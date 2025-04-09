// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import FeedbackThread from "../components/FeedbackThread"; // Import our updated component

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch feedback from the backend.
  const fetchFeedbacks = async () => {
    try {
      const feedbackRes = await api.get("/api/feedback/");
      setFeedbacks(feedbackRes.data.feedbacks || []);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  // Fetch admin data on mount.
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch registered users.
        const usersRes = await api.get("/api/admin-dashboard/");
        setUsers(usersRes.data.users || []);

        // Fetch saved meal plans.
        const mealPlanRes = await api.get("/api/admin/meal-plans/");
        setMealPlans(mealPlanRes.data || []);

        // Fetch user feedback.
        await fetchFeedbacks();
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Delete functions for users and meal plans remain unchanged.
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/api/admin/delete-user/${userId}/`);
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        alert("User deleted successfully.");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error deleting user. Please try again.");
      }
    }
  };

  const handleDeleteMealPlan = async (planId) => {
    if (window.confirm("Are you sure you want to delete this meal plan?")) {
      try {
        await api.delete(`/api/meal-plan/${planId}/`);
        setMealPlans((prev) => prev.filter((plan) => plan.id !== planId));
        alert("Meal plan deleted successfully.");
      } catch (error) {
        console.error("Error deleting meal plan:", error);
        alert("Error deleting meal plan. Please try again.");
      }
    }
  };

  // Delete feedback using its DELETE endpoint.
  // Note: This function is passed to FeedbackThread which only shows delete
  // for items authored by the admin.
  const handleDeleteFeedback = async (feedbackId) => {
    if (window.confirm("Are you sure you want to delete this reply?")) {
      try {
        await api.delete(`/api/feedback/${feedbackId}/`);
        await fetchFeedbacks(); // Refresh feedback list.
        alert("Feedback deleted successfully.");
      } catch (error) {
        console.error("Error deleting feedback:", error);
        alert("Error deleting feedback. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading admin data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Navbar */}
      <div className="navbar bg-gray-800 shadow-lg fixed top-0 left-0 w-full z-50">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost normal-case text-xl">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 mr-2" />
            vitaForge Admin
          </Link>
        </div>
        <div className="navbar-end">
          <ul className="menu menu-horizontal p-0">
            <li>
              <Link to="/settings" className="text-white">
                Settings
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

      <div className="pt-20 container mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Admin Dashboard</h1>

        {/* Registered Users Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Registered Users</h2>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <table className="table-auto w-full bg-gray-800">
              <thead>
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Username</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Admin</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-700">
                    <td className="px-4 py-2">{user.id}</td>
                    <td className="px-4 py-2">{user.username}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      {user.is_staff ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn btn-error btn-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* User Feedback Section with threaded replies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">User Feedback</h2>
          {feedbacks.length === 0 ? (
            <p>No feedback available.</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb) => (
                <FeedbackThread
                  key={fb.id}
                  feedback={fb}
                  refreshFeedback={fetchFeedbacks}
                  onDeleteFeedback={handleDeleteFeedback}
                />
              ))}
            </div>
          )}
        </div>

        {/* Saved Meal Plans Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Saved Meal Plans</h2>
          {mealPlans.length === 0 ? (
            <p>No saved meal plans available.</p>
          ) : (
            <div className="space-y-4">
              {mealPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border p-4 rounded bg-gray-800 border-gray-700"
                >
                  <p>
                    <strong>User:</strong>{" "}
                    {plan.user_name || "Unknown"}
                  </p>
                  <div className="mt-2">
                    <strong>Plan:</strong>
                    <ul className="ml-4 mt-1">
                      {Object.entries(plan.plan).map(([food, portion]) => (
                        <li key={food}>
                          {food}: {parseFloat(portion).toFixed(1)} g
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    <strong>Date:</strong> {plan.created_at}
                  </p>
                  <button
                    onClick={() => handleDeleteMealPlan(plan.id)}
                    className="btn btn-error btn-sm mt-2"
                  >
                    Delete Meal Plan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
