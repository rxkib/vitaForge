import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Recommendations from "../../pages/Recommendations";
import mockedApi from "../../api";

// Create a test QueryClient with default options.
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Helper to render components with QueryClientProvider and MemoryRouter.
const renderWithClient = (ui, initialEntries = ["/recommendations?goal=maintain&region=EU"]) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Additional Functional Edge Cases", () => {
  beforeEach(() => {
    // Clear any previous API mock calls.
    vi.clearAllMocks();
    // Reassign mockedApi methods to fresh mock functions so that we can override their behavior.
    mockedApi.get = vi.fn(() => Promise.resolve({ data: {} }));
    mockedApi.post = vi.fn();
    mockedApi.delete = vi.fn();
  });

  test("displays error state when recommendations API fails", async () => {
    // Simulate an error response for recommendations API calls.
    mockedApi.get.mockImplementation((url) => {
      if (url.includes("/api/recommendations/")) {
        return Promise.reject(new Error("Recommendations error"));
      }
      if (url.includes("/api/health-profile/detail/")) {
        return Promise.resolve({ data: { health_conditions: "", dietary_preference: "" } });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithClient(<Recommendations />);

    // Wait for the error message to appear.
    await waitFor(() => {
      expect(screen.getByText(/Error: Recommendations error/i)).toBeInTheDocument();
    });
  });

  test("displays loading indicator when recommendations API is pending", async () => {
    // Simulate a never-resolving promise for recommendations API.
    mockedApi.get.mockImplementation((url) => {
      if (url.includes("/api/recommendations/")) {
        return new Promise(() => {}); // never resolves
      }
      if (url.includes("/api/health-profile/detail/")) {
        return Promise.resolve({ data: { health_conditions: "", dietary_preference: "" } });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithClient(<Recommendations />);

    // Immediately check that the loading indicator is displayed.
    expect(screen.getByText(/Loading recommendations.../i)).toBeInTheDocument();
  });

  test("handles fallback state when recommendation data is missing", async () => {
    // Simulate the recommendations API returning empty recommended_foods.
    mockedApi.get.mockImplementation((url) => {
      if (url.includes("/api/recommendations/")) {
        return Promise.resolve({ data: { recommended_foods: {} } });
      }
      if (url.includes("/api/health-profile/detail/")) {
        return Promise.resolve({ data: { health_conditions: "", dietary_preference: "" } });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithClient(<Recommendations />);

    // Wait until the main header is rendered.
    await waitFor(() => {
      expect(screen.getByText(/Food Recommendations for/i)).toBeInTheDocument();
    });
    // Check that no food card (e.g., "Chicken") is present.
    expect(screen.queryByText(/Chicken/i)).not.toBeInTheDocument();
  });

  test("provides visual feedback when a food card is selected", async () => {
    // Simulate a recommendations response with one food item.
    mockedApi.get.mockImplementation((url) => {
      if (url.includes("/api/recommendations/")) {
        return Promise.resolve({
          data: { recommended_foods: { Protein: [{ food_id: "f1", name: "Chicken", score: 50 }] } },
        });
      }
      if (url.includes("/api/health-profile/detail/")) {
        return Promise.resolve({ data: { health_conditions: "", dietary_preference: "" } });
      }
      return Promise.resolve({ data: {} });
    });

    renderWithClient(<Recommendations />);

    // Wait until the food card with "Chicken" appears.
    const foodCard = await waitFor(() => screen.getByText(/Chicken/i));
    expect(foodCard).toBeInTheDocument();

    // Simulate clicking the food card.
    await userEvent.click(foodCard);
    // Allow time for the setTimeout (200ms delay in onClick handler) to trigger the selection state.
    await waitFor(() => {
      expect(foodCard.parentElement.className).toMatch(/scale-105/);
    }, { timeout: 500 });
  });
});
