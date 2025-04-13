// Polyfill for ResizeObserver (if any responsive components use it)
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
  
  // Import act from react for wrapping state updates.
  import { act } from "react";
  
  // Mock jwt-decode to provide a named export "jwtDecode"
  vi.mock("jwt-decode", () => ({
    jwtDecode: (token) => ({
      email: "test@example.com",
      username: "testuser",
    }),
  }));
  
  // Partially mock the API module.
  vi.mock("../../api", () => ({
    default: {
      get: vi.fn(() => Promise.resolve({ data: { feedbacks: [] } })), // default for fetchUserCases
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
  
  import React from "react";
  import { render, screen, waitFor } from "@testing-library/react";
  import userEvent from "@testing-library/user-event";
  import { MemoryRouter } from "react-router-dom";
  import Settings from "../../pages/Settings";
  import FeedbackThread from "../../components/FeedbackThread";
  import { AuthContext } from "../../context/AuthContext";
  
  // Dummy authentication state.
  const dummyAuthState = {
    user: { email: "test@example.com", username: "testuser" },
  };
  
  // Dummy refresh function.
  const dummyRefresh = vi.fn();
  
  describe("Feedback Submission and Thread Interactions", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
  
    describe("Sending Feedback", () => {
      test("submits feedback and clears textarea on success", async () => {
        // Arrange: Mock API POST response for feedback submission.
        mockedApi.post.mockResolvedValueOnce({});
  
        render(
          <AuthContext.Provider value={{ authState: dummyAuthState }}>
            <MemoryRouter>
              <Settings />
            </MemoryRouter>
          </AuthContext.Provider>
        );
  
        // Locate the feedback textarea.
        const feedbackTextarea = screen.getByPlaceholderText(/enter your complaint or feedback/i);
  
        // Simulate typing into the textarea.
        await userEvent.type(feedbackTextarea, "Test feedback message");
  
        // Click the "Send Feedback" button.
        const sendFeedbackButton = screen.getByRole("button", { name: /send feedback/i });
        await userEvent.click(sendFeedbackButton);
  
        // Assert that API.post is called with the correct message payload.
        await waitFor(() => {
          expect(mockedApi.post).toHaveBeenCalledWith("/api/feedback/", {
            message: "Test feedback message",
          });
          expect(window.alert).toHaveBeenCalledWith("Thank you for your feedback!");
        });
  
        // Confirm that the textarea is cleared.
        expect(feedbackTextarea.value).toBe("");
      });
    });
  
    describe("Replying to Feedback", () => {
      // Dummy feedback case.
      const dummyFeedback = {
        id: "fb1",
        user: "testuser",
        message: "This is a test feedback.",
        created_at: "2025-01-01T12:00:00Z",
        replies: [],
      };
  
      test("shows reply form, submits a reply and refreshes the thread", async () => {
        // Arrange: Mock API POST response for reply submission.
        mockedApi.post.mockResolvedValueOnce({});
  
        render(
          <AuthContext.Provider value={{ authState: dummyAuthState }}>
            <MemoryRouter>
              <FeedbackThread
                feedback={dummyFeedback}
                refreshFeedback={dummyRefresh}
                onDeleteFeedback={vi.fn()}
              />
            </MemoryRouter>
          </AuthContext.Provider>
        );
  
        // Click the "Reply" button to reveal the reply form.
        const replyToggleButton = screen.getByRole("button", { name: /^reply$/i });
        await userEvent.click(replyToggleButton);
  
        // The reply textarea should appear.
        const replyTextarea = screen.getByPlaceholderText(/enter your reply/i);
        expect(replyTextarea).toBeInTheDocument();
  
        // Simulate typing a reply.
        await userEvent.type(replyTextarea, "This is a reply message");
  
        // Click the "Reply" button within the form.
        const sendReplyButton = screen.getByRole("button", { name: /^reply$/i });
        await userEvent.click(sendReplyButton);
  
        // Assert that API.post is called with the correct payload.
        await waitFor(() => {
          expect(mockedApi.post).toHaveBeenCalledWith("/api/feedback/", {
            message: "This is a reply message",
            parent: dummyFeedback.id,
          });
        });
  
        // Verify that the refresh callback is triggered.
        await waitFor(() => {
          expect(dummyRefresh).toHaveBeenCalled();
        });
      });
  
      test("allows deleting a feedback if user is the owner", async () => {
        // Arrange: Override window.confirm to always return true.
        window.confirm = vi.fn(() => true);
        mockedApi.delete.mockResolvedValueOnce({});
  
        // Create a spy that calls mockedApi.delete with the correct endpoint.
        const onDeleteFeedbackSpy = vi.fn((id) =>
          mockedApi.delete(`/api/feedback/${id}/`)
        );
  
        render(
          <AuthContext.Provider value={{ authState: dummyAuthState }}>
            <MemoryRouter>
              <FeedbackThread
                feedback={dummyFeedback}
                refreshFeedback={dummyRefresh}
                onDeleteFeedback={onDeleteFeedbackSpy}
              />
            </MemoryRouter>
          </AuthContext.Provider>
        );
  
        // Query the delete button by role using an exact text matcher.
        const deleteButton = screen.getByRole("button", { name: /^delete$/i });
        await userEvent.click(deleteButton);
  
        // Assert that window.confirm was called.
        expect(window.confirm).toHaveBeenCalled();
  
        // Verify that API.delete is triggered with the correct endpoint.
        await waitFor(() => {
          expect(mockedApi.delete).toHaveBeenCalledWith(`/api/feedback/${dummyFeedback.id}/`);
        });
      });
    });
  });
  