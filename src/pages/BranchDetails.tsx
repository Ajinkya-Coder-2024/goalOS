import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Clock, CheckCircle, Target, ChevronDown, ChevronUp, BookOpen, Youtube, FileText, Link as LinkIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// This would typically come from your API or shared types
type StudyMaterial = {
  id: string;
  title: string;
  type: 'video' | 'article' | 'document' | 'link';
  url: string;
  duration?: string;
  completed?: boolean;
};

type Subject = {
  id: string;
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  materials: StudyMaterial[];
  isExpanded?: boolean;
};

type Branch = {
  id: string;
  name: string;
  subjects: Subject[];
  status: "active" | "completed" | "paused";
  createdAt: Date;
};

// Mock data - in a real app, this would come from an API
const branches: Branch[] = [
  {
    id: "1",
    name: "Web Development",
    subjects: [
      {
        id: "1",
        name: "Frontend Development",
        description: "React, Vue, and modern JavaScript frameworks",
        materials: [
          {
            id: "m1",
            title: "React Hooks Tutorial",
            type: 'video',
            url: "https://youtube.com/react-hooks",
            duration: "45 min",
            completed: false
          },
          {
            id: "m2",
            title: "Vue 3 Composition API",
            type: 'article',
            url: "https://vuejs.org/guide/",
            completed: true
          }
        ],
        isExpanded: false
      },
      {
        id: "2",
        name: "Backend Development",
        description: "Node.js, Express, and database integration",
        materials: [
          {
            id: "m3",
            title: "Node.js Crash Course",
            type: 'video',
            url: "https://youtube.com/node-crash-course",
            duration: "2h 30min",
            completed: false
          }
        ],
        isExpanded: false
      }
    ],
    status: "active",
    createdAt: new Date()
  },
  {
    id: "2",
    name: "Data Science",
    subjects: [
      {
        id: "3",
        name: "Machine Learning",
        description: "Algorithms and model training",
        materials: [
          {
            id: "m4",
            title: "Introduction to ML with Python",
            type: 'document',
            url: "https://example.com/ml-pdf",
            completed: false
          }
        ],
        isExpanded: false
      }
    ],
    status: "active",
    createdAt: new Date()
  }
];

const BranchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State management
  const [localBranches, setLocalBranches] = useState<Branch[]>(branches);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [currentSubjectId, setCurrentSubjectId] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState<Omit<StudyMaterial, 'id'>>({ 
    title: '',
    type: 'article',
    url: '',
    duration: '',
    completed: false
  });
  
  const setShowAddModal = (show: boolean) => {
    setShowAddMaterial(show);
    if (!show) {
      // Reset form when dialog is closed
      setNewMaterial({
        title: '',
        type: 'article',
        url: '',
        duration: '',
        completed: false
      });
    }
  };
  
  // Find the branch with the matching ID
  const branch = localBranches.find(b => b.id === id);
  
  const toggleSubject = (subjectId: string) => {
    setLocalBranches(prevBranches => 
      prevBranches.map(branch => ({
        ...branch,
        subjects: branch.subjects.map(subject => 
          subject.id === subjectId 
            ? { ...subject, isExpanded: !subject.isExpanded }
            : subject
        )
      }))
    );
  };
  
  const getMaterialIcon = (type: string) => {
    switch(type) {
      case 'video': return <Youtube className="h-4 w-4 text-red-500" />;
      case 'article': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'document': return <BookOpen className="h-4 w-4 text-green-500" />;
      default: return <LinkIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleAddMaterialClick = (subjectId: string) => {
    setCurrentSubjectId(subjectId);
    setNewMaterial({
      title: '',
      type: 'article',
      url: '',
      duration: '',
      completed: false
    });
    setShowAddMaterial(true);
  };

  const handleAddMaterial = () => {
    if (!currentSubjectId || !newMaterial.title || !newMaterial.url) return;
    
    setLocalBranches(prevBranches => 
      prevBranches.map(branch => ({
        ...branch,
        subjects: branch.subjects.map(subject => 
          subject.id === currentSubjectId
            ? {
                ...subject,
                materials: [
                  ...subject.materials,
                  {
                    ...newMaterial,
                    id: `material-${Date.now()}`,
                    duration: newMaterial.type === 'video' ? newMaterial.duration : undefined
                  }
                ]
              }
            : subject
        )
      }))
    );
    
    setShowAddMaterial(false);
  };

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Branch not found</h2>
        <Button onClick={() => navigate('/study')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Branches
        </Button>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return Clock;
      case "completed": return CheckCircle;
      case "paused": return Target;
      default: return Clock;
    }
  };

  const StatusIcon = getStatusIcon(branch.status);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/study')}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{branch.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant="outline" 
              className={`${branch.status === 'active' ? 'text-challenge border-challenge' : 'text-accent border-accent'}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {branch.status.charAt(0).toUpperCase() + branch.status.slice(1)}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Created on {branch.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Subjects</h2>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </div>
        
        {branch.subjects.length > 0 ? (
          <div className="space-y-3">
            {branch.subjects.map((subject) => (
              <Card key={subject.id}>
                <CardHeader 
                  className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSubject(subject.id)}
                >
                  <div>
                    <h3 className="font-medium">{subject.name}</h3>
                    <p className="text-sm text-muted-foreground">{subject.description}</p>
                  </div>
                  {subject.isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardHeader>
                
                {subject.isExpanded && (
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Study Materials</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddMaterialClick(subject.id);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Material
                        </Button>
                      </div>
                      
                      {subject.materials.length > 0 ? (
                        <div className="space-y-2">
                          {subject.materials.map((material) => (
                            <div 
                              key={material.id}
                              className="p-3 border rounded-md hover:bg-muted/50"
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-md bg-muted">
                                  {getMaterialIcon(material.type)}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">{material.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
                                    {material.duration && ` • ${material.duration}`}
                                  </p>
                                </div>
                                {material.completed ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <div className="h-5 w-5" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                          No study materials added yet.
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No subjects yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Get started by adding your first subject
            </p>
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </div>
        )}
      </div>

      {/* Add Material Dialog */}
      <Dialog open={showAddMaterial} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add Study Material</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="material-title">Title *</Label>
              <Input
                id="material-title"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                placeholder="Enter material title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="material-type">Type *</Label>
              <Select 
                value={newMaterial.type} 
                onValueChange={(value) => setNewMaterial({...newMaterial, type: value as any})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newMaterial.type === 'video' && (
              <div className="space-y-2">
                <Label htmlFor="material-duration">Duration (e.g., 45 min)</Label>
                <Input
                  id="material-duration"
                  value={newMaterial.duration || ''}
                  onChange={(e) => setNewMaterial({...newMaterial, duration: e.target.value})}
                  placeholder="e.g., 45 min"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="material-url">URL *</Label>
              <Input
                id="material-url"
                type="url"
                value={newMaterial.url}
                onChange={(e) => setNewMaterial({...newMaterial, url: e.target.value})}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddMaterial(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMaterial}
              disabled={!newMaterial.title || !newMaterial.url}
            >
              Add Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchDetails;
