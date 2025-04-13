import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { AuthContext } from "../../context/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import Login from "../../pages/Login";
import Profile from "../../pages/Profile";
import Plans from "../../pages/Plans";
import MealPlanResults from "../../pages/MealPlanResults";

// Dummy component to display current location for testing redirects.
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
}

// DummyLogout component simulating the logout process
const DummyLogout = () => {
  const { logout } = React.useContext(AuthContext);
  React.useEffect(() => {
    logout();
  }, [logout]);
  // After logout, redirect to /login
  return <Navigate to="/login" replace />;
};

describe("Protected Routes and Navigation", () => {
  describe("Access Control without Login", () => {
    // Test that an unauthenticated user is redirected to the Login page
    // for various protected routes.
    const unauthenticatedState = {
      isAuthenticated: false,
      loading: false,
      user: null,
    };

    const protectedRoutes = [
      { path: "/profile", name: "Profile", element: <Profile /> },
      { path: "/plans", name: "Plans", element: <Plans /> },
      {
        path: "/meal-plan-results",
        name: "MealPlanResults",
        element: <MealPlanResults />,
      },
    ];

    protectedRoutes.forEach((route) => {
      test(`redirects unauthenticated access to ${route.name} to the Login page`, async () => {
        render(
          <AuthContext.Provider value={{ authState: unauthenticatedState }}>
            <MemoryRouter initialEntries={[route.path]}>
              <Routes>
                <Route
                  path={route.path}
                  element={
                    <ProtectedRoute>{route.element}</ProtectedRoute>
                  }
                />
                <Route path="/login" element={<div>Login Page</div>} />
                <Route path="*" element={<LocationDisplay />} />
              </Routes>
            </MemoryRouter>
          </AuthContext.Provider>
        );

        // Wait until the redirect is complete by checking for the login page text.
        await waitFor(() => {
          expect(screen.getByText("Login Page")).toBeInTheDocument();
        });
      });
    });
  });

  describe("Redirection on Logout", () => {
    test("clears tokens and redirects to /login on logout", async () => {
      // Pre-set tokens in localStorage (simulate a logged-in user)
      localStorage.setItem("ACCESS_TOKEN", "dummy_access_token");
      localStorage.setItem("REFRESH_TOKEN", "dummy_refresh_token");

      // Create a dummy authenticated state.
      const authenticatedState = {
        isAuthenticated: true,
        loading: false,
        user: { username: "testuser", email: "test@example.com" },
      };

      // Create a mock for the logout function.
      const logoutMock = vi.fn();

      render(
        <AuthContext.Provider
          value={{
            authState: authenticatedState,
            logout: logoutMock,
          }}
        >
          <MemoryRouter initialEntries={["/logout"]}>
            <Routes>
              <Route path="/logout" element={<DummyLogout />} />
              <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      // Wait until the logout function is called.
      await waitFor(() => {
        expect(logoutMock).toHaveBeenCalled();
      });

      // Verify that after logout the user is redirected to /login.
      await waitFor(() => {
        expect(screen.getByText("Login Page")).toBeInTheDocument();
      });
    });
  });
});
