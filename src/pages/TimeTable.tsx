import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  X,
  Loader2,
  Edit,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  format,
  addDays,
  subDays,
  isToday,
  isSameDay,
  parseISO,
} from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import timetableApi from "@/services/timetableService";
import specialScheduleApi from "@/services/specialScheduleService";

/**
 * Converts 24-hour format time string to 12-hour format with AM/PM
 * @param timeString Time in 24-hour format (HH:mm)
 * @returns Formatted time in 12-hour format (h:mm AM/PM)
 */
const formatTime12Hour = (timeString: string): string => {
  if (!timeString) return "";

  try {
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeString; // Return original if there's an error
  }
};

/**
 * Formats a date string to a more readable format
 * @param dateString Date string in ISO format (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "October 5, 2025")
 */
const formatDate = (dateString: string): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

type TimeSlot = {
  id: string;
  _id?: string; // For MongoDB _id
  startTime: string;
  endTime: string;
  description: string;
  status: "pending" | "completed";
  completedAt?: string;
  isRecurring?: boolean;
  recurrencePattern?: {
    frequency: string;
    days: string[];
  };
  _isDeleting?: boolean;
  _isUpdating?: boolean;
};

type SpecialTask = {
  id: string;
  date: string; // ISO date string
  description: string;
};

const TimeTable = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [specialTasks, setSpecialTasks] = useState<SpecialTask[]>([]);
  const [isSpecialDialogOpen, setIsSpecialDialogOpen] = useState(false);
  const [specialStartDate, setSpecialStartDate] = useState<string>("");
  const [specialEndDate, setSpecialEndDate] = useState<string>("");
  const [specialScheduleId, setSpecialScheduleId] = useState<string | null>(
    null
  );
  const [isEditSpecialDialogOpen, setIsEditSpecialDialogOpen] = useState(false);
  const [editSpecialStartDate, setEditSpecialStartDate] = useState<string>("");
  const [editSpecialEndDate, setEditSpecialEndDate] = useState<string>("");
  const [isSpecialTaskDialogOpen, setIsSpecialTaskDialogOpen] = useState(false);
  const [specialTaskDate, setSpecialTaskDate] = useState<string>("");
  const [specialTaskDescription, setSpecialTaskDescription] =
    useState<string>("");
  const [areSpecialTasksCollapsed, setAreSpecialTasksCollapsed] =
    useState(false);
  const [newSlots, setNewSlots] = useState<Omit<TimeSlot, "id">[]>([
    {
      startTime: "09:00",
      endTime: "10:00",
      description: "",
      completed: false,
    },
  ]);

  // Format date as YYYY-MM-DD for API calls
  const formatDateForApi = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  // Format date for display
  const formatDateDisplay = (date: Date): string => {
    return format(date, "EEEE, MMMM d, yyyy");
  };

  // Load time slots from API for the selected date
  const loadTimeSlots = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No authentication token found in localStorage");
        return;
      }

      const dateStr = formatDateForApi(selectedDate);
      console.log("Fetching time slots for date:", dateStr);

      const data = await timetableApi.getDailySchedule(dateStr, token);
      console.log("API Response:", data);

      // Check different possible response structures
      const timeSlots = data?.timeSlots || data?.data?.timeSlots || data || [];
      console.log("Extracted time slots:", timeSlots);

      setTimeSlots(Array.isArray(timeSlots) ? timeSlots : []);
    } catch (error) {
      console.error("Error loading time slots:", error);
      toast({
        title: "Error",
        description: "Failed to load time slots. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load time slots when selectedDate changes or component is focused
  useEffect(() => {
    // Initial load
    loadTimeSlots();

    // Optional: Add an event listener to refresh when the window regains focus
    const handleFocus = () => {
      console.log("Window focused, refreshing time slots...");
      loadTimeSlots();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [selectedDate]);

  // Load latest special schedule for the current user on mount
  useEffect(() => {
    const loadSpecialSchedule = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const schedules = await specialScheduleApi.getSpecialSchedules(token);
        if (!schedules || schedules.length === 0) return;

        // Pick the latest schedule by startDate
        const latest = [...schedules].sort((a, b) => {
          return (
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
        })[0];

        setSpecialScheduleId(latest._id);
        setSpecialStartDate(latest.startDate.split("T")[0]);
        setSpecialEndDate(latest.endDate.split("T")[0]);

        const mappedTasks: SpecialTask[] = (latest.tasks || []).map(
          (t: any) => ({
            id:
              t._id ||
              Date.now().toString() + Math.random().toString(36).substr(2, 9),
            date: t.date,
            description: t.description,
          })
        );
        setSpecialTasks(mappedTasks);
      } catch (error) {
        console.error("Error loading special schedules:", error);
      }
    };

    loadSpecialSchedule();
  }, []);

  // Navigation functions
  const goToPreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleAddTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all slots
    for (let i = 0; i < newSlots.length; i++) {
      const slot = newSlots[i];
      if (!slot.startTime || !slot.endTime) {
        toast({
          title: "Error",
          description: `Please provide both start and end times for slot ${
            i + 1
          }`,
          variant: "destructive",
        });
        return;
      }

      if (!slot.description.trim()) {
        toast({
          title: "Error",
          description: `Please provide a description for slot ${i + 1}`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const dateStr = formatDateForApi(selectedDate);

      if (editingId) {
        // Update existing time slot (only first slot is used in edit mode)
        await timetableApi.updateTimeSlot(
          dateStr,
          editingId,
          newSlots[0],
          token
        );

        toast({
          title: "Success",
          description: "Time slot updated successfully",
        });
      } else {
        // Add new time slots
        const newTimeSlots = newSlots.map((slot) => ({
          ...slot,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }));

        await timetableApi.updateDailySchedule(
          dateStr,
          [...timeSlots, ...newTimeSlots],
          token
        );

        toast({
          title: "Success",
          description: `${newTimeSlots.length} time slot${
            newTimeSlots.length > 1 ? "s" : ""
          } added successfully`,
        });
      }

      // Refresh the time slots and reset form
      await loadTimeSlots();
      setNewSlots([
        {
          startTime: "09:00",
          endTime: "10:00",
          description: "",
          completed: false,
        },
      ]);
      setEditingId(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving time slot:", error);
      toast({
        title: "Error",
        description: "Failed to save time slot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeTimeSlot = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      console.log("Attempting to delete time slot with ID:", id);

      // Show loading state immediately for the specific slot
      setTimeSlots((prevSlots) => {
        const updated = prevSlots.map((slot) =>
          slot.id === id || slot._id === id
            ? { ...slot, _isDeleting: true }
            : slot
        );
        console.log("Updated slots with loading state:", updated);
        return updated;
      });

      const dateStr = formatDateForApi(selectedDate);

      try {
        console.log("Calling deleteTimeSlot with:", { date: dateStr, id });

        // Always call the API to delete the time slot
        const result = await timetableApi.deleteTimeSlot(dateStr, id, token);
        console.log("Delete result:", result);

        // The API should return the updated list of time slots
        const updatedSlots = Array.isArray(result)
          ? result
          : result?.timeSlots || result?.data || [];

        console.log("Updated slots from API:", updatedSlots);

        // Update the local state with the updated slots
        if (updatedSlots && updatedSlots.length > 0) {
          setTimeSlots(updatedSlots);
        } else {
          // If no slots returned, filter out the deleted one locally as a fallback
          setTimeSlots((prevSlots) =>
            prevSlots.filter((slot) => !(slot.id === id || slot._id === id))
          );
        }

        toast({
          title: "Success",
          description: "Time slot deleted successfully",
        });

        // Refresh the time slots from the server to ensure consistency
        try {
          const refreshedSlots = await timetableApi.getDailySchedule(
            dateStr,
            token
          );
          console.log("Refreshed slots from server:", refreshedSlots);

          // Update the local state with the refreshed data
          if (Array.isArray(refreshedSlots)) {
            setTimeSlots(refreshedSlots);
          } else if (refreshedSlots?.timeSlots) {
            setTimeSlots(refreshedSlots.timeSlots);
          } else if (refreshedSlots?.data) {
            setTimeSlots(
              Array.isArray(refreshedSlots.data) ? refreshedSlots.data : []
            );
          }
        } catch (refreshError) {
          console.error("Error refreshing time slots:", refreshError);
          // Continue with the current state if refresh fails
        }
      } catch (apiError) {
        console.error("API Error during deletion:", apiError);

        // Revert the loading state
        setTimeSlots((prevSlots) =>
          prevSlots.map((slot) => {
            const { _isDeleting, ...rest } = slot;
            return rest;
          })
        );

        throw apiError; // Re-throw to be caught by the outer catch block
      }
    } catch (error) {
      console.error("Error deleting time slot:", error);

      // Revert the loading state if there was an error
      setTimeSlots((prevSlots) =>
        prevSlots.map((slot) => {
          const { _isDeleting, ...rest } = slot;
          return rest;
        })
      );

      toast({
        title: "Error",
        description: "Failed to delete time slot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleEdit = (slot: TimeSlot) => {
    // Use _id if available, otherwise fall back to id
    const slotId = slot._id || slot.id;
    if (!slotId) {
      console.error("No ID found for time slot:", slot);
      toast({
        title: "Error",
        description: "Could not find time slot ID",
        variant: "destructive",
      });
      return;
    }
    console.log("Navigating to edit time slot with ID:", slotId);
    navigate(`/timetable/edit/${slotId}`);
  };

  const handleCancel = () => {
    setNewSlots([
      {
        startTime: "09:00",
        endTime: "10:00",
        description: "",
        completed: false,
      },
    ]);
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const addMoreSlots = () => {
    setNewSlots([
      ...newSlots,
      {
        startTime: "09:00",
        endTime: "10:00",
        description: "",
        completed: false,
      },
    ]);
  };

  const updateSlot = (
    index: number,
    field: keyof TimeSlot,
    value: string | boolean
  ) => {
    const updatedSlots = [...newSlots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    setNewSlots(updatedSlots);
  };

  const removeSlot = (index: number) => {
    if (newSlots.length > 1) {
      const updatedSlots = newSlots.filter((_, i) => i !== index);
      setNewSlots(updatedSlots);
    }
  };

  const toggleComplete = async (slot: TimeSlot, e: React.MouseEvent) => {
    e.stopPropagation();

    const slotId = slot._id || slot.id;
    const newStatus = slot.status === "pending" ? "completed" : "pending";
    const updatedAt =
      newStatus === "completed" ? new Date().toISOString() : undefined;

    // Optimistically update the UI
    setTimeSlots((prevSlots) =>
      prevSlots.map((s) =>
        s._id === slotId || s.id === slotId
          ? {
              ...s,
              _isUpdating: true,
              status: newStatus,
              ...(newStatus === "completed" && { completedAt: updatedAt }),
            }
          : s
      )
    );

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const dateStr = formatDateForApi(selectedDate);
      if (!token) throw new Error("No authentication token found");

      // Call the API to update the status
      await timetableApi.updateTimeSlot(
        dateStr,
        slotId,
        {
          status: newStatus,
          ...(newStatus === "completed" && { completedAt: updatedAt }),
        },
        token
      );

      // Update the local state with the final value
      setTimeSlots((prevSlots) =>
        prevSlots.map((s) =>
          s._id === slotId || s.id === slotId
            ? {
                ...s,
                status: newStatus,
                _isUpdating: false,
                ...(newStatus === "completed" && { completedAt: updatedAt }),
              }
            : s
        )
      );
    } catch (error) {
      console.error("Error toggling completion status:", error);
      // Revert the optimistic update on error
      setTimeSlots((prevSlots) =>
        prevSlots.map((s) =>
          s._id === slotId || s.id === slotId
            ? {
                ...s,
                _isUpdating: false,
                // Keep the original status on error
                status: slot.status,
                ...(slot.status === "pending" && { completedAt: undefined }),
              }
            : s
        )
      );

      toast({
        title: "Error",
        description: "Failed to update time slot status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">Daily Schedule</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3">
                <CardTitle>Today's Schedule</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousDay}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal flex-1 md:w-[240px]",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formatDateDisplay(selectedDate)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-background border-border"
                      align="start"
                    >
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(date);
                            setCalendarOpen(false);
                          }
                        }}
                        initialFocus
                        className="bg-background"
                        classNames={{
                          day: "hover:bg-muted",
                          day_selected:
                            "bg-foreground text-background hover:bg-foreground hover:text-background",
                          day_today: "border border-foreground",
                          day_outside: "text-muted-foreground opacity-50",
                          nav_button: "hover:bg-transparent",
                        }}
                      />
                      <div className="p-2 border-t text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            goToToday();
                            setCalendarOpen(false);
                          }}
                        >
                          Go to Today
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextDay}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="ml-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {timeSlots.length > 0 ? (
                <div className="space-y-3">
                  {timeSlots
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((slot) => (
                      <div
                        key={slot._id || slot.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-opacity ${
                          slot.status === "completed"
                            ? "bg-muted/30"
                            : "bg-card"
                        } ${slot._isDeleting ? "opacity-50" : ""}`}
                      >
                        <div className="relative mt-1 flex-shrink-0">
                          <button
                            onClick={(e) => toggleComplete(slot, e)}
                            disabled={slot._isUpdating}
                            className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                              slot.status === "completed"
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-input hover:border-primary/50"
                            } ${slot._isUpdating ? "opacity-50" : ""}`}
                            aria-label={
                              slot.status === "completed"
                                ? "Mark as incomplete"
                                : "Mark as complete"
                            }
                          >
                            {slot.status === "completed" &&
                              !slot._isUpdating && (
                                <Check className="h-4 w-4" />
                              )}
                            {slot._isUpdating && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </button>
                        </div>
                        {slot._isDeleting && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        )}
                        <div className="flex-grow">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm font-medium whitespace-nowrap">
                              {formatTime12Hour(slot.startTime)} -{" "}
                              {formatTime12Hour(slot.endTime)}
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(slot);
                                }}
                                className="text-muted-foreground hover:text-primary p-1 rounded-full hover:bg-muted"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Use _id if available, otherwise fall back to id
                                  const slotId = slot._id || slot.id;
                                  if (!slotId) {
                                    console.error(
                                      "No ID found for time slot:",
                                      slot
                                    );
                                    toast({
                                      title: "Error",
                                      description:
                                        "Could not find time slot ID",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  console.log("Deleting slot with ID:", slotId);
                                  removeTimeSlot(slotId);
                                }}
                                className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-muted"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          {slot.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {slot.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No time slots added yet. Click the button above to add one.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Special Tasks</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSpecialDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Special Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {specialStartDate && specialEndDate && (
                <div className="text-xs text-muted-foreground border rounded-md px-3 py-2 bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium">Special schedule range</p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() =>
                          setAreSpecialTasksCollapsed((prev) => !prev)
                        }
                        aria-label={
                          areSpecialTasksCollapsed ? "Show tasks" : "Hide tasks"
                        }
                      >
                        {areSpecialTasksCollapsed ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronUp className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsSpecialTaskDialogOpen(true)}
                        disabled={!specialStartDate || !specialEndDate}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add Task
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        title="Edit special schedule"
                        onClick={() => {
                          setEditSpecialStartDate(specialStartDate);
                          setEditSpecialEndDate(specialEndDate);
                          setIsEditSpecialDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        title="Delete special schedule"
                        onClick={async () => {
                          if (!specialScheduleId) {
                            toast({
                              title: "Error",
                              description:
                                "No special schedule selected to delete",
                              variant: "destructive",
                            });
                            return;
                          }

                          const token = localStorage.getItem("token");
                          if (!token) {
                            toast({
                              title: "Error",
                              description:
                                "You must be logged in to delete a special schedule",
                              variant: "destructive",
                            });
                            return;
                          }

                          try {
                            await specialScheduleApi.deleteSchedule(
                              specialScheduleId,
                              token
                            );

                            setSpecialScheduleId(null);
                            setSpecialStartDate("");
                            setSpecialEndDate("");
                            setSpecialTasks([]);

                            toast({
                              title: "Special schedule deleted",
                            });
                          } catch (error: any) {
                            console.error(
                              "Error deleting special schedule:",
                              error
                            );
                            toast({
                              title: "Error",
                              description:
                                error?.response?.data?.message ||
                                "Failed to delete special schedule",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p>
                    {formatDate(specialStartDate)} -{" "}
                    {formatDate(specialEndDate)}
                  </p>

                  {!areSpecialTasksCollapsed && (
                    <div className="space-y-2 pt-1">
                      {specialTasks.length > 0 ? (
                        specialTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex flex-col gap-1 p-2 rounded-md border bg-background/60"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {formatDate(task.date)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-primary p-1 rounded-full"
                                  title="Edit task"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-destructive p-1 rounded-full"
                                  title="Delete task"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs mt-0.5">{task.description}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted-foreground text-center">
                          No special tasks yet. Use "Add Task" to create one for
                          this range.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Time Slot</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTimeSlot} className="space-y-6">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {newSlots.map((slot, index) => (
                <div
                  key={index}
                  className="space-y-4 p-4 border rounded-lg relative"
                >
                  {newSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(index)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                      title="Remove this slot"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`startTime-${index}`}>
                        Start Time {newSlots.length > 1 ? `#${index + 1}` : ""}
                      </Label>
                      <Input
                        id={`startTime-${index}`}
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateSlot(index, "startTime", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`endTime-${index}`}>
                        End Time {newSlots.length > 1 ? `#${index + 1}` : ""}
                      </Label>
                      <Input
                        id={`endTime-${index}`}
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateSlot(index, "endTime", e.target.value)
                        }
                        min={slot.startTime}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`description-${index}`}>
                      Description {newSlots.length > 1 ? `#${index + 1}` : ""}
                    </Label>
                    <textarea
                      id={`description-${index}`}
                      value={slot.description}
                      onChange={(e) =>
                        updateSlot(index, "description", e.target.value)
                      }
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="What are you planning to do?"
                      required
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addMoreSlots}
                className="w-full mt-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add More Slots
              </Button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {editingId ? "Update" : "Add"} Time Slot
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditSpecialDialogOpen}
        onOpenChange={setIsEditSpecialDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Special Schedule</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();

              if (!editSpecialStartDate || !editSpecialEndDate) {
                toast({
                  title: "Error",
                  description: "Please select both start and end dates",
                  variant: "destructive",
                });
                return;
              }

              const start = new Date(editSpecialStartDate);
              const end = new Date(editSpecialEndDate);

              if (end < start) {
                toast({
                  title: "Error",
                  description: "End date cannot be before start date",
                  variant: "destructive",
                });
                return;
              }

              if (!specialScheduleId) {
                toast({
                  title: "Error",
                  description:
                    "No special schedule selected to update. Create one first.",
                  variant: "destructive",
                });
                return;
              }

              const token = localStorage.getItem("token");
              if (!token) {
                toast({
                  title: "Error",
                  description: "You must be logged in to update a schedule",
                  variant: "destructive",
                });
                return;
              }

              try {
                const updated = await specialScheduleApi.updateSchedule(
                  specialScheduleId,
                  {
                    startDate: editSpecialStartDate,
                    endDate: editSpecialEndDate,
                  },
                  token
                );

                setSpecialStartDate(updated.startDate.split("T")[0]);
                setSpecialEndDate(updated.endDate.split("T")[0]);

                toast({
                  title: "Special schedule updated",
                  description: `From ${formatDate(
                    updated.startDate
                  )} to ${formatDate(updated.endDate)}`,
                });

                setIsEditSpecialDialogOpen(false);
              } catch (error: any) {
                console.error("Error updating special schedule:", error);
                toast({
                  title: "Error",
                  description:
                    error?.response?.data?.message ||
                    "Failed to update special schedule",
                  variant: "destructive",
                });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-special-start-date">Start Date</Label>
              <Input
                id="edit-special-start-date"
                type="date"
                value={editSpecialStartDate}
                onChange={(e) => setEditSpecialStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-special-end-date">End Date</Label>
              <Input
                id="edit-special-end-date"
                type="date"
                value={editSpecialEndDate}
                onChange={(e) => setEditSpecialEndDate(e.target.value)}
                required
                min={editSpecialStartDate || undefined}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditSpecialDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSpecialTaskDialogOpen}
        onOpenChange={setIsSpecialTaskDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Special Task</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();

              if (!specialTaskDate || !specialTaskDescription.trim()) {
                toast({
                  title: "Error",
                  description:
                    "Please select a date and enter a task description",
                  variant: "destructive",
                });
                return;
              }

              if (!specialScheduleId) {
                toast({
                  title: "Error",
                  description:
                    "Please create a special schedule before adding tasks",
                  variant: "destructive",
                });
                return;
              }

              const token = localStorage.getItem("token");
              if (!token) {
                toast({
                  title: "Error",
                  description: "You must be logged in to add special tasks",
                  variant: "destructive",
                });
                return;
              }

              try {
                const schedule = await specialScheduleApi.addTaskToSchedule(
                  specialScheduleId,
                  {
                    date: specialTaskDate,
                    description: specialTaskDescription.trim(),
                  },
                  token
                );

                const mappedTasks: SpecialTask[] = (schedule.tasks || []).map(
                  (t: any) => ({
                    id:
                      t._id ||
                      Date.now().toString() +
                        Math.random().toString(36).substr(2, 9),
                    date: t.date,
                    description: t.description,
                  })
                );
                setSpecialTasks(mappedTasks);

                toast({
                  title: "Task added",
                  description: "Special task added to this schedule",
                });

                setSpecialTaskDate("");
                setSpecialTaskDescription("");
                setIsSpecialTaskDialogOpen(false);
              } catch (error: any) {
                console.error("Error adding special task:", error);
                toast({
                  title: "Error",
                  description:
                    error?.response?.data?.message ||
                    "Failed to add special task",
                  variant: "destructive",
                });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="special-task-date">Date</Label>
              <Input
                id="special-task-date"
                type="date"
                value={specialTaskDate}
                onChange={(e) => setSpecialTaskDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="special-task-description-field">Task</Label>
              <textarea
                id="special-task-description-field"
                value={specialTaskDescription}
                onChange={(e) => setSpecialTaskDescription(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe the special task"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSpecialTaskDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSpecialDialogOpen} onOpenChange={setIsSpecialDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Special Schedule</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();

              if (!specialStartDate || !specialEndDate) {
                toast({
                  title: "Error",
                  description: "Please select both start and end dates",
                  variant: "destructive",
                });
                return;
              }

              const start = new Date(specialStartDate);
              const end = new Date(specialEndDate);

              if (end < start) {
                toast({
                  title: "Error",
                  description: "End date cannot be before start date",
                  variant: "destructive",
                });
                return;
              }

              const token = localStorage.getItem("token");
              if (!token) {
                toast({
                  title: "Error",
                  description:
                    "You must be logged in to create a special schedule",
                  variant: "destructive",
                });
                return;
              }

              setIsLoading(true);

              specialScheduleApi
                .createSpecialSchedule(
                  specialStartDate,
                  specialEndDate,
                  [],
                  token
                )
                .then((schedule) => {
                  setSpecialScheduleId(schedule._id);

                  // Sync local tasks with backend schedule (currently empty when created)
                  const mappedTasks: SpecialTask[] = (schedule.tasks || []).map(
                    (t: any) => ({
                      id:
                        t._id ||
                        Date.now().toString() +
                          Math.random().toString(36).substr(2, 9),
                      date: t.date,
                      description: t.description,
                    })
                  );
                  setSpecialTasks(mappedTasks);

                  toast({
                    title: "Special schedule created",
                    description: `From ${formatDate(
                      specialStartDate
                    )} to ${formatDate(specialEndDate)}`,
                  });

                  setIsSpecialDialogOpen(false);
                })
                .catch((error) => {
                  console.error("Error creating special schedule:", error);
                  toast({
                    title: "Error",
                    description:
                      error?.response?.data?.message ||
                      "Failed to create special schedule",
                    variant: "destructive",
                  });
                })
                .finally(() => {
                  setIsLoading(false);
                });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="special-start-date">Start Date</Label>
              <Input
                id="special-start-date"
                type="date"
                value={specialStartDate}
                onChange={(e) => setSpecialStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="special-end-date">End Date</Label>
              <Input
                id="special-end-date"
                type="date"
                value={specialEndDate}
                onChange={(e) => setSpecialEndDate(e.target.value)}
                required
                min={specialStartDate || undefined}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSpecialDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeTable;
