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
        .mockResolvedValueOnce({ data: dummyMealPlans }) // For meal plans.
        .mockResolvedValueOnce({ data: { feedbacks: dummyFeedbacks } }); // For feedback.
    });
  
    afterEach(() => {
      cleanup();
    });
  
    test("deletes a non-admin user successfully", async () => {
      // Override window.confirm.
      window.confirm = vi.fn(() => true);
      mockedApi.delete.mockResolvedValueOnce({});
  
      render(
        <AuthContext.Provider value={{ authState: dummyAuthState, logout: vi.fn() }}>
          <MemoryRouter>
            <AdminDashboard />
          </MemoryRouter>
        </AuthContext.Provider>
      );
  
      // Wait until the non-admin user "user1" appears.
      await waitFor(() =>
        expect(screen.getByText((content) => content.includes("user1"))).toBeInTheDocument()
      );
  
      // Assume that the first Delete button in the users table is for "user1".
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      await userEvent.click(deleteButtons[0]);
  
      // Verify that the confirmation prompt was triggered.
      expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this user?");
  
      // Assert that the correct API DELETE call is made.
      await waitFor(() => {
        expect(mockedApi.delete).toHaveBeenCalledWith("/api/admin/delete-user/1/");
      });
  
      // Verify that "user1" is removed from the UI.
      await waitFor(() => {
        expect(screen.queryByText((content) => content.includes("user1"))).not.toBeInTheDocument();
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
        return rows.find(row =>
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
        expect(screen.getByText(/meal plan for user id:/i)).toBeInTheDocument();
      });
  
      // Find and click the "Close" button.
      const closeButton = screen.getByRole("button", { name: /close/i });
      await userEvent.click(closeButton);
  
      // Verify that the modal is closed.
      await waitFor(() => {
        expect(screen.queryByText(/meal plan for user id:/i)).not.toBeInTheDocument();
      });
    });
  
    test("deletes a feedback entry successfully", async () => {
      window.confirm = vi.fn(() => true);
      mockedApi.delete.mockResolvedValueOnce({});
  
      render(
        <AuthContext.Provider value={{ authState: dummyAuthState, logout: vi.fn() }}>
          <MemoryRouter>
            <AdminDashboard />
          </MemoryRouter>
        </AuthContext.Provider>
      );
  
      // Wait until the feedback message "Test feedback" appears.
      await waitFor(() =>
        expect(screen.getByText("Test feedback")).toBeInTheDocument()
      );
  
      // Find the nearest feedback item container.
      const feedbackItem = screen.getByText("Test feedback").closest(".feedback-item");
      expect(feedbackItem).toBeInTheDocument();
  
      // Within that container, get the Delete button.
      const feedbackDeleteButton = within(feedbackItem).getByRole("button", { name: /^delete$/i });
      expect(feedbackDeleteButton).toBeInTheDocument();
  
      // Click the feedback deletion button.
      await userEvent.click(feedbackDeleteButton);
      expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this reply?");
  
      // Assert that the proper API DELETE call is made.
      await waitFor(() => {
        expect(mockedApi.delete).toHaveBeenCalledWith("/api/feedback/f1/");
      });
    });
  });
  