import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Loader2 } from 'lucide-react';
import timetableApi from '@/services/timetableService';

type TimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
  completed: boolean;
};

const EditTimeSlot = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [timeSlot, setTimeSlot] = useState<Omit<TimeSlot, 'id'>>({
    startTime: '09:00',
    endTime: '10:00',
    description: '',
    completed: false
  });

  useEffect(() => {
    const fetchTimeSlot = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          throw new Error('No authentication token found');
        }
        
        if (!id) {
          console.error('No time slot ID provided');
          toast({
            title: 'Error',
            description: 'No time slot ID provided',
            variant: 'destructive',
          });
          navigate('/timetable');
          return;
        }

        console.log('Fetching time slot with ID:', id);
        const currentDate = new Date().toISOString().split('T')[0];
        console.log('Fetching schedule for date:', currentDate);
        
        const data = await timetableApi.getDailySchedule(currentDate, token);
        console.log('API Response:', data);
        
        // Handle different response formats
        let slots = [];
        if (Array.isArray(data)) {
          slots = data;
        } else if (data && Array.isArray(data.timeSlots)) {
          slots = data.timeSlots;
        } else if (data && data.data && Array.isArray(data.data)) {
          slots = data.data;
        }
        
        console.log('All slots:', slots);
        console.log('Looking for time slot with ID:', id);
        
        // Try to find the slot by both id and _id
        const slot = slots.find(s => {
          const match = (s.id === id || s._id === id);
          if (match) {
            console.log('Found matching slot:', s);
          }
          return match;
        });
        
        if (slot) {
          console.log('Setting time slot data:', {
            startTime: slot.startTime || '09:00',
            endTime: slot.endTime || '10:00',
            description: slot.description || '',
            completed: slot.completed || false
          });
          
          setTimeSlot({
            startTime: slot.startTime || '09:00',
            endTime: slot.endTime || '10:00',
            description: slot.description || '',
            completed: slot.completed || false
          });
        } else {
          console.error('Time slot not found. Available slots:', slots);
          toast({
            title: 'Error',
            description: `Time slot with ID ${id} not found`,
            variant: 'destructive',
          });
          navigate('/timetable');
        }
      } catch (error) {
        console.error('Error fetching time slot:', error);
        toast({
          title: 'Error',
          description: 'Failed to load time slot',
          variant: 'destructive',
        });
        navigate('/timetable');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeSlot();
  }, [id, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!timeSlot.startTime || !timeSlot.endTime) {
      toast({
        title: 'Error',
        description: 'Please provide both start and end times',
        variant: 'destructive',
      });
      return;
    }
    
    if (!timeSlot.description.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a description',
        variant: 'destructive',
      });
      return;
    }
    
    // Ensure end time is after start time
    if (timeSlot.endTime <= timeSlot.startTime) {
      toast({
        title: 'Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      if (!token || !id) throw new Error('Invalid request');
      
      const currentDate = new Date().toISOString().split('T')[0];
      await timetableApi.updateTimeSlot(
        currentDate,
        id,
        timeSlot,
        token
      );
      
      toast({
        title: 'Success',
        description: 'Time slot updated successfully',
      });
      
      navigate('/timetable');
    } catch (error) {
      console.error('Error updating time slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to update time slot',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTimeSlot(prev => ({
      ...prev,
      [name]: name === 'completed' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
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
          onClick={() => navigate('/timetable')}
          className="mr-2"
        >
          <X className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Time Slot</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 p-6 border rounded-lg bg-card">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={timeSlot.startTime}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={timeSlot.endTime}
                onChange={handleChange}
                min={timeSlot.startTime}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={timeSlot.description}
              onChange={handleChange}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What are you planning to do?"
              required
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <input
              id="completed"
              name="completed"
              type="checkbox"
              checked={timeSlot.completed}
              onChange={(e) => setTimeSlot(prev => ({ ...prev, completed: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="completed">Mark as completed</Label>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/timetable')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditTimeSlot;
