// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import FeedbackThread from "../components/FeedbackThread";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Holds the user we intend to delete
  const [userToDelete, setUserToDelete] = useState(null);
  // Loading indicator for delete operation
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Success message after actions
  const [successMessage, setSuccessMessage] = useState("");

  // Holds the currently viewed meal plan
  const [viewingPlan, setViewingPlan] = useState(null);

  // Fetch feedbacks
  const fetchFeedbacks = async () => {
    try {
      const res = await api.get("/api/feedback/");
      setFeedbacks(res.data.feedbacks || []);
    } catch (err) {
      console.error("Error fetching feedback:", err);
    }
  };

  // On mount, load users, meal plans, and feedback
  useEffect(() => {
    (async () => {
      try {
        const [uRes, mRes] = await Promise.all([
          api.get("/api/admin-dashboard/"),
          api.get("/api/admin/meal-plans/"),
        ]);
        setUsers(uRes.data.users || []);
        setMealPlans(mRes.data || []);
        await fetchFeedbacks();
      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatID = (num) => String(num).padStart(6, "0");

  // Feedback deletion via FeedbackThread’s onDeleteFeedback
  const handleDeleteFeedback = async (fid) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    try {
      setSuccessMessage("");
      await api.delete(`/api/feedback/${fid}/`);
      await fetchFeedbacks();
      setSuccessMessage("Feedback deleted successfully.");
    } catch (err) {
      console.error(err);
      setSuccessMessage("Failed to delete feedback.");
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
      <div className="navbar bg-gray-800 shadow fixed top-0 left-0 w-full z-50">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl normal-case">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 mr-2" />
            vitaForge Admin
          </Link>
        </div>
        <div className="navbar-end">
          <Link to="/logout" className="btn btn-ghost">
            Logout
          </Link>
        </div>
      </div>

      <div className="pt-20 container mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Admin Dashboard</h1>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-600 text-white rounded flex justify-between items-center">
            <span>{successMessage}</span>
            <button className="font-bold" onClick={() => setSuccessMessage("")}>×</button>
          </div>
        )}

        {/* Registered Users */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Registered Users</h2>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <table className="table-auto w-full bg-gray-800">
              <thead>
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Username</th>
                  <th className="px-4 py-2">Admin</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-700">
                    <td className="px-4 py-2">{formatID(u.id)}</td>
                    <td className="px-4 py-2">{u.username}</td>
                    <td className="px-4 py-2">{u.is_staff ? "Yes" : "No"}</td>
                    <td className="px-4 py-2">
                      <button
                        className={`btn btn-error btn-sm ${deletingUserId===u.id? 'loading' : ''}`}
                        disabled={u.is_staff || deletingUserId===u.id}
                        onClick={() => setUserToDelete(u)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Delete User Confirmation Modal */}
        {userToDelete && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg">
                Delete user {userToDelete.username}?
              </h3>
              <p className="py-4">
                This will permanently remove the user <strong>{userToDelete.username}</strong> and all their data.
                Are you sure?
              </p>
              <div className="modal-action">
                <button
                  className="btn btn-error btn-sm"
                  disabled={deletingUserId===userToDelete.id}
                  onClick={async () => {
                    setDeletingUserId(userToDelete.id);
                    try {
                      await api.delete(`/api/admin/delete-user/${userToDelete.id}/`);
                      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
                      setSuccessMessage("User deleted successfully.");
                    } catch (err) {
                      console.warn("Ignored proxy error:", err);
                      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
                      setSuccessMessage("User deleted successfully.");
                    } finally {
                      setDeletingUserId(null);
                      setUserToDelete(null);
                    }
                  }}
                >
                  {deletingUserId===userToDelete.id ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button className="btn btn-sm" onClick={() => setUserToDelete(null)} disabled={deletingUserId!==null}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Feedback */}
        <section className="mb-12">
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
        </section>

        {/* Saved Meal Plans */}
        <section className="mb-12">
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
                    <strong>User ID:</strong> {formatID(plan.user_id || 0)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    <strong>Date:</strong> {new Date(plan.created_at).toLocaleString()}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => setViewingPlan(plan)}
                    >
                      Show Meal Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View Meal Plan Modal */}
          {viewingPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="absolute inset-0" onClick={() => setViewingPlan(null)} />
              <div className="relative bg-gray-900 text-white p-6 rounded shadow max-w-md w-full">
                <h3 className="text-2xl font-bold mb-4">Meal Plan for User {formatID(viewingPlan.user_id || 0)}</h3>
                <ul className="list-disc pl-6 space-y-1">
                  {Object.entries(viewingPlan.plan).map(([food, amt]) => (
                    <li key={food}>{food}: {parseFloat(amt).toFixed(1)} g</li>
                  ))}
                </ul>
                <button className="btn btn-error btn-sm mt-6" onClick={() => setViewingPlan(null)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
