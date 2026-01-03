import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, Calendar, CheckCircle, Clock, Loader2, Edit, Trash2, MoreVertical, ArrowRight, Trophy, Flame, Zap } from "lucide-react";
import { createChallenge, getChallenges, updateChallenge, deleteChallenge, Challenge as ChallengeType, Subject } from "@/services/challengeService";
import { toast } from "@/components/ui/use-toast";

interface ChallengeWithId extends ChallengeType {
  _id: string;
  subjects: Subject[];
  status: "active" | "completed" | "paused";
}

const Challenges = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<ChallengeWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newChallengeName, setNewChallengeName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);

  // Fetch challenges on component mount
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setIsLoading(true);
        const data = await getChallenges();
        // Debug: Log the raw data
        console.log('Fetched challenges data:', data);
        
        // Process the data to ensure subjects exist
        const processedData = Array.isArray(data) 
          ? data.map(challenge => ({
              ...challenge,
              // Ensure subjects is always an array
              subjects: Array.isArray(challenge.subjects) ? challenge.subjects : []
            }))
          : [];
          
        console.log('Processed challenges data:', processedData);
        setChallenges(processedData);
      } catch (error) {
        console.error('Error fetching challenges:', error);
        toast({
          title: 'Error',
          description: 'Failed to load challenges',
          variant: 'destructive',
        });
        // Set to empty array on error to prevent undefined errors
        setChallenges([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const handleEditChallenge = (challenge: ChallengeWithId) => {
    navigate(`/challenges/${challenge._id}/edit`);
  };

  const handleDeleteClick = (id: string) => {
    console.log('Delete clicked with ID:', id);
    if (!id) {
      console.error('No ID provided for deletion');
      toast({
        title: "Error",
        description: "No challenge ID provided",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure we're using the string ID
    const challengeId = typeof id === 'string' ? id : id._id || id.id;
    if (!challengeId) {
      console.error('Invalid challenge ID format:', id);
      toast({
        title: "Error",
        description: "Invalid challenge ID format",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Setting challenge to delete:', challengeId);
    setChallengeToDelete(challengeId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteChallenge = async () => {
    if (!challengeToDelete) {
      console.error('No challenge ID available for deletion');
      toast({
        title: "Error",
        description: "No challenge selected for deletion",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Attempting to delete challenge with ID:', challengeToDelete);
      await deleteChallenge(challengeToDelete);
      setChallenges(challenges.filter(challenge => challenge._id !== challengeToDelete));
      setIsDeleteDialogOpen(false);
      setChallengeToDelete(null);
      toast({
        title: "Success",
        description: "Challenge deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting challenge:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete challenge. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitChallenge = async () => {
    if (!newChallengeName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a challenge name',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const newChallenge = await createChallenge({
        name: newChallengeName,
        subjects: [],
        status: 'active' as const
      });
      
      setChallenges([newChallenge as ChallengeWithId, ...challenges]);
      
      toast({
        title: 'Success',
        description: 'Challenge created successfully!',
      });
    } catch (error) {
      console.error('Error saving challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to create challenge',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setNewChallengeName("");
      setIsDialogOpen(false);
    }
  };

  const getStatusColor = (status: Challenge["status"]) => {
    switch (status) {
      case "active": return "default";
      case "completed": return "secondary";
      case "paused": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: Challenge["status"]) => {
    switch (status) {
      case "active": return Clock;
      case "completed": return CheckCircle;
      case "paused": return Target;
      default: return Target;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-challenge/10 via-challenge/5 to-accent/10 p-8 backdrop-blur-sm border border-challenge/10">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-gradient-to-br from-challenge/20 to-transparent blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-gradient-to-tr from-accent/20 to-transparent blur-xl"></div>
        
        <div className="relative z-10 flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-challenge/10">
                <Trophy className="h-6 w-6 text-challenge" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-challenge to-accent bg-clip-text text-transparent">
                Challenge Generator
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Create and track personal development challenges to achieve your goals
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-12 px-6 bg-gradient-to-r from-challenge to-accent hover:from-challenge/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-medium">Add Challenge</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold">Create New Challenge</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Start your journey by creating a new personal development challenge
                </p>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Challenge Name</Label>
                  <Input
                    id="name"
                    value={newChallengeName}
                    onChange={(e) => setNewChallengeName(e.target.value)}
                    className="h-11"
                    placeholder="e.g., Learn React, Read 20 Books, Fitness Challenge"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="h-11"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitChallenge}
                  disabled={!newChallengeName.trim() || isSubmitting}
                  className="h-11 min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Challenge'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-challenge/20 to-challenge/10 border border-challenge/200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-challenge/20 to-transparent blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-challenge/10">
                <Flame className="h-5 w-5 text-challenge" />
              </div>
              <div className="text-xs font-medium text-challenge bg-challenge/10 px-2 py-1 rounded-full">
                Active Now
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {challenges.filter(c => c.status === "active").length}
              </p>
              <p className="text-sm text-muted-foreground">Active Challenges</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-challenge">
              <Zap className="h-3 w-3" />
              <span>In Progress</span>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-green-400/20 to-transparent blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-green-500/10">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                Achieved
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {challenges.filter(c => c.status === "completed").length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-green-600">
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
                Total
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">
                {challenges.reduce((sum, c) => sum + (c.subjects?.length || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Subjects</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-primary">
              <Calendar className="h-3 w-3" />
              <span>All Topics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Challenges</h2>
          <div className="text-sm text-muted-foreground">
            {challenges.length} {challenges.length === 1 ? 'challenge' : 'challenges'} total
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading challenges...</p>
            </div>
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-challenge/10 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-12 w-12 text-challenge/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No challenges yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Create your first challenge to start your personal development journey
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const StatusIcon = getStatusIcon(challenge.status);
              const statusColors = {
                active: 'bg-challenge/10 text-challenge border-challenge/20',
                completed: 'bg-green-50 text-green-700 border-green-200',
                paused: 'bg-gray-50 text-gray-700 border-gray-200'
              };
              
              return (
                <div 
                  key={challenge._id}
                  className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg ${
                    challenge.status === 'active' 
                      ? 'bg-gradient-to-br from-challenge/5 via-card to-challenge/10 border-challenge/20 hover:border-challenge/30' 
                      : challenge.status === 'completed'
                      ? 'bg-gradient-to-br from-green-50/50 via-card to-green-50/30 border-green-200/50 hover:border-green-300/50'
                      : 'bg-gradient-to-br from-gray-50/50 via-card to-gray-50/30 border-gray-200/50 hover:border-gray-300/50'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground mb-2 truncate">
                          {challenge.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(challenge.createdAt || new Date()).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-xs border ${statusColors[challenge.status]}`}
                      >
                        {React.createElement(StatusIcon, { className: "h-3 w-3" })}
                        {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Subjects</div>
                        <div className="text-sm font-medium">
                          {challenge.subjects?.length || 0} {challenge.subjects?.length === 1 ? 'subject' : 'subjects'}
                        </div>
                      </div>
                      {challenge.subjects && challenge.subjects.length > 0 && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex-1 h-9 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditChallenge(challenge);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-9 text-xs font-medium text-destructive hover:text-destructive/90 hover:bg-destructive/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(challenge._id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1 h-9 text-xs font-medium bg-gradient-to-r from-challenge to-accent hover:from-challenge/90 hover:to-accent/90 transition-all duration-300"
                        onClick={() => navigate(`/challenges/${challenge._id}`, { 
                          state: { challenge } 
                        })}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Delete Challenge</DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to delete this challenge? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteChallenge} 
              variant="destructive"
              className="h-11"
            >
              Delete Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Challenges;