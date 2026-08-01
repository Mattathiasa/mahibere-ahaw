import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, DollarSign, TrendingUp, TrendingDown, FileText, Sparkles,
  Users, Layers, MessageSquare, Wallet, UserCheck, ArrowRight,
  Heart, Building, Printer, Download, CreditCard, Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/useTranslation';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { getTransactions, getBudgets, getFinancialReports, getMemberTithes, DEFAULT_CHURCH_BANKS, MemberTithe } from '@/services/finance';
import { userService } from '@/services/users';
import { hierarchyService } from '@/services/hierarchy';
import { dashboardService } from '@/services/dashboard';
import { FinanceTransaction, MonthlyBudget, FinancialReport } from '@/types';
import { CreateTransactionDialog } from '@/components/CreateTransactionDialog';
import { CreateBudgetDialog } from '@/components/CreateBudgetDialog';
import { CreateFinancialReportDialog } from '@/components/CreateFinancialReportDialog';
import { createTransaction, createBudget, createFinancialReport } from '@/services/finance';
import { TitheMemberTrackerDialog } from '@/components/TitheMemberTrackerDialog';
import { PledgeManagementDialog } from '@/components/PledgeManagementDialog';
import { VoucherRequisitionDialog } from '@/components/VoucherRequisitionDialog';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toEthiopianDateString } from '@/lib/date-utils';

export default function Finance() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [tithes, setTithes] = useState<MemberTithe[]>([]);
  const [loading, setLoading] = useState(true);

  // System counts
  const [totalMembersCount, setTotalMembersCount] = useState<number>(0);
  const [totalTeamsCount, setTotalTeamsCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [smsSentCount, setSmsSentCount] = useState<number>(0);

  // Dialog toggles
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionPresetType, setTransactionPresetType] = useState<'Income' | 'Expense' | 'Tithe' | 'Offering' | 'Donation'>('Income');
  const [transactionCategoryDefault, setTransactionCategoryDefault] = useState<string>('');

  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showTitheDialog, setShowTitheDialog] = useState(false);
  const [showPledgeDialog, setShowPledgeDialog] = useState(false);
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);

  // Software Control gating for the money-touching actions.
  const { showElement } = useSoftwareControl();
  const financePerms = useRolePermissions();
  const canAddTransaction = financePerms.canAddTransaction && showElement('finance.addTransaction');
  const canCreateBudget = financePerms.canCreateBudget && showElement('finance.createBudget');
  const canGenerateReport = showElement('finance.generateReport');

  useEffect(() => {
    loadData();

    const action = searchParams.get('action');
    if (action === 'revenue') {
      openRevenueModal('Revenue');
    } else if (action === 'requisition') {
      setShowVoucherDialog(true);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        transactionsData,
        budgetsData,
        reportsData,
        tithesData,
        usersData,
        dashboardData,
        atbiyaEntities
      ] = await Promise.all([
        getTransactions(),
        getBudgets(),
        getFinancialReports(),
        getMemberTithes(),
        userService.getAllUsers().catch(() => ({ users: [] })),
        dashboardService.getDashboardData().catch(() => null),
        hierarchyService.getEntitiesByLevel('Atbiya').catch(() => []),
      ]);

      setTransactions(transactionsData || []);
      setBudgets(budgetsData || []);
      setReports(reportsData || []);
      setTithes(tithesData || []);

      const userList = usersData?.users || [];
      setTotalUsersCount(userList.length);

      const memberCount = dashboardData?.stats?.totalMembers ?? userList.length;
      setTotalMembersCount(memberCount);

      const teamsCount = atbiyaEntities?.length || 1;
      setTotalTeamsCount(teamsCount);

      setSmsSentCount(memberCount * 1);
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openRevenueModal = (category: string) => {
    setTransactionPresetType('Income');
    setTransactionCategoryDefault(category);
    setShowTransactionDialog(true);
  };

  const openExpenseModal = (category: string) => {
    setTransactionPresetType('Expense');
    setTransactionCategoryDefault(category);
    setShowTransactionDialog(true);
  };

  const calculateTotals = () => {
    const incomeTypes = ['Income', 'Tithe', 'Offering', 'Donation', 'Collection', 'Asrat', 'YefikirSetota', 'Deposit'];

    const totalIncome = transactions
      .filter(t => incomeTypes.includes(t.type) || t.type === 'Income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { totalIncome, totalExpenses };
  };

  const totals = calculateTotals();
  const totalBalance = totals.totalIncome - totals.totalExpenses;

  const getCategoryTotal = (catName: string) => {
    return transactions
      .filter(t => (t.category || t.type || '').toLowerCase() === catName.toLowerCase())
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  const exportStatement = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <LoadingSkeleton type="card" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 ease-out pb-20">
      <ConfigurablePageHeader
        module="finance"
        defaultTitle="Finances"
        defaultDescription="Comprehensive financial management, member tithes, budget allocations, and reporting."
        badge="Finance"
      />

      {/* Quick Church Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/60 dark:bg-[#0D2440]/60 p-4 rounded-2xl border backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowTitheDialog(true)}
            className="bg-[#2E5E99] hover:bg-[#204a7c] text-white font-bold gap-2 rounded-xl"
          >
            <Heart className="h-4 w-4 text-rose-300" />
            የአሥራትና መባ መዝገብ (Tithe Tracker)
          </Button>

          <Button
            onClick={() => setShowPledgeDialog(true)}
            variant="outline"
            className="border-[#2E5E99]/30 text-[#2E5E99] dark:text-[#7BA4D0] font-bold gap-2 rounded-xl"
          >
            <Building className="h-4 w-4" />
            የቃል ኪዳን መዋጮ (Pledges)
          </Button>

          <Button
            onClick={() => setShowVoucherDialog(true)}
            variant="outline"
            className="border-[#2E5E99]/30 text-purple-600 dark:text-purple-400 font-bold gap-2 rounded-xl"
          >
            <FileText className="h-4 w-4" />
            Vouchers & Requisitions
          </Button>
        </div>

        <Button onClick={exportStatement} variant="ghost" className="text-[#2E5E99] font-bold gap-2">
          <Printer className="h-4 w-4" /> Export Statement
        </Button>
      </div>

      {/* Dynamic 5 Stat Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#2E5E99] text-white p-6 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <span className="text-4xl font-bold">{totalMembersCount.toLocaleString()}</span>
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <span className="text-xs uppercase tracking-wider font-bold mt-6 opacity-90">Total Members</span>
        </div>

        <div className="bg-[#2A757C] text-white p-6 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <span className="text-4xl font-bold">{totalTeamsCount.toLocaleString()}</span>
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <span className="text-xs uppercase tracking-wider font-bold mt-6 opacity-90">Total Teams</span>
        </div>

        <div className="bg-sky-600 text-white p-6 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <span className="text-4xl font-bold">{smsSentCount.toLocaleString()}</span>
            <div className="p-2.5 bg-white/20 rounded-xl">
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <span className="text-xs uppercase tracking-wider font-bold mt-6 opacity-90">SMS Sent</span>
        </div>

        <div className="bg-emerald-600 text-white p-6 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <span className="text-4xl font-bold">
              {totalBalance.toLocaleString()} ETB
            </span>
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <span className="text-xs uppercase tracking-wider font-bold mt-6 opacity-90">Total Balance</span>
        </div>

        <div className="bg-amber-600 text-white p-6 rounded-2xl flex flex-col justify-between shadow-lg backdrop-blur-xl">
          <div className="flex justify-between items-start">
            <span className="text-4xl font-bold">{totalUsersCount.toLocaleString()}</span>
            <div className="p-2.5 bg-white/20 rounded-xl">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <span className="text-xs uppercase tracking-wider font-bold mt-6 opacity-90">System Users</span>
        </div>
      </div>

      {/* Church Bank Accounts Breakdown */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 dark:bg-slate-900 pb-3 border-b">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#2E5E99] flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> የቤተክርስቲያን የባንክ ሂሳቦች (Church Bank Accounts)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_CHURCH_BANKS.map((b) => (
              <div key={b.id} className="border p-4 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-between items-start">
                  <h5 className="font-bold text-xs text-[#0D2440] dark:text-white">{b.bankName}</h5>
                  <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600">Active</Badge>
                </div>
                <p className="text-xs font-mono text-muted-foreground">{b.accountNumber}</p>
                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-500">{b.accountType}</span>
                  <span className="font-bold text-emerald-600">{b.balance.toLocaleString()} ETB</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Finance Section Header Bar */}
      <div className="bg-[#2E5E99] text-white px-6 py-3.5 rounded-2xl flex items-center gap-3 font-bold text-lg shadow-md">
        <DollarSign className="h-6 w-6 p-1 bg-white text-[#2E5E99] rounded-full" />
        Finance Categories
      </div>

      {/* Categorized Finance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Revenue Card */}
        <Card className="border-t-4 border-t-emerald-500 shadow-md hover:shadow-xl transition-all">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-emerald-600 dark:text-emerald-400 flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Revenue
              </span>
              <span className="text-xs font-bold text-slate-500">
                {totals.totalIncome.toLocaleString()} ETB
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {[
              { label: 'Sales', cat: 'Sales' },
              { label: 'Tithe', cat: 'Tithe' },
              { label: 'Special Gift', cat: 'Special Gift' },
              { label: 'Donation', cat: 'Donation' },
              { label: 'Project contribution', cat: 'Project Contribution' },
            ].map((item, idx) => {
              const catSum = getCategoryTotal(item.cat);
              return (
                <button
                  key={idx}
                  onClick={() => openRevenueModal(item.cat)}
                  className="w-full text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 py-1.5 px-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-between transition-colors"
                >
                  <span>{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600">
                      {catSum > 0 ? `${catSum.toLocaleString()} ETB` : '+ Add'}
                    </span>
                    <Plus className="h-3.5 w-3.5 opacity-50" />
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* 2. Expense Card */}
        <Card className="border-t-4 border-t-purple-500 shadow-md hover:shadow-xl transition-all">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-purple-600 dark:text-purple-400 flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" /> Expense
              </span>
              <span className="text-xs font-bold text-slate-500">
                {totals.totalExpenses.toLocaleString()} ETB
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {[
              { label: 'Payroll', cat: 'Payroll' },
              { label: 'PT Cash', cat: 'Petty Cash' },
              { label: 'Utility Fees', cat: 'Utility Fees' },
            ].map((item, idx) => {
              const catSum = getCategoryTotal(item.cat);
              return (
                <button
                  key={idx}
                  onClick={() => openExpenseModal(item.cat)}
                  className="w-full text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 py-1.5 px-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center justify-between transition-colors"
                >
                  <span>{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600">
                      {catSum > 0 ? `${catSum.toLocaleString()} ETB` : '+ Add'}
                    </span>
                    <Plus className="h-3.5 w-3.5 opacity-50" />
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* 3. Budget Card */}
        <Card className="border-t-4 border-t-cyan-500 shadow-md hover:shadow-xl transition-all">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-cyan-600 dark:text-cyan-400 flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Budget
              </span>
              <span className="text-xs font-bold text-slate-500">
                {budgets.length} Budgets
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {[
              'Bank Integration',
              'Ministry Budget',
              'Leadership Budget',
              'Teams Budget',
              'Total church Budget',
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => setShowBudgetDialog(true)}
                className="w-full text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-600 py-1.5 px-2 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-950/30 flex items-center justify-between transition-colors"
              >
                <span>{item}</span>
                <Plus className="h-3.5 w-3.5 opacity-50" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* 4. Finance Report Card */}
        <Card className="border-t-4 border-t-indigo-500 shadow-md hover:shadow-xl transition-all">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-indigo-600 dark:text-indigo-400 flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Finance Report
              </span>
              <span className="text-xs font-bold text-slate-500">
                {reports.length} Reports
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {[
              'Custom Finance Report',
              '3 Month Finance Report',
              '6 Month Finance Report',
              'Yearly Finance report',
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => setShowReportDialog(true)}
                className="w-full text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 py-1.5 px-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center justify-between transition-colors"
              >
                <span>{item}</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-50" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tabs - Transactions, Tithes, Budgets, Reports */}
      <Tabs defaultValue="transactions" className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border">
            <TabsTrigger value="transactions" className="rounded-lg px-5 font-bold text-xs uppercase tracking-wider">
              {t('transactions')} ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="tithes" className="rounded-lg px-5 font-bold text-xs uppercase tracking-wider">
              አሥራትና መባ ({tithes.length})
            </TabsTrigger>
            <TabsTrigger value="budgets" className="rounded-lg px-5 font-bold text-xs uppercase tracking-wider">
              {t('monthlyBudgets')} ({budgets.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg px-5 font-bold text-xs uppercase tracking-wider">
              {t('financialReports')} ({reports.length})
            </TabsTrigger>
          </TabsList>

          {canAddTransaction && (
            <Button
              onClick={() => {
                setTransactionPresetType('Income');
                setTransactionCategoryDefault('');
                setShowTransactionDialog(true);
              }}
              className="bg-[#2E5E99] hover:bg-[#204a7c] text-white font-bold rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('addTransaction')}
            </Button>
          )}
        </div>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="rounded-2xl border">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900">
                    <TableHead className="font-bold text-xs uppercase">Description</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Category</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Ethiopian Date</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Amount (ETB)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No transactions recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => {
                      const isIncome = ['Income', 'Tithe', 'Offering', 'Donation', 'Collection', 'Asrat', 'YefikirSetota', 'Deposit'].includes(tx.type);
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="font-semibold">{tx.description}</TableCell>
                          <TableCell>{tx.category || tx.type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={isIncome ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}>
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-ethiopic">{toEthiopianDateString(tx.date)}</TableCell>
                          <TableCell className={`text-right font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'}{(tx.amount || 0).toLocaleString()} ETB
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tithes" className="space-y-4">
          <Card className="rounded-2xl border">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900">
                    <TableHead className="font-bold text-xs uppercase">Receipt #</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Member Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Method</TableHead>
                    <TableHead className="font-bold text-xs uppercase">Ethiopian Date</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-right">Amount (ETB)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tithes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No tithes or offerings recorded yet. Click "የአሥራትና መባ መዝገብ" to record one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tithes.map((tithe) => (
                      <TableRow key={tithe.id}>
                        <TableCell className="font-mono font-bold text-[#2E5E99]">{tithe.receiptNumber}</TableCell>
                        <TableCell className="font-semibold font-ethiopic">{tithe.memberName}</TableCell>
                        <TableCell><Badge variant="outline">{tithe.type}</Badge></TableCell>
                        <TableCell className="text-xs">{tithe.paymentMethod}</TableCell>
                        <TableCell className="font-ethiopic">{tithe.ethiopianDate || toEthiopianDateString(tithe.date)}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          +{tithe.amount.toLocaleString()} ETB
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card className="rounded-2xl border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Monthly Budgets</h3>
                {canCreateBudget && <Button onClick={() => setShowBudgetDialog(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Budget
                </Button>}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month/Year</TableHead>
                    <TableHead>Planned Income</TableHead>
                    <TableHead>Planned Expenses</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No monthly budgets recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    budgets.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-semibold">{b.month}/{b.year}</TableCell>
                        <TableCell>{(b.plannedIncome || 0).toLocaleString()} ETB</TableCell>
                        <TableCell>{(b.plannedExpenses || 0).toLocaleString()} ETB</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-emerald-500">{b.status || 'Approved'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="rounded-2xl border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Financial Reports</h3>
                {canGenerateReport && <Button onClick={() => setShowReportDialog(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Generate Report
                </Button>}
              </div>
              {reports.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No financial reports generated yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reports.map((rep) => (
                    <Card key={rep.id} className="p-4 border">
                      <h4 className="font-bold text-base">{rep.title}</h4>
                      <p className="text-xs text-muted-foreground">{rep.reportType}</p>
                      <div className="mt-4 flex justify-between text-sm">
                        <span>Income: <strong className="text-emerald-600">{(rep.totalIncome || 0).toLocaleString()} ETB</strong></span>
                        <span>Expenses: <strong className="text-rose-600">{(rep.totalExpenses || 0).toLocaleString()} ETB</strong></span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Modals */}
      <CreateTransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        onSubmit={(data) => {
          createTransaction({
            ...data,
            type: transactionPresetType,
            category: transactionCategoryDefault || data.category,
          }).then(() => {
            toast.success('Transaction recorded successfully!');
            setShowTransactionDialog(false);
            loadData();
          });
        }}
      />

      <CreateBudgetDialog
        open={showBudgetDialog}
        onOpenChange={setShowBudgetDialog}
        onSubmit={(data) => {
          createBudget(data).then(() => {
            toast.success('Budget created successfully!');
            setShowBudgetDialog(false);
            loadData();
          });
        }}
      />

      <CreateFinancialReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        onSubmit={(data) => {
          createFinancialReport(data).then(() => {
            toast.success('Financial report generated successfully!');
            setShowReportDialog(false);
            loadData();
          });
        }}
      />

      <TitheMemberTrackerDialog
        open={showTitheDialog}
        onOpenChange={setShowTitheDialog}
        onSuccess={loadData}
      />

      <PledgeManagementDialog
        open={showPledgeDialog}
        onOpenChange={setShowPledgeDialog}
      />

      <VoucherRequisitionDialog
        open={showVoucherDialog}
        onOpenChange={setShowVoucherDialog}
      />
    </div>
  );
}
