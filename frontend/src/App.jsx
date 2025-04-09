import React, { useContext, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import MultiStepRegistration from "./pages/MultiStepRegistration";
import NotFound from "./pages/NotFound";
import Plans from "./pages/Plans";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Exercises from "./pages/Exercises";
import ScrollToTop from "./components/ScrollToTop";
import "animate.css";
import Recommendations from "./pages/Recommendations";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import MealPlanResults from "./pages/MealPlanResults";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";

// Simple logout component that calls the logout function and then redirects to login.
function Logout() {
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    logout();
  }, [logout]);

  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { authState } = useContext(AuthContext);
  const location = useLocation();

  // Wait for the authState to load.
  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // If the user is not authenticated and trying to access admin-dashboard, redirect to /login.
  if (!authState.isAuthenticated && location.pathname === "/admin-dashboard") {
    return <Navigate to="/login" replace />;
  }

  // If logged-in user is an admin, force them to use admin routes.
  if (authState.isAuthenticated && authState.user?.is_staff) {
    return (
      <Routes>
        <Route
          path="/admin-dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        {/* Allow admin to logout */}
        <Route path="/logout" element={<Logout />} />
        {/* Any other route redirects to the admin dashboard */}
        <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
      </Routes>
    );
  }

  // Otherwise, render normal user routes.
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/register" element={<MultiStepRegistration />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <Plans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises"
        element={
          <ProtectedRoute>
            <Exercises />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recommendations"
        element={
          <ProtectedRoute>
            <Recommendations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meal-plan-results"
        element={
          <ProtectedRoute>
            <MealPlanResults />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
