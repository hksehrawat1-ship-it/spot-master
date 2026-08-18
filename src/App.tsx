import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import PublicShell from "@/layouts/PublicShell";
import AppShell from "@/layouts/AppShell";
import Landing from "@/pages/Landing";
import Legal from "@/pages/Legal";
import Install from "@/pages/Install";
import Register from "@/pages/Register";
import Checkout from "@/pages/Checkout";
import Setup from "@/pages/Setup";
import Workspace from "@/pages/Workspace";
import Cases from "@/pages/Cases";
import StainRecord from "./pages/StainRecord";
import ProductLibrary from "./pages/ProductLibrary";
import TreatmentStages from "./pages/TreatmentStages";
import MappingMatrix from "./pages/MappingMatrix";
import KitComparison from "./pages/KitComparison";
import ComparisonAdmin from "./pages/ComparisonAdmin";
import MappingEditor from "./pages/MappingEditor";
import ProductDetail from "./pages/ProductDetail";
import ProductAdmin from "./pages/ProductAdmin";
import MasterStainAdmin from "./pages/MasterStainAdmin";
import StainMaster from "@/pages/StainMaster";
import RetailSpotting from "@/pages/RetailSpotting";
import ProfessionalSpotting from "@/pages/ProfessionalSpotting";
import MasterSpotter from "@/pages/MasterSpotter";
import StainIdentify from "@/pages/StainIdentify";
import StainIdentifyFlow from "@/pages/StainIdentifyFlow";
import StainIdAdmin from "@/pages/StainIdAdmin";
import TreatmentReadiness from "@/pages/TreatmentReadiness";
import ReadinessAdmin from "@/pages/ReadinessAdmin";
import StainCategories from "@/pages/StainCategories";
import StainClassify from "@/pages/StainClassify";
import ClassificationAdmin from "@/pages/ClassificationAdmin";
import SignIn from "@/pages/SignIn";
import Account from "@/pages/Account";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminOrganizations from "@/pages/admin/AdminOrganizations";
import AdminDocuments from "@/pages/admin/AdminDocuments";
import AdminTraining from "@/pages/admin/AdminTraining";
import AdminTranslations from "@/pages/admin/AdminTranslations";
import AdminCountries from "@/pages/admin/AdminCountries";
import AdminImportExport from "@/pages/admin/AdminImportExport";
import AdminAudit from "@/pages/admin/AdminAudit";
import AdminSystemHealth from "@/pages/admin/AdminSystemHealth";
import FoundationCheck from "@/pages/FoundationCheck";
import FabricCheck from "@/pages/FabricCheck";
import FabricCheckAdmin from "@/pages/FabricCheckAdmin";
import SafetyAdmin from "@/pages/SafetyAdmin";
import DomesticTreatmentPage from "@/pages/DomesticTreatment";
import DomesticAdmin from "@/pages/DomesticAdmin";
import TreatmentOutcome from "@/pages/TreatmentOutcome";
import OutcomeAnalytics from "@/pages/OutcomeAnalytics";
import OutcomeReview from "@/pages/OutcomeReview";
import GovernanceDashboard from "@/pages/GovernanceDashboard";
import GovernanceRecord from "@/pages/GovernanceRecord";
import AdminPilot from "@/pages/admin/AdminPilot";
import AdminScaling from "@/pages/admin/AdminScaling";

import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "@/auth/AuthProvider";
import ProtectedRoute, { RequireSignIn } from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          {/* Public website */}
          <Route element={<PublicShell />}>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/install" element={<Install />} />
            <Route path="/legal/:slug" element={<Legal />} />
            <Route element={<RequireSignIn />}>
              <Route path="/setup" element={<Setup />} />
              <Route path="/checkout" element={<Checkout />} />
            </Route>
          </Route>

          {/* Operational workspace */}
          <Route element={<AppShell />}>
            <Route element={<RequireSignIn />}>
              <Route path="/home" element={<Workspace />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/cases/new" element={<StainIdentifyFlow />} />
            </Route>



            {/* Every administration route passes through one protected gate. */}
            <Route element={<ProtectedRoute label="the administration area" />}>
              <Route path="/admin/products" element={<ProductAdmin />} />
              <Route path="/admin/mapping-matrix" element={<MappingMatrix />} />
              <Route path="/admin/mapping-editor" element={<MappingEditor />} />
              <Route path="/admin/stain-database" element={<MasterStainAdmin />} />
              <Route path="/admin/classification" element={<ClassificationAdmin />} />
              <Route path="/admin/fabric-check" element={<FabricCheckAdmin />} />
              <Route path="/admin/stain-id" element={<StainIdAdmin />} />
              <Route path="/admin/readiness" element={<ReadinessAdmin />} />
              <Route path="/admin/safety" element={<SafetyAdmin />} />
              <Route path="/admin/domestic" element={<DomesticAdmin />} />
              <Route path="/admin/comparison" element={<ComparisonAdmin />} />
              <Route path="/admin/outcome-analytics" element={<OutcomeAnalytics />} />
              <Route path="/admin/outcome-review" element={<OutcomeReview />} />
              <Route path="/admin/governance" element={<GovernanceDashboard />} />
              <Route path="/admin/governance/:stableId" element={<GovernanceRecord />} />
              <Route path="/admin/pilot" element={<AdminPilot />} />
              <Route path="/admin/scaling" element={<AdminScaling />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/organizations" element={<AdminOrganizations />} />
              <Route path="/admin/documents" element={<AdminDocuments />} />
              <Route path="/admin/training" element={<AdminTraining />} />
              <Route path="/admin/translations" element={<AdminTranslations />} />
              <Route path="/admin/countries" element={<AdminCountries />} />
              <Route path="/admin/import-export" element={<AdminImportExport />} />
              <Route path="/admin/audit" element={<AdminAudit />} />
              <Route path="/admin/system-health" element={<AdminSystemHealth />} />
              <Route path="/admin/foundation" element={<FoundationCheck />} />
            </Route>
            <Route path="/stain-master" element={<StainMaster />} />
            <Route path="/retail-spotting" element={<RetailSpotting />} />
            <Route path="/professional-spotting" element={<ProfessionalSpotting />} />
            <Route path="/master-spotter" element={<MasterSpotter />} />
            <Route path="/stain-master/identify" element={<StainIdentify />} />
            <Route path="/stain-id" element={<StainIdentifyFlow />} />
            <Route path="/treatment-readiness" element={<TreatmentReadiness />} />
            <Route path="/stain-categories" element={<StainCategories />} />
            <Route path="/stain-categories/:categoryKey" element={<StainCategories />} />
            <Route path="/classify" element={<StainClassify />} />
            <Route path="/products" element={<ProductLibrary />} />
            <Route path="/products/:productKey" element={<ProductDetail />} />
            <Route path="/treatment-stages" element={<TreatmentStages />} />
            <Route path="/treatment-stages/:stageNumber" element={<TreatmentStages />} />
            <Route path="/stain/:stainKey" element={<StainRecord />} />
            <Route path="/fabric-check" element={<FabricCheck />} />
            <Route element={<RequireSignIn />}>
              <Route path="/account" element={<Account />} />
            </Route>
            <Route path="/domestic-treatment" element={<DomesticTreatmentPage />} />
            <Route path="/kit-comparison" element={<KitComparison />} />
            <Route path="/treatment-outcome" element={<TreatmentOutcome />} />

          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
