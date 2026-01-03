import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getChallenge, updateChallenge } from "@/services/challengeService";
import { toast } from "@/components/ui/use-toast";

const EditChallenge = () => {
  const { challengeId: id } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const challenge = await getChallenge(id);
        setName(challenge.name);
      } catch (error) {
        console.error('Error fetching challenge:', error);
        toast({
          title: 'Error',
          description: 'Failed to load challenge',
          variant: 'destructive',
        });
        navigate('/challenges');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenge();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) return;

    try {
      setIsSubmitting(true);
      await updateChallenge(id, { name });
      
      toast({
        title: 'Success',
        description: 'Challenge updated successfully!',
      });
      
      navigate('/challenges');
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to update challenge',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Challenges
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Challenge Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter challenge name"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditChallenge;
