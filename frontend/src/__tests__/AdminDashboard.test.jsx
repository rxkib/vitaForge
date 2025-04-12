// src/__tests__/AdminDashboard.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '../pages/AdminDashboard';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { vi } from 'vitest';
import api from '../api';

// Dummy API responses for admin dashboard.
const dummyUsers = {
  users: [
    { id: 1, username: 'john_doe', is_staff: false },
    { id: 2, username: 'admin_user', is_staff: true },
  ],
};
const dummyMealPlans = [
  { id: 101, user_id: 1, created_at: new Date().toISOString() },
];
const dummyFeedbacks = {
  feedbacks: [
    { id: 201, user: 'john_doe', message: 'Great app!', created_at: '2020-01-01', replies: [] },
  ],
};

// Partially mock the API module so that it returns a default export.
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));
import mockedApi from '../api';

// Override window.alert and window.confirm.
window.alert = vi.fn();
window.confirm = vi.fn(() => true);

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders admin dashboard with user, meal plan, and feedback data', async () => {
    // Set up API responses.
    mockedApi.get.mockImplementation((url) => {
      if (url === '/api/admin-dashboard/') {
        return Promise.resolve({ data: dummyUsers });
      }
      if (url === '/api/admin/meal-plans/') {
        return Promise.resolve({ data: dummyMealPlans });
      }
      if (url === '/api/feedback/') {
        return Promise.resolve({ data: dummyFeedbacks });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <AuthContext.Provider value={{ authState: { user: { username: 'testUser' } } }}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait until the dashboard loads; use a flexible matcher for "admin dashboard".
    await waitFor(() => {
      expect(screen.getByText((content) => content.toLowerCase().includes('admin dashboard'))).toBeInTheDocument();
    });

    // Instead of getByText (which fails if there are duplicates), use getAllByText for "john_doe".
    const johnDoeElements = screen.getAllByText('john_doe');
    expect(johnDoeElements.length).toBeGreaterThan(0);

    // Check for admin_user as well.
    const adminUserElements = screen.getAllByText('admin_user');
    expect(adminUserElements.length).toBeGreaterThan(0);

    // Verify that the meal plans and feedback sections are rendered.
    expect(screen.getByText(/saved meal plans/i)).toBeInTheDocument();
    expect(screen.getByText(/user feedback/i)).toBeInTheDocument();
  });

  test('deletes a non-admin user when Delete is clicked', async () => {
    mockedApi.get.mockImplementation((url) => {
      if (url === '/api/admin-dashboard/') {
        return Promise.resolve({ data: dummyUsers });
      }
      if (url === '/api/admin/meal-plans/') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/feedback/') {
        return Promise.resolve({ data: { feedbacks: [] } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
    mockedApi.delete.mockResolvedValue({});

    render(
      <AuthContext.Provider value={{ authState: { user: { username: 'testUser' } } }}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeInTheDocument();
    });

    // Find the Delete button for john_doe (non-admin).
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    const deleteButtonForJohn = deleteButtons.find((btn) => !btn.disabled);
    expect(deleteButtonForJohn).toBeDefined();

    await userEvent.click(deleteButtonForJohn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/admin/delete-user/1/');
    });
    expect(window.alert).toHaveBeenCalledWith('User deleted successfully.');
  });
});
