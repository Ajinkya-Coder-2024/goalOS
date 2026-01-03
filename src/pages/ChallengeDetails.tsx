import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getChallenge,
  addSection, 
  updateSection, 
  deleteSection, 
  addMultipleSubjects,
  updateSubject,
  deleteSubject,
  SectionResponse 
} from '@/services/challengeService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, X, Pencil, Trash2, Check, X as XIcon, Edit2, Trash, List, CheckCircle, ChevronDown, ChevronRight, Trophy, Target, Calendar, Clock, Flame, Zap, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import { toast } from "sonner";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Subject {
  id: string;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  startDate?: string | Date;
  endDate?: string | Date;
  fieldType?: 'description' | 'date' | 'none';
  resources?: {
    title: string;
    url: string;
    type: 'video' | 'article' | 'document' | 'other';
  }[];
}

interface Section extends Omit<SectionResponse, '_id'> {
  _id?: string;
  id: string;
  description: string;
  progress: number;
  subjects: any[];
  order: number;
  isEditing?: boolean;
  tempName?: string;
}

interface Challenge {
  id: string;
  _id?: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  totalTasks: number;
  completedTasks: number;
  categories?: string[];
  sections: Section[];
  startDate: Date | string;
  endDate: Date | string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  isActive?: boolean;
  ownerId?: string;
  tags?: string[];
}

// Mock data for challenges
const mockChallenges: Challenge[] = [
  {
    id: '1',
    name: '30-Day Full Stack Development Challenge',
    description: 'Complete a full-stack web application in 30 days',
    status: 'active',
    progress: 45,
    totalTasks: 30,
    completedTasks: 14,
    categories: ['Web Development', 'Programming', 'Learning'],
    sections: [
      {
        id: 's1',
        name: 'Frontend Development',
        description: 'Learn and implement frontend technologies',
        order: 1,
        progress: 60,
        subjects: [
          {
            id: 's1-sub1',
            name: 'HTML & CSS Fundamentals',
            description: 'Master the basics of web development',
            status: 'completed',
            progress: 100,
            resources: [
              { title: 'HTML Crash Course', url: '#', type: 'video' },
              { title: 'CSS Grid Guide', url: '#', type: 'article' }
            ]
          },
          {
            id: 's1-sub2',
            name: 'React Basics',
            description: 'Learn React fundamentals',
            status: 'in_progress',
            progress: 40,
            resources: [
              { title: 'React Documentation', url: '#', type: 'document' },
              { title: 'React Tutorial', url: '#', type: 'video' }
            ]
          }
        ]
      },
      {
        id: 's2',
        name: 'Backend Development',
        description: 'Build a robust backend service',
        order: 2,
        progress: 30,
        subjects: [
          {
            id: 's2-sub1',
            name: 'Node.js & Express',
            description: 'Create RESTful APIs with Express',
            status: 'in_progress',
            progress: 20,
            resources: []
          },
          {
            id: 's2-sub2',
            name: 'Database Design',
            description: 'Learn about database modeling',
            status: 'not_started',
            progress: 0,
            resources: []
          }
        ]
      }
    ],
    startDate: new Date(2025, 7, 15),
    endDate: new Date(2025, 8, 15),
    createdAt: new Date(2025, 7, 15)
  },
  {
    id: '2',
    name: 'React Native Mobile App Challenge',
    description: 'Build a cross-platform mobile app with React Native',
    status: 'active',
    progress: 20,
    totalTasks: 25,
    completedTasks: 5,
    categories: ['Mobile Development', 'React Native', 'JavaScript'],
    sections: [],
    startDate: new Date(2025, 8, 1),
    endDate: new Date(2025, 8, 30),
    createdAt: new Date(2025, 7, 20)
  }
];

interface NewSectionFormData {
  name: string;
}

type FieldType = 'date' | 'description';

interface SubjectFormData {
  subjects: Array<{
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    fieldType: 'description' | 'date' | 'none';
  }>;
}

interface AddSubjectFormProps {
  sectionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const ChallengeDetails = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryClient = useQueryClient();
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<{sectionId: string, subjectId: string} | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState<{sectionId: string | null, isEditing: boolean}>({sectionId: null, isEditing: false});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [viewAllDialogOpen, setViewAllDialogOpen] = useState<boolean>(false);
  // State to track selected subjects by section: { [sectionId]: { [subjectId]: boolean } }
  // Removed selectedSubjects state as we're not using checkboxes anymore
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>('overview');
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      if (direction === 'left') {
        tabsContainerRef.current.scrollLeft -= scrollAmount;
      } else {
        tabsContainerRef.current.scrollLeft += scrollAmount;
      }
    }
  };
  
  const [newSection, setNewSection] = useState<NewSectionFormData>({
    name: ''
  });
  
  const [newSubject, setNewSubject] = useState<SubjectFormData>({
    subjects: [{
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fieldType: 'date' // Default to date type to show date fields
    }]
  });
  const [editingSubjectData, setEditingSubjectData] = useState<{
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    fieldType?: 'description' | 'date' | 'none';
  }>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    fieldType: 'date'
  });
  const [editSectionData, setEditSectionData] = useState<{
    name: string;
    description: string;
  }>({ name: '', description: '' });
  const [challenge, setChallenge] = useState<Challenge | undefined>(
    location.state?.challenge || mockChallenges.find(c => c.id === challengeId || c._id === challengeId)
  );
  
  // Log for debugging
  console.log('Challenge ID from URL:', challengeId);
  console.log('Challenge from state:', challenge);

  // Add section mutation
  const addSectionMutation = useMutation<SectionResponse, Error, string>({
    mutationFn: async (sectionName: string) => {
      if (!challenge) {
        throw new Error('No challenge selected');
      }
      
      if (!challengeId) {
        console.error('No challenge ID found');
        throw new Error('No challenge ID found');
      }
      
      try {
        return await addSection(challengeId, { name: sectionName });
      } catch (error) {
        console.error('Error adding section:', error);
        throw error;
      }
    },
    onSuccess: (response: SectionResponse) => {
      if (challenge) {
        const newSection: Section = {
          id: response._id || `temp-${Date.now()}`,
          name: response.name || 'New Section',
          description: response.description || '',
          progress: 0,
          subjects: [],
          order: (challenge.sections?.length || 0) + 1
        };
        
        setChallenge({
          ...challenge,
          sections: [...(challenge.sections || []), newSection]
        });
      }
      setNewSection({ name: '' });
      setShowAddSection(false);
      toast.success('Section added successfully');
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
    onError: (error: any) => {
      console.error('Error adding section:', error);
      toast.error(error.response?.data?.message || 'Failed to add section');
    }
  });

  // Update section mutation
  const updateSectionMutation = useMutation<SectionResponse, Error, { sectionId: string; name: string }>({
    mutationFn: async ({ sectionId, name }) => {
      if (!challenge) {
        throw new Error('No challenge selected');
      }
      
      if (!challengeId) {
        throw new Error('No challenge ID found');
      }
      
      try {
        return await updateSection(challengeId, sectionId, { name });
      } catch (error) {
        console.error('Error updating section:', error);
        throw error;
      }
    },
    onSuccess: (updatedSection) => {
      if (challenge) {
        setChallenge(prevChallenge => {
          if (!prevChallenge) return prevChallenge;
          
          return {
            ...prevChallenge,
            sections: prevChallenge.sections?.map(section => {
              const sectionId = (section as any)._id || section.id;
              return sectionId === updatedSection._id
                ? { 
                    ...section, 
                    name: updatedSection.name, 
                    description: updatedSection.description || '',
                    _id: updatedSection._id // Ensure _id is set for future reference
                  }
                : section;
            }) || []
          };
        });
      }
      setEditingSectionId(null);
      toast.success('Section updated successfully');
      // Invalidate the challenges query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
    onError: (error: any) => {
      console.error('Error updating section:', error);
      toast.error(error.response?.data?.message || 'Failed to update section');
    }
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation<void, Error, string>({
    mutationFn: async (sectionId: string) => {
      if (!challengeId) {
        throw new Error('No challenge ID found');
      }
      
      try {
        await deleteSection(challengeId, sectionId);
      } catch (error) {
        console.error('Error deleting section:', error);
        throw error;
      }
    },
    onSuccess: (_, sectionId) => {
      if (challenge) {
        setChallenge(prevChallenge => {
          if (!prevChallenge) return prevChallenge;
          
          return {
            ...prevChallenge,
            sections: prevChallenge.sections?.filter(section => {
              const sectionIdToCheck = (section as any)._id || section.id;
              return sectionIdToCheck !== sectionId;
            }) || []
          };
        });
      }
      
      setSectionToDelete(null);
      toast.success('Section deleted successfully');
      // Invalidate the challenges query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
    onError: (error: any) => {
      console.error('Error deleting section:', error);
      toast.error(error.response?.data?.message || 'Failed to delete section');
    }
  });

  const handleEditSection = (section: Section) => {
    try {
      // Get the section ID, prioritizing _id for MongoDB
      const sectionId = (section as any)._id || section.id;
      if (!sectionId) {
        console.error('No section ID found for editing');
        toast.error('Could not start editing: Missing section ID');
        return;
      }
      
      console.log('Editing section ID:', sectionId);
      setEditingSectionId(sectionId);
      setEditSectionData({
        name: section.name || '',
        description: section.description || ''
      });
      
      // Force a re-render by updating the state
      setChallenge(prev => prev ? {...prev} : prev);
    } catch (error) {
      console.error('Error in handleEditSection:', error);
      toast.error('Failed to start editing section');
    }
  };

  const handleUpdateSection = (sectionId: string) => {
    try {
      console.log('Updating section ID:', sectionId);
      
      if (!sectionId) {
        console.error('Cannot update: No section ID provided');
        toast.error('Cannot update: Missing section ID');
        return;
      }
      
      if (!editSectionData.name?.trim()) {
        toast.error('Section name cannot be empty');
        return;
      }
      
      console.log('Sending update for section:', {
        sectionId,
        name: editSectionData.name.trim(),
        description: editSectionData.description
      });
      
      updateSectionMutation.mutate({
        sectionId,
        name: editSectionData.name.trim()
      });
    } catch (error) {
      console.error('Error in handleUpdateSection:', error);
      toast.error('Failed to update section');
    }
  };

  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setEditSectionData({ name: '', description: '' });
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    const sectionName = newSection.name.trim();
    if (!sectionName) {
      toast.error('Please enter a section name');
      return;
    }
    
    addSectionMutation.mutate(sectionName, {
      onError: (error: any) => {
        console.error('Error in handleAddSection:', error);
        toast.error(error.message || 'Failed to add section');
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSection(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, index: number) => {
    const { name, value, type } = e.target;
    
    if (name === 'subject-name' || name === 'subject-description' || 
        name === 'subject-startDate' || name === 'subject-endDate' || 
        name === 'subject-fieldType') {
      const fieldName = name.split('-')[1];
      setNewSubject(prev => {
        const updatedSubjects = [...prev.subjects];
        updatedSubjects[index] = {
          ...updatedSubjects[index],
          [fieldName]: type === 'number' ? parseFloat(value) : value,
          // Ensure dates are properly updated
          ...(fieldName === 'startDate' && { startDate: value }),
          ...(fieldName === 'endDate' && { endDate: value })
        };
        
        return {
          ...prev,
          subjects: updatedSubjects
        };
      });
    }
  };

  const formatDate = (dateString: string | Date): string => {
    try {
      if (!dateString) return 'No date';

      // If already a Date instance, use it directly
      let date: Date;
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        const trimmed = dateString.trim();
        if (!trimmed) return 'No date';

        // Handle plain YYYY-MM-DD by coercing to local midnight ISO
        const ymdMatch = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
        date = ymdMatch ? new Date(`${trimmed}T00:00:00`) : new Date(trimmed);
      } else {
        return 'No date';
      }

      if (isNaN(date.getTime())) {
        // Fallback: show the raw string if parsing failed
        return typeof dateString === 'string' ? dateString : 'No date';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return typeof dateString === 'string' ? dateString : 'No date';
    }
  };

  const toggleDescription = (e: React.MouseEvent, subjectId: string) => {
    e.stopPropagation();
    setExpandedDescriptions(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const handleDeleteSubject = async (e: React.MouseEvent, sectionId: string, subjectId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Starting delete subject with:', { sectionId, subjectId });
    
    // Store the current state in case we need to revert
    const previousState = {...challenge};
    
    try {
      // Find the section containing the subject
      const section = challenge?.sections?.find(s => s.id === sectionId || s._id === sectionId);
      
      if (!section) {
        console.error('Section not found for ID:', sectionId);
        toast.error('Section not found');
        return;
      }
      
      // Find the subject to get its _id if available
      const subjectToDelete = section.subjects?.find(s => 
        s.id === subjectId || s._id === subjectId
      );
      
      if (!subjectToDelete) {
        console.error('Subject not found for ID:', subjectId, 'in section:', sectionId);
        toast.error('Subject not found');
        return;
      }
      
      // Use _id if available, otherwise use the provided subjectId
      const actualSubjectId = subjectToDelete._id || subjectToDelete.id || subjectId;
      console.log('Actual subject ID to delete:', actualSubjectId);
      
      // Optimistic UI update
      const updatedSections = challenge.sections?.map(s => {
        if (s.id === sectionId || s._id === sectionId) {
          const newSubjects = s.subjects?.filter(subj => 
            !(subj.id === actualSubjectId || subj._id === actualSubjectId)
          ) || [];
          console.log('Updated subjects after filter:', newSubjects);
          return {
            ...s,
            subjects: newSubjects
          };
        }
        return s;
      }) || [];
      
      console.log('Sections after update:', updatedSections);
      
      // Update the UI immediately
      if (challenge) {
        setChallenge({
          ...challenge,
          sections: updatedSections
        });
      }
      
      // Call API to delete if it's not a temporary ID
      const isTemporaryId = actualSubjectId.startsWith('temp-');
      console.log('Is temporary ID?', isTemporaryId);
      
      if (!isTemporaryId) {
        try {
          console.log('Calling deleteSubject API with:', { 
            challengeId, 
            sectionId, 
            subjectId: actualSubjectId 
          });
          
          await deleteSubject(challengeId, sectionId, actualSubjectId);
          console.log('Subject deleted successfully');
          toast.success('Subject deleted successfully');
        } catch (error: any) {
          console.error('Error in deleteSubject API call:', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText
          });
          
          // Revert to previous state on error
          setChallenge(previousState);
          toast.error('Failed to delete subject');
        }
      } else {
        console.log('Skipping API call for temporary ID');
        toast.success('Draft subject removed');
      }
    } catch (error) {
      console.error('Unexpected error in handleDeleteSubject:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSubjectToDelete(null);
    }
  };

  const handleEditSubject = (e: React.MouseEvent, sectionId: string, subjectId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!challenge) {
      console.error('Challenge not found');
      toast.error('Challenge not found');
      return;
    }
    
    // Find the section containing the subject
    const section = challenge.sections?.find(s => 
      s.id === sectionId || (s as any)._id === sectionId
    );
    
    if (!section || !section.subjects) {
      console.error('Section not found:', { sectionId, sections: challenge.sections });
      toast.error('Section not found');
      return;
    }
    
    // Log for debugging
    console.log('Looking for subject with ID:', subjectId);
    console.log('Available subjects in section:', section.subjects);
    
    // Find the subject to edit - check both id and _id fields
    const subjectToEdit = section.subjects.find(s => {
      const subjId = (s as any)._id || s.id;
      return subjId === subjectId;
    });
    
    if (!subjectToEdit) {
      console.error('Subject not found:', { 
        subjectId, 
        subjectIds: section.subjects.map(s => ({
          id: (s as any).id,
          _id: (s as any)._id,
          name: s.name
        }))
      });
      toast.error('Subject not found. Please try again.');
      return;
    }
    
    // Format dates for the date input fields (YYYY-MM-DD)
    const formatDateForInput = (date: Date | string | undefined): string => {
      if (!date) return new Date().toISOString().split('T')[0];
      try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
      } catch (e) {
        console.error('Error formatting date:', e);
        return new Date().toISOString().split('T')[0];
      }
    };
    
    // Get the actual subject ID that was found (could be in _id or id field)
    const actualSubjectId = (subjectToEdit as any)._id || subjectToEdit.id;
    
    // Set up the edit form with the subject's data
    setNewSubject({
      subjects: [{
        name: subjectToEdit.name,
        description: subjectToEdit.description || '',
        startDate: formatDateForInput(subjectToEdit.startDate),
        endDate: formatDateForInput(subjectToEdit.endDate),
        fieldType: subjectToEdit.fieldType || 'date'
      }]
    });
    
    // Set the editing state with the actual subject ID
    setEditingSubjectId(actualSubjectId);
    setShowAddSubject({ 
      sectionId: section.id || (section as any)._id, 
      isEditing: true 
    });
    
    // Scroll to the form after a short delay to ensure it's rendered
    setTimeout(() => {
      const formElement = document.getElementById('subject-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleUpdateSubject = async (sectionId: string, subjectId: string) => {
    console.log('Updating subject:', { sectionId, subjectId, newSubject });
    
    if (!newSubject.subjects[0]?.name?.trim()) {
      toast.error('Subject name is required');
      return;
    }

    try {
      const subjectData = newSubject.subjects[0];
      
      // Call the API to update the subject
      await updateSubject(
        challengeId!,
        sectionId,
        subjectId,
        {
          name: subjectData.name.trim(),
          description: subjectData.description?.trim() || '',
          startDate: subjectData.startDate,
          endDate: subjectData.endDate,
          fieldType: subjectData.fieldType || 'date'
        }
      );

      // Update the local state
      setChallenge(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          sections: prev.sections?.map(section => {
            const sectionIdToCheck = (section as any)._id || section.id;
            if (sectionIdToCheck === sectionId) {
              return {
                ...section,
                subjects: section.subjects?.map(subject => {
                  const subjectIdToCheck = (subject as any)._id || subject.id;
                  if (subjectIdToCheck === subjectId) {
                    return {
                      ...subject,
                      name: subjectData.name,
                      description: subjectData.description,
                      startDate: subjectData.startDate,
                      endDate: subjectData.endDate,
                      fieldType: subjectData.fieldType
                    };
                  }
                  return subject;
                }) || []
              };
            }
            return section;
          }) || []
        };
      });

      // Reset form and editing state
      setNewSubject({
        subjects: [{
          name: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          fieldType: 'date'
        }]
      });
      setEditingSubjectId(null);
      setShowAddSubject({ sectionId: null, isEditing: false });
      
      toast.success('Subject updated successfully');
    } catch (error: any) {
      console.error('Error updating subject:', error);
      toast.error(error.message || 'Failed to update subject');
    }
  };

  const addMoreSubject = () => {
    setNewSubject(prev => ({
      subjects: [
        ...prev.subjects,
        {
          name: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          fieldType: 'date'
        }
      ]
    }));
  };

  const removeSubject = (index: number) => {
    if (newSubject.subjects.length <= 1) return;
    
    setNewSubject(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const handleAddSubject = async (sectionId: string) => {
    // If we're in edit mode, handle the update
    if (editingSubjectId) {
      await handleUpdateSubject(sectionId, editingSubjectId);
      return;
    }

    if (!newSubject.subjects[0]?.name.trim()) {
      toast.error('Subject name is required');
      return;
    }

    // Prepare valid subjects from the form (non-empty names)
    const validSubjects = newSubject.subjects
      .filter((s) => s.name && s.name.trim() !== '')
      .map((s) => ({
        name: s.name.trim(),
        description: (s.description || '').trim(),
        startDate: s.startDate,
        endDate: s.endDate,
        fieldType: s.fieldType || 'none'
      }));

    if (validSubjects.length === 0) {
      toast.error('Please enter at least one subject');
      return;
    }

    try {
      // Get the challenge ID
      if (!challenge) {
        throw new Error('Challenge not found');
      }
      const challengeId = challenge._id || challenge.id;
      if (!challengeId) {
        throw new Error('Challenge ID is missing');
      }

      // Call the API to add subjects
      const addedSubjects = await addMultipleSubjects(challengeId, sectionId, validSubjects);
      
      // Update the local state with the new subjects
      setChallenge(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          sections: prev.sections?.map(section => 
            section.id === sectionId || section._id === sectionId
              ? {
                  ...section,
                  subjects: [
                    ...(section.subjects || []),
                    ...addedSubjects
                  ]
                }
              : section
          )
        };
      });

      // Reset form
      setNewSubject({
        subjects: [{
          name: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          fieldType: 'description'
        }]
      });

      // Close the add/edit subject form
      setShowAddSubject({ sectionId: null, isEditing: false });
      setEditingSubjectId(null);
      
      toast.success(`Added ${addedSubjects.length} subject${addedSubjects.length > 1 ? 's' : ''} successfully`);
    } catch (error: any) {
      console.error('Error adding subjects:', error);
      toast.error(error.message || 'Failed to add subjects');
    }
  };
  
  // If challenge not found, show error
  if (!challenge) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Challenges
        </Button>
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h1 className="text-2xl font-bold text-red-600">Challenge not found</h1>
          <p className="mt-2">The requested challenge could not be found.</p>
        </div>
      </div>
    );
  }

  // Ensure sections exists and is an array
  const sections = Array.isArray(challenge.sections) ? challenge.sections : [];

  const renderAddSubjectForm = (sectionId: string) => (
    <div id="subject-form" className="mt-4 p-4 bg-muted/10 rounded-lg">
      <h4 className="font-medium mb-3">{editingSubjectId ? 'Edit Subject' : 'Add New Subject(s)'}</h4>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (editingSubjectId) {
            handleUpdateSubject(sectionId, editingSubjectId);
          } else {
            handleAddSubject(sectionId);
          }
        }}
        className="space-y-4"
      >
        {newSubject.subjects.map((subject, index) => (
          <div key={index} className="space-y-3 p-3 bg-white/5 rounded-lg relative">
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeSubject(index)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                title="Remove subject"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <div>
              <Label htmlFor={`subject-name-${index}`}>Subject Name *</Label>
              <Input
                id={`subject-name-${index}`}
                name={`subject-name`}
                value={subject.name}
                onChange={(e) => handleSubjectInputChange(e, index)}
                placeholder="Enter subject name"
                className="mt-1"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Add:</span>
              <select
                name="subject-fieldType"
                value={subject.fieldType}
                onChange={(e) => handleSubjectInputChange(e, index)}
                className="text-sm border-0 bg-transparent p-1 rounded hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="description">Description</option>
                <option value="date">Dates</option>
                <option value="none">No Additional Fields</option>
              </select>
            </div>

            {subject.fieldType === 'description' && (
              <div>
                <Label htmlFor={`subject-desc-${index}`}>Description (Optional)</Label>
                <Input
                  id={`subject-desc-${index}`}
                  name={`subject-description`}
                  value={subject.description}
                  onChange={(e) => handleSubjectInputChange(e, index)}
                  placeholder="Enter description"
                  className="mt-1"
                />
              </div>
            )}

            {subject.fieldType === 'date' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`start-date-${index}`}>Start Date</Label>
                  <Input
                    type="date"
                    id={`start-date-${index}`}
                    name={`subject-startDate`}
                    value={subject.startDate}
                    onChange={(e) => handleSubjectInputChange(e, index)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`end-date-${index}`}>End Date</Label>
                  <Input
                    type="date"
                    id={`end-date-${index}`}
                    name={`subject-endDate`}
                    value={subject.endDate}
                    onChange={(e) => handleSubjectInputChange(e, index)}
                    min={subject.startDate}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-wrap justify-between items-center gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMoreSubject}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add More Subjects
          </Button>
          
          <div className="flex space-x-2">
            <Button 
              type="submit" 
              size="sm"
              disabled={!newSubject.subjects.some(s => s.name.trim() !== '')}
            >
              {editingSubjectId ? 'Update' : `Add ${newSubject.subjects.length > 1 ? 'All ' : ''}Subject${newSubject.subjects.length > 1 ? 's' : ''}`}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddSubject(null);
                setNewSubject({
                  subjects: [{
                    name: '',
                    description: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    fieldType: 'date'
                  }]
                });
                setEditingSubjectId(null);
                setShowAddSubject({ sectionId: null, isEditing: false });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );


  // Generate PDF function
  const generatePDF = async () => {
    if (!challenge) {
      toast.error('No challenge data available');
      return;
    }

    try {
      // Show loading state
      toast.info('Generating PDF...');

      // Ensure we have the latest data
      const currentSections = Array.isArray(challenge.sections) ? challenge.sections : [];
      
      // Create a temporary container for the PDF content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '800px';
      tempContainer.style.padding = '40px';
      tempContainer.style.background = 'white';
      tempContainer.style.fontFamily = 'Times New Roman, serif';
      tempContainer.style.color = '#000000';
      tempContainer.style.lineHeight = '1.6';
      document.body.appendChild(tempContainer);

      // Generate professional report HTML with current data
      const reportHTML = `
        <div style="background: white; padding: 60px; font-family: 'Times New Roman', serif; color: #000000; line-height: 1.6;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 50px; border-bottom: 3px solid #000; padding-bottom: 30px;">
            <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 2px;">
              ${challenge.name || 'Challenge Report'}
            </h1>
            <div style="font-size: 16px; color: #333; font-weight: 500;">
              Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <!-- Challenge Overview -->
          <div style="margin-bottom: 40px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #333; padding-bottom: 10px;">
              Challenge Overview
            </h2>
            <div style="margin-bottom: 15px; font-size: 14px;">
              <strong style="color: #333;">Description:</strong> 
              <span style="color: #555;">${challenge.description || 'No description available'}</span>
            </div>
            <div style="margin-bottom: 15px; font-size: 14px;">
              <strong style="color: #333;">Status:</strong> 
              <span style="color: #555;">${challenge.status ? challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1) : 'Unknown'}</span>
            </div>
            <div style="margin-bottom: 15px; font-size: 14px;">
              <strong style="color: #333;">Categories:</strong> 
              <span style="color: #555;">${challenge.categories && challenge.categories.length > 0 ? challenge.categories.join(', ') : 'None'}</span>
            </div>
          </div>
          
          <!-- Statistics -->
          <div style="margin-bottom: 40px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #333; padding-bottom: 10px;">
              Statistics
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid #333;">
              <tr>
                <td style="padding: 15px; border: 1px solid #333; background: #f8f8f8; font-weight: bold; font-size: 14px; width: 40%;">Total Sections</td>
                <td style="padding: 15px; border: 1px solid #333; font-size: 14px; font-weight: 500;">${currentSections.length}</td>
              </tr>
              <tr>
                <td style="padding: 15px; border: 1px solid #333; background: #f8f8f8; font-weight: bold; font-size: 14px;">Total Subjects</td>
                <td style="padding: 15px; border: 1px solid #333; font-size: 14px; font-weight: 500;">${currentSections.reduce((total, section) => total + (section?.subjects?.length || 0), 0)}</td>
              </tr>
              <tr>
                <td style="padding: 15px; border: 1px solid #333; background: #f8f8f8; font-weight: bold; font-size: 14px;">Completed Subjects</td>
                <td style="padding: 15px; border: 1px solid #333; font-size: 14px; font-weight: 500;">${currentSections.reduce((total, section) => total + (section?.subjects?.filter((s: any) => s.status === 'completed').length || 0), 0)}</td>
              </tr>
            </table>
          </div>
          
          <!-- Sections and Subjects -->
          <div style="margin-bottom: 40px;">
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #333; padding-bottom: 10px;">
              Sections and Subjects
            </h2>
            ${currentSections.filter(Boolean).map((section, sectionIndex) => `
              <div style="margin-bottom: 35px; page-break-inside: avoid; border: 1px solid #ccc; padding: 20px; background: #fafafa;">
                <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #000; text-transform: uppercase;">
                  Section ${sectionIndex + 1}: ${section?.name || 'Untitled Section'}
                </h3>
                <div style="margin-bottom: 15px; font-size: 13px; color: #666; font-weight: 500;">
                  ${section?.subjects?.length || 0} subject(s) in this section
                </div>
                
                ${section?.subjects && section.subjects.length > 0 ? `
                  <table style="width: 100%; border-collapse: collapse; margin-top: 15px; border: 1px solid #333;">
                    <thead>
                      <tr style="background: #333; color: white;">
                        <th style="padding: 12px; border: 1px solid #333; text-align: left; font-size: 13px; font-weight: bold;">Subject Name</th>
                        <th style="padding: 12px; border: 1px solid #333; text-align: left; font-size: 13px; font-weight: bold;">Status</th>
                        <th style="padding: 12px; border: 1px solid #333; text-align: left; font-size: 13px; font-weight: bold;">Dates</th>
                        <th style="padding: 12px; border: 1px solid #333; text-align: left; font-size: 13px; font-weight: bold;">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${section.subjects.map((subject, subjectIndex) => `
                        <tr style="${subjectIndex % 2 === 0 ? 'background: #f9f9f9;' : 'background: white;'}">
                          <td style="padding: 12px; border: 1px solid #333; font-size: 12px; font-weight: 500;">
                            ${subject.name || `Subject ${subjectIndex + 1}`}
                          </td>
                          <td style="padding: 12px; border: 1px solid #333; font-size: 12px;">
                            ${subject.status === 'completed' ? '<span style="color: #228B22; font-weight: bold;">✓ Completed</span>' : subject.status === 'in_progress' ? '<span style="color: #FF8C00; font-weight: bold;">⏳ In Progress</span>' : '<span style="color: #666;">○ Not Started</span>'}
                          </td>
                          <td style="padding: 12px; border: 1px solid #333; font-size: 12px;">
                            ${subject.startDate && subject.endDate ? 
                              `${formatDate(subject.startDate)} - ${formatDate(subject.endDate)}` : 
                              subject.startDate ? `From: ${formatDate(subject.startDate)}` : 
                              subject.endDate ? `Until: ${formatDate(subject.endDate)}` : 
                              'No dates set'
                            }
                          </td>
                          <td style="padding: 12px; border: 1px solid #333; font-size: 12px;">
                            ${subject.description || 'No description'}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                ` : '<div style="padding: 15px; background: #f0f0f0; border: 1px solid #ccc; font-size: 12px; color: #666; text-align: center;">No subjects in this section</div>'}
              </div>
            `).join('')}
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #333; font-size: 11px; color: #666; text-align: center;">
            <div style="margin-bottom: 5px; font-weight: 500;">Report generated on ${new Date().toLocaleDateString('en-US')} at ${new Date().toLocaleTimeString('en-US')}</div>
            <div style="font-style: italic;">Challenge Management System - Professional Report</div>
          </div>
        </div>
      `;

      tempContainer.innerHTML = reportHTML;

      // Generate PDF
      const canvas = await html2canvas(tempContainer, {
        useCORS: true,
        logging: false,
        background: '#ffffff',
        width: 800,
        height: tempContainer.scrollHeight
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Clean up
      document.body.removeChild(tempContainer);

      // Download PDF
      const fileName = `${challenge.name || 'challenge'}-report-${new Date().toISOString().split('T')[0]}.pdf`;
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
  const ViewAllDetailsDialog = () => {
    if (!challenge) return null;
    
    return (
      <Dialog open={viewAllDialogOpen} onOpenChange={setViewAllDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Challenge Details</DialogTitle>
            <DialogDescription>
              View and manage all sections and subjects in one place
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {challenge?.sections?.map((section) => (
              <div key={section.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSections(prev => ({
                          ...prev,
                          [section.id]: !prev[section.id]
                        }));
                      }}
                    >
                      {expandedSections[section.id] === false ? 
                        <ChevronRight className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </Button>
                    <h3 className="font-medium">{section.name}</h3>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {section.subjects?.length || 0} subjects
                  </span>
                </div>
                
                {expandedSections[section.id] !== false && section.subjects?.map((subject) => (
                  <div className="flex items-center p-2 hover:bg-gray-50 rounded-md w-full">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {subject.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {subject.status === 'completed' ? (
                            <span className="inline-flex items-center text-green-600">
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Completed
                            </span>
                          ) : subject.status === 'in_progress' ? (
                            <span className="text-blue-600">In Progress</span>
                          ) : (
                            <span className="text-gray-500">Not Started</span>
                          )}
                        </span>
                      </div>
                      {subject.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {subject.description}
                        </p>
                      )}
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        {subject.startDate && (
                          <span className="mr-4">
                            Start: {formatDate(subject.startDate, 'DD/MM/YYYY')}
                          </span>
                        )}
                        {subject.endDate && (
                          <span>End: {formatDate(subject.endDate, 'DD/MM/YYYY')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
      <ViewAllDetailsDialog />
      
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-challenge/10 via-challenge/5 to-accent/10 p-8 backdrop-blur-sm border border-challenge/10">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-gradient-to-br from-challenge/20 to-transparent blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-gradient-to-tr from-accent/20 to-transparent blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              className="h-10 w-10 p-0 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2 rounded-xl bg-challenge/10">
              <Trophy className="h-6 w-6 text-challenge" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-challenge to-accent bg-clip-text text-transparent">
              {challenge?.name || 'Untitled Challenge'}
            </h1>
          </div>
          
          <p className="text-muted-foreground text-lg max-w-3xl mb-6">
            {challenge?.description}
          </p>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-challenge/10 text-challenge border border-challenge/20">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {challenge?.status.charAt(0).toUpperCase() + challenge?.status.slice(1)}
              </span>
            </div>
            
            {(challenge?.categories || []).map((category, index) => (
              <div key={index} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <span className="text-sm font-medium">{category}</span>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generatePDF}
              className="flex items-center gap-2 h-9 px-4 border-border/50 hover:border-border transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Sections */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Sections</h2>
            <Button 
              onClick={() => setShowAddSection(!showAddSection)}
              className="gap-2 h-11 px-6 bg-gradient-to-r from-challenge to-accent hover:from-challenge/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {showAddSection ? (
                <>
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add Section</span>
                </>
              )}
            </Button>
          </div>

          {/* Add Section Form */}
          {showAddSection && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-challenge/5 via-card to-challenge/10 border border-challenge/20 p-6 shadow-sm">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-challenge/20 to-transparent blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-semibold mb-4">Create New Section</h3>
                <form onSubmit={handleAddSection} className="space-y-4">
                  <div>
                    <Label htmlFor="section-name" className="text-sm font-medium">Section Name</Label>
                    <Input
                      id="section-name"
                      name="name"
                      value={newSection.name}
                      onChange={handleInputChange}
                      placeholder="Enter section name"
                      className="h-11 mt-2"
                      autoFocus
                      disabled={addSectionMutation.isPending}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      type="button"
                      onClick={() => setShowAddSection(false)}
                      disabled={addSectionMutation.isPending}
                      className="h-11"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={!newSection.name.trim() || addSectionMutation.isPending}
                      className="h-11 min-w-[100px]"
                    >
                      {addSectionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Section'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Sections Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="relative flex items-center gap-2 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollTabs('left')}
                className="h-9 w-9 p-0 rounded-full border-border/50 hover:border-border flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div 
                ref={tabsContainerRef}
                className="overflow-x-hidden flex-1"
                style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none'
                }}
              >
                <div className="overflow-x-auto">
                  <TabsList className="inline-flex w-auto min-w-max gap-2 bg-transparent p-1">
                    <TabsTrigger 
                      value="overview" 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md whitespace-nowrap font-medium"
                    >
                      <Target className="h-4 w-4" />
                      <span>Overview</span>
                    </TabsTrigger>
                    {sections.filter(Boolean).map((section, index) => (
                      <TabsTrigger 
                        key={section?.id || `section-${index}`} 
                        value={section?.id || `section-${index}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md whitespace-nowrap font-medium"
                      >
                        <span>{section?.name || `Section ${index + 1}`}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => scrollTabs('right')}
                className="h-9 w-9 p-0 rounded-full border-border/50 hover:border-border flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-card to-primary/10 border border-primary/20 p-6">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-xl"></div>
                <div className="relative z-10">
                  <h3 className="text-xl font-semibold mb-4">Challenge Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">{sections.length}</div>
                      <div className="text-sm text-muted-foreground">Total Sections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-challenge mb-2">
                        {sections.reduce((total, section) => total + (section?.subjects?.length || 0), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Subjects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {sections.reduce((total, section) => 
                          total + (section?.subjects?.filter((s: any) => s.status === 'completed').length || 0), 0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Section Tabs */}
            {sections.filter(Boolean).map((section, index) => (
              <TabsContent key={section?.id || `section-${index}`} value={section?.id || `section-${index}`} className="space-y-6 mt-6">
                <div 
                  className="group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card via-card to-muted/30 border-border/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6">
                    {editingSectionId === ((section as any)._id || section.id) ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Edit Section</h3>
                        <div className="flex items-center gap-3">
                          <Input
                            value={editSectionData.name}
                            onChange={(e) => setEditSectionData(prev => ({ ...prev, name: e.target.value }))}
                            className="flex-1 h-11"
                            autoFocus
                          />
                          <Button 
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateSectionMutation.isPending}
                            className="h-11"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              const sectionId = editingSectionId;
                              console.log('Save button clicked for section ID:', sectionId);
                              if (sectionId) {
                                handleUpdateSection(sectionId);
                              } else {
                                console.error('No section ID available for update');
                                toast.error('Cannot update: Missing section ID');
                              }
                            }}
                            disabled={!editSectionData.name?.trim() || updateSectionMutation.isPending}
                            className="h-11 min-w-[80px]"
                          >
                            {updateSectionMutation.isPending && updateSectionMutation.variables?.sectionId === ((section as any)._id || section.id) ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save'
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-6">
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-foreground">
                              {section?.name || 'Untitled Section'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Target className="h-4 w-4" />
                              <span>{section?.subjects?.length || 0} {section?.subjects?.length === 1 ? 'subject' : 'subjects'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                console.log('Edit button clicked for section:', section);
                                handleEditSection(section);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 text-destructive hover:text-destructive/90 hover:bg-destructive/10 transition-colors"
                              onClick={() => setSectionToDelete((section as any)._id || section.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        
                        {/* Subjects Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground">Subjects</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const secId = (section as any)._id || section.id;
                                setShowAddSubject(prev => (prev.sectionId === secId && !prev.isEditing 
                                  ? { sectionId: null, isEditing: false }
                                  : { sectionId: secId, isEditing: false }));
                                setEditingSubjectId(null);
                              }}
                              className="h-9 px-4"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Subject
                            </Button>
                          </div>
                        
                          {/* Add/Edit Subject Form */}
                          {showAddSubject.sectionId === ((section as any)._id || section.id) && (
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-card to-primary/10 border border-primary/20 p-4">
                              {renderAddSubjectForm(
                                (section as any)._id || section.id,
                                showAddSubject.isEditing
                              )}
                            </div>
                          )}
                          
                          {/* Subjects List */}
                          <div className="space-y-3">
                            {section?.subjects?.map((subject, idx) => (
                              <div 
                                key={subject.id || `subject-${idx}`} 
                                className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/50 hover:bg-card transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <div className="relative p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-semibold text-foreground mb-2">{subject.name}</h5>
                                      {(subject.startDate || subject.endDate) && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                          <Calendar className="h-4 w-4" />
                                          <span>
                                            {formatDate(subject.startDate)} - {formatDate(subject.endDate)}
                                          </span>
                                        </div>
                                      )}
                                      {subject.description && (
                                        <p className="text-sm text-muted-foreground">{subject.description}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 ml-4">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const sectionId = (section as any)._id || section.id;
                                          const subjectId = (subject as any)._id || subject.id;
                                          handleEditSubject(e, sectionId, subjectId);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const sectionId = section.id || (section as any)._id;
                                          const subjectId = (subject as any)._id || subject.id || `subject-${idx}`;
                                          console.log('Deleting subject with ID:', { subjectId, subject });
                                          if (window.confirm('Are you sure you want to delete this subject?')) {
                                            handleDeleteSubject(e, sectionId, subjectId);
                                          }
                                        }}
                                      >
                                        <Trash className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  {expandedDescriptions[subject.id || `subject-${idx}`] && subject.resources && subject.resources.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-border/50">
                                      <h6 className="text-xs font-medium text-muted-foreground mb-2">Resources:</h6>
                                      <div className="flex flex-wrap gap-2">
                                        {subject.resources.map((resource, resIdx) => (
                                          <a
                                            key={resIdx}
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs px-3 py-1.5 bg-muted/50 rounded-md hover:bg-muted border border-border/50 text-foreground flex items-center gap-1.5 transition-colors"
                                          >
                                            {resource.type === 'video' && (
                                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                              </svg>
                                            )}
                                            {resource.type === 'article' && (
                                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385V4.804zM11 4.804A7.968 7.968 0 0114.5 4c1.255 0 2.443.29 3.5.804v10A7.969 7.969 0 0014.5 14c-1.669 0-3.218.51-4.5 1.385V4.804z" />
                                              </svg>
                                            )}
                                            {resource.type === 'document' && (
                                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                              </svg>
                                            )}
                                            {resource.title}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!sectionToDelete} onOpenChange={(open) => !open && setSectionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this section and all its content. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteSectionMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => sectionToDelete && deleteSectionMutation.mutate(sectionToDelete)}
                disabled={deleteSectionMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteSectionMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Subject Confirmation Dialog */}
        <AlertDialog open={!!subjectToDelete} onOpenChange={(open) => !open && setSubjectToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Subject</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this subject? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={(e) => {
                  if (subjectToDelete) {
                    handleDeleteSubject(e, subjectToDelete.sectionId, subjectToDelete.subjectId);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ChallengeDetails;