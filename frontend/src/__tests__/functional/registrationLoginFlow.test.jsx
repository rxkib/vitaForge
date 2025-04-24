// Polyfill for ResizeObserver (needed by chart components)
global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  // IMPORTANT: Set up mocks BEFORE any other imports
  
  // Suppress console.log output during tests.
  beforeAll(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  
  // Mock jwt-decode to provide a named export "jwtDecode" that returns dummy user data.
  vi.mock("jwt-decode", () => ({
    jwtDecode: (token) => ({
      email: "test@example.com",
      username: "test@example.com",
    }),
  }));
  
  // Mock the API module so that its "post" and "get" methods are mock functions.
  vi.mock("../../api", () => ({
    default: {
      post: vi.fn(),
      get: vi.fn(),
    },
  }));
  
  // Stub out the registration subcomponents with minimal implementations.
  vi.mock("../../components/registration/BasicInfo", () => ({
    default: ({ formData, updateFormData, nextStep }) => (
      <div data-testid="basic-info">
        <input
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
        />
        <input
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => updateFormData({ password: e.target.value })}
        />
        <button onClick={nextStep}>Next</button>
      </div>
    ),
  }));
  
  vi.mock("../../components/registration/PersonalDetails", () => ({
    default: ({ formData, updateFormData, nextStep, prevStep }) => (
      <div data-testid="personal-details">
        <input
          placeholder="Enter your age"
          value={formData.age}
          onChange={(e) => updateFormData({ age: e.target.value })}
        />
        <input
          placeholder="Enter your height in cm"
          value={formData.height}
          onChange={(e) => updateFormData({ height: e.target.value })}
        />
        <input
          placeholder="Enter your weight in kg"
          value={formData.weight}
          onChange={(e) => updateFormData({ weight: e.target.value })}
        />
        <button onClick={prevStep}>Back</button>
        <button onClick={nextStep}>Next</button>
      </div>
    ),
  }));
  
  vi.mock("../../components/registration/DietaryPreference", () => ({
    default: ({ formData, updateFormData, nextStep, prevStep }) => (
      <div data-testid="dietary-preference">
        <h2>Dietary Preference</h2>
        <select
          role="combobox"
          value={formData.dietaryPreference}
          onChange={(e) =>
            updateFormData({ dietaryPreference: e.target.value })
          }
        >
          <option value="">Select...</option>
          <option value="non_vegetarian">Non-Vegetarian</option>
        </select>
        <button onClick={prevStep}>Back</button>
        <button onClick={nextStep}>Next</button>
      </div>
    ),
  }));
  
  vi.mock("../../components/registration/HealthConditions", () => ({
    default: ({ formData, updateFormData, prevStep, handleSubmit }) => (
      <div data-testid="health-conditions">
        <h2>Select Health Conditions</h2>
        <button onClick={prevStep}>Back</button>
        <button onClick={() => handleSubmit(formData.healthConditions || [])}>
          Complete Registration
        </button>
      </div>
    ),
  }));
  
  // Stub out chart components to avoid warnings during Home render.
  vi.mock("../../components/BMIChart", () => ({
    default: () => <div data-testid="bmi-chart">BMI Chart</div>,
  }));
  
  vi.mock("../../components/WorkoutCalendar", () => ({
    default: () => <div data-testid="workout-calendar">Workout Calendar</div>,
  }));
  
  // Now import the rest of the modules.
  import React from "react";
  import { render, screen, waitFor } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import { MemoryRouter, Route, Routes } from "react-router-dom";
  import { describe, it, expect, beforeEach } from "vitest";
  import { AuthProvider } from "../../context/AuthContext";
  import MultiStepRegistration from "../../pages/MultiStepRegistration";
  import Login from "../../pages/Login";
  import Home from "../../pages/Home";
  import api from "../../api";
  
  describe("Registration and Login Flow", () => {
    const registrationResponse = { data: { email: "test@example.com" } };
    const loginResponse = {
      data: {
        access: "fake-access-token",
        refresh: "fake-refresh-token",
      },
    };
  
    // Helper: Render components wrapped in AuthProvider and MemoryRouter.
    const renderWithRouter = (initialEntries = ["/"]) =>
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route path="/register" element={<MultiStepRegistration />} />
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Home />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );
  
    beforeEach(() => {
      vi.clearAllMocks();
      // Set default implementation for api.get.
      api.get.mockImplementation((url) => {
        if (url === "/api/user/me/") {
          return Promise.resolve({
            data: {
              email: "test@example.com",
              username: "test@example.com",
              height: 170,
              weight: 70,
              age: 30,
              created_at: "2020-01-01T00:00:00Z",
            },
          });
        }
        if (url.includes("weightHistory") || url.includes("logs")) {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });
    });
  
    it("Multi-step registration redirects to login and then login updates auth context", async () => {
      // Set up API post mocks for registration, token retrieval, and health profile creation.
      api.post.mockImplementation((url, payload) => {
        if (url === "/api/user/register/") {
          return Promise.resolve(registrationResponse);
        }
        if (url === "/api/token/") {
          return Promise.resolve(loginResponse);
        }
        if (url === "/api/health-profile/") {
          return Promise.resolve({ data: { success: true } });
        }
        return Promise.resolve({});
      });
  
      // --- Registration Flow ---
      renderWithRouter(["/register"]);
  
      // Verify registration page heading.
      expect(
        screen.getByRole("heading", { name: "Create Your Free vitaForge Account" })
      ).toBeInTheDocument();
      
  
      // Step 1: BasicInfo.
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
  
      const basicNextBtn = screen.getByRole("button", { name: /next/i });
      await userEvent.click(basicNextBtn);
  
      // Step 2: PersonalDetails.
      const ageInput = await screen.findByPlaceholderText(/enter your age/i);
      const heightInput = screen.getByPlaceholderText(/enter your height in cm/i);
      const weightInput = screen.getByPlaceholderText(/enter your weight in kg/i);
      await userEvent.type(ageInput, "30");
      await userEvent.type(heightInput, "170");
      await userEvent.type(weightInput, "70");
  
      const personalNextBtn = screen.getByRole("button", { name: /next/i });
      await userEvent.click(personalNextBtn);
  
      // Step 3: DietaryPreference.
      await waitFor(() =>
        expect(screen.getByTestId("dietary-preference")).toBeInTheDocument()
      );
      const dietarySelect = screen.getByRole("combobox");
      await userEvent.selectOptions(dietarySelect, "non_vegetarian");
  
      const dietaryNextBtn = screen.getByRole("button", { name: /next/i });
      await userEvent.click(dietaryNextBtn);
  
      // Step 4: HealthConditions.
      await waitFor(() =>
        expect(screen.getByTestId("health-conditions")).toBeInTheDocument()
      );
      const completeBtn = screen.getByRole("button", {
        name: /complete registration/i,
      });
      await userEvent.click(completeBtn);
  
      // Verify registration API call.
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          "/api/user/register/",
          expect.objectContaining({
            email: "test@example.com",
            password: "password123",
          })
        );
      });
  
      // --- Login Flow ---
      renderWithRouter(["/login"]);
      expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  
      const loginEmailInput = screen.getByPlaceholderText(/enter your username/i);
      const loginPasswordInput = screen.getByPlaceholderText(/enter your password/i);
      await userEvent.type(loginEmailInput, "test@example.com");
      await userEvent.type(loginPasswordInput, "password123");
  
      const loginBtn = screen.getByRole("button", { name: /login/i });
      await userEvent.click(loginBtn);
  
      // Verify login API call.
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("/api/token/", {
          username: "test@example.com",
          password: "password123",
        });
      });
  
      // --- Home Page ---
      await waitFor(() => {
        const welcomeHeadings = screen.getAllByRole("heading", {
          name: /welcome back!/i,
        });
        expect(welcomeHeadings[0]).toBeInTheDocument();
      });
    });
  });
  