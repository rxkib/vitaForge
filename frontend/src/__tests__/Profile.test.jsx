// src/__tests__/Profile.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Profile from '../pages/Profile';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { vi } from 'vitest';

vi.mock('../api');

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {}); // suppress API error log
  });
  

  test('displays loading indicator initially', () => {
    // Return a promise that never resolves to simulate loading.
    api.get.mockReturnValue(new Promise(() => {}));

    render(
      <AuthContext.Provider value={{ authState: { user: { username: 'testuser' } } }}>
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  });

  test('displays "Profile Not Found" when profile fetch fails', async () => {
    // Simulate an API error.
    api.get.mockRejectedValue(new Error('API error'));

    render(
      <AuthContext.Provider value={{ authState: { user: { username: 'testuser' } } }}>
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/profile not found/i)).toBeInTheDocument();
    });
  });

  test('displays profile information when fetch is successful', async () => {
    // Provide sample profile data.
    const profileData = {
      age: 30,
      height: 175,
      weight: 70,
      dietary_preference: "vegan",
      health_conditions: "None"
    };
    api.get.mockResolvedValueOnce({ data: profileData });

    render(
      <AuthContext.Provider value={{ authState: { user: { username: 'testuser' } } }}>
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    });
    // Check that expected profile field labels are present.
    expect(screen.getByText(/age:/i)).toBeInTheDocument();
    expect(screen.getByText(/height/i)).toBeInTheDocument();
    expect(screen.getByText(/dietary preference/i)).toBeInTheDocument();
  });
});
