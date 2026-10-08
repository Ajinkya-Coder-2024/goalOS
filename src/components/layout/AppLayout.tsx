import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
          <header className="h-16 flex items-center justify-between px-6 border-b bg-card min-w-0 flex-shrink-0 z-50 backdrop-blur-sm bg-card/95">
            <div className="flex items-center gap-4 min-w-0">
              <SidebarTrigger className="ml-2 flex-shrink-0">
                <Menu className="h-4 w-4" />
              </SidebarTrigger>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex-shrink-0">
                GoalOS
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDark(!dark)}
                className="hover:bg-accent hover:text-accent-foreground flex-shrink-0"
                aria-label="Toggle night mode"
              >
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/profile')}
                className="hover:bg-accent hover:text-accent-foreground flex-shrink-0"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden min-w-0 w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}