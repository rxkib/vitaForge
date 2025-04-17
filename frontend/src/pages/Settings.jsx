// src/pages/Settings.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import { HelpCircle } from "lucide-react";

function Settings() {
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);
  const [feedbackText, setFeedbackText] = useState("");
  const [userCases, setUserCases] = useState([]);

  // Delete account function (unchanged)
  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action is irreversible and will remove all your data."
      )
    ) {
      try {
        await api.delete("/api/user/me/");
        alert("Account deleted successfully");
        navigate("/login");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Error deleting account. Please try again.");
      }
    }
  };

  // Delete meal plan function (unchanged)
  const handleDeleteMealPlan = async () => {
    if (
      window.confirm("Are you sure you want to delete your saved meal plan?")
    ) {
      try {
        await api.delete("/api/meal-plan/");
        alert("Meal plan deleted successfully");
      } catch (error) {
        console.error("Error deleting meal plan:", error);
        alert("Error deleting meal plan. Please try again.");
      }
    }
  };

  // New feedback submission function
  const handleSendFeedback = async () => {
    if (feedbackText.trim() === "") {
      alert("Please enter your feedback or complaint.");
      return;
    }
    try {
      // Post feedback (creates a new case at the top level)
      await api.post("/api/feedback/", { message: feedbackText });
      alert("Thank you for your feedback!");
      setFeedbackText("");
      fetchUserCases(); // Refresh the cases list after submission
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Error submitting feedback. Please try again.");
    }
  };

  // Function to fetch all feedback and filter to only this user's top-level cases
  const fetchUserCases = async () => {
    try {
      const res = await api.get("/api/feedback/");
      // Assuming the API returns: { feedbacks: [ ... ] }
      const allFeedback = res.data.feedbacks || [];
      // Filter only top-level cases (parent is null) and where the user is the current user
      const myCases = allFeedback.filter(
        (fb) =>
          fb.parent === null &&
          fb.user === (authState.user ? authState.user.username : "")
      );
      setUserCases(myCases);
    } catch (error) {
      console.error("Error fetching feedback cases:", error);
    }
  };

  // Fetch user's cases when the component mounts
  useEffect(() => {
    fetchUserCases();
  }, []);

  // Enhanced recursive component for displaying a case with replies, delete and reply options.
  function FeedbackCase({ feedback, refreshCases }) {
    const [showReplies, setShowReplies] = useState(false);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState("");

    const toggleReplies = () => setShowReplies((prev) => !prev);
    const toggleReplyForm = () => setShowReplyForm((prev) => !prev);

    const handleReplySubmit = async (e) => {
      e.preventDefault();
      if (replyText.trim() === "") return;
      try {
        // Post reply with the parent field set to the current feedback's id
        await api.post("/api/feedback/", {
          message: replyText,
          parent: feedback.id,
        });
        setReplyText("");
        setShowReplyForm(false);
        refreshCases();
      } catch (error) {
        console.error("Error posting reply:", error);
        alert("Error posting reply. Please try again.");
      }
    };

    const handleDelete = async () => {
      if (window.confirm("Are you sure you want to delete this message?")) {
        try {
          await api.delete(`/api/feedback/${feedback.id}/`);
          refreshCases();
          alert("Message deleted successfully.");
        } catch (error) {
          console.error("Error deleting message:", error);
          alert("Error deleting message. Please try again.");
        }
      }
    };

    return (
      <div className="feedback-item p-4 border rounded bg-gray-800 mb-2">
        <div className="flex justify-between items-center">
          <div>
            <strong>{feedback.user}</strong>{" "}
            <span className="text-sm text-gray-400">{feedback.created_at}</span>
          </div>
          <div>
            <button className="btn btn-sm" onClick={toggleReplies}>
              {showReplies ? "Hide Replies" : "Show Replies"}
            </button>
            {/* Always show the Reply button */}
            <button className="btn btn-sm ml-2" onClick={toggleReplyForm}>
              {showReplyForm ? "Cancel" : "Reply"}
            </button>
            {/* Allow deletion if the message belongs to the user */}
            {feedback.user === authState.user.username && (
              <button
                className="btn btn-sm btn-error ml-2"
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <p className="mt-2">{feedback.message}</p>
        {showReplyForm && (
          <form onSubmit={handleReplySubmit} className="mt-2">
            <textarea
              className="textarea textarea-bordered w-full"
              rows="2"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Enter your reply..."
            ></textarea>
            <button type="submit" className="btn btn-primary mt-1">
              Send Reply
            </button>
          </form>
        )}
        {showReplies && feedback.replies && feedback.replies.length > 0 && (
          <div className="ml-4 border-l pl-2 mt-2">
            {feedback.replies.map((reply) => (
              <FeedbackCase
                key={reply.id}
                feedback={reply}
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
          <ul className="menu menu-horizontal p-0 text-white">
            <li>
              <Link to="/plans" className="text-white">
                Plans
              </Link>
            </li>
            <li>
              <Link to="/profile" className="text-white">
                View Profile
              </Link>
            </li>
            <li>
              <Link to="/logout" className="text-white">
                Logout
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="pt-20 container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">
          Settings
        </h1>
        <div className="grid gap-8">
          {/* Account Settings Section */}
          <div className="card bg-gray-800 shadow-md rounded p-6 text-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Account Settings
            </h2>
            <p className="mb-4 text-gray-400">
              Manage your account details and view your profile.
            </p>
            <Link to="/profile" className="btn btn-primary">
              View Profile
            </Link>
          </div>

          {/* Delete Account Section */}
          <div className="card bg-gray-800 shadow-md rounded p-6 text-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Delete Account
            </h2>
            <p className="mb-4 text-gray-400">
              Warning: Deleting your account is irreversible. All your data will
              be permanently removed.
            </p>
            <button onClick={handleDeleteAccount} className="btn btn-error">
              Delete Account
            </button>
          </div>

          {/* Delete Meal Plan Section */}
          <div className="card bg-gray-800 shadow-md rounded p-6 text-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Delete Meal Plan
            </h2>
            <p className="mb-4 text-gray-400">
              If you have a saved meal plan, you can delete it and generate a
              new one.
            </p>
            <button onClick={handleDeleteMealPlan} className="btn btn-warning">
              Delete Meal Plan
            </button>
          </div>

          {/* Data & Privacy Section */}
          <div className="card bg-gray-800 shadow-md rounded p-6 text-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Data & Privacy
            </h2>
            <p className="mb-4 text-gray-400">
              All your data is securely recorded in our database. We adhere to
              standard data protection practices as expected in a typical
              fitness app.
            </p>
          </div>

          {/* About Section */}
          <div className="card bg-gray-800 shadow-md rounded p-6 text-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-white">About</h2>
            <p className="mb-2 text-gray-400">App Version: 1.0.0</p>
            <p className="mb-2 text-gray-400">Credits: Md Rakibul Hasan</p>
            <p className="mb-2 text-gray-400">Contact: rakibsaysxo@gmail.com</p>
          </div>

          {/* Help & Feedback Section */}
          <div className="card bg-gray-800 shadow-md rounded p-6 text-gray-200">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold mb-0 text-white">
                Help & Feedback
              </h2>
              <div
                className="ml-2 tooltip tooltip-warning text-lg"
                data-tip="To check admin responses, scroll to ‘Your Cases’ below and click ‘Show replies’."
              >
                <HelpCircle className="w-5 h-5 text-white cursor-pointer" />
              </div>
            </div>
            <textarea
              placeholder="Enter your complaint or feedback..."
              className="textarea textarea-bordered w-full bg-gray-700 text-gray-100"
              rows="4"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            ></textarea>
            <button onClick={handleSendFeedback} className="btn btn-info mt-4">
              Send Feedback
            </button>
          </div>

          {/* Your Cases Section */}
          <div className="card bg-gray-800 shadow-md rounded p-6 mt-8 text-gray-200">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold mb-0.5 text-white">Your Cases</h2>
              <div
                className="ml-2 tooltip tooltip-info text-lg"
                data-tip="If ‘Show Replies’ doesn’t open anything, it means the admin hasn’t responded yet, please wait."
              >
                <HelpCircle className="w-5 h-5 text-white cursor-pointer" />
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
    </div>
  );
}

export default Settings;
