import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function Settings() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("");

  // Function to delete the user's account
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

  // Function to delete the current saved meal plan (if it exists)
  const handleDeleteMealPlan = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your saved meal plan?"
      )
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

  // Function to handle feedback submission (placeholder)
  const handleSendFeedback = async () => {
    if (feedback.trim() === "") {
      alert("Please enter your feedback or complaint.");
      return;
    }
    // Placeholder for sending feedback to admin
    alert("Thank you for your feedback. This feature will be implemented soon.");
    setFeedback("");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Navbar */}
      <div className="navbar bg-gray-800 shadow-lg fixed top-0 left-0 w-full z-50">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost normal-case text-xl flex items-center text-white">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 mr-2" />
            vitaForge
          </Link>
        </div>
        <div className="navbar-end">
          <ul className="menu menu-horizontal p-0 text-white">
            <li>
              <Link to="/plans" className="text-white">Plans</Link>
            </li>
            <li>
              <Link to="/profile" className="text-white">View Profile</Link>
            </li>
            <li>
              <Link to="/logout" className="text-white">Logout</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="pt-20 container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">Settings</h1>
        <div className="grid gap-8">
          {/* Account Settings Section */}
          <div className="card bg-gray-800 shadow-md rounded p-6 text-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-white">Account Settings</h2>
            <p className="mb-4 text-gray-400">
              Manage your account details and view your profile.
            </p>
            <Link to="/profile" className="btn btn-primary">
              View Profile
            </Link>
          </div>

          {/* Delete Account Section */}
          <div className="card bg-gray-800 shadow-md rounded p-6 text-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-white">Delete Account</h2>
            <p className="mb-4 text-gray-400">
              Warning: Deleting your account is irreversible. All your data will be permanently removed.
            </p>
            <button onClick={handleDeleteAccount} className="btn btn-error">
              Delete Account
            </button>
          </div>

          {/* Delete Meal Plan Section */}
          <div className="card bg-gray-800 shadow-md rounded p-6 text-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-white">Delete Meal Plan</h2>
            <p className="mb-4 text-gray-400">
              If you have a saved meal plan, you can delete it and generate a new one.
            </p>
            <button onClick={handleDeleteMealPlan} className="btn btn-warning">
              Delete Meal Plan
            </button>
          </div>

          {/* Data & Privacy Section */}
          <div className="card bg-gray-800 shadow-md rounded p-6 text-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-white">Data & Privacy</h2>
            <p className="mb-4 text-gray-400">
              All your data is securely recorded in our database. We adhere to standard data protection practices as expected in a typical fitness app.
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
            <h2 className="text-2xl font-bold mb-4 text-white">Help & Feedback</h2>
            <textarea
              placeholder="Enter your complaint or feedback..."
              className="textarea textarea-bordered w-full bg-gray-700 text-gray-100"
              rows="4"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            ></textarea>
            <button onClick={handleSendFeedback} className="btn btn-info mt-4">
              Send Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
