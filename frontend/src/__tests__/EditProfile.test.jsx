// src/__tests__/EditProfile.test.jsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditProfile from "../pages/EditProfile";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import api from "../api";

// Override window.alert to prevent jsdom error.
window.alert = vi.fn();

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Partially mock the API module to provide a default export.
vi.mock("../api", () => {
  return {
    default: {
      get: vi.fn(),
      patch: vi.fn(),
    },
  };
});
import mockedApi from "../api";

describe("EditProfile Component", () => {
  // Utility wrapper that provides a new QueryClient for each test.
  const createWrapper = () => {
    const queryClient = new QueryClient();
    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  test("displays loading state initially", () => {
    // Simulate a never-resolving promise to force the loading state.
    mockedApi.get.mockReturnValue(new Promise(() => {}));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <EditProfile />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("renders form with fetched profile details", async () => {
    const profileData = {
      dietary_preference: "vegetarian",
      health_conditions: "diabetes, hypertension",
    };
    mockedApi.get.mockResolvedValueOnce({ data: profileData });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <EditProfile />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/edit profile/i)).toBeInTheDocument();
    });

    // Check that the select contains the correct value.
    const selectInput = screen.getByRole("combobox");
    expect(selectInput.value).toBe("vegetarian");

    // Verify that checkboxes for 'diabetes' and 'hypertension' are checked.
    const diabetesCheckbox = screen.getByLabelText(/diabetes/i);
    expect(diabetesCheckbox.checked).toBe(true);
    const hypertensionCheckbox = screen.getByLabelText(/hypertension/i);
    expect(hypertensionCheckbox.checked).toBe(true);
  });

  test("submits updated profile and navigates to profile page", async () => {
    const profileData = {
      dietary_preference: "vegetarian",
      health_conditions: "diabetes, hypertension",
    };
    mockedApi.get.mockResolvedValueOnce({ data: profileData });
    mockedApi.patch.mockResolvedValueOnce({}); // Simulate a successful update.

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <EditProfile />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/edit profile/i)).toBeInTheDocument();
    });

    // Change the dietary preference to "vegan"
    const selectInput = screen.getByRole("combobox");
    await userEvent.selectOptions(selectInput, "vegan");

    // Optionally, uncheck the checkbox for 'diabetes'
    const diabetesCheckbox = screen.getByLabelText(/diabetes/i);
    if (diabetesCheckbox.checked) {
      await userEvent.click(diabetesCheckbox);
    }

    // Submit the form.
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await userEvent.click(saveButton);

    // Assert that the API patch call was made with updated data.
    await waitFor(() => {
      expect(mockedApi.patch).toHaveBeenCalledWith(
        "/api/health-profile/detail/",
        {
          dietary_preference: "vegan",
          health_conditions: expect.any(String),
        }
      );
    });

    // Verify that after submission, navigation to '/profile' is triggered.
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });
  });
});
