import { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, FileText, Heart, Sparkles, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/useTranslation';
import { getTransactions, getBudgets, getFinancialReports } from '@/services/finance';
import { FinanceTransaction, MonthlyBudget, FinancialReport } from '@/types';
import { CreateTransactionDialog } from '@/components/CreateTransactionDialog';
import { CreateBudgetDialog } from '@/components/CreateBudgetDialog';
import { CreateFinancialReportDialog } from '@/components/CreateFinancialReportDialog';
import { useQueryClient } from '@tanstack/react-query';
import { createTransaction, createBudget, createFinancialReport } from '@/services/finance';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function Finance() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, budgetsData, reportsData] = await Promise.all([
        getTransactions(),
        getBudgets(),
        getFinancialReports(),
      ]);
      setTransactions(transactionsData);
      setBudgets(budgetsData);
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const incomeTypes = ['Income', 'Tithe', 'Offering', 'Donation', 'Collection', 'Asrat', 'YefikirSetota', 'Deposit'];

    const totalIncome = transactions
      .filter(t => incomeTypes.includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTithes = transactions
      .filter(t => t.type === 'Tithe' || t.type === 'Asrat')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOfferings = transactions
      .filter(t => ['Offering', 'Donation', 'YefikirSetota'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalIncome, totalExpenses, totalTithes, totalOfferings };
  };

  const totals = calculateTotals();
  const remainder = totals.totalIncome - totals.totalExpenses;

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title={t('finance')} description={t('financeHeaderDesc')} />
        <LoadingSkeleton type="card" count={4} />
      </div>
    );
  }

  const { totalIncome, totalExpenses, totalTithes } = totals;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 ease-out pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <ConfigurablePageHeader
          module="finance"
          defaultTitle={t('finance')}
          defaultDescription={t('financeHeaderDesc')}
          badge="Divine Stewardship"
        />

        <div className="flex flex-wrap gap-4">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Button
              onClick={() => setShowTransactionDialog(true)}
              className="h-16 px-8 rounded-2xl bg-[#2E5E99] hover:bg-[#204a7c] text-white font-black uppercase tracking-widest shadow-xl shadow-[#2E5E99]/20 transition-all duration-300 hover:scale-105 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Plus className="mr-3 h-6 w-6" />
              {t('addTransaction')}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Summary Cards - Glassy & Vibrant */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: t('totalIncome'), amount: totalIncome, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { title: t('totalExpenses'), amount: totalExpenses, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
          { title: t('remainder'), amount: remainder, icon: DollarSign, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
          { title: t('tithe'), amount: totalTithes, icon: Heart, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={cn("relative overflow-hidden group rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 border-2", stat.border)}>
              <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10 group-hover:scale-150 transition-transform duration-700", stat.bg)} />
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0D2440]/40 dark:text-white/40">{stat.title}</CardTitle>
                <div className={cn("p-2 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black tracking-tighter text-[#0D2440] dark:text-white leading-none">
                  {stat.amount.toLocaleString()}
                  <span className="text-xs font-bold opacity-30 ml-2 tracking-widest uppercase">ETB</span>
                </div>
                <div className={cn("mt-4 flex items-center text-[10px] font-black uppercase tracking-widest opacity-60", stat.color)}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Divinely Accounted
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs with Premium Design */}
      <Tabs defaultValue="transactions" className="space-y-12">
        <TabsList className="bg-white/40 dark:bg-black/20 p-2 rounded-[2rem] border-2 border-white/60 dark:border-white/10 backdrop-blur-3xl h-20 shadow-2xl overflow-x-auto max-w-full inline-flex">
          <TabsTrigger value="transactions" className="rounded-2xl px-12 h-16 data-[state=active]:bg-[#2E5E99] data-[state=active]:text-white data-[state=active]:shadow-2xl transition-all font-black uppercase tracking-widest text-[11px] italic">
            {t('transactions')}
          </TabsTrigger>
          <TabsTrigger value="budgets" className="rounded-2xl px-12 h-16 data-[state=active]:bg-[#2E5E99] data-[state=active]:text-white data-[state=active]:shadow-2xl transition-all font-black uppercase tracking-widest text-[11px] italic">
            {t('monthlyBudgets')}
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-2xl px-12 h-16 data-[state=active]:bg-[#2E5E99] data-[state=active]:text-white data-[state=active]:shadow-2xl transition-all font-black uppercase tracking-widest text-[11px] italic">
            {t('financialReports')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6">
            <AnimatePresence>
              {transactions.slice(0, 20).map((transaction, i) => {
                const isIncome = ['Income', 'Tithe', 'Offering', 'Donation', 'Collection', 'Asrat', 'YefikirSetota', 'Deposit'].includes(transaction.type);
                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="group relative overflow-hidden rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/60 dark:border-white/10 hover:shadow-2xl transition-all duration-500 border-2 hover:border-[#2E5E99]/20">
                      <CardContent className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className={cn("p-5 rounded-[1.5rem] shadow-inner", isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                            {isIncome ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
                          </div>
                          <div>
                            <p className="font-black text-[#0D2440] dark:text-white text-xl tracking-tight leading-tight">{transaction.description}</p>
                            {transaction.type === 'Transfer' && (transaction as any).fromAccount && (
                              <p className="text-xs font-bold text-[#2E5E99] mt-1">
                                {(transaction as any).fromAccount} → {(transaction as any).toAccount}
                                {(transaction as any).receiptUrl && (
                                  <a href={(transaction as any).receiptUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline">receipt</a>
                                )}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/50 dark:bg-black/20 border-none px-3 py-1 text-[#2E5E99] rounded-full">
                                {transaction.type}
                              </Badge>
                              <span className="text-[10px] font-black text-[#0D2440]/30 dark:text-white/30 uppercase tracking-widest">
                                {new Date(transaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-3xl font-black tracking-tighter leading-none", isIncome ? 'text-emerald-500' : 'text-rose-500')}>
                            {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()}
                            <span className="text-xs font-bold opacity-40 ml-2">ETB</span>
                          </p>
                          {transaction.category && (
                            <p className="mt-2 text-[10px] font-black text-[#0D2440]/40 dark:text-white/40 uppercase tracking-[0.3em]">
                              {transaction.category}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-2xl font-black tracking-tight italic opacity-60">Divine Stewardship Plans</h3>
            <Button
              onClick={() => setShowBudgetDialog(true)}
              className="h-14 px-8 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all duration-300"
            >
              <Plus className="mr-2 h-5 w-5" />
              {t('createBudget')}
            </Button>
          </div>

          <Card className="rounded-[3rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-white/60 dark:border-white/10 shadow-3xl overflow-hidden border-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/60 dark:bg-black/30 backdrop-blur-3xl">
                  <TableRow className="hover:bg-transparent border-white/20">
                    <TableHead className="font-black text-[11px] uppercase tracking-[0.2em] py-8 px-10 text-[#2E5E99]">Month/Year</TableHead>
                    <TableHead className="font-black text-[11px] uppercase tracking-[0.2em] py-8">Planned Inc</TableHead>
                    <TableHead className="font-black text-[11px] uppercase tracking-[0.2em] py-8">Actual Inc</TableHead>
                    <TableHead className="font-black text-[11px] uppercase tracking-[0.2em] py-8 text-center">Variance</TableHead>
                    <TableHead className="font-black text-[11px] uppercase tracking-[0.2em] py-8">Planned Exp</TableHead>
                    <TableHead className="font-black text-[11px] uppercase tracking-[0.2em] py-8">Actual Exp</TableHead>
                    <TableHead className="font-black text-[11px] uppercase tracking-[0.2em] py-8">Remainder</TableHead>
                    <TableHead className="font-black text-[11px] uppercase tracking-[0.2em] py-8 text-right px-10">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-40">
                        <div className="flex flex-col items-center opacity-10">
                          <FileText className="h-32 w-32 mb-4" />
                          <p className="font-black text-3xl tracking-[0.2em] uppercase">Nulla Tabula</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    budgets.map((budget: any) => {
                      const budgetMonth = budget.month;
                      const budgetYear = budget.year;

                      const monthTransactions = transactions.filter((t: any) => {
                        const tDate = new Date(t.date);
                        return tDate.getMonth() + 1 === budgetMonth && tDate.getFullYear() === budgetYear;
                      });

                      const actualIncome = monthTransactions
                        .filter((t: any) => ['Income', 'Tithe', 'Offering', 'Donation', 'Collection', 'Asrat', 'YefikirSetota', 'Deposit'].includes(t.type))
                        .reduce((acc: number, curr: any) => acc + curr.amount, 0);

                      const actualExpenses = monthTransactions
                        .filter((t: any) => t.type === 'Expense')
                        .reduce((acc: number, curr: any) => acc + curr.amount, 0);

                      const incVariance = actualIncome - budget.plannedIncome;
                      const netRemainder = actualIncome - actualExpenses;

                      return (
                        <TableRow key={budget.id} className="hover:bg-white/60 dark:hover:bg-white/5 transition-all border-white/10 group">
                          <TableCell className="font-black text-lg px-10 py-8 italic tracking-tight group-hover:text-[#2E5E99] transition-colors">
                            {new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'long' })} {budget.year}
                          </TableCell>
                          <TableCell className="font-bold text-sm opacity-60 italic">ETB {budget.plannedIncome.toLocaleString()}</TableCell>
                          <TableCell className="font-black text-xl text-[#2E5E99] tracking-tighter italic">ETB {actualIncome.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <div className={cn("inline-flex items-center px-4 py-1.5 rounded-2xl font-black text-[11px] tracking-tight border-2 shadow-lg", incVariance >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20')}>
                              {incVariance >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                              {incVariance >= 0 ? '+' : ''}{incVariance.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-sm opacity-60 italic">ETB {budget.plannedExpenses.toLocaleString()}</TableCell>
                          <TableCell className="font-black text-xl text-amber-600 tracking-tighter italic">ETB {actualExpenses.toLocaleString()}</TableCell>
                          <TableCell className={cn("font-black text-xl tracking-tighter italic", netRemainder >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                            ETB {netRemainder.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right px-10">
                            <Badge className={cn("px-6 py-2 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl",
                              budget.status === 'Approved' ? 'bg-emerald-500 shadow-emerald-500/20' :
                                budget.status === 'Rejected' ? 'bg-rose-500 shadow-rose-500/20' :
                                  'bg-amber-500 shadow-amber-500/20'
                            )}>
                              {budget.status || 'Draft'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-2xl font-black tracking-tight italic opacity-60">Financial Sovereignty Reports</h3>
            <Button
              onClick={() => setShowReportDialog(true)}
              className="h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all duration-300"
            >
              <Plus className="mr-2 h-5 w-5" />
              Generate Report
            </Button>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            {reports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="group relative overflow-hidden rounded-[3.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-white/60 dark:border-white/10 shadow-3xl hover:shadow-indigo-500/10 transition-all duration-700 border-2">
                  <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                    <Sparkles className="h-40 w-40" />
                  </div>
                  <CardHeader className="p-10 border-b border-white/20">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-3xl font-black text-[#0D2440] dark:text-white tracking-tight italic leading-tight">
                          {report.title}
                        </CardTitle>
                        <CardDescription className="font-black text-[11px] uppercase tracking-[0.3em] text-[#2E5E99]">
                          {report.titleAmharic} • {report.reportType}
                        </CardDescription>
                      </div>
                      <Badge className="bg-indigo-500 text-white font-black uppercase text-[11px] tracking-[0.2em] px-4 py-2 rounded-2xl shadow-xl">
                        {new Date(report.createdAt).getFullYear()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                    <div className="grid gap-8 sm:grid-cols-2">
                      <div className="space-y-6">
                        <div className="bg-white/40 dark:bg-slate-800/40 p-6 rounded-[2rem] border-2 border-emerald-500/20 shadow-inner">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{t('totalIncome')}</p>
                          <p className="text-3xl font-black text-emerald-500 tracking-tighter italic">{report.totalIncome.toLocaleString()} <span className="text-[10px]">ETB</span></p>
                        </div>
                        <div className="bg-white/40 dark:bg-slate-800/40 p-6 rounded-[2rem] border-2 border-rose-500/20 shadow-inner">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('totalExpenses')}</p>
                          <p className="text-3xl font-black text-rose-500 tracking-tighter italic">{report.totalExpenses.toLocaleString()} <span className="text-[10px]">ETB</span></p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="bg-[#0D2440] p-8 rounded-[2.5rem] text-white shadow-2xl shadow-[#0D2440]/20 relative overflow-hidden group/mini">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover/mini:opacity-100 transition-opacity duration-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">{t('remainder')}</p>
                          <p className="text-4xl font-black tracking-tighter italic">{report.remainder.toLocaleString()} <span className="text-xs">ETB</span></p>
                          <div className="absolute top-4 right-4 text-emerald-500 animate-pulse">
                            <TrendingUp className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 px-4">
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Clock className="h-4 w-4" />
                          </div>
                          <span className="text-[10px] font-black text-[#0D2440]/60 dark:text-white/40 uppercase tracking-[0.2em] italic">
                            {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {report.recipientInfo && (
                      <div className="pt-8 border-t border-white/20 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-[#0D2440]/5 dark:bg-white/5 text-[#2E5E99]">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Authenticated For</p>
                          <p className="text-sm font-black text-[#0D2440] dark:text-white italic">{report.recipientInfo}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CreateTransactionDialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
        onSubmit={(data) => {
          createTransaction(data).then(() => {
            toast.success('Transaction secured!');
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
            toast.success('Budget plan established!');
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
            toast.success('Report generated successfully!');
            setShowReportDialog(false);
            loadData();
          });
        }}
      />
    </div>
  );
}
