import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { NilavantiAuthProvider } from "@/contexts/NilavantiAuthContext";
import Dashboard from "./pages/Dashboard";
import Finances from "./pages/Finances";
import Challenges from "./pages/Challenges";
import ChallengeDetails from "./pages/ChallengeDetails";
import LifePlan from "./pages/LifePlan.new";
import FestiveBucketList from "./pages/FestiveBucketList";
import Study from "./pages/Study";
import BranchDetails from "./pages/BranchDetails";
import Nilavanti from "./pages/Nilavanti";
import Diary from "./pages/Diary";
import { DiaryBookView } from "./pages/DiaryBookView";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import EditTransaction from "./pages/EditTransaction";
import EditChallenge from "./pages/EditChallenge";
import TimeTable from "./pages/TimeTable";
import EditTimeSlot from "./pages/EditTimeSlot";
import { NilavantiAuthFlow } from "@/components/NilavantiAuthFlow";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

// Layout wrapper component that includes AppLayout
const LayoutWithAppLayout = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

const App = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NilavantiAuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route element={
              <ProtectedRoute>
                <LayoutWithAppLayout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/finances" element={<Finances />} />
              <Route path="/transactions/:id/edit" element={<EditTransaction />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/challenges/:challengeId" element={<ChallengeDetails />} />
              <Route path="/challenges/:challengeId/edit" element={<EditChallenge />} />
              <Route path="/life-plan" element={<LifePlan />} />
              <Route path="/festive-bucket-list" element={<FestiveBucketList />} />
              <Route path="/study" element={<Study />} />
              <Route path="/study/branches/:id" element={<BranchDetails />} />
              <Route path="/projects/nilavanti" element={<NilavantiAuthFlow />} />
              <Route path="/projects/nilavanti/main" element={<Nilavanti />} />
              <Route path="/projects" element={<Navigate to="/projects/nilavanti" replace />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/diary/book" element={<DiaryBookView />} />
              <Route path="/timetable" element={<TimeTable />} />
              <Route path="/timetable/edit/:id" element={<EditTimeSlot />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </NilavantiAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
