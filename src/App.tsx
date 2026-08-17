import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import MobileShell from "@/layouts/MobileShell";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import LessonPlayer from "@/pages/LessonPlayer";
import StainMaster from "@/pages/StainMaster";
import StainIdentify from "@/pages/StainIdentify";
import Certificate from "@/pages/Certificate";
import SignIn from "@/pages/SignIn";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import FoundationCheck from "@/pages/FoundationCheck";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route element={<MobileShell />}>
            <Route path="/" element={<Navigate to="/stain-master" replace />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />
            <Route path="/courses/:slug/lesson/:lessonId" element={<LessonPlayer />} />
            <Route path="/courses/:slug/certificate" element={<Certificate />} />
            <Route path="/stain-master" element={<StainMaster />} />
            <Route path="/stain-master/identify" element={<StainIdentify />} />
            <Route path="/account" element={<Account />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
