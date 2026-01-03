import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DiaryBookView } from "./DiaryBookView";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Edit, Trash2, CheckCircle, X, CalendarDays, Star, ThumbsUp, ThumbsDown, BookOpen, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DiaryEntry = {
  id: string;
  date: Date;
  content: string;
  goodThings: string[];
  badThings: string[];
};

interface DiaryProps {
  viewMode?: 'list' | 'book';
}

export default function Diary({ viewMode: initialViewMode = 'list' }: DiaryProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [currentEntry, setCurrentEntry] = useState<string>("");
  const [viewingEntry, setViewingEntry] = useState<DiaryEntry | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'book'>(initialViewMode);
  const navigate = useNavigate();
  const [goodThing, setGoodThing] = useState<string>("");
  const [badThing, setBadThing] = useState<string>("");
  const [goodThingsList, setGoodThingsList] = useState<string[]>([]);
  const [badThingsList, setBadThingsList] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const API_BASE_URL = 'http://localhost:5000/api/diary';
  
  // Create axios instance with default headers
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Helper function to safely parse dates
  const safeDateParse = (dateString: string): Date => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  // Fetch entries on component mount and when selectedDate changes
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching all entries');
        const response = await api.get('/entries');
        
        console.log('API Response:', response.data);
        
        // Extract entries from the response
        const responseData = response?.data?.data || [];
        console.log('Extracted entries:', responseData);
        
        // Convert date strings back to Date objects with safe parsing
        const formattedEntries = responseData.map((entry: any) => ({
          id: entry._id || entry.id,
          content: entry.content || '',
          goodThings: Array.isArray(entry.goodThings) ? entry.goodThings : [],
          badThings: Array.isArray(entry.badThings) ? entry.badThings : [],
          date: safeDateParse(entry.date)
        }));
        
        console.log('Formatted entries:', formattedEntries);
        setEntries(formattedEntries);
      } catch (error) {
        console.error('Error fetching diary entries:', error);
        setEntries([]); // Reset entries on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [selectedDate]);

  const handleSaveEntry = async () => {
    if (!currentEntry.trim()) return;

    const entryData = {
      content: currentEntry.trim(),
      goodThings: [...goodThingsList],
      badThings: [...badThingsList],
      date: selectedDate.toISOString()
    };

    try {
      if (editingId) {
        // Update existing entry
        const response = await api.patch(`/entries/${editingId}`, entryData);
        const updatedEntry = response?.data?.data;
        
        if (updatedEntry) {
          setEntries(entries.map(entry => 
            entry.id === editingId ? {
              id: updatedEntry._id || updatedEntry.id,
              content: updatedEntry.content || '',
              goodThings: Array.isArray(updatedEntry.goodThings) ? updatedEntry.goodThings : [],
              badThings: Array.isArray(updatedEntry.badThings) ? updatedEntry.badThings : [],
              date: safeDateParse(updatedEntry.date)
            } : entry
          ));
          setSuccessMessage('Entry updated successfully!');
        }
      } else {
        // Create new entry
        const response = await api.post('/entries', entryData);
        const savedEntry = response?.data?.data;
        
        if (savedEntry) {
          setEntries([{
            id: savedEntry._id || savedEntry.id,
            content: savedEntry.content || '',
            goodThings: Array.isArray(savedEntry.goodThings) ? savedEntry.goodThings : [],
            badThings: Array.isArray(savedEntry.badThings) ? savedEntry.badThings : [],
            date: safeDateParse(savedEntry.date)
          }, ...entries]);
          setSuccessMessage('Entry saved successfully!');
        }
      }
      
      // Reset form
      setCurrentEntry("");
      setGoodThing("");
      setBadThing("");
      setGoodThingsList([]);
      setBadThingsList([]);
      setEditingId(null);
      
      // Show success message
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving diary entry:', error);
      if (error.response?.status === 401) {
        // Handle unauthorized error - redirect to login or show message
        alert('Your session has expired. Please log in again.');
        // Optionally redirect to login
        // navigate('/login');
      } else {
        // Show a generic error message for other errors
        alert('Failed to save entry. Please try again.');
      }
    }
  };

  // Show all entries by default
  const getTodaysEntries = () => {
    return [...entries].sort((a, b) => {
      // Sort by date, newest first
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setCurrentEntry(entry.content);
    setGoodThingsList([...entry.goodThings]);
    setBadThingsList([...entry.badThings]);
    setSelectedDate(new Date(entry.date));
    setEditingId(entry.id);
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await api.delete(`/entries/${id}`);
        setEntries(entries.filter(entry => entry.id !== id));
        setSuccessMessage('Entry deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Helper to safely format dates in the UI
  const formatDateSafe = (date: Date | string) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      return isNaN(d.getTime()) ? 'Invalid Date' : format(d, 'PPP');
    } catch (e) {
      console.error('Error formatting date:', date, e);
      return 'Invalid Date';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Diary</h1>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) setSelectedDate(date);
                setIsCalendarOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Entry</CardTitle>
              <CardDescription>
                Write about your day, thoughts, or anything on your mind.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    className="min-h-[200px] text-base mb-4"
                    placeholder="Today I..."
                    value={currentEntry}
                    onChange={(e) => setCurrentEntry(e.target.value)}
                  />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Something good that happened..."
                          value={goodThing}
                          onChange={(e) => setGoodThing(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && goodThing.trim()) {
                              e.preventDefault();
                              setGoodThingsList([...goodThingsList, goodThing.trim()]);
                              setGoodThing("");
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (goodThing.trim()) {
                              setGoodThingsList([...goodThingsList, goodThing.trim()]);
                              setGoodThing("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      {goodThingsList.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {goodThingsList.map((item, index) => (
                            <div key={`good-${index}-${item.substring(0, 10)}`} className="bg-green-50 text-green-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                              {item}
                              <button 
                                onClick={() => {
                                  const newList = [...goodThingsList];
                                  newList.splice(index, 1);
                                  setGoodThingsList(newList);
                                }}
                                className="text-green-600 hover:text-green-800"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Something to improve..."
                          value={badThing}
                          onChange={(e) => setBadThing(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && badThing.trim()) {
                              e.preventDefault();
                              setBadThingsList([...badThingsList, badThing.trim()]);
                              setBadThing("");
                            }
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (badThing.trim()) {
                              setBadThingsList([...badThingsList, badThing.trim()]);
                              setBadThing("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      {badThingsList.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {badThingsList.map((item, index) => (
                            <div key={`bad-${index}-${item.substring(0, 10)}`} className="bg-red-50 text-red-800 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                              {item}
                              <button 
                                onClick={() => {
                                  const newList = [...badThingsList];
                                  newList.splice(index, 1);
                                  setBadThingsList(newList);
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {editingId && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCurrentEntry("");
                    setGoodThingsList([]);
                    setBadThingsList([]);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button onClick={handleSaveEntry}>
                {editingId ? 'Update Entry' : 'Save Entry'}
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-4">
            {successMessage && (
              <div className="fixed top-4 right-4 z-50 animate-fade-in">
                <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 w-80" role="alert">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-green-800">Success!</p>
                      <p className="mt-1 text-sm text-green-700">{successMessage}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                      <button
                        className="bg-green-50 rounded-md inline-flex text-green-500 hover:text-green-600 focus:outline-none"
                        onClick={() => setSuccessMessage('')}
                      >
                        <span className="sr-only">Close</span>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-primary" />
                <span>Your Entries</span>
              </h2>
              {entries.length > 0 && (
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => navigate('/diary/book')}
                >
                  <BookOpen className="h-4 w-4" />
                  Read Diary
                </Button>
              )}
            </div>
            {getTodaysEntries().length > 0 ? (
              <div className="grid gap-3">
                {getTodaysEntries().map((entry) => (
                  <div 
                    key={entry.id}
                    onClick={() => setViewingEntry(entry)}
                    className="group relative p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {format(entry.date, 'EEEE, MMMM d, yyyy')}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {entry.content.length > 100 ? `${entry.content.substring(0, 100)}...` : entry.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.goodThings.length > 0 && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {entry.goodThings.length}
                          </span>
                        )}
                        {entry.badThings.length > 0 && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center gap-1">
                            <ThumbsDown className="h-3 w-3" />
                            {entry.badThings.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEntry(entry);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEntry(entry.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open-check">
                    <path d="M8 3H2v15h7c1.7 0 3 1.3 3 3V7c0-2.2-1.8-4-4-4Z"/>
                    <path d="m16 12 2 2 4-4"/>
                    <path d="M22 6V3h-6c-2.2 0-4 1.8-4 4v14h7c1.7 0 3-1.3 3-3v-2"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">No entries yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Start writing to see your entries here</p>
                <Button 
                  variant="ghost" 
                  className="mt-4"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Write your first entry
                </Button>
              </div>
            )}
          </div>
      </div>

      {/* Entry View Dialog */}
      <Dialog open={!!viewingEntry} onOpenChange={(open) => !open && setViewingEntry(null)}>
        {viewingEntry && (
          <DialogContent className="max-w-2xl max-h-[90vh] [&>button:last-child]:hidden">
Failed to load resource: the server responded with a status of 404 (Not Found)
DiaryBookView.tsx:36 Error fetching diary entries: AxiosError            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <span>{format(viewingEntry.date, 'EEEE, MMMM d, yyyy')}</span>
                </DialogTitle>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      handleEditEntry(viewingEntry);
                      setViewingEntry(null);
                    }}
                    title="Edit entry"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this entry?')) {
                        handleDeleteEntry(viewingEntry.id);
                        setViewingEntry(null);
                      }
                    }}
                    title="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-6 py-2 overflow-y-auto max-h-[calc(90vh-200px)] pr-2 -mr-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square-text">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    <path d="M13 8H7"/>
                    <path d="M17 12H7"/>
                  </svg>
                  <h3 className="font-medium">Today's Thoughts</h3>
                </div>
                <div className="prose max-w-none text-foreground/90 bg-white/80 dark:bg-gray-900/80 border border-muted/30 rounded-lg p-8 shadow-sm">
                  <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed tracking-wide text-gray-800 dark:text-gray-200">
                    <p className="mb-6">
                      <span className="mr-2">Dear</span>
                      <span className="inline-block w-32 border-b-2 border-gray-300 dark:border-gray-600"></span>
                      <span className="ml-2">,</span>
                    </p>
                    <div className="indent-8 space-y-4">
                      {viewingEntry.content.split('\n\n').map((paragraph, i) => (
                        <p key={`para-${i}`} className="first:indent-0">
                          {paragraph || <br />}
                        </p>
                      ))}
                    </div>
                    <p className="mt-8 mb-4">Sincerely,</p>
                    <p className="font-signature text-2xl text-gray-700 dark:text-gray-300">
                      {new Date().toLocaleDateString('en-US', { month: 'long' })}
                    </p>
                  </div>
                </div>
              </div>

              {viewingEntry.goodThings.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <ThumbsUp className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium">Positive Highlights</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full ml-1">
                      {viewingEntry.goodThings.length}
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {viewingEntry.goodThings.map((item, i) => (
                      <li key={`view-good-${i}`} className="flex items-start gap-3 p-2.5 bg-green-50/50 rounded-lg border border-green-100">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <p className="text-foreground/90 text-sm leading-relaxed">{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingEntry.badThings.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <ThumbsDown className="h-5 w-5 text-red-600" />
                    <h3 className="font-medium">Areas for Improvement</h3>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full ml-1">
                      {viewingEntry.badThings.length}
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {viewingEntry.badThings.map((item, i) => (
                      <li key={`view-bad-${i}`} className="flex items-start gap-3 p-2.5 bg-red-50/50 rounded-lg border border-red-100">
                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                        </div>
                        <p className="text-foreground/90 text-sm leading-relaxed">{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="pt-4 mt-4 border-t flex justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setViewingEntry(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
