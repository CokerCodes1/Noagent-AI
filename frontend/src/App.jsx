import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ToastContainer } from "react-toastify";
import Auth from "./pages/Auth.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import LandlordDashboard from "./pages/LandlordDashboard.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import RenterDashboard from "./pages/RenterDashboard.jsx";
import TechnicianDashboard from "./pages/TechnicianDashboard.jsx";
import WhatsAppFloatingButton from "./components/shared/WhatsAppFloatingButton.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));

export default function App() {
  return (
    <BrowserRouter>
      <SiteHeader />
      <Suspense fallback={<div className="app-fallback">Loading...</div>}>
        <Routes>
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

      <WhatsAppFloatingButton />
      <ToastContainer position="top-right" autoClose={3500} />
    </BrowserRouter>
  );
}
