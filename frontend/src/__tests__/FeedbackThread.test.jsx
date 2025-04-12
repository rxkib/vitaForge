// src/__tests__/FeedbackThread.test.jsx
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedbackThread from '../components/FeedbackThread';
import { AuthContext } from '../context/AuthContext';
import { vi } from 'vitest';
import api from '../api';

// Set up a dummy auth state where current user is "john_doe".
const dummyAuthState = { user: { username: 'john_doe' } };

// Dummy feedback object with no nested replies.
const dummyFeedback = {
  id: 1,
  user: 'john_doe',
  message: 'Test feedback message',
  created_at: '2021-01-01',
  replies: [],
};

// Dummy feedback with one nested reply.
const feedbackWithReply = {
  id: 2,
  user: 'john_doe',
  message: 'Parent feedback',
  created_at: '2021-01-01',
  replies: [
    {
      id: 3,
      user: 'john_doe',
      message: 'Nested reply',
      created_at: '2021-01-02',
      replies: [],
    },
  ],
};

// Mock the API module so that we can spy on post calls.
vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
  },
}));
const mockedApi = api; // our mocked API

describe('FeedbackThread Component', () => {
  // Dummy functions for refreshFeedback and onDeleteFeedback.
  const dummyRefresh = vi.fn();
  const dummyOnDelete = vi.fn();

  // Utility function to render the component wrapped in AuthContext.
  const renderFeedbackThread = (feedbackObject) =>
    render(
      <AuthContext.Provider value={{ authState: dummyAuthState }}>
        <FeedbackThread
          feedback={feedbackObject}
          refreshFeedback={dummyRefresh}
          onDeleteFeedback={dummyOnDelete}
        />
      </AuthContext.Provider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders feedback details correctly', () => {
    renderFeedbackThread(dummyFeedback);
    // Check that the user's name, message, and date are rendered.
    expect(screen.getByText('john_doe')).toBeInTheDocument();
    expect(screen.getByText('Test feedback message')).toBeInTheDocument();
    expect(screen.getByText('2021-01-01')).toBeInTheDocument();
    // The "Reply" toggle button should be rendered.
    expect(screen.getByRole('button', { name: /reply/i })).toBeInTheDocument();
    // Since feedback.user === current user, Delete button should appear.
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('toggles reply form when "Reply" is clicked', async () => {
    renderFeedbackThread(dummyFeedback);
    const replyToggleButton = screen.getByRole('button', { name: /reply/i });
    // Initially, the reply form is not rendered.
    expect(screen.queryByPlaceholderText(/enter your reply/i)).toBeNull();

    // Click "Reply" to open the form.
    await userEvent.click(replyToggleButton);
    expect(screen.getByPlaceholderText(/enter your reply/i)).toBeInTheDocument();
    // The toggle button text should now be "Cancel Reply".
    expect(screen.getByRole('button', { name: /cancel reply/i })).toBeInTheDocument();

    // Click "Cancel Reply" to close the form.
    await userEvent.click(screen.getByRole('button', { name: /cancel reply/i }));
    expect(screen.queryByPlaceholderText(/enter your reply/i)).toBeNull();
  });

  test('submits a reply and calls onReplySubmitted', async () => {
    // Set up the API post mock to resolve.
    mockedApi.post.mockResolvedValueOnce({});
    renderFeedbackThread(dummyFeedback);
    // Open the reply form.
    await userEvent.click(screen.getByRole('button', { name: /reply/i }));

    // Get the form element by finding the textarea and then its closest form.
    const replyTextarea = screen.getByPlaceholderText(/enter your reply/i);
    const replyForm = replyTextarea.closest('form');
    // Use within() to narrow down search within the form.
    const submitButton = within(replyForm).getByRole('button', { name: /^reply$/i });
    
    // Type in a reply.
    await userEvent.clear(replyTextarea); // Clear any prefilled text.
    await userEvent.type(replyTextarea, 'This is a reply');

    // Submit the reply using the button inside the form.
    await userEvent.click(submitButton);

    // Wait until the API call is made.
    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/api/feedback/', {
        message: 'This is a reply',
        parent: dummyFeedback.id,
      });
    });
    // Check that the refresh callback was called.
    expect(dummyRefresh).toHaveBeenCalled();
    // Ensure the reply textarea is cleared.
    expect(replyTextarea.value).toBe('');
  });

  test('calls onDeleteFeedback when delete button is clicked', async () => {
    // Override window.confirm to return true.
    window.confirm = vi.fn(() => true);
    renderFeedbackThread(dummyFeedback);
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this reply?');
    await waitFor(() => {
      expect(dummyOnDelete).toHaveBeenCalledWith(dummyFeedback.id);
    });
  });

  test('renders nested replies recursively', () => {
    renderFeedbackThread(feedbackWithReply);
    // Parent feedback should be rendered.
    expect(screen.getByText('Parent feedback')).toBeInTheDocument();
    // Nested reply should be rendered.
    expect(screen.getByText('Nested reply')).toBeInTheDocument();
  });
});
