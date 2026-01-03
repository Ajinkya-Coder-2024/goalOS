import { useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  stats: {
    challengesCompleted: number;
    studyHours: number;
    totalSavings: number;
    goalsAchieved: number;
    currentStreak: number;
    totalPoints: number;
  };
  achievements: {
    id: number;
    name: string;
    icon: string;
    unlocked: boolean;
  }[];
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    darkMode: boolean;
    language: string;
  };
}

export const useProfileData = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user info from localStorage
  const getCurrentUser = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    return null;
  };

  // Get default profile data from localStorage or use defaults
  const getDefaultProfile = (): UserProfile => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      return JSON.parse(storedProfile);
    }

    // Get user info from auth system or create default
    const currentUser = getCurrentUser();
    return {
      id: currentUser?.id || currentUser?._id || '1',
      name: currentUser?.username || currentUser?.name || 'John Doe',
      email: currentUser?.email || 'john.doe@example.com',
      joinDate: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2024',
      avatar: '',
      bio: 'Passionate about personal development and continuous learning. Always striving to become a better version of myself.',
      location: 'San Francisco, CA',
      website: 'https://johndoe.dev',
      stats: {
        challengesCompleted: 0,
        studyHours: 0,
        totalSavings: 0,
        goalsAchieved: 0,
        currentStreak: 0,
        totalPoints: 0
      },
      achievements: [
        { id: 1, name: 'First Challenge Completed', icon: '🎯', unlocked: false },
        { id: 2, name: 'Week Warrior', icon: '⚔️', unlocked: false },
        { id: 3, name: 'Saver Pro', icon: '💰', unlocked: false },
        { id: 4, name: 'Goal Getter', icon: '🎯', unlocked: false },
        { id: 5, name: 'Study Master', icon: '📚', unlocked: false },
        { id: 6, name: 'Challenge Champion', icon: '🏆', unlocked: false }
      ],
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        darkMode: false,
        language: 'en'
      }
    };
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Try to fetch from API first
        try {
          const response = await fetch('http://localhost:5000/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            setProfile(data.data);
            localStorage.setItem('userProfile', JSON.stringify(data.data));
            return;
          }
        } catch (apiError) {
          console.log('Profile API not available, using fallback');
        }

        // Fallback: Create profile from current user data
        const currentUser = getCurrentUser();
        if (currentUser) {
          const defaultProfile = getDefaultProfile();
          
          // Try to get some stats from dashboard
          try {
            const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            });

            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              const stats = statsData.data;
              
              // Update profile with real stats
              defaultProfile.stats = {
                challengesCompleted: stats.moduleStats?.challenges?.completed || 0,
                studyHours: Math.floor(Math.random() * 100) + 20, // Mock for now
                totalSavings: parseInt(stats.moduleStats?.earnings?.totalBalance?.replace('$', '') || '0'),
                goalsAchieved: stats.moduleStats?.lifePlan?.goalsSet || 0,
                currentStreak: Math.floor(Math.random() * 14) + 1, // Mock for now
                totalPoints: (stats.moduleStats?.challenges?.completed || 0) * 100 + (stats.moduleStats?.lifePlan?.goalsSet || 0) * 50
              };
            }
          } catch (statsError) {
            console.log('Stats API not available, using default stats');
          }

          setProfile(defaultProfile);
          localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
        } else {
          throw new Error('No user data available');
        }

      } catch (err) {
        console.error('Profile data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
        
        // Still set default profile on error
        const defaultProfile = getDefaultProfile();
        setProfile(defaultProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    try {
      const token = localStorage.getItem('token');
      const updatedProfile = { ...profile, ...updates };

      // Try to update via API
      try {
        const response = await fetch('http://localhost:5000/api/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data.data);
          localStorage.setItem('userProfile', JSON.stringify(data.data));
          return true;
        }
      } catch (apiError) {
        console.log('API update not available, updating locally');
      }

      // Fallback to local update
      setProfile(updatedProfile);
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      return true;

    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    }
  };

  const updatePreferences = async (preferences: Partial<UserProfile['preferences']>) => {
    return updateProfile({ preferences: { ...profile?.preferences, ...preferences } });
  };

  const refetch = () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      .then(response => response.json())
      .then(data => {
        setProfile(data.data);
        localStorage.setItem('userProfile', JSON.stringify(data.data));
      })
      .catch(err => {
        console.error('Refetch error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
    }
  };

  return { profile, loading, error, updateProfile, updatePreferences, refetch };
};
