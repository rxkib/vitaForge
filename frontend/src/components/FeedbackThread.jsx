// src/components/FeedbackThread.jsx
import React, { useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

function ReplyForm({ parentId, onReplySubmitted }) {
  const [replyText, setReplyText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (replyText.trim() === "") return;
    try {
      // Post reply with the parent field set to the feedback id.
      await api.post("/api/feedback/", {
        message: replyText,
        parent: parentId,
      });
      setReplyText("");
      onReplySubmitted(); // Signal to refresh the thread
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Error posting your reply. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        className="textarea textarea-bordered w-full"
        rows="2"
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Enter your reply..."
      ></textarea>
      <button type="submit" className="btn btn-primary mt-1">
        Reply
      </button>
    </form>
  );
}

function FeedbackThread({ feedback, refreshFeedback, onDeleteFeedback }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { authState } = useContext(AuthContext);

  // Toggle display of reply form.
  const toggleReplyForm = () => setShowReplyForm((prev) => !prev);

  const formattedDate = feedback.created_at;

  // Dedicated delete handler to prevent duplicate events.
  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return; // Prevent multiple deletions
    setDeleting(true);
    if (window.confirm("Are you sure you want to delete this reply?")) {
      onDeleteFeedback(feedback.id);
    }
    setDeleting(false);
  };

  const renderReplies = (replies) => {
    if (!replies || replies.length === 0) return null;
    return (
      <div className="ml-4 border-l pl-2 mt-2">
        {replies.map((reply) => (
          <FeedbackThread
            key={reply.id}
            feedback={reply}
            refreshFeedback={refreshFeedback}
            onDeleteFeedback={onDeleteFeedback}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="feedback-item p-4 border rounded bg-gray-800 mb-2">
      <div className="flex justify-between items-center">
        <div>
          <strong>{feedback.user}</strong>{" "}
          <span className="text-sm text-gray-400">{formattedDate}</span>
        </div>
        <div>
          <button className="btn btn-sm" onClick={toggleReplyForm}>
            {showReplyForm ? "Cancel Reply" : "Reply"}
          </button>
          {feedback.user === authState.user.username && (
            <button
              className="btn btn-sm btn-error ml-2"
              onClick={handleDeleteClick}
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <p className="mt-2">{feedback.message}</p>
      {showReplyForm && (
        <ReplyForm parentId={feedback.id} onReplySubmitted={refreshFeedback} />
      )}
      {feedback.replies && feedback.replies.length > 0 && (
        <div className="ml-4 border-l pl-2 mt-2">
          {feedback.replies.map((reply) => (
            <FeedbackThread
              key={reply.id}
              feedback={reply}
              refreshFeedback={refreshFeedback}
              onDeleteFeedback={onDeleteFeedback}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedbackThread;
