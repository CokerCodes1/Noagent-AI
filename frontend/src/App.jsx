import { Suspense, lazy, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import InstallPrompt from "./components/shared/InstallPrompt.jsx";
import OnlineStatusBanner from "./components/shared/OnlineStatusBanner.jsx";
import WhatsAppFloatingButton from "./components/shared/WhatsAppFloatingButton.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import { PwaProvider, usePwa } from "./contexts/PwaContext.jsx";
import TestimonialsProvider from "./contexts/TestimonialsContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const Auth = lazy(() => import("./pages/Auth.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const LandlordDashboard = lazy(() => import("./pages/LandlordDashboard.jsx"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess.jsx"));
const RenterDashboard = lazy(() => import("./pages/RenterDashboard.jsx"));
const TechnicianDashboard = lazy(
  () => import("./pages/TechnicianDashboard.jsx"),
);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="route-transition-shell"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <Suspense
          fallback={
            <div className="app-fallback">Loading your workspace...</div>
          }
        >
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/renter/*"
              element={
                <ProtectedRoute roles={["renter"]}>
                  <RenterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/landlord/*"
              element={
                <ProtectedRoute roles={["landlord"]}>
                  <LandlordDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician/*"
              element={
                <ProtectedRoute roles={["technician"]}>
                  <TechnicianDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute roles={["renter", "admin"]}>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function AppFrame() {
  const { refreshApp, updateAvailable } = usePwa();

  useEffect(() => {
    if (!updateAvailable) {
      return;
    }

    toast.info(
      <div className="pwa-update-toast">
        <strong>App update ready</strong>
        <span>A newer NoAgentNaija build is available.</span>
        <button
          className="btn primary"
          type="button"
          onClick={() => refreshApp()}
        >
          Refresh now
        </button>
      </div>,
      {
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        position: "bottom-center",
        toastId: "pwa-update-ready",
      },
    );
  }, [refreshApp, updateAvailable]);

  return (
    <>
      <SiteHeader />
      <OnlineStatusBanner />
      <AnimatedRoutes />
      <InstallPrompt />
      <WhatsAppFloatingButton />
      <ToastContainer position="top-right" autoClose={3500} />
    </>
  );
}

export default function App() {
  return (
    <TestimonialsProvider>
      <BrowserRouter>
        <PwaProvider>
          <AppFrame />
        </PwaProvider>
      </BrowserRouter>
    </TestimonialsProvider>
  );
}
