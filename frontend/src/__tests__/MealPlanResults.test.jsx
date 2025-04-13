// src/__tests__/MealPlanResults.test.jsx

// Suppress console.log output during tests.
beforeAll(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MealPlanResults from '../pages/MealPlanResults';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import api from '../api';
import { AuthContext } from '../context/AuthContext';

// Dummy state passed to MealPlanResults
const dummyState = {
  daily_targets: { calories: 2000, carbs: 250, protein: 150, fat: 70, fiber: 30 },
  meal_plan: { Breakfast: 100, Lunch: 150, Dinner: 200 },
};

// Partially mock the API module so that it returns a default export.
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));
import mockedApi from '../api';

// Helper to create a QueryClient with retries disabled.
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('MealPlanResults Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('displays "No meal plan data available" if state is empty', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/meal-plan-results', state: {} }]}>
        <MealPlanResults />
      </MemoryRouter>
    );
    expect(screen.getByText(/no meal plan data available/i)).toBeInTheDocument();
  });

  test('renders daily targets and meal plan details when provided valid state', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/meal-plan-results', state: dummyState }]}>
        <MealPlanResults />
      </MemoryRouter>
    );
    expect(screen.getByText(/daily meal plan/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/calories/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/breakfast/i)).toBeInTheDocument();
  });

  test('handles save plan button click and updates status on success', async () => {
    // The API expects a payload with daily_targets and plan keys.
    mockedApi.post.mockResolvedValueOnce({ data: { success: true } });
    render(
      <MemoryRouter initialEntries={[{ pathname: '/meal-plan-results', state: dummyState }]}>
        <MealPlanResults />
      </MemoryRouter>
    );
    const saveButton = screen.getByRole('button', { name: /save plan/i });
    await userEvent.click(saveButton);
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/api/meal-plan/', {
        daily_targets: dummyState.daily_targets,
        plan: dummyState.meal_plan,
      });
      expect(screen.getByText(/plan saved successfully/i)).toBeInTheDocument();
    });
  });

  test('handles create new plan button click and navigates to plans page', async () => {
    // Simulate confirmation dialog returning true.
    window.confirm = vi.fn(() => true);
    mockedApi.delete.mockResolvedValueOnce({});
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: '/meal-plan-results', state: dummyState }]}>
          <Routes>
            <Route path="/meal-plan-results" element={<MealPlanResults />} />
            <Route path="/plans" element={<div>Plans Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    const createNewPlanButton = screen.getByRole('button', { name: /create new plan/i });
    await userEvent.click(createNewPlanButton);
    await waitFor(() => {
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/meal-plan/');
      expect(screen.getByText(/plans page/i)).toBeInTheDocument();
    });
  });
});
