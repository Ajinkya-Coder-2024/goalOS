import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Target, Loader2, Check, Trophy, Flame, Zap, X, Clock, Download, Trash2 } from "lucide-react";
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
  goal?: string;
  startAge: number;
  endAge: number;
  startYear?: number;
  endYear?: number;
  targetYear: number;
  detailItems?: string[];
  description: string;
  completed: boolean;
  completedAt?: string;
  user: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface FormData {
  goal: string;
  startAge: string;
  endAge: string;
  startYear: string;
  endYear: string;
  detailItems: string[];
}

const planAnchorYear = (p: LifePlan) => p.startYear ?? p.targetYear;
const planEndYear = (p: LifePlan) => p.endYear ?? p.targetYear;

const displayGoal = (p: LifePlan) => (p.goal?.trim() ? p.goal.trim() : getPlanTitleStatic(p.description));

function getPlanTitleStatic(description: string): string {
  if (!description) return "Untitled Plan";
  const cleaned = description.replace(/^\d+\.\s*/, "").trim();
  if (cleaned.length > 0) {
    const firstSentence = cleaned.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 0 && firstSentence.length <= 60) return firstSentence;
    return cleaned.substring(0, 60) + (cleaned.length > 60 ? "..." : "");
  }
  return description.substring(0, 60) + (description.length > 60 ? "..." : "");
}

function displayDetailItems(plan: LifePlan): string[] {
  const fromApi = plan.detailItems?.map((s) => s.trim()).filter(Boolean);
  if (fromApi?.length) return fromApi;
  const d = plan.description?.trim();
  if (!d) return [];
  const parts = d.split(/\n\n/);
  if (parts.length >= 2) {
    return parts
      .slice(1)
      .join("\n\n")
      .split("\n")
      .map((l) => l.replace(/^•\s*/, "").trim())
      .filter(Boolean);
  }
  return [d];
}

function planToForm(plan: LifePlan): FormData {
  const sy = plan.startYear ?? plan.targetYear;
  const ey = plan.endYear ?? plan.targetYear;
  let detailItems = plan.detailItems?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (!detailItems.length && plan.description?.trim()) {
    detailItems = displayDetailItems(plan);
  }
  if (!detailItems.length) detailItems = [""];
  const goalHead =
    plan.goal?.trim() ||
    (plan.description?.includes("\n\n")
      ? plan.description.split(/\n\n/)[0].trim()
      : getPlanTitleStatic(plan.description || ""));
  return {
    goal: goalHead,
    startAge: String(plan.startAge),
    endAge: String(plan.endAge),
    startYear: String(sy),
    endYear: String(ey),
    detailItems,
  };
}

function planCoversYear(plan: LifePlan, y: number): boolean {
  const start = planAnchorYear(plan);
  const end = planEndYear(plan);
  if (plan.startYear != null && plan.endYear != null) return y >= start && y <= end;
  return plan.targetYear === y;
}

function escapeHtmlPdf(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LifePlan = () => {
  const [plans, setPlans] = useState<LifePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<LifePlan | null>(null);
  const [formData, setFormData] = useState<FormData>({
    goal: "",
    startAge: "",
    endAge: "",
    startYear: String(new Date().getFullYear()),
    endYear: String(new Date().getFullYear()),
    detailItems: [""],
  });
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState<LifePlan | null>(null);
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateDetailItem = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      detailItems: prev.detailItems.map((line, i) => (i === index ? value : line)),
    }));
  };

  const addDetailItem = () => {
    setFormData((prev) => ({ ...prev, detailItems: [...prev.detailItems, ""] }));
  };

  const removeDetailItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      detailItems:
        prev.detailItems.length <= 1
          ? prev.detailItems
          : prev.detailItems.filter((_, i) => i !== index),
    }));
  };

  const parsedStartYear = parseInt(formData.startYear, 10);
  const parsedEndYear = parseInt(formData.endYear, 10);
  const durationYearsDisplay =
    !Number.isNaN(parsedStartYear) && !Number.isNaN(parsedEndYear) && parsedEndYear >= parsedStartYear
      ? parsedEndYear - parsedStartYear + 1
      : "—";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.goal.trim()) {
      toast.error("Please enter a goal");
      return;
    }

    if (!formData.startAge || !formData.endAge || !formData.startYear || !formData.endYear) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseInt(formData.startAge, 10) >= parseInt(formData.endAge, 10)) {
      toast.error("End age must be greater than start age");
      return;
    }

    const startYear = parseInt(formData.startYear, 10);
    const endYear = parseInt(formData.endYear, 10);
    if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
      toast.error("Enter valid start and end years");
      return;
    }
    if (endYear < startYear) {
      toast.error("End year must be greater than or equal to start year");
      return;
    }

    const detailItems = formData.detailItems.map((s) => s.trim()).filter(Boolean);
    if (detailItems.length === 0) {
      toast.error("Add at least one detail point");
      return;
    }

    setIsSubmitting(true);

    try {
      const planData = {
        goal: formData.goal.trim(),
        startAge: parseInt(formData.startAge, 10),
        endAge: parseInt(formData.endAge, 10),
        startYear,
        endYear,
        detailItems,
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
        setPlans(
          [...plans, planWithDefaults].sort(
            (a, b) => planAnchorYear(a) - planAnchorYear(b)
          )
        );
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
    setFormData(planToForm(plan));
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
    const y = new Date().getFullYear();
    setFormData({
      goal: "",
      startAge: "",
      endAge: "",
      startYear: String(y),
      endYear: String(y),
      detailItems: [""],
    });
    setEditingPlan(null);
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
      
      const timelineYearSet = new Set<number>();
      plans.forEach((p) => {
        const a = planAnchorYear(p);
        const e = planEndYear(p);
        for (let y = a; y <= e; y++) timelineYearSet.add(y);
      });
      const targetYears = [...timelineYearSet].sort((a, b) => a - b);
      
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
              Years (coverage)
            </h2>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${targetYears.map(year => {
                const yearPlans = plans.filter(p => planCoversYear(p, year)).length;
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
      
      const sortedPlans = [...plans].sort(
        (a, b) => a.startAge - b.startAge || planAnchorYear(a) - planAnchorYear(b)
      );

      for (let planIndex = 0; planIndex < sortedPlans.length; planIndex++) {
        const plan = sortedPlans[planIndex];
        const safeGoal = escapeHtmlPdf(displayGoal(plan));
        const sy = planAnchorYear(plan);
        const ey = planEndYear(plan);
        const durYears =
          plan.startYear != null && plan.endYear != null && ey >= sy
            ? ey - sy + 1
            : "—";
        const detailLines = displayDetailItems(plan);
        const detailsList =
          detailLines.length > 0
            ? `<ul style="margin: 0; padding-left: 22px; font-size: 16px; line-height: 1.8;">${detailLines
                .map((line) => `<li>${escapeHtmlPdf(line)}</li>`)
                .join("")}</ul>`
            : `<div style="font-size: 16px;">${escapeHtmlPdf(plan.description || "No details")}</div>`;

        const singlePlanHTML = `
          <style>
            * {
              box-sizing: border-box;
            }
          </style>
          <div style="background: #ffffff; padding: 40px 50px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #000000; line-height: 1.6; width: 800px; min-height: 1000px; display: flex; flex-direction: column;">
            <div style="text-align: center; margin-bottom: 40px; padding-bottom: 25px; border-bottom: 2px solid #000000;">
              <div style="font-size: 10px; color: #000000; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
                Life Plan Tracker
              </div>
              <h1 style="font-size: 28px; font-weight: 700; margin: 0; color: #000000; letter-spacing: -0.5px;">
                ${safeGoal}
              </h1>
              <div style="font-size: 11px; color: #000000; margin-top: 10px; letter-spacing: 0.5px;">
                Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>

            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
              <div style="background: #f8f8f8; padding: 25px; border-left: 4px solid #000000; margin-bottom: 30px; border-radius: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div>
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Age range</div>
                    <div style="font-size: 22px; font-weight: 700;">${plan.startAge} – ${plan.endAge} years</div>
                  </div>
                  <div>
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Duration</div>
                    <div style="font-size: 22px; font-weight: 700;">${durYears}${typeof durYears === "number" ? " years" : ""}</div>
                  </div>
                  <div>
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Start year</div>
                    <div style="font-size: 22px; font-weight: 700;">${sy}</div>
                  </div>
                  <div>
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">End year</div>
                    <div style="font-size: 22px; font-weight: 700;">${ey}</div>
                  </div>
                </div>
              </div>

              <div style="flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; font-weight: 600;">
                  Details
                </div>
                <div style="word-wrap: break-word; overflow-wrap: break-word; padding: 20px; background: #fafafa; border-radius: 4px; min-height: 200px;">
                  ${detailsList}
                </div>
              </div>
            </div>

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
    new Set([currentYear, ...plans.map((p) => planAnchorYear(p))])
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
                {plans.filter((p) => planEndYear(p) >= currentYear).length}
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
                {plans.filter((p) => planCoversYear(p, currentYear)).length}
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit" : "Create"} Life Plan</DialogTitle>
            <DialogDescription>
              Set your goal, age range, year span, and bullet-point details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal">Goal *</Label>
              <Input
                id="goal"
                name="goal"
                placeholder="e.g. Complete professional certification"
                value={formData.goal}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Age range *</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startAge" className="text-muted-foreground font-normal">
                    Start age
                  </Label>
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
                  <Label htmlFor="endAge" className="text-muted-foreground font-normal">
                    End age
                  </Label>
                  <Input
                    id="endAge"
                    name="endAge"
                    type="number"
                    min={formData.startAge ? parseInt(formData.startAge, 10) + 1 : 19}
                    max="100"
                    placeholder="27"
                    value={formData.endAge}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startYear">Start year *</Label>
                <Input
                  id="startYear"
                  name="startYear"
                  type="number"
                  min={1990}
                  max={2100}
                  value={formData.startYear}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endYear">End year *</Label>
                <Input
                  id="endYear"
                  name="endYear"
                  type="number"
                  min={1990}
                  max={2100}
                  value={formData.endYear}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                readOnly
                tabIndex={-1}
                className="bg-muted/50 cursor-default"
                value={
                  typeof durationYearsDisplay === "number"
                    ? `${durationYearsDisplay} year${durationYearsDisplay === 1 ? "" : "s"} (inclusive)`
                    : durationYearsDisplay
                }
              />
              <p className="text-xs text-muted-foreground">Computed from start and end year.</p>
            </div>
            <div className="space-y-2">
              <Label>Details *</Label>
              <p className="text-xs text-muted-foreground">Add one or more bullet points for this goal.</p>
              <div className="space-y-2">
                {formData.detailItems.map((line, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-muted-foreground pt-2 shrink-0 select-none" aria-hidden>
                      •
                    </span>
                    <Input
                      aria-label={`Detail point ${index + 1}`}
                      placeholder={`Point ${index + 1}`}
                      value={line}
                      onChange={(e) => updateDetailItem(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={formData.detailItems.length <= 1}
                      onClick={() => removeDetailItem(index)}
                      aria-label="Remove point"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addDetailItem}>
                <Plus className="h-4 w-4" />
                Add point
              </Button>
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
              {selectedPlanForDetails ? displayGoal(selectedPlanForDetails) : "Plan Details"}
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
                    <span>Years</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {planAnchorYear(selectedPlanForDetails)} – {planEndYear(selectedPlanForDetails)}
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-muted/30 rounded-lg col-span-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-life-plan" />
                    <span>Duration (year span)</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {selectedPlanForDetails.startYear != null &&
                    selectedPlanForDetails.endYear != null &&
                    selectedPlanForDetails.endYear >= selectedPlanForDetails.startYear
                      ? `${selectedPlanForDetails.endYear - selectedPlanForDetails.startYear + 1} years (inclusive)`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-life-plan" />
                  Details
                </h3>
                <ul className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-lg list-disc pl-5 space-y-2">
                  {displayDetailItems(selectedPlanForDetails).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
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
                    <span className="text-muted-foreground">Start year:</span>
                    <span className="font-medium">{planAnchorYear(selectedPlanForDetails)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End year:</span>
                    <span className="font-medium">{planEndYear(selectedPlanForDetails)}</span>
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
              const yearPlans = plans.filter((plan) => planAnchorYear(plan) === year);
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
                                {displayGoal(plan)}
                              </CardTitle>
                              <div className="flex items-center text-sm text-muted-foreground flex-wrap gap-3">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4 text-life-plan" />
                                  <span className="font-medium">Age {plan.startAge}-{plan.endAge}</span>
                                </div>
                                <span className="text-muted-foreground/50">•</span>
                                <div className="flex items-center gap-1.5">
                                  <Target className="h-4 w-4 text-life-plan" />
                                  <span className="font-medium">
                                    {planAnchorYear(plan)}–{planEndYear(plan)}
                                  </span>
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
                          {displayDetailItems(plan).length > 0 && (
                            <div className="pl-8">
                              <div className="relative">
                                <div className="absolute left-0 top-2 bottom-0 w-0.5 bg-life-plan/20 rounded-full" />
                                <ul
                                  className={`text-sm leading-relaxed list-disc pl-6 space-y-1 ${
                                    plan.completed ? "text-muted-foreground/70" : "text-muted-foreground"
                                  }`}
                                >
                                  {displayDetailItems(plan).map((line, idx) => (
                                    <li key={idx}>{line}</li>
                                  ))}
                                </ul>
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
