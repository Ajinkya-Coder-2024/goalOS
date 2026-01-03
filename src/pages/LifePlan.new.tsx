import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Target, Loader2, Check, ArrowLeft, Trophy, Flame, Zap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getLifePlans as fetchLifePlans,
  createLifePlan as createNewPlan,
  updateLifePlan as updateExistingPlan,
  deleteLifePlan as deleteExistingPlan,
} from "@/api/lifePlanService";

interface LifePlan {
  _id: string;
  startAge: number;
  endAge: number;
  targetYear: number;
  description: string;
  completed: boolean;
  completedAt?: string;
  user: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface FormData {
  startAge: string;
  endAge: string;
  targetYear: string;
  description: string;
  completed: boolean;
}

const LifePlan = () => {
  const [plans, setPlans] = useState<LifePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<LifePlan | null>(null);
  const [formData, setFormData] = useState<FormData>({
    startAge: "",
    endAge: "",
    targetYear: "",
    description: "",
    completed: false,
  });
  const [showAddPlan, setShowAddPlan] = useState(false);
  const navigate = useNavigate();

  // Fetch plans on component mount
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchLifePlans();
        setPlans(data);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        toast.error("Failed to load life plans. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startAge || !formData.endAge || !formData.targetYear || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseInt(formData.startAge) >= parseInt(formData.endAge)) {
      toast.error("End age must be greater than start age");
      return;
    }

    setIsSubmitting(true);

    try {
      const planData = {
        startAge: parseInt(formData.startAge),
        endAge: parseInt(formData.endAge),
        targetYear: parseInt(formData.targetYear),
        description: formData.description,
        completed: formData.completed,
      };

      if (editingPlan) {
        const updatedPlan = await updateExistingPlan(editingPlan._id, planData);
        setPlans(plans.map(p => p._id === updatedPlan._id ? updatedPlan : p));
        toast.success("Plan updated successfully");
      } else {
        const newPlan = await createNewPlan(planData);
        setPlans([...plans, newPlan].sort((a, b) => a.targetYear - b.targetYear));
        toast.success("Plan created successfully");
      }

      setShowAddPlan(false);
      resetForm();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (plan: LifePlan) => {
    setEditingPlan(plan);
    setFormData({
      startAge: plan.startAge.toString(),
      endAge: plan.endAge.toString(),
      targetYear: plan.targetYear.toString(),
      description: plan.description,
      completed: plan.completed || false,
    });
    setShowAddPlan(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    
    setIsDeleting(id);
    
    try {
      await deleteExistingPlan(id);
      setPlans(plans.filter(plan => plan._id !== id));
      toast.success("Plan deleted successfully");
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  const togglePlanCompletion = async (id: string, currentStatus: boolean) => {
    try {
      const updatedPlan = await updateExistingPlan(id, { 
        completed: !currentStatus,
        completedAt: !currentStatus ? new Date().toISOString() : null
      });
      
      setPlans(plans.map(plan => 
        plan._id === id ? { ...plan, ...updatedPlan } : plan
      ));
      
      toast.success(`Plan marked as ${!currentStatus ? 'completed' : 'incomplete'}`);
    } catch (error) {
      console.error("Error updating plan completion:", error);
      toast.error("Failed to update plan status. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      startAge: "",
      endAge: "",
      targetYear: "",
      description: "",
      completed: false,
    });
    setEditingPlan(null);
  };

  const currentYear = new Date().getFullYear();
  const timelineYears = Array.from(
    new Set([currentYear, ...plans.map(p => p.targetYear)])
  ).sort((a, b) => a - b);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-life-plan" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-life-plan/10 via-life-plan/5 to-accent/10 p-8 backdrop-blur-sm border border-life-plan/10">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-gradient-to-br from-life-plan/20 to-transparent blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-gradient-to-tr from-accent/20 to-transparent blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-life-plan/10">
              <Trophy className="h-6 w-6 text-life-plan" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-life-plan to-accent bg-clip-text text-transparent">
              Life Plan Tracker
            </h1>
          </div>
          
          <Button 
            onClick={() => setShowAddPlan(true)}
            className="gap-2 h-11 px-6 bg-gradient-to-r from-life-plan to-accent hover:from-life-plan/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            Add Plan
          </Button>
        </div>
          
          <p className="text-muted-foreground text-lg max-w-3xl mb-6">
            Visualize and track your life goals on a timeline
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-life-plan/20 to-life-plan/10 border border-life-plan/200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-life-plan/20 to-transparent blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-life-plan/10">
                <Target className="h-5 w-5 text-life-plan" />
              </div>
              <div className="text-xs font-medium text-life-plan bg-life-plan/10 px-2 py-1 rounded-full">
                Total Goals
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {plans.length}
              </p>
              <p className="text-sm text-muted-foreground">Life Plans</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-life-plan">
              <Zap className="h-3 w-3" />
              <span>All Time</span>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                Upcoming
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {plans.filter(p => p.targetYear >= currentYear).length}
              </p>
              <p className="text-sm text-muted-foreground">Future Plans</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600">
              <Flame className="h-3 w-3" />
              <span>In Progress</span>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                Current
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {plans.filter(p => p.targetYear === currentYear).length}
              </p>
              <p className="text-sm text-muted-foreground">This Year</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-primary">
              <Calendar className="h-3 w-3" />
              <span>Active Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Plan Dialog */}
      <Dialog 
        open={showAddPlan} 
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
            setShowAddPlan(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit' : 'Create'} Life Plan</DialogTitle>
            <DialogDescription>
              Set your life goals with target ages and years.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startAge">Start Age *</Label>
                <Input
                  id="startAge"
                  name="startAge"
                  type="number"
                  min="18"
                  max="100"
                  placeholder="25"
                  value={formData.startAge}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAge">End Age *</Label>
                <Input
                  id="endAge"
                  name="endAge"
                  type="number"
                  min={formData.startAge ? parseInt(formData.startAge) + 1 : 19}
                  max="100"
                  placeholder="27"
                  value={formData.endAge}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetYear">Target Year *</Label>
              <Input
                id="targetYear"
                name="targetYear"
                type="number"
                min={new Date().getFullYear()}
                placeholder={new Date().getFullYear().toString()}
                value={formData.targetYear}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe your life goal..."
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddPlan(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingPlan ? 'Updating...' : 'Creating...'}
                  </>
                ) : editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Timeline View */}
      <div className="relative">
        {plans.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium">No life plans yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Get started by creating your first life plan
            </p>
            <Button onClick={() => setShowAddPlan(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </div>
        ) : (
          <>
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border -z-10" />
            
            {timelineYears.map((year) => {
              const yearPlans = plans.filter(plan => plan.targetYear === year);
              if (yearPlans.length === 0) return null;
              
              return (
                <div key={year} className="relative pl-12 pb-8">
                  {/* Year marker */}
                  <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-life-plan text-white text-sm font-medium">
                    {year}
                  </div>
                  
                  {/* Plans for this year */}
                  <div className="space-y-4">
                    {yearPlans.map((plan) => (
                      <Card key={plan._id} className={`group relative ${plan.completed ? 'opacity-80' : ''}`}>
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEdit(plan)}
                          >
                            <span className="sr-only">Edit</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m13.5 6.5 4 4" />
                            </svg>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(plan._id)}
                            disabled={isDeleting === plan._id}
                          >
                            {isDeleting === plan._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <span className="sr-only">Delete</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                              </>
                            )}
                          </Button>
                        </div>
                        <CardHeader className="pb-2 pr-16">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`plan-${plan._id}`}
                              checked={plan.completed || false}
                              onCheckedChange={() => togglePlanCompletion(plan._id, plan.completed || false)}
                              className="h-5 w-5 rounded-md border-gray-300 text-life-plan"
                            />
                            <CardTitle className={`text-lg ${plan.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {plan.description.split('.')[0]}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center text-sm text-muted-foreground flex-wrap gap-2">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-3.5 w-3.5" />
                              <span>Age {plan.startAge}-{plan.endAge}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center">
                              <Target className="mr-1 h-3.5 w-3.5" />
                              <span>Target: {plan.targetYear}</span>
                            </div>
                          </div>
                          {plan.description && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {plan.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default LifePlan;
