import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Exercises from "../../pages/Exercises";

// Create a new QueryClient instance for testing.
const queryClient = new QueryClient();

// A mock exercise to be returned by our fetch calls.
const mockExercise = {
  id: 1,
  exercise_name: "Push Up",
  Category: "Bodyweight",
  Difficulty: "Beginner",
  Force: "Push",
  videoURL: ["http://example.com/video.mp4"],
  target: { Primary: ["Chest"] },
  // Long details string to test truncation.
  details: "Push up details " + "word ".repeat(100),
  steps: ["Place your hands...", "Lower your body...", "Push up..."],
};

// Override global.fetch without using fake timers.
beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (url.includes("proxy/exercises?")) {
      if (url.includes("name=")) {
        // Simulate a search suggestion fetch.
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockExercise]),
        });
      }
      // Otherwise, return filtered exercises.
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockExercise]),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });
});

afterEach(() => {
  global.fetch.mockClear();
});

// Helper to render the component with required providers.
function renderWithProviders(ui) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Exercises Component", () => {
  test("renders navbar and header", async () => {
    renderWithProviders(<Exercises />);
    // Wait for the navbar and header to appear.
    await waitFor(() => {
      expect(screen.getByText(/vitaForge/i)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /exercises/i })
      ).toBeInTheDocument();
    });
  }, 15000);

  test("displays exercises fetched from the API", async () => {
    renderWithProviders(<Exercises />);
    // Wait for the exercise card to render.
    await waitFor(
      () => expect(screen.getByText(/Push Up/i)).toBeInTheDocument(),
      { timeout: 10000 }
    );
    // Verify additional exercise details.
    expect(screen.getAllByText(/Bodyweight/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Beginner/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Push/i).length).toBeGreaterThan(0);
  }, 15000);

  test("displays search suggestions when typing and opens modal on selection", async () => {
    renderWithProviders(<Exercises />);
    const searchInput = screen.getByPlaceholderText(/Search all exercises/i);
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, "Push");
    await new Promise((resolve) => setTimeout(resolve, 300));
    const suggestionDropdown = document.querySelector(
      ".absolute.bg-base-100.border.border-gray-300.mt-1.rounded.shadow-md.z-10"
    );
    expect(suggestionDropdown).toBeTruthy();
    const suggestionItems = within(suggestionDropdown).getAllByRole("listitem");
    const suggestionItem = suggestionItems.find(
      (item) => item.textContent.trim() === "Push Up"
    );
    expect(suggestionItem).toBeInTheDocument();
    userEvent.click(suggestionItem);
    await waitFor(
      () =>
        expect(
          screen.getByRole("heading", { name: /Push Up/i })
        ).toBeInTheDocument(),
      { timeout: 10000 }
    );
  }, 15000);

  test("opens and closes exercise details modal", async () => {
    renderWithProviders(<Exercises />);
    await waitFor(
      () => expect(screen.getByText(/Push Up/i)).toBeInTheDocument(),
      { timeout: 10000 }
    );
    const viewDetailsButton = screen.getByRole("button", {
      name: /View Details/i,
    });
    userEvent.click(viewDetailsButton);
    await waitFor(
      () =>
        expect(
          screen.getByRole("heading", { name: /Push Up/i })
        ).toBeInTheDocument(),
      { timeout: 10000 }
    );
    // Wait for the close button to appear.
    const closeButton = await screen.findByTestId(
      "close-modal",
      {},
      { timeout: 10000 }
    );
    expect(closeButton).toBeTruthy();
    userEvent.click(closeButton);
    // Wait for the modal container to be removed.
    await waitFor(
      () =>
        expect(screen.queryByTestId("exercise-modal")).not.toBeInTheDocument(),
      { timeout: 10000 }
    );
  }, 15000);
});
