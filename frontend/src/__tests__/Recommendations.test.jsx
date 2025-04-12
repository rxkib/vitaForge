// src/__tests__/Recommendations.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Recommendations from '../pages/Recommendations';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import api from '../api';

// Dummy recommendations data with categories and food scores.
const dummyRecommendations = {
  recommended_foods: {
    Carbs: [
      { food_id: 1, name: "Rice", score: 80 },
      { food_id: 2, name: "Bread", score: 70 },
    ],
    Protein: [
      { food_id: 3, name: "Chicken", score: 90 },
      { food_id: 4, name: "Beef", score: 85 },
    ],
  }
};

// Dummy profile data.
const dummyProfile = {
  health_conditions: "None",
  dietary_preference: "vegan",
};

// Partially mock the API module so that it returns a default export.
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));
import mockedApi from '../api';

// Create a QueryClient that disables automatic retries.
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('Recommendations Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('displays loading message while fetching data', () => {
    // Simulate a pending promise so that isLoading stays true.
    mockedApi.get.mockReturnValue(new Promise(() => {}));
    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={['/recommendations?goal=maintain&region=EU']}>
          <Recommendations />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText(/loading recommendations/i)).toBeInTheDocument();
  });

  test('displays error message when fetch fails', async () => {
    // For recommendations, force the API to reject.
    mockedApi.get.mockImplementation((url) => {
      if (url.startsWith('/api/recommendations/')) {
        return Promise.reject(new Error('Fetch error'));
      }
      if (url === '/api/health-profile/detail/') {
        return Promise.resolve({ data: dummyProfile });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={['/recommendations?goal=maintain&region=EU']}>
          <Recommendations />
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    // Wait until a node whose text includes "Error: Fetch error" appears.
    const errorEl = await screen.findByText((content) => content.includes('Error: Fetch error'));
    expect(errorEl).toBeInTheDocument();
  });

  test('renders recommendations with categories and food cards', async () => {
    mockedApi.get.mockImplementation((url) => {
      if (url.startsWith('/api/recommendations/')) {
        return Promise.resolve({ data: dummyRecommendations });
      }
      if (url === '/api/health-profile/detail/') {
        return Promise.resolve({ data: dummyProfile });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={['/recommendations?goal=lose&region=EU']}>
          <Recommendations />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Food Recommendations for Losing Weight/i)).toBeInTheDocument();
    });
    // Verify that category headings and at least one food card are rendered.
    expect(screen.getByText(/Carbs/i)).toBeInTheDocument();
    expect(screen.getByText(/Protein/i)).toBeInTheDocument();
    expect(screen.getByText(/Rice/i)).toBeInTheDocument();
  });

  test('handles edge case when minScore equals maxScore', async () => {
    // Dummy recommendations data where both items have the same score (50).
    const edgeRecommendations = {
      recommended_foods: {
        Snacks: [
          { food_id: 10, name: "Chips", score: 50 },
          { food_id: 11, name: "Nuts", score: 50 },
        ],
      }
    };
    mockedApi.get.mockImplementation((url) => {
      if (url.startsWith('/api/recommendations/')) {
        return Promise.resolve({ data: edgeRecommendations });
      }
      if (url === '/api/health-profile/detail/') {
        return Promise.resolve({ data: dummyProfile });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={['/recommendations?goal=maintain&region=EU']}>
          <Recommendations />
        </MemoryRouter>
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Chips/i)).toBeInTheDocument();
    });
    // As both cards use the fallback, ensure that at least one "50" is rendered.
    const scoreElements = screen.getAllByText('50');
    expect(scoreElements.length).toBeGreaterThan(0);
  });
});
