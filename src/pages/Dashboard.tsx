import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  DollarSign,
  Target,
  Calendar,
  BookOpen,
  Rocket,
  TrendingUp,
  CheckCircle,
  Users,
  Quote
} from "lucide-react";
import heroImage from "@/assets/goalos-hero.jpg";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const { data: dashboardData, loading, error } = useDashboardData();

  useEffect(() => {
    if (dashboardData.slogans.length > 0) {
      const interval = setInterval(() => {
        setCurrentSloganIndex((prevIndex) => (prevIndex + 1) % dashboardData.slogans.length);
      }, 4000); // Change slogan every 4 seconds

      return () => clearInterval(interval);
    }
  }, [dashboardData.slogans.length]);

  const modules = [
    {
      title: "Earnings & Expenses",
      description: "Track your financial progress with detailed income and expense monitoring",
      icon: DollarSign,
      href: "/finances",
      color: "earnings" as const,
      stats: { label: "Total Balance", value: `$${dashboardData.moduleStats.earnings.totalBalance}` }
    },
    {
      title: "Challenges",
      description: "Create and manage personal development challenges with progress tracking",
      icon: Target,
      href: "/challenges",
      color: "challenge" as const,
      stats: { label: "Active Challenges", value: dashboardData.moduleStats.challenges.active.toString() }
    },
    {
      title: "Life Plan",
      description: "Visualize your life goals on an interactive timeline",
      icon: Calendar,
      href: "/life-plan",
      color: "life-plan" as const,
      stats: { label: "Goals Set", value: dashboardData.moduleStats.lifePlan.goalsSet.toString() }
    },
    {
      title: "Study Material",
      description: "Organize your learning resources and educational content",
      icon: BookOpen,
      href: "/study",
      color: "study" as const,
      stats: { label: "Resources", value: dashboardData.moduleStats.study.resources.toString() }
    }
  ];

  const cardBg: Record<string, string> = {
    "earnings": "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200/50 dark:border-green-800/30",
    "challenge": "from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200/50 dark:border-purple-800/30",
    "life-plan": "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200/50 dark:border-orange-800/30",
    "study": "from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border-teal-200/50 dark:border-teal-800/30",
  };

  const iconBg: Record<string, string> = {
    "earnings": "bg-green-500/10",
    "challenge": "bg-purple-500/10",
    "life-plan": "bg-orange-500/10",
    "study": "bg-teal-500/10",
  };

  const iconColor: Record<string, string> = {
    "earnings": "text-green-600 dark:text-green-400",
    "challenge": "text-purple-600 dark:text-purple-400",
    "life-plan": "text-orange-600 dark:text-orange-400",
    "study": "text-teal-600 dark:text-teal-400",
  };

  const glowBg: Record<string, string> = {
    "earnings": "from-green-400/20 dark:from-green-400/10",
    "challenge": "from-purple-400/20 dark:from-purple-400/10",
    "life-plan": "from-orange-400/20 dark:from-orange-400/10",
    "study": "from-teal-400/20 dark:from-teal-400/10",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading dashboard: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl">
        <div 
          className="h-80 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-emerald-600/90 dark:from-blue-950/95 dark:to-emerald-950/95" />
          <div className="relative h-full flex items-center justify-center text-center p-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Welcome to GoalOS
                </h1>
                <p className="text-xl text-white/90 max-w-2xl">
                  Your comprehensive personal development management system. Track finances, challenges, goals, and projects all in one place.
                </p>
              </div>
              
              {/* Motivational Slogans */}
              <div className="p-4">
                <div className="min-h-[40px] flex items-center justify-center">
                  <p className="text-lg md:text-xl font-semibold text-white transition-all duration-1000 ease-in-out">
                    {dashboardData.slogans[currentSloganIndex]}
                  </p>
                </div>
                <div className="flex justify-center space-x-1 mt-2">
                  {dashboardData.slogans.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSloganIndex(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        index === currentSloganIndex 
                          ? 'bg-green-300 w-4' 
                          : 'bg-green-400/50 hover:bg-green-400'
                      }`}
                      aria-label={`Go to slogan ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/30 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent dark:from-blue-400/10 blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 px-2 py-1 rounded-full">
                Progress
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">{dashboardData.quickStats.monthlyProgress}%</p>
              <p className="text-sm text-muted-foreground">Monthly Progress</p>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/30 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-green-400/20 to-transparent dark:from-green-400/10 blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/50 px-2 py-1 rounded-full">
                Done
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">{dashboardData.quickStats.completedTasks}</p>
              <p className="text-sm text-muted-foreground">Completed Tasks</p>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200/50 dark:border-purple-800/30 p-6 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-gradient-to-br from-purple-400/20 to-transparent dark:from-purple-400/10 blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/50 px-2 py-1 rounded-full">
                Active
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">{dashboardData.quickStats.activeGoals}</p>
              <p className="text-sm text-muted-foreground">Active Goals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Development Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <div key={module.title} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${cardBg[module.color]} hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col`}>
                <div className={`absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-gradient-to-br ${glowBg[module.color]} to-transparent blur-2xl group-hover:scale-110 transition-transform duration-500`}></div>
                <CardHeader className="pb-4 flex-1 relative z-10">
                  <div className="flex items-center mb-4">
                    <div className={`w-14 h-14 rounded-xl ${iconBg[module.color]} flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                      <IconComponent className={`h-7 w-7 ${iconColor[module.color]}`} />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed mt-2">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 mt-auto relative z-10">
                  <NavLink 
                    to={module.href} 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/25 h-11 px-6 w-full group-hover:scale-[1.02] transform"
                  >
                    Open Module
                  </NavLink>
                </CardContent>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;