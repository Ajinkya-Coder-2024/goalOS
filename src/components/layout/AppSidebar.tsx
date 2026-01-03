import React from 'react';
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DollarSign,
  Target,
  Calendar,
  BookOpen,
  Rocket,
  Home,
  BookMarked,
  LogOut,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  User,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  subItems?: {
    title: string;
    url: string;
  }[];
}

const navigationItems: NavigationItem[] = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Earnings & Expenses", url: "/finances", icon: DollarSign },
  { title: "Challenges", url: "/challenges", icon: Target },
  { title: "Life Plan", url: "/life-plan", icon: Calendar },
  { title: "Study Material", url: "/study", icon: BookOpen },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get current user info
  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const currentUser = getCurrentUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };
  
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (title: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const getNavClassName = (path: string, isSubItem = false) => {
    const active = isActive(path);
    const baseClass = active 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
    
    return cn(
      "flex items-center h-12 rounded-md w-full text-left transition-colors",
      isSubItem ? 'pl-12 pr-3' : 'px-3',
      baseClass
    );
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r">
        <div className="p-6">
          <div className={`text-center ${collapsed ? 'hidden' : 'block'}`}>
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl mx-auto mb-3 flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h2 className="font-bold text-lg">GoalOS</h2>
            <p className="text-sm text-muted-foreground">Personal Development</p>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className={`px-6 text-xs font-medium uppercase tracking-wider text-muted-foreground ${collapsed ? 'hidden' : 'block'}`}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-3">
              {navigationItems.map((item) => (
                <React.Fragment key={item.title}>
                  <SidebarMenuItem>
                    {item.subItems ? (
                      <div>
                        <button
                          onClick={() => toggleSubmenu(item.title)}
                          className={cn(
                            "flex items-center justify-between w-full px-3 h-12 rounded-md",
                            isActive(item.url) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          )}
                        >
                          <div className="flex items-center">
                            <item.icon className="h-5 w-5 shrink-0" />
                            <span className={`ml-3 ${collapsed ? 'hidden' : 'block'}`}>
                              {item.title}
                            </span>
                          </div>
                          {!collapsed && (
                            <span className="ml-2">
                              {expandedItems[item.title] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </button>
                        {!collapsed && expandedItems[item.title] && (
                          <div className="mt-1 space-y-1">
                            {item.subItems.map((subItem) => (
                              <NavLink
                                key={subItem.title}
                                to={subItem.url}
                                className={getNavClassName(subItem.url, true)}
                              >
                                <span>{subItem.title}</span>
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <NavLink 
                        to={item.url}
                        className={getNavClassName(item.url)}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className={`ml-3 ${collapsed ? 'hidden' : 'block'}`}>
                          {item.title}
                        </span>
                      </NavLink>
                    )}
                  </SidebarMenuItem>
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mt-auto p-4 border-t relative">
          {!collapsed ? (
            <div className="relative">
              <Button 
                variant="ghost" 
                className="w-full justify-between h-12 hover:bg-accent hover:text-accent-foreground"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 shrink-0" />
                  <span className="ml-3 truncate">
                    {currentUser?.username || currentUser?.name || 'User'}
                  </span>
                </div>
                <MoreVertical className="h-4 w-4 shrink-0" />
              </Button>
              
              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-md shadow-lg z-50">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-md flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-md flex items-center gap-2 text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button 
              variant="ghost" 
              className="w-full justify-center h-12 hover:bg-accent hover:text-accent-foreground"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <User className="h-5 w-5" />
            </Button>
          )}
          
          {/* Collapsed dropdown menu */}
          {collapsed && showUserMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-background border rounded-md shadow-lg z-50">
              <div className="p-2 min-w-[150px]">
                <div className="px-3 py-2 text-sm font-medium border-b mb-2">
                  {currentUser?.username || currentUser?.name || 'User'}
                </div>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-md flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 rounded-md flex items-center gap-2 text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}