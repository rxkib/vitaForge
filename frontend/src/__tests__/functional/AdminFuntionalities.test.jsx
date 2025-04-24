// src/__tests__/functional/AdminFuntionalities.test.jsx

// Place the API module mock at the top.
vi.mock("../../api", () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

import mockedApi from "../../api";
import React from "react";
import { render, screen, waitFor, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AdminDashboard from "../../pages/AdminDashboard";
import { AuthContext } from "../../context/AuthContext";

// Suppress window.alert.
beforeAll(() => {
  window.alert = vi.fn();
});

// Dummy data for testing.
const dummyUsers = [
  { id: 1, username: "user1", is_staff: false },
  { id: 2, username: "adminUser", is_staff: true },
];

const dummyMealPlans = [
  {
    id: 100,
    user_id: 1,
    created_at: "2025-01-01T12:00:00Z",
    plan: { Apple: 100, Banana: 150 },
  },
];

// For feedback deletion test, set feedback user to adminUser (so the delete button is rendered).
const dummyFeedbacks = [
  {
    id: "f1",
    user: "adminUser",
    message: "Test feedback",
    created_at: "2025-01-01T12:00:00Z",
    replies: [],
  },
];

// Dummy auth context for an admin user.
const dummyAuthState = {
  isAuthenticated: true,
  loading: false,
  user: { username: "adminUser", email: "admin@example.com", is_staff: true },
};

describe("Admin Dashboard Functionalities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up API GET responses in order: users, meal plans, feedback.
    mockedApi.get
      .mockResolvedValueOnce({ data: { users: dummyUsers } }) // For registered users.
      .mockResolvedValueOnce({ data: dummyMealPlans })         // For meal plans.
      .mockResolvedValueOnce({ data: { feedbacks: dummyFeedbacks } }); // For feedback.
  });

  afterEach(() => {
    cleanup();
  });

  test("deletes a non-admin user successfully", async () => {
    render(
      <AuthContext.Provider value={{ authState: dummyAuthState, logout: vi.fn() }}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait until the non-admin user "user1" appears.
    await waitFor(() =>
      expect(screen.getByText("user1")).toBeInTheDocument()
    );

    // Click the first Delete button (for user1).
    const deleteButtons = screen.getAllByRole("button", { name: /^delete$/i });
    await userEvent.click(deleteButtons[0]);

    // Now our custom confirmation modal should appear.
    expect(screen.getByText(/Delete user user1\?/i)).toBeInTheDocument();

    // Mock the DELETE API and click "Yes, Delete".
    mockedApi.delete.mockResolvedValueOnce({});
    const confirmButton = screen.getByRole("button", { name: /yes, delete/i });
    await userEvent.click(confirmButton);

    // Assert that the correct API DELETE call is made.
    await waitFor(() => {
      expect(mockedApi.delete).toHaveBeenCalledWith("/api/admin/delete-user/1/");
    });

    // Verify that "user1" is removed from the UI.
    await waitFor(() => {
      expect(screen.queryByText("user1")).not.toBeInTheDocument();
    });
  });

  test("disables delete button for an admin user", async () => {
    render(
      <AuthContext.Provider value={{ authState: dummyAuthState, logout: vi.fn() }}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for the admin user "adminUser" to appear in a table row.
    const adminRow = await waitFor(() => {
      const rows = screen.getAllByRole("row");
      return rows.find(
        (row) =>
          row.textContent.includes("adminUser") && row.textContent.includes("Yes")
      );
    });
    expect(adminRow).toBeInTheDocument();

    // Within that row, find the Delete button.
    const deleteButton = within(adminRow).getByRole("button", { name: /^delete$/i });
    expect(deleteButton).toBeDisabled();
  });

  test("opens and closes the meal plan modal", async () => {
    render(
      <AuthContext.Provider value={{ authState: dummyAuthState, logout: vi.fn() }}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for the "Show Meal Plan" button.
    const showPlanButton = await waitFor(() =>
      screen.getByRole("button", { name: /show meal plan/i })
    );
    expect(showPlanButton).toBeInTheDocument();

    // Open the modal.
    await userEvent.click(showPlanButton);
    await waitFor(() => {
      // Look for the actual heading text your component renders.
      expect(screen.getByText(/meal plan for user/i)).toBeInTheDocument();
    });

    // Find and click the "Close" button.
    const closeButton = screen.getByRole("button", { name: /close/i });
    await userEvent.click(closeButton);

    // Verify that the modal is closed.
    await waitFor(() => {
      expect(screen.queryByText(/meal plan for user/i)).not.toBeInTheDocument();
    });
  });

  test("deletes a feedback entry successfully", async () => {
    // The feedback handler still uses window.confirm.
    window.confirm = vi.fn(() => true);
    mockedApi.delete.mockResolvedValueOnce({});

    render(
      <AuthContext.Provider value={{ authState: dummyAuthState, logout: vi.fn() }}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait until the feedback message appears.
    await waitFor(() =>
      expect(screen.getByText("Test feedback")).toBeInTheDocument()
    );

    // Locate the feedback-item container and its Delete button.
    const feedbackItem = screen
      .getByText("Test feedback")
      .closest(".feedback-item");
    const feedbackDeleteButton = within(feedbackItem).getByRole("button", {
      name: /^delete$/i,
    });

    // Click it and assert confirmation and API call.
    await userEvent.click(feedbackDeleteButton);
    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete this reply?"
    );
    await waitFor(() => {
      expect(mockedApi.delete).toHaveBeenCalledWith("/api/feedback/f1/");
    });
  });
});
