import { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/useTranslation';
import { getTransactions, getBudgets, getFinancialReports } from '@/services/finance';
import { FinanceTransaction, MonthlyBudget, FinancialReport } from '@/types';
import { CreateTransactionDialog } from '@/components/CreateTransactionDialog';
import { CreateBudgetDialog } from '@/components/CreateBudgetDialog';
import { CreateFinancialReportDialog } from '@/components/CreateFinancialReportDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTransaction, createBudget, createFinancialReport } from '@/services/finance';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
    const totalIncome = transactions
      .filter(t => ['Income', 'Collection', 'Deposit'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate totals
    const income = transactions.filter((t: any) => t.type === 'Income' || t.type === 'Tithe' || t.type === 'Offering' || t.type === 'Donation' || t.type === 'Collection' || t.type === 'Asrat' || t.type === 'YefikirSetota').reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const expenses = transactions.filter((t: any) => t.type === 'Expense').reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const remainder = income - expenses;

    const asratTotal = transactions.filter((t: any) => t.type === 'Asrat').reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const yefikirSetotaTotal = transactions.filter((t: any) => t.type === 'YefikirSetota').reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTithes = transactions
      .filter(t => t.type === 'Tithe')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOfferings = transactions
      .filter(t => ['Offering', 'Donation'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalIncome, totalExpenses, totalTithes, totalOfferings, asratTotal, yefikirSetotaTotal };
  };

  const totals = calculateTotals();
  const remainder = totals.totalIncome - totals.totalExpenses;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('financeManagement')}</h1>
          <p className="text-muted-foreground">{t('financeDescription')}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalIncome.toLocaleString()} Birr</div>
            <div className="text-2xl font-bold">
              {(totals.totalTithes + totals.totalOfferings).toLocaleString()} Birr
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budgets">Monthly Budgets</TabsTrigger>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <Button onClick={() => setShowTransactionDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>

          <CreateTransactionDialog
            open={showTransactionDialog}
            onOpenChange={setShowTransactionDialog}
            onSubmit={async (data) => {
              try {
                await createTransaction(data);
                toast.success('Transaction added successfully!');
                loadData();
                setShowTransactionDialog(false);
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to add transaction');
              }
            }}
          />

          <CreateBudgetDialog
            open={showBudgetDialog}
            onOpenChange={setShowBudgetDialog}
            onSubmit={async (data) => {
              try {
                await createBudget(data);
                toast.success('Budget created successfully!');
                loadData();
                setShowBudgetDialog(false);
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to create budget');
              }
            }}
          />

          <CreateFinancialReportDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            onSubmit={async (data) => {
              try {
                await createFinancialReport(data);
                toast.success('Financial report generated successfully!');
                loadData();
                setShowReportDialog(false);
              } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to generate report');
              }
            }}
          />

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.type} • {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`font-bold ${['Income', 'Collection', 'Deposit'].includes(transaction.type)
                      ? 'text-green-600'
                      : 'text-red-600'
                      }`}>
                      {['Income', 'Collection', 'Deposit'].includes(transaction.type) ? '+' : '-'}
                      {transaction.amount.toLocaleString()} Birr
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Monthly Budgets</h2>
            <Button onClick={() => setShowBudgetDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Budget
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month/Year</TableHead>
                  <TableHead>Planned Income</TableHead>
                  <TableHead>Actual Income</TableHead>
                  <TableHead>Variance (Inc)</TableHead>
                  <TableHead>Planned Expense</TableHead>
                  <TableHead>Actual Expense</TableHead>
                  <TableHead>Variance (Exp)</TableHead>
                  <TableHead>Net Remainder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attachments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No budget plans found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  budgets.map((budget: any) => {
                    // Calculate actuals based on transactions for this month (this is a simplified logic)
                    // In a real app, this would be computed on the backend or more robustly here
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
                    const expVariance = budget.plannedExpenses - actualExpenses; // Positive if under budget
                    const netRemainder = actualIncome - actualExpenses;

                    return (
                      <TableRow key={budget.id}>
                        <TableCell>{new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'long' })} {budget.year}</TableCell>
                        <TableCell>ETB {budget.plannedIncome.toLocaleString()}</TableCell>
                        <TableCell>ETB {actualIncome.toLocaleString()}</TableCell>
                        <TableCell className={incVariance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {incVariance >= 0 ? '+' : ''}{incVariance.toLocaleString()}
                        </TableCell>
                        <TableCell>ETB {budget.plannedExpenses.toLocaleString()}</TableCell>
                        <TableCell>ETB {actualExpenses.toLocaleString()}</TableCell>
                        <TableCell className={expVariance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {expVariance >= 0 ? '+' : ''}{expVariance.toLocaleString()}
                        </TableCell>
                        <TableCell className={netRemainder >= 0 ? 'text-green-600' : 'text-red-600 font-bold'}>
                          ETB {netRemainder.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={budget.status === 'Approved' ? 'default' : budget.status === 'Rejected' ? 'destructive' : 'secondary'}>
                            {budget.status || 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {budget.attachments && budget.attachments.length > 0 ? (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <FileText className="h-4 w-4" />
                            </Button>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Financial Reports</h2>
            <Button onClick={() => setShowReportDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>

          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>
                    {report.titleAmharic} • {report.reportType} Report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Period:</span>
                        <span className="font-medium">
                          {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Income:</span>
                        <span className="font-medium text-green-600">{report.totalIncome.toLocaleString()} Birr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Expenses:</span>
                        <span className="font-medium text-red-600">{report.totalExpenses.toLocaleString()} Birr</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Tithes (አስራት):</span>
                        <span className="font-medium">{report.totalTithes.toLocaleString()} Birr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Offerings:</span>
                        <span className="font-medium">{report.totalOfferings.toLocaleString()} Birr</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-semibold">Remainder:</span>
                        <span className={`font-bold ${report.remainder >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {report.remainder.toLocaleString()} Birr
                        </span>
                      </div>
                    </div>
                  </div>
                  {report.recipientInfo && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">To: {report.recipientInfo}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs >
    </div >
  );
}
