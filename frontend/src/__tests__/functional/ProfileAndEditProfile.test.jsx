// Polyfill for ResizeObserver (if used by any responsive components)
global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  // Suppress console.log and window.alert output during tests.
  beforeAll(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    window.alert = vi.fn();
  });
  
  // Mock jwt-decode to provide a named export "jwtDecode"
  vi.mock("jwt-decode", () => ({
    jwtDecode: (token) => ({
      email: "test@example.com",
      username: "test@example.com",
    }),
  }));
  
  // Partially mock the API module so that its methods are mock functions.
  vi.mock("../../api", () => ({
    default: {
      get: vi.fn(),
      patch: vi.fn(),
    },
  }));
  import mockedApi from "../../api";
  
  // Dummy authentication state.
  const dummyAuthState = {
    user: { email: "test@example.com", username: "test@example.com" },
  };
  
  // Dummy profile data for testing Profile display.
  const dummyProfile = {
    age: 30,
    height: 170,
    weight: 70,
    dietary_preference: "non_vegetarian",
    health_conditions: "diabetes, hypertension",
  };
  
  import React from "react";
  import { render, screen, waitFor } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import Profile from "../../pages/Profile";
  import EditProfile from "../../pages/EditProfile";
  import { MemoryRouter, Routes, Route } from "react-router-dom";
  import { AuthContext } from "../../context/AuthContext";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  
  // ----------------------------------------------------------------
  // Profile Display tests.
  describe("Profile Display", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
  
    test("displays profile details when API returns data", async () => {
      // Simulate API returning dummy profile details.
      mockedApi.get.mockResolvedValueOnce({ data: dummyProfile });
  
      render(
        <AuthContext.Provider value={{ authState: dummyAuthState }}>
          <MemoryRouter>
            <Profile />
          </MemoryRouter>
        </AuthContext.Provider>
      );
  
      // Check for the loading indicator.
      expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  
      // Then, once loaded, confirm that "My Profile" is displayed.
      await waitFor(() => {
        expect(screen.getByText(/my profile/i)).toBeInTheDocument();
      });
  
      // Validate individual profile details.
      expect(screen.getByText("30")).toBeInTheDocument();
      expect(screen.getByText(/170 cm/i)).toBeInTheDocument();
      expect(screen.getByText(/70 kg/i)).toBeInTheDocument();
      expect(screen.getByText(/non_vegetarian/i)).toBeInTheDocument();
      expect(screen.getByText(/diabetes, hypertension/i)).toBeInTheDocument();
    });
  
    test("displays 'Profile Not Found' when API returns no data", async () => {
      mockedApi.get.mockResolvedValueOnce({ data: null });
  
      render(
        <AuthContext.Provider value={{ authState: dummyAuthState }}>
          <MemoryRouter>
            <Profile />
          </MemoryRouter>
        </AuthContext.Provider>
      );
  
      await waitFor(() => {
        expect(screen.getByText(/profile not found/i)).toBeInTheDocument();
        expect(screen.getByText(/please update your health profile/i)).toBeInTheDocument();
      });
    });
  });
  
  // ----------------------------------------------------------------
  // Profile Update (EditProfile) tests.
  describe("Profile Update (EditProfile)", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
  
    test("fetches current profile data and submits updated profile", async () => {
      // Create a QueryClient for react-query.
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
  
      // When EditProfile mounts, it calls GET to fetch profile.
      // Chain two responses: first for EditProfile then for Profile after navigation.
      mockedApi.get
        .mockResolvedValueOnce({ data: dummyProfile }) // For EditProfile
        .mockResolvedValueOnce({ data: dummyProfile }); // For Profile view
  
      // Render EditProfile inside a QueryClientProvider with routes.
      render(
        <AuthContext.Provider value={{ authState: dummyAuthState }}>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={["/edit-profile"]}>
              <Routes>
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        </AuthContext.Provider>
      );
  
      // Wait for the EditProfile view to load.
      await waitFor(() => {
        expect(screen.getByText(/edit profile/i)).toBeInTheDocument();
      });
  
      // Simulate changing dietary preference from "non_vegetarian" to "vegetarian".
      const selectElement = screen.getByRole("combobox");
      await userEvent.selectOptions(selectElement, "vegetarian");
  
      // Simulate toggling a health condition checkbox.
      // This test assumes that EditProfile renders a checkbox for "Hypertension".
      // If the checkbox is not rendered, you may need to adjust this part.
      const hypertensionCheckbox = screen.getByRole("checkbox", { name: /hypertension/i });
      if (!hypertensionCheckbox.checked) {
        await userEvent.click(hypertensionCheckbox);
      }
  
      // Click the "Save Changes" button.
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await userEvent.click(saveButton);
  
      // Verify that a PATCH request is made with the updated dietary preference.
      await waitFor(() => {
        expect(mockedApi.patch).toHaveBeenCalledWith(
          "/api/health-profile/detail/",
          expect.objectContaining({
            dietary_preference: "vegetarian",
          })
        );
      });
  
      // After saving, the EditProfile component calls navigate("/profile").
      // Now, verify that the Profile view loads.
      await waitFor(() => {
        // Use a flexible matcher in case "My Profile" text is split.
        expect(
          screen.getByText((content, element) =>
            element.tagName.toLowerCase() === "h2" && /my profile/i.test(content)
          )
        ).toBeInTheDocument();
      });
    });
  });
  