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
      color: "earnings",
      stats: { label: "Total Balance", value: `$${dashboardData.moduleStats.earnings.totalBalance}` }
    },
    {
      title: "Challenges",
      description: "Create and manage personal development challenges with progress tracking",
      icon: Target,
      href: "/challenges",
      color: "challenge",
      stats: { label: "Active Challenges", value: dashboardData.moduleStats.challenges.active.toString() }
    },
    {
      title: "Life Plan",
      description: "Visualize your life goals on an interactive timeline",
      icon: Calendar,
      href: "/life-plan",
      color: "life-plan",
      stats: { label: "Goals Set", value: dashboardData.moduleStats.lifePlan.goalsSet.toString() }
    },
    {
      title: "Study Material",
      description: "Organize your learning resources and educational content",
      icon: BookOpen,
      href: "/study",
      color: "study",
      stats: { label: "Resources", value: dashboardData.moduleStats.study.resources.toString() }
    }
  ];

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
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/90" />
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Progress</p>
                <p className="text-3xl font-bold text-primary">{dashboardData.quickStats.monthlyProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
                <p className="text-3xl font-bold text-accent">{dashboardData.quickStats.completedTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                <p className="text-3xl font-bold text-challenge">{dashboardData.quickStats.activeGoals}</p>
              </div>
              <Users className="h-8 w-8 text-challenge" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Development Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Card key={module.title} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-card to-card/80 flex flex-col">
                <CardHeader className="pb-4 flex-1">
                  <div className="flex items-center mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${module.color}/20 to-${module.color}/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                      <IconComponent className={`h-7 w-7 text-${module.color}`} />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed mt-2">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 mt-auto">
                  <NavLink 
                    to={module.href} 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/25 h-11 px-6 w-full group-hover:scale-[1.02] transform"
                  >
                    Open Module
                  </NavLink>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;