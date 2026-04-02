import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Auth from "./pages/Auth.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import LandlordDashboard from "./pages/LandlordDashboard.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import RenterDashboard from "./pages/RenterDashboard.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route
          path="/renter"
          element={
            <ProtectedRoute roles={["renter"]}>
              <RenterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/landlord"
          element={
            <ProtectedRoute roles={["landlord"]}>
              <LandlordDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
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

      <ToastContainer position="top-right" autoClose={3500} />
    </BrowserRouter>
  );
}
