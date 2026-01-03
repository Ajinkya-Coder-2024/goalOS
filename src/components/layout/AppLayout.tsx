import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Menu, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between px-6 border-b bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="ml-2">
                <Menu className="h-4 w-4" />
              </SidebarTrigger>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                GoalOS
              </h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/profile')}
              className="hover:bg-accent hover:text-accent-foreground"
            >
              <User className="h-5 w-5" />
            </Button>
          </header>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}