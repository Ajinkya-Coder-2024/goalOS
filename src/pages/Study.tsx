import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  BookOpen, 
  FileText, 
  File, 
  Link as LinkIcon, 
  Video, 
  CheckCircle, 
  Clock, 
  Target, 
  Loader2, 
  Trash2, 
  Play, 
  Pause, 
  FileEdit, 
  Download, 
  ExternalLink,
  X,
  Pencil,
  ArrowLeft,
  Trophy,
  Flame,
  Zap
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogTrigger, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { 
  getStudyBranches, 
  createStudyBranch, 
  updateStudyBranch, 
  deleteStudyBranch,
  addSubject,
  getStudyStatistics,
  addStudyMaterial,
  getStudyMaterialsBySubject,
  updateStudyMaterial,
  deleteStudyMaterial,
  StudyMaterial
} from "@/services/studyService";

type MaterialType = 'pdf' | 'video' | 'link' | 'document' | 'other';

interface Subject {
  _id: string;
  name: string;
  description: string;
  startDate?: string | Date;
  endDate?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  materials?: StudyMaterial[];
}

interface Branch {
  _id: string;
  name: string;
  description?: string;
  subjects: Subject[];
  status?: "active" | "completed" | "paused";
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface StudyStatistics {
  totalBranches: number;
  activeBranches: number;
  completedBranches: number;
  totalSubjects: number;
}

const Study = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<StudyStatistics>({
    totalBranches: 0,
    activeBranches: 0,
    completedBranches: 0,
    totalSubjects: 0
  });
  const [newBranchName, setNewBranchName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editBranchForm, setEditBranchForm] = useState({
    name: '',
    description: ''
  });
  
  // State for subject dialogs
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isEditSubjectDialogOpen, setIsEditSubjectDialogOpen] = useState(false);
  const [isDeleteSubjectDialogOpen, setIsDeleteSubjectDialogOpen] = useState(false);
  const [selectedSubjectForEdit, setSelectedSubjectForEdit] = useState<Subject | null>(null);
  const [selectedBranchForSubject, setSelectedBranchForSubject] = useState<Branch | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    description: '',
    branchId: ''
  });
  
  // Study Material States
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isDeleteMaterialDialogOpen, setIsDeleteMaterialDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [materialForm, setMaterialForm] = useState<{
    title: string;
    description: string;
    type: MaterialType;
    url: string;
    subjectId: string;
    branchId: string;
  }>({
    title: '',
    description: '',
    type: 'link',
    url: '',
    subjectId: '',
    branchId: ''
  });
  const [isMaterialLoading, setIsMaterialLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Calculate statistics from branches data
  const overviewStats = useMemo(() => {
    const totalBranches = branches.length;
    const totalSubjects = branches.reduce((total, branch) => {
      return total + (Array.isArray(branch?.subjects) ? branch.subjects.length : 0);
    }, 0);
    
    const totalMaterials = branches.reduce((total, branch) => {
      if (!Array.isArray(branch?.subjects)) return total;
      return total + branch.subjects.reduce((subTotal: number, subject: Subject) => {
        if (Array.isArray(subject?.materials)) {
          return subTotal + subject.materials.length;
        }
        return subTotal;
      }, 0);
    }, 0);
    
    const activeBranches = branches.filter(branch => branch?.status === 'active').length;
    const completedBranches = branches.filter(branch => branch?.status === 'completed').length;
    
    return {
      totalBranches,
      totalSubjects,
      totalMaterials,
      activeBranches,
      completedBranches
    };
  }, [branches]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching study data...');
        
        // First, get all branches with their subjects
        const branchesResponse = await getStudyBranches();
        console.log('Branches response:', branchesResponse);
        
        // Extract branches from the response
        let branchesData: Branch[] = [];
        
        if (Array.isArray(branchesResponse)) {
          branchesData = branchesResponse;
        } else if (branchesResponse?.branches) {
          // Handle case where branches are in a 'branches' property
          branchesData = branchesResponse.branches;
        } else if (branchesResponse?.data?.branches) {
          // Handle case where response has a 'data' object with 'branches'
          branchesData = branchesResponse.data.branches;
        } else if (branchesResponse?.data) {
          // Handle case where response has a 'data' array
          branchesData = Array.isArray(branchesResponse.data) ? branchesResponse.data : [branchesResponse.data];
        }
        
        console.log('Fetched branches data:', { 
          rawResponse: branchesResponse, 
          extractedBranches: branchesData 
        });
        
        if (!Array.isArray(branchesData)) {
          console.error('Could not extract branches array from response. Full response:', branchesResponse);
          return;
        }
        
        // Ensure each branch has a status and subjects array
        const branchesWithStatus = branchesData.map(branch => ({
          ...branch,
          status: branch.status || 'active', // Default to 'active' if status is not provided
          subjects: branch.subjects || []    // Ensure subjects is always an array
        }));
        
        // Process each branch to ensure materials are properly structured
        const branchesWithMaterials = await Promise.all(
          branchesWithStatus.map(async (branch) => {
            // Process each subject to ensure materials array exists
            const processedSubjects = await Promise.all(
              branch.subjects.map(async (subject) => {
                // Normalize materials - map 'link' to 'url' for consistency
                let materials = [];
                if (subject.materials && subject.materials.length > 0) {
                  materials = subject.materials.map((material: any) => ({
                    ...material,
                    url: material.url || material.link || '', // Use link if url doesn't exist
                    link: material.link || material.url || '' // Keep both for compatibility
                  }));
                } else {
                  try {
                    // Try to fetch materials for this subject
                    const fetchedMaterials = await getStudyMaterialsBySubject(subject._id);
                    materials = (fetchedMaterials || []).map((material: any) => ({
                      ...material,
                      url: material.url || material.link || '',
                      link: material.link || material.url || ''
                    }));
                  } catch (error) {
                    console.error(`Error fetching materials for subject ${subject._id}:`, error);
                    materials = [];
                  }
                }
                
                return {
                  ...subject,
                  materials
                };
              })
            );
            
            return {
              ...branch,
              subjects: processedSubjects
            };
          })
        );
        
        // Update state with the processed branches
        setBranches(branchesWithMaterials);
        
        // Update statistics
        const statsData = await getStudyStatistics();
        setStatistics(statsData);
      } catch (error) {
        console.error('Error fetching study data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load study data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAddBranch = async () => {
    if (!newBranchName.trim()) return;
    
    try {
      setIsSubmitting(true);
      const newBranch = await createStudyBranch({
        name: newBranchName,
        status: 'active',
        description: ''
      });
      
      // Ensure new branch has subjects array and proper structure
      const branchWithSubjects = {
        ...newBranch,
        _id: newBranch._id || newBranch.id,
        name: newBranch.name || newBranchName,
        subjects: newBranch.subjects || [],
        status: newBranch.status || 'active'
      };
      
      setBranches([branchWithSubjects, ...branches]);
      setStatistics({
        ...statistics,
        totalBranches: statistics.totalBranches + 1,
        activeBranches: statistics.activeBranches + 1
      });
      
      // Switch to the new branch tab
      setActiveTab(branchWithSubjects._id);
      
      setNewBranchName('');
      setIsDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'Branch created successfully',
      });
    } catch (error) {
      console.error('Error creating branch:', error);
      toast({
        title: 'Error',
        description: 'Failed to create branch',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Study Material Handlers
  const handleAddMaterial = async () => {
    if (!selectedSubject || !materialForm.title || !materialForm.url) return;
    
    try {
      setIsMaterialLoading(true);
      const newMaterial = await addStudyMaterial({
        ...materialForm,
        subjectId: selectedSubject._id,
        branchId: selectedSubject._id, // Assuming branchId is needed, adjust if different
      });
      
      // Update the state to include the new material
      setBranches(branches.map(branch => {
        if (branch._id === selectedSubject._id) { // Adjust if branchId is different
          const updatedSubjects = branch.subjects.map(subject => {
            if (subject._id === selectedSubject._id) {
              return {
                ...subject,
                materials: [...(subject.materials || []), newMaterial]
              };
            }
            return subject;
          });
          return { ...branch, subjects: updatedSubjects };
        }
        return branch;
      }));
      
      // Reset form and close dialog
      setMaterialForm({
        title: '',
        description: '',
        type: 'document',
        url: ''
      });
      setIsMaterialDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'Study material added successfully',
      });
    } catch (error) {
      console.error('Error adding study material:', error);
      toast({
        title: 'Error',
        description: 'Failed to add study material',
        variant: 'destructive',
      });
    } finally {
      setIsMaterialLoading(false);
    }
  };
  
  const handleUpdateMaterial = async () => {
    if (!selectedMaterial || !materialForm.title || !materialForm.url) return;
    
    try {
      setIsMaterialLoading(true);
      const updatedMaterial = await updateStudyMaterial(selectedMaterial._id!, {
        ...materialForm,
      });
      
      // Update the state with the updated material
      setBranches(branches.map(branch => {
        const updatedSubjects = branch.subjects.map(subject => {
          if (subject.materials?.some(m => m._id === selectedMaterial._id)) {
            return {
              ...subject,
              materials: subject.materials?.map(material => 
                material._id === selectedMaterial._id ? updatedMaterial : material
              )
            };
          }
          return subject;
        });
        return { ...branch, subjects: updatedSubjects };
      }));
      
      // Reset form and close dialog
      setSelectedMaterial(null);
      setMaterialForm({
        title: '',
        description: '',
        type: 'document',
        url: ''
      });
      setIsMaterialDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'Study material updated successfully',
      });
    } catch (error) {
      console.error('Error updating study material:', error);
      toast({
        title: 'Error',
        description: 'Failed to update study material',
        variant: 'destructive',
      });
    } finally {
      setIsMaterialLoading(false);
    }
  };
  
  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return;
    
    try {
      setIsMaterialLoading(true);
      await deleteStudyMaterial(selectedMaterial._id!);
      
      // Update the state to remove the deleted material
      setBranches(branches.map(branch => {
        const updatedSubjects = branch.subjects.map(subject => ({
          ...subject,
          materials: subject.materials?.filter(m => m._id !== selectedMaterial._id) || []
        }));
        return { ...branch, subjects: updatedSubjects };
      }));
      
      setIsDeleteMaterialDialogOpen(false);
      setSelectedMaterial(null);
      
      toast({
        title: 'Success',
        description: 'Study material deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting study material:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete study material',
        variant: 'destructive',
      });
    } finally {
      setIsMaterialLoading(false);
    }
  };
  
  const openAddMaterialDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedMaterial(null);
    setMaterialForm({
      title: '',
      description: '',
      type: 'document',
      url: ''
    });
    setIsMaterialDialogOpen(true);
  };
  
  const openEditMaterialDialog = (material: StudyMaterial, subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedMaterial(material);
    setMaterialForm({
      title: material.title,
      description: material.description || '',
      type: material.type as MaterialType,
      url: material.url
    });
    setIsMaterialDialogOpen(true);
  };
  
  const openDeleteMaterialDialog = (material: StudyMaterial) => {
    setSelectedMaterial(material);
    setIsDeleteMaterialDialogOpen(true);
  };
  
  const handleDeleteBranch = async (branchId: string) => {
    try {
      await deleteStudyBranch(branchId);
      const deletedBranch = branches.find(b => b._id === branchId);
      
      setBranches(branches.filter(branch => branch._id !== branchId));
      
      // Update statistics
      const statsUpdate = { 
        ...statistics, 
        totalBranches: statistics.totalBranches - 1 
      };
      
      if (deletedBranch?.status === 'active') {
        statsUpdate.activeBranches = Math.max(0, statistics.activeBranches - 1);
      } else if (deletedBranch?.status === 'completed') {
        statsUpdate.completedBranches = Math.max(0, statistics.completedBranches - 1);
      }
      
      setStatistics(statsUpdate);
      setIsDeleteDialogOpen(false);
      
      toast({
        title: 'Success',
        description: 'Branch deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete branch',
        variant: 'destructive',
      });
    }
  };

  // Status update handler kept for any programmatic status changes
  const handleUpdateBranchStatus = async (branchId: string, newStatus: 'active' | 'completed' | 'paused') => {
    try {
      const updatedBranch = await updateStudyBranch(branchId, { status: newStatus });
      
      setBranches(branches.map(branch => 
        branch._id === branchId ? updatedBranch : branch
      ));
      
      // Update statistics
      const oldBranch = branches.find(b => b._id === branchId);
      const statsUpdate = { ...statistics };
      
      // Decrement old status count
      if (oldBranch?.status === 'active') {
        statsUpdate.activeBranches--;
      } else if (oldBranch?.status === 'completed') {
        statsUpdate.completedBranches--;
      }
      
      // Increment new status count
      if (newStatus === 'active') {
        statsUpdate.activeBranches++;
      } else if (newStatus === 'completed') {
        statsUpdate.completedBranches++;
      }
      
      setStatistics(statsUpdate);
      
      toast({
        title: 'Success',
        description: 'Branch status updated',
      });
    } catch (error) {
      console.error('Error updating branch status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update branch status',
        variant: 'destructive',
      });
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: Branch["status"]) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-purple-100 text-purple-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get icon for material type
  const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-blue-500" />;
      case 'link':
        return <LinkIcon className="h-4 w-4 text-purple-500" />;
      case 'document':
        return <File className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  // Handle editing a subject
  const handleEditSubject = (branch: Branch, subject: Subject) => {
    setSelectedBranchForSubject(branch);
    setSelectedSubjectForEdit(subject);
    setSubjectForm({
      name: subject.name,
      description: subject.description || '',
      branchId: branch._id
    });
    setIsEditSubjectDialogOpen(true);
  };

  // Handle updating a subject
  const handleUpdateSubject = async () => {
    if (!selectedBranchForSubject || !selectedSubjectForEdit) return;
    
    try {
      setIsSubmitting(true);
      await updateSubject(selectedBranchForSubject._id, selectedSubjectForEdit._id, {
        name: subjectForm.name.trim(),
        description: subjectForm.description.trim()
      });
      
      // Refresh the branches to show updated data
      const updatedBranches = await getStudyBranches();
      setBranches(updatedBranches);
      
      toast({
        title: 'Success',
        description: 'Subject updated successfully',
      });
      
      setIsEditSubjectDialogOpen(false);
    } catch (error) {
      console.error('Error updating subject:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subject',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a subject
  const handleDeleteSubject = async () => {
    if (!selectedBranchForSubject || !selectedSubjectForEdit) return;
    
    try {
      setIsSubmitting(true);
      await deleteSubject(selectedBranchForSubject._id, selectedSubjectForEdit._id);
      
      // Refresh the branches to show updated data
      const updatedBranches = await getStudyBranches();
      setBranches(updatedBranches);
      
      toast({
        title: 'Success',
        description: 'Subject deleted successfully',
      });
      
      setIsDeleteSubjectDialogOpen(false);
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subject',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "paused":
        return <Pause className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading study data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-study/10 via-study/5 to-accent/10 p-8 backdrop-blur-sm border border-study/10">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-gradient-to-br from-study/20 to-transparent blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-gradient-to-tr from-accent/20 to-transparent blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-study/10">
                <Trophy className="h-6 w-6 text-study" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-study to-accent bg-clip-text text-transparent">
                Study Dashboard
              </h1>
            </div>
            
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="gap-2 h-11 px-6 bg-gradient-to-r from-study to-accent hover:from-study/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              Add Branch
            </Button>
          </div>
          
          <p className="text-muted-foreground text-lg max-w-3xl mb-6">
            Organize and track your study materials across different branches and subjects
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-study/20 to-study/10 border border-study/200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-study/20 to-transparent blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-study/10">
                <BookOpen className="h-5 w-5 text-study" />
              </div>
              <div className="text-xs font-medium text-study bg-study/10 px-2 py-1 rounded-full">
                Total
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {overviewStats.totalBranches}
              </p>
              <p className="text-sm text-muted-foreground">Branches</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-study">
              <Zap className="h-3 w-3" />
              <span>All Study Areas</span>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <div className="h-5 w-5 text-blue-600">
                  {getStatusIcon('active')}
                </div>
              </div>
              <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Active
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {overviewStats.activeBranches}
              </p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-blue-600">
              <Flame className="h-3 w-3" />
              <span>Currently Studying</span>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                Completed
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {overviewStats.completedBranches}
              </p>
              <p className="text-sm text-muted-foreground">Finished</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-purple-600">
              <CheckCircle className="h-3 w-3" />
              <span>Success Rate</span>
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
                Subjects
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {overviewStats.totalSubjects}
              </p>
              <p className="text-sm text-muted-foreground">Total Topics</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-primary">
              <BookOpen className="h-3 w-3" />
              <span>All Topics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Branches Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="relative">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
              onClick={() => {
                const tabsContainer = document.querySelector('[data-tabs-container]');
                if (tabsContainer) {
                  tabsContainer.scrollBy({ left: -200, behavior: 'smooth' });
                }
              }}
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            
            <div 
              ref={(el) => {
                if (el) {
                  el.setAttribute('data-tabs-container', 'true');
                }
              }}
              className="flex-1 overflow-x-auto scrollbar-hide"
            >
              <TabsList className="inline-flex w-auto min-w-max gap-2 bg-transparent p-1 h-auto">
                <TabsTrigger 
                  value="overview" 
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border/50 bg-background hover:bg-muted transition-all duration-200 data-[state=active]:bg-study data-[state=active]:text-study-foreground data-[state=active]:border-study/50 data-[state=active]:shadow-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                {branches.map((branch, index) => (
                  <TabsTrigger 
                    key={branch._id} 
                    value={branch._id}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border/50 bg-background hover:bg-muted transition-all duration-200 data-[state=active]:bg-study data-[state=active]:text-study-foreground data-[state=active]:border-study/50 data-[state=active]:shadow-sm"
                  >
                    <span className="truncate max-w-[150px]">{branch.name || `Branch ${index + 1}`}</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                      {branch.subjects?.length || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
              onClick={() => {
                const tabsContainer = document.querySelector('[data-tabs-container]');
                if (tabsContainer) {
                  tabsContainer.scrollBy({ left: 200, behavior: 'smooth' });
                }
              }}
            >
              <ArrowLeft className="h-3 w-3 rotate-180" />
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-study" />
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-study/5 via-card to-study/10 border border-study/20 p-6">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-study/20 to-transparent blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-4">Study Material Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-study mb-2">{overviewStats.totalBranches}</div>
                    <div className="text-sm text-muted-foreground">Total Branches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {overviewStats.totalSubjects}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Subjects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent mb-2">
                      {overviewStats.totalMaterials}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Materials</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {overviewStats.completedBranches}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed Branches</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {branches.map((branch) => (
          <TabsContent key={branch._id} value={branch._id} className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span>{branch.name || 'Unnamed Branch'}</span>
                      <Badge variant={branch.status === 'completed' ? 'default' : 'secondary'}>
                        {branch.status ? 
                          branch.status.charAt(0).toUpperCase() + branch.status.slice(1) : 
                          'Active'}
                      </Badge>
                    </CardTitle>
                    {branch.description && (
                      <CardDescription className="mt-1">
                        {branch.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedBranch(branch);
                        setEditBranchForm({
                          name: branch.name,
                          description: branch.description || ''
                        });
                        setIsEditDialogOpen(true);
                      }}
                      title="Edit branch"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedBranch(branch);
                        setIsDeleteDialogOpen(true);
                      }}
                      title="Delete branch"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Subjects</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setSubjectForm({
                        name: '',
                        description: '',
                        branchId: branch._id
                      });
                      setIsSubjectDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Subject
                  </Button>
                </div>
                {branch.subjects && branch.subjects.length > 0 ? (
                  <div className="space-y-3">
                    {branch.subjects.map((subject) => (
                      <div 
                        key={subject._id} 
                        className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => {
                          setExpandedSubjects(prev => ({
                            ...prev,
                            [subject._id]: !prev[subject._id]
                          }));
                        }}>
                          <div className="flex-1">
                            <h4 className="font-medium flex items-center gap-2">
                              {subject.name}
                              <span className="text-xs text-muted-foreground">
                                ({subject.materials?.length || 0} material{subject.materials?.length !== 1 ? 's' : ''})
                              </span>
                            </h4>
                            {subject.description && (
                              <p className="text-sm text-muted-foreground">{subject.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSubject(branch, subject);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBranchForSubject(branch);
                                setSelectedSubjectForEdit(subject);
                                setIsDeleteSubjectDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Study Materials List */}
                        <div className={`mt-2 ${expandedSubjects[subject._id] ? 'block' : 'hidden'}`}>
                          {subject.materials?.length > 0 ? (
                            <div className="space-y-2 mb-2">
                              {subject.materials.map((material) => (
                                <div key={material._id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                                  <div className="flex items-center gap-2">
                                    {material.type === 'pdf' && <FileText className="h-4 w-4 text-red-500" />}
                                    {material.type === 'video' && <Video className="h-4 w-4 text-blue-500" />}
                                    {material.type === 'link' && <LinkIcon className="h-4 w-4 text-purple-500" />}
                                    {material.type === 'document' && <File className="h-4 w-4 text-orange-500" />}
                                    <span className="font-medium">{material.title}</span>
                                  </div>
                                  <a 
                                    href={(material?.url || material?.link) ? (
                                      (material?.url || material?.link).startsWith('http') ? 
                                        (material?.url || material?.link) : 
                                        `https://${material?.url || material?.link}`
                                    ) : '#'}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline text-xs flex items-center gap-1"
                                    onClick={(e) => {
                                      const url = material?.url || material?.link;
                                      
                                      // If there's no URL, prevent default and show error
                                      if (!url) {
                                        e.preventDefault();
                                        toast({
                                          title: 'Error',
                                          description: 'This material has no URL specified',
                                          variant: 'destructive',
                                        });
                                        return;
                                      }
                                      
                                      // If the URL doesn't have a protocol, add https://
                                      if (!/^https?:\/\//i.test(url)) {
                                        e.preventDefault();
                                        window.open(`https://${url}`, '_blank', 'noopener,noreferrer');
                                      }
                                    }}
                                  >
                                    Open <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mb-2">No study materials added yet</p>
                          )}
                          
                          {/* Add Material Button */}
                          <div className="flex items-center justify-between mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!branch?._id) {
                                  toast({
                                    title: 'Error',
                                    description: 'Could not determine branch ID',
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                setMaterialForm({
                                  title: '',
                                  description: '',
                                  type: 'document',
                                  url: '',
                                  subjectId: subject._id,
                                  branchId: branch._id
                                });
                                setIsMaterialDialogOpen(true);
                              }}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> 
                              {subject.materials?.length ? 'Add More Materials' : 'Add Study Material'}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8 text-muted-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedSubjects(prev => ({
                                  ...prev,
                                  [subject._id]: !prev[subject._id]
                                }));
                              }}
                            >
                              {expandedSubjects[subject._id] ? 'Hide' : 'Show'} Materials
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No subjects added yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Branch Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Branch</DialogTitle>
            <DialogDescription>
              Create a new branch to organize your study materials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="branch-name" className="text-right">
                Name
              </Label>
              <Input
                id="branch-name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="col-span-3"
                placeholder="Enter branch name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleAddBranch}
              disabled={!newBranchName.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : 'Add Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Branch Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this branch? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedBranch && (
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="font-medium">{selectedBranch.name}</p>
              {selectedBranch.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedBranch.description}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedBranch && handleDeleteBranch(selectedBranch._id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subject Dialog */}
      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>
              Add a new subject to organize your study materials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject-name" className="text-right">
                Name
              </Label>
              <Input
                id="subject-name"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                className="col-span-3"
                placeholder="Enter subject name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="subject-description"
                value={subjectForm.description}
                onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
                className="col-span-3"
                placeholder="Enter subject description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={async () => {
                if (!subjectForm.name.trim()) return;
                
                try {
                  setIsSubmitting(true);
                  console.log('Adding subject with data:', {
                    branchId: subjectForm.branchId,
                    subjectData: {
                      name: subjectForm.name,
                      description: subjectForm.description
                    }
                  });
                  
                  // 1. First, add the subject to the server
                  const response = await addSubject(subjectForm.branchId, {
                    name: subjectForm.name,
                    description: subjectForm.description
                  });
                  
                  console.log('Subject added successfully:', response);
                  
                  // 2. Get the latest branches data from the server to ensure consistency
                  const updatedBranches = await getStudyBranches();
                  console.log('Refreshed branches data after adding subject:', updatedBranches);
                  
                  // 3. Update the UI with the latest data from the server
                  let branchesData = [];
                  if (Array.isArray(updatedBranches)) {
                    branchesData = updatedBranches;
                  } else if (updatedBranches?.branches) {
                    branchesData = updatedBranches.branches;
                  } else if (updatedBranches?.data?.branches) {
                    branchesData = updatedBranches.data.branches;
                  } else if (updatedBranches?.data) {
                    branchesData = Array.isArray(updatedBranches.data) ? updatedBranches.data : [updatedBranches.data];
                  }
                  
                  // Ensure each branch has a subjects array and status
                  const processedBranches = branchesData.map(branch => ({
                    ...branch,
                    subjects: branch.subjects || [],
                    status: branch.status || 'active'
                  }));
                  
                  setBranches(processedBranches);
                  
                  // 4. Update statistics
                  const totalSubjects = processedBranches.reduce(
                    (acc, branch) => acc + (branch.subjects?.length || 0), 
                    0
                  );
                  
                  setStatistics(prev => ({
                    ...prev,
                    totalSubjects
                  }));
                  
                  // 4. Close the dialog and show success message
                  setIsSubjectDialogOpen(false);
                  
                  toast({
                    title: 'Success',
                    description: 'Subject added successfully',
                  });
                } catch (error) {
                  console.error('Error adding subject:', error);
                  const errorMessage = error.response?.data?.message || error.message;
                  
                  // If subject already exists, refresh the data to show the existing subject
                  if (errorMessage.includes('already exists')) {
                    try {
                      const updatedBranches = await getStudyBranches();
                      let branchesData = [];
                      if (Array.isArray(updatedBranches)) {
                        branchesData = updatedBranches;
                      } else if (updatedBranches?.branches) {
                        branchesData = updatedBranches.branches;
                      } else if (updatedBranches?.data?.branches) {
                        branchesData = updatedBranches.data.branches;
                      } else if (updatedBranches?.data) {
                        branchesData = Array.isArray(updatedBranches.data) ? updatedBranches.data : [updatedBranches.data];
                      }
                      setBranches(branchesData);
                      
                      toast({
                        title: 'Subject exists',
                        description: 'The subject was already added to this branch',
                      });
                    } catch (refreshError) {
                      console.error('Error refreshing branches:', refreshError);
                      toast({
                        title: 'Error',
                        description: 'Failed to refresh subjects: ' + refreshError.message,
                        variant: 'destructive',
                      });
                    }
                  } else {
                    // For other errors, show the error message
                    toast({
                      title: 'Error',
                      description: 'Failed to add subject: ' + errorMessage,
                      variant: 'destructive',
                    });
                  }
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={!subjectForm.name.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : 'Add Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Study Material Dialog */}
      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Study Material</DialogTitle>
            <DialogDescription>
              Add a new study material to this subject
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="material-title" className="text-right">
                Title
              </Label>
              <Input
                id="material-title"
                value={materialForm.title}
                onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})}
                className="col-span-3"
                placeholder="Enter material title"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="material-type" className="text-right">
                Type
              </Label>
              <select
                id="material-type"
                value={materialForm.type}
                onChange={(e) => setMaterialForm({...materialForm, type: e.target.value as any})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="document">Document</option>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="link">Link</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="material-url" className="text-right mt-2">
                URL/Link
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="material-url"
                  type="url"
                  value={materialForm.url}
                  onChange={(e) => setMaterialForm({...materialForm, url: e.target.value})}
                  placeholder="https://example.com/material"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL where this material is hosted
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="material-description" className="text-right mt-2">
                Description
              </Label>
              <Textarea
                id="material-description"
                value={materialForm.description}
                onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                className="col-span-3"
                placeholder="Enter a brief description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={async () => {
                if (!materialForm.title.trim() || !materialForm.url.trim()) {
                  toast({
                    title: 'Error',
                    description: 'Please fill in all required fields',
                    variant: 'destructive',
                  });
                  return;
                }
                
                try {
                  setIsSubmitting(true);
                  
                  // 1. First, add the material to the server
                  const newMaterial = await addStudyMaterial({
                    title: materialForm.title.trim(),
                    description: materialForm.description.trim(),
                    type: materialForm.type,
                    url: materialForm.url.trim(),
                    subjectId: materialForm.subjectId,
                    branchId: materialForm.branchId
                  });
                  
                  console.log('Material added successfully:', newMaterial);
                  
                  // Normalize the new material - map 'link' to 'url' for consistency
                  const normalizedMaterial = {
                    ...newMaterial,
                    url: newMaterial.url || newMaterial.link || materialForm.url.trim(),
                    link: newMaterial.link || newMaterial.url || materialForm.url.trim()
                  };
                  
                  // 2. Update the UI immediately with the new material
                  setBranches(prevBranches => {
                    return prevBranches.map(branch => {
                      if (branch._id === materialForm.branchId) {
                        // Create a deep copy of the branch
                        const updatedBranch = { ...branch };
                        
                        // Find the subject index
                        const subjectIndex = updatedBranch.subjects?.findIndex(
                          s => s._id === materialForm.subjectId
                        );
                        
                        if (subjectIndex !== -1 && subjectIndex !== undefined) {
                          // Create a new subjects array with the updated subject
                          const updatedSubjects = [...(updatedBranch.subjects || [])];
                          const subjectToUpdate = { 
                            ...updatedSubjects[subjectIndex],
                            materials: [
                              ...(updatedSubjects[subjectIndex].materials || []),
                              normalizedMaterial
                            ]
                          };
                          
                          updatedSubjects[subjectIndex] = subjectToUpdate;
                          
                          // Return a new branch with the updated subjects
                          return {
                            ...updatedBranch,
                            subjects: updatedSubjects
                          };
                        }
                      }
                      return branch;
                    });
                  });
                  
                  // 3. Try to refresh the data in the background
                  try {
                    const updatedBranches = await getStudyBranches();
                    console.log('Refreshed branches data:', updatedBranches);
                    
                    // Update with the latest data from the server
                    let branchesData = [];
                    if (Array.isArray(updatedBranches)) {
                      branchesData = updatedBranches;
                    } else if (updatedBranches?.branches) {
                      branchesData = updatedBranches.branches;
                    } else if (updatedBranches?.data?.branches) {
                      branchesData = updatedBranches.data.branches;
                    } else if (updatedBranches?.data) {
                      branchesData = Array.isArray(updatedBranches.data) ? updatedBranches.data : [updatedBranches.data];
                    }
                    
                    setBranches(branchesData);
                  } catch (refreshError) {
                    console.warn('Could not refresh branches data:', refreshError);
                    // This is not a critical error since we've already updated the UI
                  }
                  
                  // 4. Close the dialog and show success message
                  setIsMaterialDialogOpen(false);
                  
                  toast({
                    title: 'Success',
                    description: 'Study material added successfully',
                  });
                } catch (error) {
                  console.error('Error adding study material:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to add study material',
                    variant: 'destructive',
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting || !materialForm.title.trim() || !materialForm.url.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : 'Add Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update the branch details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-branch-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-branch-name"
                value={editBranchForm.name}
                onChange={(e) => setEditBranchForm({...editBranchForm, name: e.target.value})}
                className="col-span-3"
                placeholder="Enter branch name"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-branch-description" className="text-right mt-2">
                Description
              </Label>
              <Textarea
                id="edit-branch-description"
                value={editBranchForm.description}
                onChange={(e) => setEditBranchForm({...editBranchForm, description: e.target.value})}
                className="col-span-3"
                placeholder="Enter branch description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={async () => {
                if (!selectedBranch || !editBranchForm.name.trim()) return;
                
                try {
                  setIsSubmitting(true);
                  console.log('Starting branch update...');
                  
                  // Get the current branch data
                  const currentBranch = branches.find(b => b._id === selectedBranch._id);
                  if (!currentBranch) {
                    console.error('Current branch not found');
                    return;
                  }
                  
                  console.log('Current branch before update:', JSON.parse(JSON.stringify(currentBranch)));
                  
                  // Only send the fields we want to update to the backend
                  const updateData = {
                    name: editBranchForm.name.trim(),
                    description: editBranchForm.description.trim()
                  };
                  
                  console.log('Sending update data:', updateData);
                  
                  try {
                    // Call the update API
                    console.log('Calling updateStudyBranch API...');
                    const response = await updateStudyBranch(selectedBranch._id, updateData);
                    console.log('Update API response:', response);
                    
                    // Force a complete refresh of the branches data
                    console.log('Refreshing branches data...');
                    const updatedBranches = await getStudyBranches();
                    console.log('Refreshed branches data:', updatedBranches);
                    
                    // Update the branches state with the fresh data
                    setBranches(updatedBranches);
                    
                    // Also update the selected branch
                    const updatedBranch = updatedBranches.find(b => b._id === selectedBranch._id);
                    if (updatedBranch) {
                      console.log('Updating selected branch:', updatedBranch);
                      setSelectedBranch(updatedBranch);
                    }
                    
                    // Show success message
                    toast({
                      title: 'Success',
                      description: 'Branch updated successfully',
                    });
                    
                    // Close the edit dialog
                    setIsEditDialogOpen(false);
                    return; // Exit early on success
                    
                  } catch (error) {
                    console.error('Error in update process:', error);
                    throw error; // Let the outer catch handle it
                  }
                  
                  // Moved inside the try block
                } catch (error) {
                  console.error('Error updating branch:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to update branch',
                    variant: 'destructive',
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={!editBranchForm.name.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : 'Update Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={isEditSubjectDialogOpen} onOpenChange={setIsEditSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update the subject details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-subject-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-subject-name"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                className="col-span-3"
                placeholder="Enter subject name"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-subject-description" className="text-right mt-2">
                Description
              </Label>
              <Textarea
                id="edit-subject-description"
                value={subjectForm.description}
                onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
                className="col-span-3"
                placeholder="Enter subject description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setIsEditSubjectDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateSubject}
              disabled={isSubmitting || !subjectForm.name.trim()}
            >
              {isSubmitting ? 'Updating...' : 'Update Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirmation Dialog */}
      <Dialog open={isDeleteSubjectDialogOpen} onOpenChange={setIsDeleteSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subject? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedSubjectForEdit && (
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="font-medium">{selectedSubjectForEdit.name}</p>
              {selectedSubjectForEdit.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedSubjectForEdit.description}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteSubjectDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSubject}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Study;