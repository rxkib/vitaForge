import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";
import { AuthContext } from "../context/AuthContext";

describe("Login Component", () => {
  // Create a mock login function that simulates the authentication call.
  const mockLogin = vi.fn();

  // Helper function that renders the Login component wrapped in the required context
  // and router provider. The authState is set with loading: false.
  const renderLogin = () =>
    render(
      <AuthContext.Provider
        value={{ login: mockLogin, authState: { loading: false } }}
      >
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );

  // Clear the mock call history before each test runs.
  beforeEach(() => {
    mockLogin.mockClear();
  });

  test("should render the login form inputs and button", () => {
    renderLogin();

    // Verify that the username input field is present
    const usernameInput = screen.getByPlaceholderText(/enter your username/i);
    // Verify that the password input field is present
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    // Verify that the login button is present
    const loginButton = screen.getByRole("button", { name: /login/i });

    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(loginButton).toBeInTheDocument();

    // What this test covers:
    // - Rendering of essential form elements: the username field, password field, and login button.
    // - Ensures that users see the correct inputs when they access the Login page.
  });

  test("should call login function with correct credentials on form submission", async () => {
    renderLogin();

    // Locate the form elements
    const usernameInput = screen.getByPlaceholderText(/enter your username/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const loginButton = screen.getByRole("button", { name: /login/i });

    // Simulate user interaction: typing email and password, then clicking the login button.
    // Using userEvent provides a more realistic simulation than fireEvent.
    await userEvent.type(usernameInput, "test@example.com");
    await userEvent.type(passwordInput, "p@ssw0rd");
    await userEvent.click(loginButton);

    // Assertions:
    // - Confirm that the mockLogin function is called exactly once.
    // - Confirm that it receives the correct credentials.
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith("test@example.com", "p@ssw0rd");

    // What this test covers:
    // - The integration of the form inputs with the form submission logic.
    // - It verifies that when a user enters credentials and submits the form,
    //   the login function provided by the AuthContext is called with the right values.
  });
});
