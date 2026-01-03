import { useState, useEffect } from 'react';

export const useDashboardData = () => {
  const [data, setData] = useState({
    quickStats: {
      monthlyProgress: 0,
      completedTasks: 0,
      activeGoals: 0
    },
    moduleStats: {
      earnings: {
        totalBalance: "$0",
        transactionCount: 0
      },
      challenges: {
        active: 0,
        completed: 0,
        total: 0
      },
      lifePlan: {
        goalsSet: 0,
        active: 0,
        completed: 0
      },
      study: {
        resources: 0,
        categories: 0
      },
      projects: {
        activeProjects: 0,
        totalTasks: 0
      }
    },
    slogans: [
      "One Life. One System. No Excuses.",
      "Designing My Life with Discipline, Not Luck.",
      "From Chaos to Control — One Day at a Time.",
      "Built for Growth. Run by Discipline.",
      "I Track. I Improve. I Win."
    ]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch dashboard stats
        const statsResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }

        const statsData = await statsResponse.json();

        // Fetch slogans
        const slogansResponse = await fetch('http://localhost:5000/api/dashboard/slogans', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        let slogansData = { data: { slogans: data.slogans } }; // fallback
        if (slogansResponse.ok) {
          slogansData = await slogansResponse.json();
        }

        setData({
          quickStats: statsData.data.quickStats,
          moduleStats: statsData.data.moduleStats,
          slogans: slogansData.data.slogans
        });

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const refetch = () => {
    setLoading(true);
    setError(null);
    // Trigger a refetch by creating a new effect dependency
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      .then(response => response.json())
      .then(statsData => {
        setData(prev => ({
          ...prev,
          quickStats: statsData.data.quickStats,
          moduleStats: statsData.data.moduleStats
        }));
      })
      .catch(err => {
        console.error('Refetch error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
    }
  };

  return { data, loading, error, refetch };
};
