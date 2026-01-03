import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getTransaction, updateTransaction } from '@/services/transactionService';
import { useToast } from '@/components/ui/use-toast';

const EditTransaction = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [transaction, setTransaction] = useState({
    type: 'earning' as 'earning' | 'expense',
    amount: '',
    description: '',
    date: new Date(),
    category: ''
  });

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await getTransaction(id);
        const data = response.data;
        
        setTransaction({
          type: data.type,
          amount: data.amount.toString(),
          description: data.description,
          date: new Date(data.date),
          category: data.category
        });
      } catch (error) {
        console.error('Error fetching transaction:', error);
        toast({
          title: 'Error',
          description: 'Failed to load transaction',
          variant: 'destructive',
        });
        navigate('/finances');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [id, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction.amount || !transaction.description || !transaction.category) {
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
        ...transaction,
        amount: parseFloat(transaction.amount),
        date: transaction.date.toISOString()
      };

      await updateTransaction(id!, transactionData);
      
      toast({
        title: 'Success',
        description: 'Transaction updated successfully',
      });
      
      navigate('/finances');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update transaction',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Transaction</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={transaction.type}
              onChange={(e) => setTransaction({...transaction, type: e.target.value as 'earning' | 'expense'})}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="earning">Earning</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={transaction.amount}
              onChange={(e) => setTransaction({...transaction, amount: e.target.value})}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={transaction.description}
            onChange={(e) => setTransaction({...transaction, description: e.target.value})}
            placeholder="Transaction description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !transaction.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {transaction.date ? format(transaction.date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={transaction.date}
                  onSelect={(date) => date && setTransaction({...transaction, date})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={transaction.category}
              onChange={(e) => setTransaction({...transaction, category: e.target.value})}
              placeholder="e.g., Salary, Food, Rent"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/finances')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditTransaction;
