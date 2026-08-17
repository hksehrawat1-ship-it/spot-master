import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import MobileShell from "@/layouts/MobileShell";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import LessonPlayer from "@/pages/LessonPlayer";
import StainRecord from "./pages/StainRecord";
import ProductLibrary from "./pages/ProductLibrary";
import TreatmentStages from "./pages/TreatmentStages";
import MappingMatrix from "./pages/MappingMatrix";
import MappingEditor from "./pages/MappingEditor";
import ProductDetail from "./pages/ProductDetail";
import ProductAdmin from "./pages/ProductAdmin";
import MasterStainAdmin from "./pages/MasterStainAdmin";
import StainMaster from "@/pages/StainMaster";
import StainIdentify from "@/pages/StainIdentify";
import StainIdentifyFlow from "@/pages/StainIdentifyFlow";
import StainIdAdmin from "@/pages/StainIdAdmin";
import TreatmentReadiness from "@/pages/TreatmentReadiness";
import ReadinessAdmin from "@/pages/ReadinessAdmin";
import StainCategories from "@/pages/StainCategories";
import StainClassify from "@/pages/StainClassify";
import ClassificationAdmin from "@/pages/ClassificationAdmin";
import Certificate from "@/pages/Certificate";
import SignIn from "@/pages/SignIn";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import FoundationCheck from "@/pages/FoundationCheck";
import FabricCheck from "@/pages/FabricCheck";
import FabricCheckAdmin from "@/pages/FabricCheckAdmin";
import SafetyAdmin from "@/pages/SafetyAdmin";

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
            <Route path="/stain-id" element={<StainIdentifyFlow />} />
            <Route path="/treatment-readiness" element={<TreatmentReadiness />} />
            <Route path="/stain-categories" element={<StainCategories />} />
            <Route path="/stain-categories/:categoryKey" element={<StainCategories />} />
            <Route path="/classify" element={<StainClassify />} />
            <Route path="/products" element={<ProductLibrary />} />
            <Route path="/products/:productKey" element={<ProductDetail />} />
            <Route path="/admin/products" element={<ProductAdmin />} />
            <Route path="/treatment-stages" element={<TreatmentStages />} />
            <Route path="/treatment-stages/:stageNumber" element={<TreatmentStages />} />
            <Route path="/admin/mapping-matrix" element={<MappingMatrix />} />
            <Route path="/admin/mapping-editor" element={<MappingEditor />} />
            <Route path="/stain/:stainKey" element={<StainRecord />} />
            <Route path="/admin/stain-database" element={<MasterStainAdmin />} />
            <Route path="/admin/classification" element={<ClassificationAdmin />} />
            <Route path="/fabric-check" element={<FabricCheck />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin/fabric-check" element={<FabricCheckAdmin />} />
            <Route path="/admin/stain-id" element={<StainIdAdmin />} />
            <Route path="/admin/readiness" element={<ReadinessAdmin />} />
            <Route path="/admin/safety" element={<SafetyAdmin />} />
            <Route path="/sign-in" element={<SignIn />} />

            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/foundation" element={<FoundationCheck />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
