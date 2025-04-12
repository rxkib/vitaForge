// src/__tests__/Settings.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Settings from "../pages/Settings";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

// Dummy auth state.
const dummyAuthState = { user: { username: "john_doe" } };

// Partially mock the API module so it returns a default export.
vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));
import mockedApi from "../api";

// Override window.confirm and window.alert.
window.confirm = vi.fn(() => true);
window.alert = vi.fn();

// Spy on useNavigate.
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("Settings Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders settings page with static sections", async () => {
    mockedApi.get.mockResolvedValue({ data: { feedbacks: [] } });

    render(
      <AuthContext.Provider value={{ authState: dummyAuthState }}>
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/account settings/i)).toBeInTheDocument();
      expect(screen.getAllByText(/delete account/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/delete meal plan/i).length).toBeGreaterThan(
        0
      );
      expect(screen.getByText(/data & privacy/i)).toBeInTheDocument();
      expect(screen.getByText(/about/i)).toBeInTheDocument();
      expect(screen.getByText(/help & feedback/i)).toBeInTheDocument();
    });
  });

  test("submits feedback and clears textarea on success", async () => {
    mockedApi.post.mockResolvedValueOnce({});
    mockedApi.get.mockResolvedValue({ data: { feedbacks: [] } });

    render(
      <AuthContext.Provider value={{ authState: dummyAuthState }}>
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const feedbackTextarea = screen.getByPlaceholderText(
      /enter your complaint or feedback/i
    );
    await userEvent.type(feedbackTextarea, "Test feedback message");
    const sendButton = screen.getByRole("button", { name: /send feedback/i });
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith("/api/feedback/", {
        message: "Test feedback message",
      });
      expect(window.alert).toHaveBeenCalledWith("Thank you for your feedback!");
    });
    expect(feedbackTextarea.value).toBe("");
  });

  test("deletes account and navigates to login page", async () => {
    mockedApi.delete.mockResolvedValueOnce({});
    render(
      <AuthContext.Provider value={{ authState: dummyAuthState }}>
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    const deleteAccountButton = screen.getByRole("button", {
      name: /delete account/i,
    });
    await userEvent.click(deleteAccountButton);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockedApi.delete).toHaveBeenCalledWith("/api/user/me/");
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("deletes meal plan successfully", async () => {
    mockedApi.delete.mockResolvedValueOnce({});
    render(
      <AuthContext.Provider value={{ authState: dummyAuthState }}>
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    const deleteMealPlanButton = screen.getByRole("button", {
      name: /delete meal plan/i,
    });
    await userEvent.click(deleteMealPlanButton);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockedApi.delete).toHaveBeenCalledWith("/api/meal-plan/");
    });
  });
});
