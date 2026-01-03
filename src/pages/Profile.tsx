import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Calendar, Edit2, Save, X, Lock, Key, LogOut, AlertTriangle, Shield, Settings } from "lucide-react";
import { useProfileData } from "@/hooks/useProfileData";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    bio: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const { profile, loading, error, updateProfile, updatePreferences } = useProfileData();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        location: profile.location,
        bio: profile.bio
      });
    }
  }, [profile]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data
      if (profile) {
        setFormData({
          name: profile.name,
          email: profile.email,
          location: profile.location,
          bio: profile.bio
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreferenceToggle = async (key: keyof typeof profile.preferences) => {
    if (!profile) return;
    
    const newPreferences = {
      ...profile.preferences,
      [key]: !profile.preferences[key]
    };
    
    const success = await updatePreferences(newPreferences);
    if (success) {
      toast({
        title: "Preferences Updated",
        description: `Your ${key} preference has been updated.`,
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully.",
        });
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to change password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Show success message
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    
    // Force redirect to login page using window.location
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading profile: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No profile data available</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 backdrop-blur-sm border border-white/20 shadow-2xl mb-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">Profile Settings</h1>
                <p className="text-blue-100 text-lg">Manage your account and preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleEditToggle}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setShowLogoutDialog(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
              <div className="flex items-center text-blue-100 gap-3">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                  <Calendar className="h-4 w-4" />
                  Joined {profile.joinDate}
                </div>
              </div>
              {profile.location && (
                <div className="flex items-center text-blue-100 gap-2 bg-white/10 px-3 py-1 rounded-full w-fit">
                  <User className="h-4 w-4" />
                  {profile.location}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-blue-100">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                Profile Information
              </CardTitle>
              <CardDescription className="text-gray-600">Update your personal information and details</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing} 
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing} 
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
                <Input 
                  id="location" 
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!isEditing} 
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  placeholder="Enter your location"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
                <Input 
                  id="bio" 
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing} 
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  placeholder="Tell us about yourself"
                />
              </div>
              
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={handleSaveProfile} 
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleEditToggle}
                    className="border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Security Section */}
        <div className="lg:col-span-1">
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-xl bg-purple-100">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                Security
              </CardTitle>
              <CardDescription className="text-gray-600">Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {!isChangingPassword ? (
                <Button 
                  variant="outline" 
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full flex items-center gap-3 h-12 border-purple-200 hover:bg-purple-50 hover:border-purple-300 rounded-xl"
                >
                  <Lock className="h-4 w-4" />
                  Change Password
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">Current Password</Label>
                    <Input 
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</Label>
                    <Input 
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleChangePassword} 
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                    >
                      <Save className="h-4 w-4" />
                      Update Password
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md mx-4 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
              <CardTitle className="flex items-center gap-3 text-xl text-orange-600">
                <div className="p-2 rounded-xl bg-orange-100">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                Confirm Logout
              </CardTitle>
              <CardDescription className="text-gray-600">
                Are you sure you want to logout? You will need to login again to access your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowLogoutDialog(false)}
                  className="border-gray-200 hover:bg-gray-50 rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg rounded-xl"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;
