import { useState, useEffect } from "react";
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
  Pencil
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
  
  // State for subject dialog
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
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
  const [materialForm, setMaterialForm] = useState<{
    title: string;
    description: string;
    type: MaterialType;
    url: string;
  }>({
    title: '',
    description: '',
    type: 'document',
    url: ''
  });
  const [isMaterialLoading, setIsMaterialLoading] = useState(false);

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
                // If subject already has materials, use them
                if (subject.materials && subject.materials.length > 0) {
                  return subject;
                }
                
                try {
                  // Try to fetch materials for this subject
                  const materials = await getStudyMaterialsBySubject(subject._id);
                  return {
                    ...subject,
                    materials: materials || []
                  };
                } catch (error) {
                  console.error(`Error fetching materials for subject ${subject._id}:`, error);
                  return {
                    ...subject,
                    materials: []
                  };
                }
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
      
      setBranches([newBranch, ...branches]);
      setStatistics({
        ...statistics,
        totalBranches: statistics.totalBranches + 1,
        activeBranches: statistics.activeBranches + 1
      });
      
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
      const oldBranch = branches.find(b => b._id === branchId);
      if (!oldBranch) return;
      
      // Update the branch status on the server
      const updatedBranch = await updateStudyBranch(branchId, { status: newStatus });
      
      // Preserve the existing branch data and only update the status
      setBranches(branches.map(branch => 
        branch._id === branchId ? { ...branch, status: newStatus } : branch
      ));
      
      // Update statistics
      const statsUpdate = { ...statistics };
      
      // Decrement old status count
      if (oldBranch.status === 'active') {
        statsUpdate.activeBranches--;
      } else if (oldBranch.status === 'completed') {
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
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
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
        return <LinkIcon className="h-4 w-4 text-green-500" />;
      case 'document':
        return <File className="h-4 w-4 text-yellow-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Study Dashboard</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Branch
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalBranches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-4 w-4 text-green-500">
              {getStatusIcon('active')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeBranches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completedBranches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalSubjects}</div>
          </CardContent>
        </Card>
      </div>

      {/* Branches List */}
      <div className="space-y-6">
        {branches.map((branch) => (
          <Card key={branch._id}>
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
              <h3 className="text-sm font-medium mb-3">Subjects</h3>
              {branch.subjects && branch.subjects.length > 0 ? (
                <div className="space-y-3">
                  {branch.subjects.slice(0, 3).map((subject) => (
                    <div 
                      key={subject._id} 
                      className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{subject.name}</h4>
                        {subject.description && (
                          <p className="text-sm text-muted-foreground">{subject.description}</p>
                        )}
                      </div>
                      
                      {/* Study Materials List */}
                      <div className="mt-2">
                        {subject.materials?.length > 0 ? (
                          <div className="space-y-2 mb-2">
                            {subject.materials.map((material) => (
                              <div key={material._id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                                <div className="flex items-center gap-2">
                                  {material.type === 'pdf' && <FileText className="h-4 w-4 text-red-500" />}
                                  {material.type === 'video' && <Video className="h-4 w-4 text-blue-500" />}
                                  {material.type === 'link' && <LinkIcon className="h-4 w-4 text-green-500" />}
                                  {material.type === 'document' && <File className="h-4 w-4 text-gray-500" />}
                                  <span className="font-medium">{material.title}</span>
                                </div>
                                <a 
                                  href={material?.link || material?.url ? (
                                    (material.link || material.url).startsWith('http') ? 
                                      (material.link || material.url) : 
                                      `https://${material.link || material.url}`
                                  ) : '#'}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline text-xs flex items-center gap-1"
                                  onClick={(e) => {
                                    const url = material?.link || material?.url;
                                    
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
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => {
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
                          
                          {subject.materials?.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {subject.materials.length} material{subject.materials.length !== 1 ? 's' : ''} added
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No subjects added yet
              </p>
            )}
            
            {/* Add Subject Button */}
              
              {/* Add Subject Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => {
                  if (!branch?._id) {
                    toast({
                      title: 'Error',
                      description: 'Could not determine branch ID',
                      variant: 'destructive',
                    });
                    return;
                  }
                  setSubjectForm({
                    name: '',
                    description: '',
                    branchId: branch._id
                  });
                  console.log('Opening subject dialog with branchId:', branch._id);
                  setIsSubjectDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Subject
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

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
                  const newSubject = await addSubject(subjectForm.branchId, {
                    name: subjectForm.name,
                    description: subjectForm.description
                  });
                  
                  console.log('Subject added successfully:', newSubject);
                  
                  // 2. Update the UI immediately with the new subject
                  setBranches(prevBranches => {
                    return prevBranches.map(branch => {
                      if (branch._id === subjectForm.branchId) {
                        // Create a new array with the new subject added
                        const updatedSubjects = [
                          ...(branch.subjects || []),
                          {
                            ...newSubject,
                            materials: [] // Initialize with empty materials array
                          }
                        ];
                        
                        // Return a new branch object with the updated subjects
                        return {
                          ...branch,
                          subjects: updatedSubjects
                        };
                      }
                      return branch;
                    });
                  });
                  
                  // 3. Try to refresh the branches data in the background
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
                  setIsSubjectDialogOpen(false);
                  
                  toast({
                    title: 'Success',
                    description: 'Subject added successfully',
                  });
                } catch (error) {
                  console.error('Error adding subject:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to add subject: ' + (error.response?.data?.message || error.message),
                    variant: 'destructive',
                  });
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
                              newMaterial
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
                  const oldBranch = branches.find(b => b._id === selectedBranch._id);
                  if (!oldBranch) return;
                  
                  // Only update the name and description, preserve other data
                  await updateStudyBranch(selectedBranch._id, {
                    name: editBranchForm.name.trim(),
                    description: editBranchForm.description.trim()
                  });
                  
                  // Update the branch in state while preserving all other data
                  setBranches(branches.map(branch => 
                    branch._id === selectedBranch._id 
                      ? { 
                          ...branch, 
                          name: editBranchForm.name.trim(),
                          description: editBranchForm.description.trim()
                        } 
                      : branch
                  ));
                  
                  setIsEditDialogOpen(false);
                  
                  toast({
                    title: 'Success',
                    description: 'Branch updated successfully',
                  });
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
                              newMaterial
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
                  const oldBranch = branches.find(b => b._id === selectedBranch._id);
                  if (!oldBranch) return;
                  
                  // Only update the name and description, preserve other data
                  await updateStudyBranch(selectedBranch._id, {
                    name: editBranchForm.name.trim(),
                    description: editBranchForm.description.trim()
                  });
                  
                  // Update the branch in state while preserving all other data
                  setBranches(branches.map(branch => 
                    branch._id === selectedBranch._id 
                      ? { 
                          ...branch, 
                          name: editBranchForm.name.trim(),
                          description: editBranchForm.description.trim()
                        } 
                      : branch
                  ));
                  
                  setIsEditDialogOpen(false);
                  
                  toast({
                    title: 'Success',
                    description: 'Branch updated successfully',
                  });
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
    </div>
  );
};
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
            const oldBranch = branches.find(b => b._id === selectedBranch._id);
            if (!oldBranch) return;
            
            // Only update the name and description, preserve other data
            await updateStudyBranch(selectedBranch._id, {
              name: editBranchForm.name.trim(),
              description: editBranchForm.description.trim()
            });
            
            // Update the branch in state while preserving all other data
            setBranches(branches.map(branch => 
              branch._id === selectedBranch._id 
                ? { 
                    ...branch, 
                    name: editBranchForm.name.trim(),
                    description: editBranchForm.description.trim()
                  } 
                : branch
            ));
            
            setIsEditDialogOpen(false);
            
            toast({
              title: 'Success',
              description: 'Branch updated successfully',
            });
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
</div>
);
                    description: 'Branch updated successfully',
                  });
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
    </div>
  );
};

export default Study;