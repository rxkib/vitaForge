// src/__tests__/AdminDashboard.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '../pages/AdminDashboard';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { vi } from 'vitest';
import api from '../api';

// Mock the API module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));
import mockedApi from '../api';

describe('AdminDashboard Component', () => {
  const dummyUsers = { users: [
    { id: 1, username: 'john_doe', is_staff: false },
    { id: 2, username: 'admin_user', is_staff: true },
  ]};
  const dummyMealPlans = [
    { id: 101, user_id: 1, created_at: new Date().toISOString(), plan: {} },
  ];
  const dummyFeedbacks = { feedbacks: [] };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders admin dashboard with users, meal plans, and feedback sections', async () => {
    // Stub GET endpoints
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
      <AuthContext.Provider value={{
        authState: { isAuthenticated: true, loading: false, user: { is_staff: true } },
      }}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for the dashboard title
    await waitFor(() =>
      expect(
        screen.getByText((t) => t.toLowerCase().includes('admin dashboard'))
      ).toBeInTheDocument()
    );

    // Both users should appear
    expect(screen.getByText('john_doe')).toBeInTheDocument();
    expect(screen.getByText('admin_user')).toBeInTheDocument();

    // Sections for meal plans and feedback
    expect(screen.getByText(/saved meal plans/i)).toBeInTheDocument();
    expect(screen.getByText(/user feedback/i)).toBeInTheDocument();
  });

  test('deletes a non-admin user via the modal and shows success banner', async () => {
    // Stub GET endpoints
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
    // Stub DELETE call
    mockedApi.delete.mockResolvedValue({});

    render(
      <AuthContext.Provider value={{
        authState: { isAuthenticated: true, loading: false, user: { is_staff: true } },
      }}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for john_doe to show up
    await waitFor(() => expect(screen.getByText('john_doe')).toBeInTheDocument());

    // Click the active "Delete" button (john_doe)
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    const johnDelete = deleteButtons.find((btn) => !btn.disabled);
    await userEvent.click(johnDelete);

    // The custom modal should open
    expect(screen.getByText(/delete user john_doe\?/i)).toBeInTheDocument();

    // Confirm deletion in the modal
    const confirmBtn = screen.getByRole('button', { name: /yes, delete/i });
    await userEvent.click(confirmBtn);

    // API call should be made with the correct URL
    await waitFor(() => {
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/admin/delete-user/1/');
    });

    // Success banner appears
    expect(screen.getByText(/user deleted successfully\./i)).toBeInTheDocument();

    // And john_doe is removed from the table
    expect(screen.queryByText('john_doe')).not.toBeInTheDocument();
  });
});
