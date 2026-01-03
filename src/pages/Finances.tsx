import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { CalendarIcon, Plus, TrendingUp, TrendingDown, DollarSign, PlusCircle, Loader2, Trash2, Download, Check, Edit, ArrowUpRight, ArrowDownRight, Wallet, Target } from "lucide-react";
import { format, startOfMonth, endOfMonth, getYear, setMonth, setYear, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createTransaction, getTransactions, getTransactionSummary, deleteTransaction, updateTransaction, Transaction, TransactionSummary, markTransactionAsCompleted } from "@/services/transactionService";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const Finances = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [completedTransactions, setCompletedTransactions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([2023, 2024, 2025]); // Add more years as needed
  const [summary, setSummary] = useState<TransactionSummary>({
    earnings: 0,
    expenses: 0,
    transactionCount: 0
  });

  const [transactionForms, setTransactionForms] = useState([{
    id: 1,
    amount: "",
    description: ""
  }]);

  const [globalTransactionType, setGlobalTransactionType] = useState<"earning" | "expense">("earning");

  const [newTransaction, setNewTransaction] = useState({
    type: "earning" as "earning" | "expense",
    amount: "",
    description: "",
    date: new Date(),
    category: ""
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch transactions and summary when month or year changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const month = selectedMonth + 1; // Add 1 because months are 0-indexed in JS
        const year = selectedYear;
        
        console.log('Fetching data for month:', month, 'year:', year);
        const [transactionsResponse, summaryResponse] = await Promise.all([
          getTransactions(month, year),
          getTransactionSummary(month, year)
        ]);

        console.log('Transactions response:', transactionsResponse);
        console.log('Summary response:', summaryResponse);

        // Handle transactions data
        const transactionsData = Array.isArray(transactionsResponse?.data) 
          ? transactionsResponse.data 
          : [];
          
        // Initialize completed transactions from the API response
        const completedIds = transactionsData
          .filter(tx => tx.completed)
          .map(tx => tx._id);
          
        setCompletedTransactions(new Set(completedIds));
          
        setTransactions(transactionsData);
        
        // Always calculate from transactions data to ensure accuracy
        console.log('Raw transactions data:', transactionsData);
        const calculated = transactionsData.reduce(
          (acc, tx) => {
            // Ensure amount is a number and handle any potential string values
            const amount = typeof tx.amount === 'string' 
              ? parseFloat(tx.amount) || 0 
              : Number(tx.amount) || 0;
              
            console.log(`Processing transaction - ID: ${tx._id}, Type: ${tx.type}, Amount: ${amount}, Raw Amount: ${tx.amount}`);
            
            if (tx.type === 'earning') {
              acc.earnings += amount;
            } else if (tx.type === 'expense') {
              acc.expenses += Math.abs(amount); // Ensure expenses are positive
            }
            return acc;
          },
          { earnings: 0, expenses: 0 }
        );
        
        console.log('Calculated summary:', calculated);
        setSummary({
          earnings: Number(calculated.earnings.toFixed(2)),
          expenses: Number(calculated.expenses.toFixed(2)),
          transactionCount: transactionsData.length
        });
        
        // Log the summary from backend for comparison
        console.log('Backend summary response:', summaryResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch transactions. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear, toast]);

  const handleAddTransactionForm = () => {
    setTransactionForms(prev => [...prev, {
      id: Math.max(...prev.map(f => f.id), 0) + 1,
      amount: "",
      description: ""
    }]);
  };

  const handleRemoveTransactionForm = (id: number) => {
    if (transactionForms.length > 1) {
      setTransactionForms(prev => prev.filter(form => form.id !== id));
    }
  };

  const handleUpdateTransactionForm = (id: number, field: string, value: any) => {
    setTransactionForms(prev => prev.map(form => 
      form.id === id ? { ...form, [field]: value } : form
    ));
  };

  const handleAddMultipleTransactions = async () => {
    const validForms = transactionForms.filter(form => 
      form.amount && form.description
    );

    if (validForms.length === 0) {
      toast({
        title: 'Error',
        description: 'Please fill in at least one complete transaction form',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      for (const form of validForms) {
        const transactionData = {
          ...form,
          type: globalTransactionType,
          amount: parseFloat(form.amount),
          date: new Date().toISOString(),
          category: globalTransactionType === 'earning' ? 'General Earning' : 'General Expense'
        };
        
        const { data: newTransactionData } = await createTransaction(transactionData);
        setTransactions(prev => [newTransactionData, ...prev]);
        
        // Update summary
        setSummary(prev => ({
          ...prev,
          earnings: globalTransactionType === 'earning' 
            ? prev.earnings + transactionData.amount 
            : prev.earnings,
          expenses: globalTransactionType === 'expense'
            ? prev.expenses + transactionData.amount
            : prev.expenses,
          transactionCount: prev.transactionCount + 1
        }));
      }
      
      toast({
        title: 'Success',
        description: `${validForms.length} ${globalTransactionType}(s) added successfully`,
      });
      
      // Reset forms
      setTransactionForms([{
        id: 1,
        amount: "",
        description: ""
      }]);
      
      // Close the dialog
      document.getElementById('close-dialog')?.click();
    } catch (error) {
      console.error('Error processing transactions:', error);
      const errorMessage = error.response?.data?.message || 'Failed to process transactions. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        date: newTransaction.date.toISOString()
      };
      
      if (isEditing && editingTransactionId) {
        // Update existing transaction
        const { data: updatedTransaction } = await updateTransaction(editingTransactionId, transactionData);
        
        // Update local state
        setTransactions(transactions.map(tx => 
          tx._id === editingTransactionId ? updatedTransaction : tx
        ));
        
        // Calculate totals from transactions as a fallback
        const calculateTotals = (transactions: Transaction[]) => {
          return transactions.reduce(
            (acc, transaction) => {
              const amount = Number(transaction.amount) || 0;
              if (transaction.type === 'earning') {
                acc.earnings += amount;
              } else if (transaction.type === 'expense') {
                acc.expenses += amount;
              }
              return acc;
            },
            { earnings: 0, expenses: 0 }
          );
        };

        // Calculate totals based on the current view
        const getDisplayTotals = () => {
          const { earnings = 0, expenses = 0 } = summary || {};
          const { earnings: calcEarnings, expenses: calcExpenses } = calculateTotals(transactions);
          
          // If we have transactions but no summary data, use calculated values
          if (transactions.length > 0 && (earnings === 0 && expenses === 0)) {
            return {
              earnings: calcEarnings,
              expenses: calcExpenses,
              balance: calcEarnings - calcExpenses
            };
          }
          
          // Otherwise use the summary data from API
          return {
            earnings,
            expenses,
            balance: earnings - expenses
          };
        };
        
        const { earnings: totalEarnings, expenses: totalExpenses, balance } = getDisplayTotals();
        
        // Update summary
        const oldTransaction = transactions.find(t => t._id === editingTransactionId);
        if (oldTransaction) {
          const amountDiff = transactionData.amount - (oldTransaction.amount || 0);
          
          setSummary(prev => ({
            ...prev,
            earnings: oldTransaction.type === 'earning' 
              ? prev.earnings + amountDiff
              : prev.earnings,
            expenses: oldTransaction.type === 'expense'
              ? prev.expenses + amountDiff
              : prev.expenses
          }));
        }
        
        toast({
          title: 'Success',
          description: 'Transaction updated successfully',
        });
        
        // Close the dialog
        document.getElementById('close-dialog')?.click();
      } else {
        // Create new transaction
        const { data: newTransactionData } = await createTransaction(transactionData);
        
        // Update local state
        setTransactions(prev => [newTransactionData, ...prev]);
        setSummary(prev => ({
          ...prev,
          earnings: transactionData.type === 'earning' 
            ? prev.earnings + transactionData.amount 
            : prev.earnings,
          expenses: transactionData.type === 'expense'
            ? prev.expenses + transactionData.amount
            : prev.expenses,
          transactionCount: prev.transactionCount + 1
        }));
        
        toast({
          title: 'Success',
          description: 'Transaction added successfully',
        });
        
        // Close the dialog
        document.getElementById('close-dialog')?.click();
      }
      
      // Reset form
      setNewTransaction({
        type: 'earning',
        amount: '',
        description: '',
        date: new Date(),
        category: ''
      });
      
      // Reset editing state
      setIsEditing(false);
      setEditingTransactionId(null);
    } catch (error) {
      console.error('Error processing transaction:', error);
      const errorMessage = error.response?.data?.message || 'Failed to process transaction. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    await deleteTransactionById(id);
  };

  const deleteTransactionById = async (id: string) => {
    try {
      await deleteTransaction(id);
      const deletedTransaction = transactions.find(t => t._id === id);
      
      if (deletedTransaction) {
        // Update local state
        setTransactions(prev => prev.filter(transaction => transaction._id !== id));
        
        // Remove from completed transactions
        setCompletedTransactions(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        
        // Update summary using functional update to ensure we have the latest state
        setSummary(prev => ({
          ...prev,
          earnings: deletedTransaction.type === 'earning' 
            ? prev.earnings - deletedTransaction.amount 
            : prev.earnings,
          expenses: deletedTransaction.type === 'expense'
            ? prev.expenses - deletedTransaction.amount
            : prev.expenses,
          transactionCount: prev.transactionCount - 1
        }));
      }
      
      // Reset editing if the deleted transaction was being edited
      if (editingTransactionId === id) {
        setIsEditing(false);
        setEditingTransactionId(null);
      }
      
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleCompletion = async (id: string, isCompleted: boolean) => {
    console.log('=== TOGGLE COMPLETION START ===');
    console.log('handleToggleCompletion called with:', { id, isCompleted });
    console.log('Current completedTransactions:', Array.from(completedTransactions));
    console.log('Is transaction currently completed?', completedTransactions.has(id));
    
    try {
      // Optimistically update the UI
      setCompletedTransactions(prev => {
        console.log('Previous state:', Array.from(prev));
        const newSet = new Set(prev);
        if (isCompleted) {
          newSet.add(id);
          console.log('Adding to completed set');
        } else {
          newSet.delete(id);
          console.log('Removing from completed set');
        }
        console.log('New state:', Array.from(newSet));
        return newSet;
      });

      // Temporarily skip backend call to test UI update
      console.log('Skipping backend call for testing - UI should update immediately');
      
      toast({
        title: 'Success',
        description: `Transaction marked as ${isCompleted ? 'completed' : 'not completed'}`,
      });
      
      // Uncomment the below line after testing
      // await markTransactionAsCompleted(id, isCompleted);
      
      console.log('=== TOGGLE COMPLETION END ===');
      
    } catch (error) {
      console.error('Error updating transaction completion:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transaction status',
        variant: 'destructive',
      });
      
      // Revert the UI on error
      console.log('Error occurred, reverting UI');
      setCompletedTransactions(prev => {
        const newSet = new Set(prev);
        if (isCompleted) {
          // If we were trying to mark as completed but failed, remove it
          newSet.delete(id);
        } else {
          // If we were trying to mark as not completed but failed, add it back
          newSet.add(id);
        }
        console.log('After error revert:', Array.from(newSet));
        return newSet;
      });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    navigate(`/transactions/${transaction._id}/edit`);
  };

  // Calculate display values
  const getDisplayTotals = () => {
    const earnings = transactions
      .filter(t => t.type === 'earning')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return {
      earnings,
      expenses,
      balance: earnings - expenses
    };
  };
  
  const { earnings: totalEarnings, expenses: totalExpenses, balance } = getDisplayTotals();
  
  // Filter transactions by type
  const earnings = transactions.filter(t => t.type === 'earning');
  const expenses = transactions.filter(t => t.type === 'expense');

  const generatePDF = async () => {
    if (!reportRef.current) {
      console.error('Report element not found');
      toast({
        title: 'Error',
        description: 'Could not find the report content to generate PDF.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const button = document.activeElement as HTMLElement;
      const originalText = button.innerHTML;
      button.innerHTML = '<span class="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generating PDF...</span>';
      button.setAttribute('disabled', 'true');

      // Create a temporary container for the PDF
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '800px';
      tempContainer.style.padding = '20px';
      tempContainer.style.background = 'white';
      tempContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      document.body.appendChild(tempContainer);

      // Fetch fresh data
      const month = selectedMonth + 1;
      const year = selectedYear;
      const [transactionsResponse] = await Promise.all([
        getTransactions(month, year)
      ]);

      const transactionsData = Array.isArray(transactionsResponse?.data) 
        ? transactionsResponse.data 
        : [];

      // Calculate totals
      const { earnings, expenses } = transactionsData.reduce(
        (acc, tx) => {
          const amount = typeof tx.amount === 'string' 
            ? parseFloat(tx.amount) || 0 
            : Number(tx.amount) || 0;
          
          if (tx.type === 'earning') {
            acc.earnings += amount;
          } else if (tx.type === 'expense') {
            acc.expenses += Math.abs(amount);
          }
          return acc;
        },
        { earnings: 0, expenses: 0 }
      );

      const balance = earnings - expenses;

      // Separate transactions by type
      const earningsTransactions = transactionsData.filter(tx => tx.type === 'earning');
      const expensesTransactions = transactionsData.filter(tx => tx.type === 'expense');

      // Create the report content
      const reportHTML = `
        <div style="background: white; padding: 40px; font-family: 'Times New Roman', serif; color: #000;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">
              Financial Report
            </h1>
            <div style="font-size: 16px; color: #666; border-bottom: 2px solid #000; padding-bottom: 10px;">
              ${new Date(year, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          
          <div style="margin-bottom: 40px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <tr>
                <td style="width: 33%; padding: 15px; border: 1px solid #000; vertical-align: top;">
                  <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Total Earnings</div>
                  <div style="font-size: 24px; font-weight: bold;">
                    ₹${earnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td style="width: 33%; padding: 15px; border: 1px solid #000; border-left: none; vertical-align: top;">
                  <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Total Expenses</div>
                  <div style="font-size: 24px; font-weight: bold;">
                    ₹${expenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td style="width: 33%; padding: 15px; border: 1px solid #000; border-left: none; vertical-align: top;">
                  <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Net Balance</div>
                  <div style="font-size: 24px; font-weight: bold;">
                    ₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
              </tr>
            </table>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #000; padding-bottom: 10px;">
              Earnings Details
            </h2>
            
            ${earningsTransactions.length > 0 ? `
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                  <tr style="border-bottom: 2px solid #000;">
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date</th>
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Description</th>
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Category</th>
                    <th style="padding: 12px 8px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${earningsTransactions.map((transaction, index) => `
                    <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''} border-bottom: 1px solid #ddd;">
                      <td style="padding: 10px 8px; font-size: 14px;">
                        ${new Date(transaction.date).toLocaleDateString('en-IN')}
                      </td>
                      <td style="padding: 10px 8px; font-size: 14px;">
                        ${transaction.description}
                      </td>
                      <td style="padding: 10px 8px; font-size: 14px;">
                        ${transaction.category || 'Uncategorized'}
                      </td>
                      <td style="padding: 10px 8px; text-align: right; font-size: 14px; font-weight: 500;">
                        +₹${Number(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <div style="text-align: center; padding: 30px; border: 1px solid #000; background: #f9f9f9; margin-bottom: 30px;">
                <div style="font-size: 14px; color: #666;">No earnings found for this period</div>
              </div>
            `}
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #000; padding-bottom: 10px;">
              Expenses Details
            </h2>
            
            ${expensesTransactions.length > 0 ? `
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #000;">
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Date</th>
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Description</th>
                    <th style="padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Category</th>
                    <th style="padding: 12px 8px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${expensesTransactions.map((transaction, index) => `
                    <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''} border-bottom: 1px solid #ddd;">
                      <td style="padding: 10px 8px; font-size: 14px;">
                        ${new Date(transaction.date).toLocaleDateString('en-IN')}
                      </td>
                      <td style="padding: 10px 8px; font-size: 14px;">
                        ${transaction.description}
                      </td>
                      <td style="padding: 10px 8px; font-size: 14px;">
                        ${transaction.category || 'Uncategorized'}
                      </td>
                      <td style="padding: 10px 8px; text-align: right; font-size: 14px; font-weight: 500;">
                        -₹${Number(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <div style="text-align: center; padding: 30px; border: 1px solid #000; background: #f9f9f9;">
                <div style="font-size: 14px; color: #666;">No expenses found for this period</div>
              </div>
            `}
          </div>
          
          <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #000; font-size: 10px; color: #666; text-align: center;">
            <div>Report generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</div>
            <div style="margin-top: 5px;">Financial Management System</div>
          </div>
        </div>
      `;

      tempContainer.innerHTML = reportHTML;

      // Generate PDF
      const canvas = await html2canvas(tempContainer, {
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempContainer.scrollHeight
      });

      // Clean up
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`financial-report-${month}-${year}.pdf`);

      // Restore button
      button.innerHTML = originalText;
      button.removeAttribute('disabled');

      toast({
        title: 'Success',
        description: 'PDF downloaded successfully!',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-8 backdrop-blur-sm border border-primary/10">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-gradient-to-tr from-accent/20 to-transparent blur-xl"></div>
        
        <div className="relative z-10 flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Financial Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Manage your transactions and monitor your financial progress
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 h-12 px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-medium">Add Transaction</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold">Add Transactions</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Record multiple transactions at once to track your financial progress
                </p>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Global Transaction Type Selection */}
                <div className="space-y-2 pb-4 border-b">
                  <Label className="text-sm font-medium">Transaction Type for All Forms</Label>
                  <Select
                    value={globalTransactionType}
                    onValueChange={(value) =>
                      setGlobalTransactionType(value as "earning" | "expense")
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="earning" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                          <span>Earning</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="expense" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                          <span>Expense</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {transactionForms.map((form, index) => (
                  <div key={form.id} className="relative">
                    {transactionForms.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                        onClick={() => handleRemoveTransactionForm(form.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <div className="border rounded-lg p-4 space-y-4 bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Transaction {index + 1}</h4>
                        <Badge variant="outline" className="text-xs">
                          {globalTransactionType === 'earning' ? 'Income' : 'Expense'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                          <Input
                            type="number"
                            className="pl-8 h-10"
                            placeholder="0.00"
                            value={form.amount}
                            onChange={(e) =>
                              handleUpdateTransactionForm(form.id, 'amount', e.target.value)
                            }
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <Input
                          className="h-10"
                          placeholder="e.g., Monthly salary, Grocery shopping"
                          value={form.description}
                          onChange={(e) =>
                            handleUpdateTransactionForm(form.id, 'description', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTransactionForm}
                  className="w-full h-11 border-dashed border-2 hover:border-solid hover:bg-gray-50 transition-all duration-200"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add More Transaction
                </Button>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <DialogClose id="close-dialog" className="hidden" />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('close-dialog')?.click()}
                  disabled={isSubmitting}
                  className="h-11"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMultipleTransactions}
                  disabled={isSubmitting}
                  className="h-11 min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    `Add ${transactionForms.length} ${globalTransactionType}${transactionForms.length > 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-green-400/20 to-transparent blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-green-500/10">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                +12.5%
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-green-700">
                ₹{(totalEarnings || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-red-400/20 to-transparent blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-red-500/10">
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">
                -8.3%
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-red-700">
                ₹{(totalExpenses || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div className={`text-xs font-medium px-2 py-1 rounded-full ${(balance || 0) >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                {(balance || 0) >= 0 ? 'Positive' : 'Negative'}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Net Balance</p>
              <p className={`text-3xl font-bold ${(balance || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ₹{(balance || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                <Wallet className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No transactions yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Start tracking your finances by adding your first transaction
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div 
                  key={transaction._id} 
                  className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-md ${
                    completedTransactions.has(transaction._id!) 
                      ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-green-200/50' 
                      : 'bg-card border-border/50 hover:border-border'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={completedTransactions.has(transaction._id!)}
                            onChange={(e) => handleToggleCompletion(transaction._id!, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-5 w-5 rounded-lg border-2 transition-all duration-200 cursor-pointer
                              focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                              checked:bg-green-500 checked:border-green-500
                              hover:border-green-400"
                          />
                          {completedTransactions.has(transaction._id!) && (
                            <div className="absolute -inset-1 bg-green-500/20 rounded-lg animate-pulse"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className={`font-semibold text-base truncate ${
                              completedTransactions.has(transaction._id!) ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}>
                              {transaction.description}
                            </h4>
                            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${
                              transaction.type === 'earning' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-red-100 text-red-700 border-red-200'
                            }`}>
                              {transaction.type === 'earning' ? 'Earning' : 'Expense'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full bg-muted-foreground/30"></div>
                              {transaction.category}
                            </span>
                            <span>•</span>
                            <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            transaction.type === 'earning' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'earning' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                          </p>
                          {completedTransactions.has(transaction._id!) && (
                            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                              <Check className="h-3 w-3" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(transaction._id!);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          {earnings.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <ArrowUpRight className="h-12 w-12 text-green-500/50" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No earnings yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Start tracking your income by adding your first earning
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.map((transaction) => (
                <div 
                  key={transaction._id} 
                  className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-md ${
                    completedTransactions.has(transaction._id!) 
                      ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-green-200/50' 
                      : 'bg-card border-border/50 hover:border-border'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={completedTransactions.has(transaction._id!)}
                            onChange={(e) => handleToggleCompletion(transaction._id!, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-5 w-5 rounded-lg border-2 transition-all duration-200 cursor-pointer
                              focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                              checked:bg-green-500 checked:border-green-500
                              hover:border-green-400"
                          />
                          {completedTransactions.has(transaction._id!) && (
                            <div className="absolute -inset-1 bg-green-500/20 rounded-lg animate-pulse"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className={`font-semibold text-base truncate ${
                              completedTransactions.has(transaction._id!) ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}>
                              {transaction.description}
                            </h4>
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs px-2 py-0.5">
                              Earning
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full bg-green-500/30"></div>
                              {transaction.category}
                            </span>
                            <span>•</span>
                            <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            +₹{transaction.amount.toFixed(2)}
                          </p>
                          {completedTransactions.has(transaction._id!) && (
                            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                              <Check className="h-3 w-3" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(transaction._id!);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          {expenses.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <ArrowDownRight className="h-12 w-12 text-red-500/50" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No expenses yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Start tracking your spending by adding your first expense
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((transaction) => (
                <div 
                  key={transaction._id} 
                  className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-md ${
                    completedTransactions.has(transaction._id!) 
                      ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-green-200/50' 
                      : 'bg-card border-border/50 hover:border-border'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={completedTransactions.has(transaction._id!)}
                            onChange={(e) => handleToggleCompletion(transaction._id!, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-5 w-5 rounded-lg border-2 transition-all duration-200 cursor-pointer
                              focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                              checked:bg-green-500 checked:border-green-500
                              hover:border-green-400"
                          />
                          {completedTransactions.has(transaction._id!) && (
                            <div className="absolute -inset-1 bg-green-500/20 rounded-lg animate-pulse"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className={`font-semibold text-base truncate ${
                              completedTransactions.has(transaction._id!) ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}>
                              {transaction.description}
                            </h4>
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs px-2 py-0.5">
                              Expense
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full bg-red-500/30"></div>
                              {transaction.category}
                            </span>
                            <span>•</span>
                            <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            -₹{transaction.amount.toFixed(2)}
                          </p>
                          {completedTransactions.has(transaction._id!) && (
                            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                              <Check className="h-3 w-3" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(transaction._id!);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card ref={reportRef}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Monthly Report</CardTitle>
                <CardDescription>Select month and year to view financial report</CardDescription>
              </div>
              <Button
                variant="outline"
                className="gap-2 no-print"
                onClick={generatePDF}
                id="download-pdf-button"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(value) => setSelectedMonth(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => ({
                          value: i.toString(),
                          label: new Date(0, i).toLocaleString('default', { month: 'long' })
                        })).map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="e.g., 2024"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
                      className="h-11"
                    />
                  </div>
                </div>

                {selectedMonth && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Earnings</p>
                          <p className="text-2xl font-bold text-green-600">₹{(totalEarnings || 0).toLocaleString('en-IN')}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Expenses</p>
                          <p className="text-2xl font-bold text-red-600">₹{(totalExpenses || 0).toLocaleString('en-IN')}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Net</p>
                          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{(balance || 0).toLocaleString('en-IN')}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div key={transaction._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(transaction.date), "MMM dd, yyyy")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-semibold ${transaction.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'earning' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                            </p>
                            {transaction.category && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finances;