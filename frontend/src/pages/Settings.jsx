// src/pages/Settings.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import api from "../api";
import { AuthContext } from "../context/AuthContext";

export default function Settings() {
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);

  const [feedbackText, setFeedbackText] = useState("");
  const [userCases, setUserCases] = useState([]);

  // Modal state flags
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeleteMealPlanModal, setShowDeleteMealPlanModal] = useState(false);

  // Fetch feedback cases
  const fetchUserCases = async () => {
    try {
      const res = await api.get("/api/feedback/");
      const all = res.data.feedbacks || [];
      const mine = all.filter(
        (fb) => fb.parent === null && fb.user === authState.user?.username
      );
      setUserCases(mine);
    } catch (err) {
      console.error("Error fetching feedback cases:", err);
    }
  };

  useEffect(() => {
    fetchUserCases();
  }, []);

  // Confirmed delete handlers
  const confirmDeleteAccount = async () => {
    try {
      await api.delete("/api/user/me/");
      alert("Account deleted successfully");
      navigate("/login");
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("Error deleting account. Please try again.");
    }
  };

  const confirmDeleteMealPlan = async () => {
    try {
      await api.delete("/api/meal-plan/");
      alert("Meal plan deleted successfully");
      setShowDeleteMealPlanModal(false);
    } catch (err) {
      console.error("Error deleting meal plan:", err);
      alert("Error deleting meal plan. Please try again.");
    }
  };

  // Feedback submission
  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      alert("Please enter your feedback or complaint.");
      return;
    }
    try {
      await api.post("/api/feedback/", { message: feedbackText });
      alert("Thank you for your feedback!");
      setFeedbackText("");
      fetchUserCases();
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("Error submitting feedback. Please try again.");
    }
  };

  // Recursive feedback component
  function FeedbackCase({ feedback, refreshCases }) {
    const [showReplies, setShowReplies] = useState(false);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState("");

    const toggleReplies = () => setShowReplies((p) => !p);
    const toggleReplyForm = () => setShowReplyForm((p) => !p);

    const handleReplySubmit = async (e) => {
      e.preventDefault();
      if (!replyText.trim()) return;
      try {
        await api.post("/api/feedback/", {
          message: replyText,
          parent: feedback.id,
        });
        setReplyText("");
        setShowReplyForm(false);
        refreshCases();
      } catch (err) {
        console.error("Error posting reply:", err);
        alert("Error posting reply. Please try again.");
      }
    };

    const handleDeleteMessage = async () => {
      setShowReplies(false);
      try {
        await api.delete(`/api/feedback/${feedback.id}/`);
        refreshCases();
        alert("Message deleted successfully.");
      } catch (err) {
        console.error("Error deleting message:", err);
        alert("Error deleting message. Please try again.");
      }
    };

    return (
      <div className="feedback-item p-4 border rounded bg-gray-800 mb-2">
        <div className="flex justify-between items-center">
          <div>
            <strong>{feedback.user}</strong>{" "}
            <span className="text-sm text-gray-400">{feedback.created_at}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="btn btn-sm" onClick={toggleReplies}>
              {showReplies ? "Hide Replies" : "Show Replies"}
            </button>
            <button className="btn btn-sm" onClick={toggleReplyForm}>
              {showReplyForm ? "Cancel" : "Reply"}
            </button>
            {feedback.user === authState.user.username && (
              <button
                className="btn btn-sm btn-error"
                onClick={handleDeleteMessage}
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-gray-200">{feedback.message}</p>
        {showReplyForm && (
          <form onSubmit={handleReplySubmit} className="mt-2">
            <textarea
              className="textarea textarea-bordered w-full"
              rows="2"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Enter your reply..."
            />
            <button type="submit" className="btn btn-primary mt-1">
              Send Reply
            </button>
          </form>
        )}
        {showReplies && feedback.replies?.length > 0 && (
          <div className="ml-4 border-l pl-2 mt-2">
            {feedback.replies.map((r) => (
              <FeedbackCase
                key={r.id}
                feedback={r}
                refreshCases={refreshCases}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Navbar */}
      <div className="navbar bg-gray-800 shadow-lg fixed top-0 left-0 w-full z-50">
        <div className="navbar-start">
          <Link
            to="/"
            className="btn btn-ghost normal-case text-xl flex items-center text-white"
          >
            <img src="/logo.png" alt="Logo" className="w-8 h-8 mr-2" />
            vitaForge
          </Link>
        </div>
        <div className="navbar-end">
          <ul className="menu menu-horizontal p-0 text-white space-x-4">
            <li>
              <Link to="/plans">Plans</Link>
            </li>
            <li>
              <Link to="/profile">View Profile</Link>
            </li>
            <li>
              <Link to="/logout">Logout</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">
          Settings
        </h1>
        <div className="grid gap-8">
          {/* Account Settings */}
          <div className="card bg-gray-800 p-6 text-gray-200">
            <h2 className="text-2xl text-white mb-2">Account Settings</h2>
            <p className="text-gray-400 mb-4">
              Manage your account details and view your profile.
            </p>
            <Link to="/profile" className="btn btn-primary">
              View Profile
            </Link>
          </div>

          {/* Delete Account */}
          <div className="card bg-gray-800 p-6 text-gray-200">
            <h2 className="text-2xl text-white mb-2">Delete Account</h2>
            <p className="text-gray-400 mb-4">
              This action is irreversible. All your data will be removed.
            </p>
            <button
              className="btn btn-error"
              onClick={() => setShowDeleteAccountModal(true)}
            >
              Delete Account
            </button>
          </div>

          {/* Delete Meal Plan */}
          <div className="card bg-gray-800 p-6 text-gray-200">
            <h2 className="text-2xl text-white mb-2">Delete Meal Plan</h2>
            <p className="text-gray-400 mb-4">
              Remove your saved meal plan and generate a new one.
            </p>
            <button
              className="btn btn-warning"
              onClick={() => setShowDeleteMealPlanModal(true)}
            >
              Delete Meal Plan
            </button>
          </div>

          {/* Data & Privacy */}
          <div className="card bg-gray-800 p-6 text-gray-200">
            <h2 className="text-2xl text-white mb-2">Data &amp; Privacy</h2>
            <p className="text-gray-400">
              The information users provide, such as health details and
              preferences, is stored securely within the system. A proper
              authentication process is in place, and standard privacy practices
              commonly used in any in-progress applications are followed to
              ensure that user data is handled responsibly.
            </p>
          </div>

          {/* About */}
          <div className="card bg-gray-800 p-6 text-gray-200">
            <h2 className="text-2xl text-white mb-2">About</h2>
            <p className="text-gray-400 mb-1">App Version: 1.0.0</p>
            <p className="text-gray-400 mb-1">Developed by: Md Rakibul Hasan</p>
            <p className="text-gray-400">Contact: rakibsaysxo@gmail.com</p>
          </div>

          {/* Help & Feedback */}
          <div className="card bg-gray-800 p-6 text-gray-200">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl text-white">Help & Feedback</h2>
              <div
                className="ml-2 tooltip tooltip-warning"
                data-tip="Scroll to 'Your Cases' below and click 'Show Replies' to see admin responses."
              >
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            <textarea
              placeholder="Enter your complaint or feedback..."
              className="textarea textarea-bordered w-full bg-gray-700 text-gray-100"
              rows="4"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <button className="btn btn-info mt-4" onClick={handleSendFeedback}>
              Send Feedback
            </button>
          </div>

          {/* Your Cases */}
          <div className="card bg-gray-800 p-6 text-gray-200">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl text-white mb-0.5">Your Cases</h2>
              <div
                className="ml-2 tooltip tooltip-info"
                data-tip="If ‘Show Replies’ shows nothing, the admin hasn’t replied yet."
              >
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            {userCases.length === 0 ? (
              <p className="text-gray-400">
                You haven’t submitted any cases yet.
              </p>
            ) : (
              <div className="space-y-4">
                {userCases.map((fb) => (
                  <FeedbackCase
                    key={fb.id}
                    feedback={fb}
                    refreshCases={fetchUserCases}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Account Deletion</h3>
            <p className="py-4">
              Are you sure you want to delete your account? This cannot be
              undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-error"
                onClick={() => {
                  confirmDeleteAccount();
                  setShowDeleteAccountModal(false);
                }}
              >
                Absolutely, Delete
              </button>
              <button
                className="btn"
                onClick={() => setShowDeleteAccountModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Meal Plan Modal */}
      {showDeleteMealPlanModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Saved Meal Plan?</h3>
            <p className="py-4">
              This will remove your current meal plan. You can generate a new
              one afterward.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-warning"
                onClick={() => {
                  confirmDeleteMealPlan();
                  setShowDeleteMealPlanModal(false);
                }}
              >
                Yes, Delete Plan
              </button>
              <button
                className="btn"
                onClick={() => setShowDeleteMealPlanModal(false)}
              >
                Keep Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
