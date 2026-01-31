import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Target, Loader2, Check, ArrowLeft, Trophy, Flame, Zap, X, Clock, User, Download, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState<LifePlan | null>(null);
  const navigate = useNavigate();

  // Fetch plans on component mount
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchLifePlans();
        // Ensure all plans have completed field defaulted to false if not present
        const plansWithDefaults = data.map((plan: LifePlan) => ({
          ...plan,
          completed: plan.completed ?? false,
          completedAt: plan.completedAt || null
        }));
        setPlans(plansWithDefaults);
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
        const planWithDefaults = {
          ...updatedPlan,
          completed: updatedPlan.completed ?? false,
          completedAt: updatedPlan.completedAt || null
        };
        setPlans(plans.map(p => p._id === updatedPlan._id ? planWithDefaults : p));
        toast.success("Plan updated successfully");
      } else {
        const newPlan = await createNewPlan(planData);
        const planWithDefaults = {
          ...newPlan,
          completed: newPlan.completed ?? false,
          completedAt: newPlan.completedAt || null
        };
        setPlans([...plans, planWithDefaults].sort((a, b) => a.targetYear - b.targetYear));
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
      const newCompletedStatus = !currentStatus;
      const updatedPlan = await updateExistingPlan(id, { 
        completed: newCompletedStatus,
        completedAt: newCompletedStatus ? new Date().toISOString() : null
      });
      
      // Ensure the updated plan has the completed field
      const planWithCompleted = {
        ...updatedPlan,
        completed: updatedPlan.completed ?? newCompletedStatus,
        completedAt: updatedPlan.completedAt || null
      };
      
      setPlans(plans.map(plan => 
        plan._id === id ? planWithCompleted : plan
      ));
      
      toast.success(`Plan marked as ${newCompletedStatus ? 'completed' : 'incomplete'}`);
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

  // Extract a better title from description
  const getPlanTitle = (description: string): string => {
    if (!description) return "Untitled Plan";
    
    // Remove leading numbers and dots (e.g., "1.", "2.", etc.)
    const cleaned = description.replace(/^\d+\.\s*/, "").trim();
    
    // If description starts with a number pattern, try to get the first meaningful sentence
    if (cleaned.length > 0) {
      // Take first 60 characters or first sentence, whichever is shorter
      const firstSentence = cleaned.split(/[.!?]/)[0].trim();
      if (firstSentence.length > 0 && firstSentence.length <= 60) {
        return firstSentence;
      }
      // If first sentence is too long, take first 60 chars
      return cleaned.substring(0, 60) + (cleaned.length > 60 ? "..." : "");
    }
    
    // Fallback: return first 60 characters
    return description.substring(0, 60) + (description.length > 60 ? "..." : "");
  };

  const generatePDF = async () => {
    if (!plans || plans.length === 0) {
      toast.error('No life plans available to download');
      return;
    }

    try {
      toast.info('Generating PDF...');

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      
      // Calculate summary statistics
      const totalPlans = plans.length;
      const completedPlans = plans.filter(p => p.completed).length;
      const pendingPlans = totalPlans - completedPlans;
      
      // Group by age ranges
      const ageGroups = plans.reduce((acc: { [key: string]: number }, plan) => {
        const key = `${plan.startAge}-${plan.endAge}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      // Get unique target years
      const targetYears = [...new Set(plans.map(p => p.targetYear))].sort((a, b) => a - b);
      
      // Calculate average age range
      const avgStartAge = Math.round(plans.reduce((sum, p) => sum + p.startAge, 0) / totalPlans);
      const avgEndAge = Math.round(plans.reduce((sum, p) => sum + p.endAge, 0) / totalPlans);
      
      // Create Summary Page HTML
      const summaryHTML = `
        <style>
          * {
            box-sizing: border-box;
          }
        </style>
        <div style="background: #ffffff; padding: 40px 50px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #000000; line-height: 1.6; width: 800px; min-height: 1000px;">
          <!-- Header Section -->
          <div style="text-align: center; margin-bottom: 50px; padding-bottom: 25px; border-bottom: 2px solid #000000;">
            <h1 style="font-size: 36px; font-weight: 700; margin: 0; color: #000000; letter-spacing: -1px;">
              LIFE PLAN TRACKER
            </h1>
            <div style="font-size: 12px; color: #000000; margin-top: 10px; letter-spacing: 0.5px;">
              Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <!-- Summary Cards Section -->
          <div style="margin-bottom: 40px;">
            <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 25px 0; color: #000000; text-transform: uppercase; letter-spacing: 1px;">
              Overview Summary
            </h2>
            
            <!-- Stats Cards Row 1 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <!-- Total Plans Card -->
              <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 25px; background: #fafafa; border-left: 4px solid #000000;">
                <div style="font-size: 10px; color: #000000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                  Total Plans
                </div>
                <div style="font-size: 32px; font-weight: 700; color: #000000;">
                  ${totalPlans}
                </div>
              </div>
              
              <!-- Completed Plans Card -->
              <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 25px; background: #fafafa; border-left: 4px solid #000000;">
                <div style="font-size: 10px; color: #000000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                  Completed Plans
                </div>
                <div style="font-size: 32px; font-weight: 700; color: #000000;">
                  ${completedPlans}
                </div>
                <div style="font-size: 11px; color: #000000; margin-top: 5px;">
                  ${totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0}% completion rate
                </div>
              </div>
            </div>
            
            <!-- Stats Cards Row 2 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <!-- Pending Plans Card -->
              <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 25px; background: #fafafa; border-left: 4px solid #000000;">
                <div style="font-size: 10px; color: #000000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                  Pending Plans
                </div>
                <div style="font-size: 32px; font-weight: 700; color: #000000;">
                  ${pendingPlans}
                </div>
              </div>
              
              <!-- Average Age Range Card -->
              <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 25px; background: #fafafa; border-left: 4px solid #000000;">
                <div style="font-size: 10px; color: #000000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
                  Average Age Range
                </div>
                <div style="font-size: 24px; font-weight: 700; color: #000000;">
                  ${avgStartAge} - ${avgEndAge} Years
                </div>
              </div>
            </div>
          </div>
          
          <!-- Age Groups Section -->
          <div style="margin-bottom: 40px;">
            <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 20px 0; color: #000000; text-transform: uppercase; letter-spacing: 1px;">
              Plans by Age Group
            </h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
              ${Object.entries(ageGroups)
                .sort(([keyA], [keyB]) => {
                  const [startA] = keyA.split('-').map(Number);
                  const [startB] = keyB.split('-').map(Number);
                  return startA - startB;
                })
                .map(([ageRange, count]) => `
                  <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: #ffffff;">
                    <div style="font-size: 11px; color: #000000; margin-bottom: 5px;">
                      ${ageRange} Years
                    </div>
                    <div style="font-size: 20px; font-weight: 700; color: #000000;">
                      ${count} Plan${count !== 1 ? 's' : ''}
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>
          
          <!-- Target Years Section -->
          <div style="margin-bottom: 40px;">
            <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 20px 0; color: #000000; text-transform: uppercase; letter-spacing: 1px;">
              Target Years
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${targetYears.map(year => {
                const yearPlans = plans.filter(p => p.targetYear === year).length;
                return `
                  <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px 18px; background: #ffffff; display: inline-block;">
                    <div style="font-size: 14px; font-weight: 600; color: #000000;">
                      ${year}
                    </div>
                    <div style="font-size: 10px; color: #000000; margin-top: 2px;">
                      ${yearPlans} plan${yearPlans !== 1 ? 's' : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <div style="font-size: 10px; color: #000000;">
              Summary Page
            </div>
          </div>
        </div>
      `;
      
      // Create and render summary page
      const summaryContainer = document.createElement('div');
      summaryContainer.style.position = 'fixed';
      summaryContainer.style.left = '-9999px';
      summaryContainer.style.width = '800px';
      summaryContainer.style.background = 'white';
      summaryContainer.style.fontFamily = 'Arial, sans-serif';
      summaryContainer.innerHTML = summaryHTML;
      document.body.appendChild(summaryContainer);
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Generate canvas for summary page
      const summaryCanvas = await html2canvas(summaryContainer, {
        useCORS: true,
        logging: false,
        background: '#ffffff',
        width: 800,
        height: summaryContainer.scrollHeight,
        scale: 2,
        windowWidth: 800,
        windowHeight: summaryContainer.scrollHeight
      });
      
      // Calculate image dimensions to fit exactly on one page
      const summaryImgHeight = (summaryCanvas.height * imgWidth) / summaryCanvas.width;
      const availableHeight = pageHeight - 20;
      let finalSummaryHeight = summaryImgHeight;
      let finalSummaryWidth = imgWidth;
      let summaryXOffset = 0;
      
      if (summaryImgHeight > availableHeight) {
        const scale = availableHeight / summaryImgHeight;
        finalSummaryHeight = availableHeight;
        finalSummaryWidth = imgWidth * scale;
        summaryXOffset = (imgWidth - finalSummaryWidth) / 2;
      }
      
      // Add summary page to PDF
      pdf.addImage(summaryCanvas.toDataURL('image/png', 1.0), 'PNG', summaryXOffset, 10, finalSummaryWidth, finalSummaryHeight);
      
      // Clean up summary container
      document.body.removeChild(summaryContainer);
      
      // Sort plans for consistent ordering
      const sortedPlans = [...plans].sort((a, b) => a.startAge - b.startAge || a.targetYear - b.targetYear);
      
      // Generate each plan as a separate page
      for (let planIndex = 0; planIndex < sortedPlans.length; planIndex++) {
        const plan = sortedPlans[planIndex];
        
        // Escape HTML in description
        const safeDescription = (plan.description || 'No description')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/&/g, '&amp;');
        
        // Split description by numbers to create a list-like format
        const descriptionLines = safeDescription.split(/(?=\d+\.)/).filter(line => line.trim());
        
        // Create HTML for single plan page
        const singlePlanHTML = `
          <style>
            * {
              box-sizing: border-box;
            }
          </style>
          <div style="background: #ffffff; padding: 40px 50px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #000000; line-height: 1.6; width: 800px; min-height: 1000px; display: flex; flex-direction: column;">
            <!-- Header Section -->
            <div style="text-align: center; margin-bottom: 40px; padding-bottom: 25px; border-bottom: 2px solid #000000;">
              <div style="font-size: 10px; color: #000000; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
                Life Plan Tracker
              </div>
              <h1 style="font-size: 36px; font-weight: 700; margin: 0; color: #000000; letter-spacing: -1px;">
                PLAN #${planIndex + 1}
              </h1>
              <div style="font-size: 11px; color: #000000; margin-top: 10px; letter-spacing: 0.5px;">
                Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            
            <!-- Plan Details Section -->
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
              <!-- Age Group Info -->
              <div style="background: #f8f8f8; padding: 25px; border-left: 4px solid #000000; margin-bottom: 30px; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                  <div>
                    <div style="font-size: 10px; color: #000000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                      Age Range
                    </div>
                    <div style="font-size: 24px; font-weight: 700; color: #000000;">
                      ${plan.startAge} - ${plan.endAge} Years
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 10px; color: #000000; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                      Target Year
                    </div>
                    <div style="font-size: 24px; font-weight: 700; color: #000000;">
                      ${plan.targetYear}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Description Section -->
              <div style="flex: 1;">
                <div style="font-size: 11px; color: #000000; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 600;">
                  Plan Description
                </div>
                <div style="font-size: 16px; color: #000000; line-height: 2; word-wrap: break-word; overflow-wrap: break-word; padding: 20px; background: #fafafa; border-radius: 4px; min-height: 200px;">
                  ${descriptionLines.length > 1 
                    ? descriptionLines.map(line => `<div style="margin-bottom: 12px; padding-left: 10px; border-left: 3px solid #000000; padding-left: 15px;">${line.trim()}</div>`).join('')
                    : `<div style="padding-left: 10px;">${safeDescription}</div>`
                  }
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
              <div style="font-size: 10px; color: #000000;">
                Page ${planIndex + 2} of ${sortedPlans.length + 1}
              </div>
            </div>
          </div>
        `;
        
        // Create temporary container for this plan
        const planContainer = document.createElement('div');
        planContainer.style.position = 'fixed';
        planContainer.style.left = '-9999px';
        planContainer.style.width = '800px';
        planContainer.style.background = 'white';
        planContainer.style.fontFamily = 'Arial, sans-serif';
        planContainer.innerHTML = singlePlanHTML;
        document.body.appendChild(planContainer);
        
        // Wait for content to render
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Generate canvas for this plan
        const canvas = await html2canvas(planContainer, {
          useCORS: true,
          logging: false,
          background: '#ffffff',
          width: 800,
          height: planContainer.scrollHeight,
          scale: 2,
          windowWidth: 800,
          windowHeight: planContainer.scrollHeight
        });
        
        // Add new page for each plan (summary is already on first page)
        pdf.addPage();
        
        // Calculate image dimensions to fit exactly on one page
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Scale to fit page height with margins (10mm top and bottom)
        const availableHeight = pageHeight - 20; // 10mm margin top and bottom
        let finalHeight = imgHeight;
        let finalWidth = imgWidth;
        let xOffset = 0;
        let yOffset = 10;
        
        // If content is taller than available space, scale it down
        if (imgHeight > availableHeight) {
          const scale = availableHeight / imgHeight;
          finalHeight = availableHeight;
          finalWidth = imgWidth * scale;
          xOffset = (imgWidth - finalWidth) / 2; // Center horizontally
        }
        
        // Add image to PDF - centered on page
        pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', xOffset, yOffset, finalWidth, finalHeight);
        
        // Clean up this plan's container
        document.body.removeChild(planContainer);
      }

      // Download PDF
      const fileName = `life-plan-tracker-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast.success('PDF downloaded successfully!');

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
      
      // Clean up temp container if it exists
      const tempContainer = document.querySelector('[style*="position: fixed"]');
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-life-plan/10">
                <Trophy className="h-6 w-6 text-life-plan" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-life-plan to-accent bg-clip-text text-transparent">
                Life Plan Tracker
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={generatePDF}
                className="gap-2 h-11 px-6 border-border/50 hover:border-border transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Plan
              </Button>
              <Button 
                onClick={() => setShowAddPlan(true)}
                className="gap-2 h-11 px-6 bg-gradient-to-r from-life-plan to-accent hover:from-life-plan/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
                Add Plan
              </Button>
            </div>
          </div>
          
          <p className="text-muted-foreground text-lg max-w-3xl">
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

      {/* Plan Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedPlanForDetails ? getPlanTitle(selectedPlanForDetails.description) : 'Plan Details'}
            </DialogTitle>
            <DialogDescription>
              Complete details of your life plan
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlanForDetails && (
            <div className="space-y-6 py-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedPlanForDetails.completed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-life-plan/10 text-life-plan'
                }`}>
                  {selectedPlanForDetails.completed ? 'Completed' : 'Active'}
                </div>
                {selectedPlanForDetails.completed && selectedPlanForDetails.completedAt && (
                  <span className="text-sm text-muted-foreground">
                    Completed on {new Date(selectedPlanForDetails.completedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-life-plan" />
                  Description
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-lg">
                  {selectedPlanForDetails.description}
                </p>
              </div>

              {/* Key Information Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 text-life-plan" />
                    <span>Age Range</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {selectedPlanForDetails.startAge} - {selectedPlanForDetails.endAge} years
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4 text-life-plan" />
                    <span>Target Year</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {selectedPlanForDetails.targetYear}
                  </p>
                </div>
              </div>

              {/* Timeline Information */}
              <div className="space-y-2 p-4 bg-gradient-to-br from-life-plan/5 to-life-plan/10 rounded-lg border border-life-plan/20">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-life-plan" />
                  Timeline
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Age:</span>
                    <span className="font-medium">{selectedPlanForDetails.startAge} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Age:</span>
                    <span className="font-medium">{selectedPlanForDetails.endAge} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{selectedPlanForDetails.endAge - selectedPlanForDetails.startAge} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Year:</span>
                    <span className="font-medium">{selectedPlanForDetails.targetYear}</span>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">
                      {new Date(selectedPlanForDetails.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>
                    <p className="font-medium">
                      {new Date(selectedPlanForDetails.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleEdit(selectedPlanForDetails);
                  }}
                  className="flex-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m13.5 6.5 4 4" />
                  </svg>
                  Edit Plan
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleDelete(selectedPlanForDetails._id);
                  }}
                  className="flex-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                  Delete Plan
                </Button>
              </div>
            </div>
          )}
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
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-life-plan/30 via-life-plan/20 to-transparent -z-10" />
            
            {timelineYears.map((year, yearIndex) => {
              const yearPlans = plans.filter(plan => plan.targetYear === year);
              if (yearPlans.length === 0) return null;
              
              const isCurrentYear = year === currentYear;
              
              return (
                <div key={year} className="relative pl-12 pb-8 last:pb-0">
                  {/* Year marker */}
                  <div className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold shadow-lg transition-all duration-300 ${
                    isCurrentYear 
                      ? 'bg-gradient-to-br from-life-plan to-life-plan/80 ring-2 ring-life-plan/30 ring-offset-2 scale-110' 
                      : 'bg-life-plan hover:scale-105'
                  }`}>
                    {year}
                  </div>
                  
                  {/* Plans for this year */}
                  <div className="space-y-4 mt-2">
                    {yearPlans.map((plan, index) => (
                      <Card 
                        key={plan._id} 
                        className={`group relative transition-all duration-200 hover:shadow-lg border-l-4 cursor-pointer ${
                          plan.completed 
                            ? 'opacity-75 bg-muted/30 border-l-muted-foreground/30' 
                            : 'hover:border-life-plan/50 border-l-life-plan'
                        }`}
                        onClick={(e) => {
                          // Don't open dialog if clicking on buttons or checkbox
                          const target = e.target as HTMLElement;
                          if (target.closest('button') || target.closest('[role="checkbox"]')) {
                            return;
                          }
                          setSelectedPlanForDetails(plan);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-life-plan/10"
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
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
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
                        
                        <CardHeader className="pb-3 pr-20">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              <Checkbox 
                                id={`plan-${plan._id}`}
                                checked={Boolean(plan.completed)}
                                onCheckedChange={() => togglePlanCompletion(plan._id, Boolean(plan.completed))}
                                className="h-5 w-5 rounded-md border-gray-300 text-life-plan data-[state=checked]:bg-life-plan"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle 
                                className={`text-xl font-semibold mb-2 ${
                                  plan.completed 
                                    ? 'line-through text-muted-foreground' 
                                    : 'text-foreground'
                                }`}
                              >
                                {getPlanTitle(plan.description)}
                              </CardTitle>
                              <div className="flex items-center text-sm text-muted-foreground flex-wrap gap-3">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4 text-life-plan" />
                                  <span className="font-medium">Age {plan.startAge}-{plan.endAge}</span>
                                </div>
                                <span className="text-muted-foreground/50">•</span>
                                <div className="flex items-center gap-1.5">
                                  <Target className="h-4 w-4 text-life-plan" />
                                  <span className="font-medium">Target: {plan.targetYear}</span>
                                </div>
                                {plan.completed && plan.completedAt && (
                                  <>
                                    <span className="text-muted-foreground/50">•</span>
                                    <div className="flex items-center gap-1.5">
                                      <Check className="h-4 w-4 text-emerald-600" />
                                      <span className="text-emerald-600 font-medium">
                                        Completed
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0 pb-4">
                          {plan.description && (
                            <div className="pl-8">
                              <div className="relative">
                                <div className="absolute left-0 top-2 bottom-0 w-0.5 bg-life-plan/20 rounded-full"></div>
                                <p className={`text-sm leading-relaxed pl-4 ${
                                  plan.completed 
                                    ? 'text-muted-foreground/70' 
                                    : 'text-muted-foreground'
                                }`}>
                                  {plan.description}
                                </p>
                              </div>
                            </div>
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
