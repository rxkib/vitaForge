// Polyfill for ResizeObserver (needed by responsive components)
global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  // Suppress console.log and window.alert during tests.
  beforeAll(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    window.alert = vi.fn();
  });
  
  // Import act from "react" (instead of "react-dom/test-utils") as recommended.
  import { act } from "react";
  
  // Mock jwt-decode to provide a named export "jwtDecode"
  vi.mock("jwt-decode", () => ({
    jwtDecode: (token) => ({
      email: "test@example.com",
      username: "test@example.com",
    }),
  }));
  
  // Mock the API module for all endpoints.
  vi.mock("../../api", () => ({
    default: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
  }));
  import mockedApi from "../../api";
  
  // Spy on useNavigate.
  const mockNavigate = vi.fn();
  vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
  });
  
  // Dummy data for Recommendations.
  const dummyRecommendations = {
    recommended_foods: {
      Carbs: [
        { food_id: "1", name: "Food1", score: 30 },
        { food_id: "2", name: "Food2", score: 40 },
        { food_id: "3", name: "Food3", score: 50 },
        { food_id: "4", name: "Food4", score: 60 },
        { food_id: "5", name: "Food5", score: 70 },
        { food_id: "6", name: "Food6", score: 80 },
        { food_id: "7", name: "Food7", score: 90 },
      ],
    },
  };
  // Dummy health profile for Recommendations.
  const dummyProfileForRec = {
    health_conditions: "hypertension",
    dietary_preference: "non_vegetarian",
  };
  
  // Dummy response for meal plan optimization.
  const dummyMealPlanOptimizationResponse = {
    daily_targets: { calories: 2000, carbs: 250, protein: 150, fat: 70, fiber: 30 },
    plan: { Breakfast: 100, Lunch: 150, Dinner: 200 },
  };
  
  // Dummy data for MealPlanResults.
  const dummyDailyTargets = { calories: 2000, carbs: 250, protein: 150, fat: 70, fiber: 30 };
  const dummyMealPlan = { Breakfast: 100, Lunch: 150, Dinner: 200 };
  
  import React from "react";
  import { render, screen, waitFor } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import Recommendations from "../../pages/Recommendations";
  import MealPlanResults from "../../pages/MealPlanResults";
  import { MemoryRouter, Routes, Route } from "react-router-dom";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  
  // Helper function to create a QueryClient with retries disabled.
  const createQueryClient = () =>
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  
  describe("Meal Plan Generation and Management", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockNavigate.mockClear();
    });
  
    describe("Recommendations Component", () => {
      test("generates food recommendations and creates meals", async () => {
        const queryClient = createQueryClient();
  
        // Mock API GET responses: recommendations and health profile.
        mockedApi.get.mockImplementation((url) => {
          if (url.startsWith("/api/recommendations/")) {
            return Promise.resolve({ data: dummyRecommendations });
          }
          if (url === "/api/health-profile/detail/") {
            return Promise.resolve({ data: dummyProfileForRec });
          }
          return Promise.resolve({ data: {} });
        });
  
        // Render the Recommendations component.
        render(
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={["/recommendations?goal=lose&region=EU"]}>
              <Routes>
                <Route path="/recommendations" element={<Recommendations />} />
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>
        );
  
        // Wait for the header with the goal to display.
        await waitFor(() => {
          expect(screen.getByText(/food recommendations for losing weight/i)).toBeInTheDocument();
        });
  
        // Wrap the food selection loop in act to flush state updates.
        await act(async () => {
          for (let i = 1; i <= 7; i++) {
            const foodItem = await screen.findByText(new RegExp(`Food${i}`, "i"));
            await userEvent.click(foodItem);
            // Delay to ensure the debounce (200ms) completes.
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        });
  
        // The "Create Meals" button should now be enabled.
        const createMealsButton = screen.getByRole("button", { name: /create meals/i });
        expect(createMealsButton).toBeEnabled();
  
        // Set up API POST mock for meal-plan-optimization.
        mockedApi.post.mockResolvedValueOnce({ data: dummyMealPlanOptimizationResponse });
  
        // Click "Create Meals".
        await userEvent.click(createMealsButton);
  
        // Verify that the API POST call is made with the expected payload.
        await waitFor(() => {
          expect(mockedApi.post).toHaveBeenCalledWith(
            "/api/meal-plan-optimization/",
            expect.objectContaining({
              goal: "lose",
              meals_per_day: 3,
              food_ids: ["1", "2", "3", "4", "5", "6", "7"],
            })
          );
        });
  
        // Verify that navigation to MealPlanResults is triggered with the correct state.
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith("/meal-plan-results", {
            state: dummyMealPlanOptimizationResponse,
          });
        });
      });
    });
  
    describe("MealPlanResults Component", () => {
      test("renders daily targets and meal plan details; saves plan successfully", async () => {
        // Render MealPlanResults with provided state.
        render(
          <MemoryRouter initialEntries={[{ pathname: "/meal-plan-results", state: { daily_targets: dummyDailyTargets, meal_plan: dummyMealPlan } }]}>
            <Routes>
              <Route path="/meal-plan-results" element={<MealPlanResults />} />
            </Routes>
          </MemoryRouter>
        );
  
        // Verify that the main section is rendered.
        expect(screen.getByText(/daily meal plan/i)).toBeInTheDocument();
  
        // Check that one of the daily target cards (e.g., Calories) appears.
        await waitFor(() => {
          expect(screen.getByText(/calories/i)).toBeInTheDocument();
        });
  
        // Simulate clicking the "Save Plan" button.
        mockedApi.post.mockResolvedValueOnce({ data: { success: true } });
        const savePlanButton = screen.getByRole("button", { name: /save plan/i });
        await userEvent.click(savePlanButton);
  
        // Verify that the API POST call is made with the expected payload and that a success message appears.
        await waitFor(() => {
          expect(mockedApi.post).toHaveBeenCalledWith("/api/meal-plan/", {
            daily_targets: dummyDailyTargets,
            plan: dummyMealPlan,
          });
          expect(screen.getByText(/plan saved successfully/i)).toBeInTheDocument();
        });
      });
  
      test("handles create new plan action and navigates back to plans", async () => {
        // Override window.confirm to return true.
        window.confirm = vi.fn(() => true);
        mockedApi.delete.mockResolvedValueOnce({});
  
        // Render MealPlanResults with state and proper routes.
        render(
          <MemoryRouter initialEntries={[{ pathname: "/meal-plan-results", state: { daily_targets: dummyDailyTargets, meal_plan: dummyMealPlan } }]}>
            <Routes>
              <Route path="/meal-plan-results" element={<MealPlanResults />} />
              <Route path="/plans" element={<div>Plans Page</div>} />
            </Routes>
          </MemoryRouter>
        );
  
        // Click the "Create New Plan" button.
        const createNewPlanButton = screen.getByRole("button", { name: /create new plan/i });
        await userEvent.click(createNewPlanButton);
  
        // Verify that window.confirm was called.
        expect(window.confirm).toHaveBeenCalled();
  
        // Verify that the DELETE API call is made.
        await waitFor(() => {
          expect(mockedApi.delete).toHaveBeenCalledWith("/api/meal-plan/");
        });
  
        // Verify that navigation to the Plans page is triggered.
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith("/plans");
        });
      });
    });
  });
  