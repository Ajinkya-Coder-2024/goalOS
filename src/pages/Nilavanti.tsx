import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Rocket, Calendar, Target, Code, Cpu, Brain, Database, Zap, Shield, Users, Globe, Code2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNilavantiAuth } from "@/contexts/NilavantiAuthContext";
import { useEffect } from "react";
import { NilavantiLoginForm } from "@/components/NilavantiLoginForm";
import { Loader2 } from "lucide-react";

const Nilavanti = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useNilavantiAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return <NilavantiLoginForm />;
  }
  
  const project = {
    id: "1",
    name: "Nilavanti",
    tagline: "AI-Powered Personal Assistant",
    description: "Revolutionary AI-powered personal assistant that learns and adapts to user preferences, providing intelligent automation for daily tasks and decision-making processes.",
    status: "development" as const,
    startDate: new Date("2024-01-15"),
    expectedCompletion: new Date("2024-12-31"),
    progress: 45,
    technologies: ["React", "Node.js", "Python", "TensorFlow", "MongoDB", "Docker", "GraphQL", "TypeScript"],
    team: [
      { name: "Sarah Chen", role: "AI/ML Engineer" },
      { name: "Alex Rodriguez", role: "Frontend Developer" },
      { name: "Priya Patel", role: "Backend Developer" },
      { name: "James Wilson", role: "DevOps Engineer" },
    ],
    objectives: [
      { id: 1, title: "Core AI Learning Algorithms", status: "in-progress", progress: 60 },
      { id: 2, title: "User Interface Development", status: "in-progress", progress: 75 },
      { id: 3, title: "Voice Recognition System", status: "not-started", progress: 0 },
      { id: 4, title: "Task Automation Engine", status: "in-progress", progress: 30 },
      { id: 5, title: "Beta Testing Platform", status: "not-started", progress: 0 },
    ],
    features: [
      { 
        title: "Adaptive Learning", 
        description: "Continuously learns from user interactions to provide personalized experiences",
        icon: Brain 
      },
      { 
        title: "Multi-Platform", 
        description: "Available across web, mobile, and desktop platforms",
        icon: Globe 
      },
      { 
        title: "Privacy First", 
        description: "End-to-end encryption and local processing for sensitive data",
        icon: Shield 
      },
      { 
        title: "Smart Automation", 
        description: "Automates repetitive tasks and workflows intelligently",
        icon: Zap 
      },
    ]
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "in-progress": { text: "In Progress", color: "bg-blue-100 text-blue-800" },
      "completed": { text: "Completed", color: "bg-green-100 text-green-800" },
      "not-started": { text: "Planned", color: "bg-gray-100 text-gray-800" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["not-started"];
    return <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>{config.text}</span>;
  };

  return (
    <div className="container mx-auto px-4 pt-2 pb-8">

      {/* Project Header */}
      <div className="space-y-2 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-xl text-muted-foreground">{project.tagline}</p>
        <p className="text-muted-foreground">{project.description}</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Project Progress</span>
          <span className="text-sm text-muted-foreground">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Started: {project.startDate.toLocaleDateString()}</span>
          <span>Target: {project.expectedCompletion.toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Project Objectives
              </CardTitle>
              <CardDescription>Key milestones and their current status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.objectives.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{item.title}</h4>
                    {getStatusBadge(item.status)}
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Key Features
              </CardTitle>
              <CardDescription>Core capabilities of the {project.name} platform</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h4 className="font-medium">{feature.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>Meet the people behind {project.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.team.map((member, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-medium text-primary">{member.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Technologies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Technologies
              </CardTitle>
              <CardDescription>Tech stack powering {project.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tech === "React" && <Code className="h-3 w-3" />}
                    {tech === "Node.js" && <Code className="h-3 w-3" />}
                    {tech === "Python" && <Code className="h-3 w-3" />}
                    {tech === "TensorFlow" && <Brain className="h-3 w-3" />}
                    {tech === "MongoDB" && <Database className="h-3 w-3" />}
                    {tech === "Docker" && <Cpu className="h-3 w-3" />}
                    {tech === "GraphQL" && <Code className="h-3 w-3" />}
                    {tech === "TypeScript" && <Code className="h-3 w-3" />}
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
              <CardDescription>Project milestones and deadlines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <div className="absolute left-3 top-0 h-full w-0.5 bg-border -translate-x-1/2" />
                <div className="space-y-6">
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-primary -translate-x-1/2" />
                    <h4 className="font-medium">Project Kickoff</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.startDate.toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-blue-500 -translate-x-1/2" />
                    <h4 className="font-medium">Current Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.progress}% completed
                    </p>
                  </div>
                  
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-0 h-3 w-3 rounded-full bg-muted-foreground -translate-x-1/2" />
                    <h4 className="font-medium">Expected Completion</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.expectedCompletion.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Nilavanti;
