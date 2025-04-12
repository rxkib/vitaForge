// src/__tests__/AuthForm.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthForm from '../components/AuthForm';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';

// --- Mock useNavigate ---
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// --- Partially mock the API module with a default export ---
vi.mock('../api', () => {
  return {
    default: {
      post: vi.fn(),
    },
  };
});
// Import the api mock.
import api from '../api';

describe('AuthForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders correct form title for login', () => {
    render(
      <MemoryRouter>
        <AuthForm route="/api/token/" method="login" />
      </MemoryRouter>
    );
    expect(screen.getByText(/login to fitness app/i)).toBeInTheDocument();
  });

  test('renders correct form title for register', () => {
    render(
      <MemoryRouter>
        <AuthForm route="/api/user/register/" method="register" />
      </MemoryRouter>
    );
    expect(screen.getByText(/register for fitness app/i)).toBeInTheDocument();
  });

  test('submits the form and navigates correctly for login', async () => {
    // Arrange: simulate the API response for login with tokens.
    api.post.mockResolvedValueOnce({
      data: { access: 'access-token', refresh: 'refresh-token' },
    });

    render(
      <MemoryRouter>
        <AuthForm route="/api/token/" method="login" />
      </MemoryRouter>
    );

    // Act: fill in the form and submit.
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'secret');
    await userEvent.click(submitButton);

    // Assert: ensure the API call is made with the correct parameters.
    expect(api.post).toHaveBeenCalledWith('/api/token/', {
      username: 'user@example.com',
      password: 'secret',
    });
    // Wait for navigation to occur.
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
    // Verify tokens are stored in localStorage using the imported constants.
    expect(localStorage.getItem(ACCESS_TOKEN)).toBe('access-token');
    expect(localStorage.getItem(REFRESH_TOKEN)).toBe('refresh-token');
  });

  test('submits the form for register and navigates to login', async () => {
    // Arrange: simulate a registration API response.
    api.post.mockResolvedValueOnce({ data: { message: 'Registered successfully' } });

    render(
      <MemoryRouter>
        <AuthForm route="/api/user/register/" method="register" />
      </MemoryRouter>
    );

    // Act: fill in the registration form and submit.
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    await userEvent.type(emailInput, 'newuser@example.com');
    await userEvent.type(passwordInput, 'newsecret');
    await userEvent.click(submitButton);

    // Assert: check that the API call is made correctly.
    expect(api.post).toHaveBeenCalledWith('/api/user/register/', {
      username: 'newuser@example.com',
      password: 'newsecret',
    });
    // Verify that navigation to the login page is triggered.
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
