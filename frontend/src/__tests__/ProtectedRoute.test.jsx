import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthContext } from '../context/AuthContext';

describe('ProtectedRoute Component', () => {
  // A dummy component to represent protected content.
  const ProtectedContent = () => <div>Protected Content</div>;

  test('displays loading message when authentication state is loading', () => {
    render(
      <AuthContext.Provider value={{ authState: { loading: true, isAuthenticated: false } }}>
        <MemoryRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    // Check that the loading message appears.
    expect(screen.getByText(/verifying your fitness profile/i)).toBeInTheDocument();
  });

  test('renders protected content when authenticated', () => {
    render(
      <AuthContext.Provider value={{ authState: { loading: false, isAuthenticated: true } }}>
        <MemoryRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    // Protected content should be visible.
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    render(
      <AuthContext.Provider value={{ authState: { loading: false, isAuthenticated: false } }}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    // If not authenticated, the login page should be rendered instead.
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });
});
