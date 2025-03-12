// src/pages/Profile.jsx
import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import defaultUser from "../assets/default_user.jpg"; // Default user image

function Profile() {
  const { authState } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/health-profile/detail/");
        setProfile(res.data);
      } catch (error) {
        console.error("Failed to fetch health profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <p className="text-lg">Loading Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
        <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
        <p>Please update your health profile.</p>
      </div>
    );
  }

  const healthConditions = Array.isArray(profile.health_conditions)
    ? profile.health_conditions.length > 0
      ? profile.health_conditions.join(", ")
      : "None"
    : profile.health_conditions || "None";

  const userIdentifier = authState.user
    ? authState.user.email || authState.user.username || "User"
    : "User";

  return (
    <div className="min-h-screen bg-base-200">
      {/* Fixed Navbar */}
      <div className="navbar bg-base-100 shadow-lg fixed top-0 left-0 w-full z-50">
        <div className="navbar-start">
          <Link
            to="/"
            className="btn btn-ghost normal-case text-xl flex items-center"
          >
            <img src="/logo.png" alt="Logo" className="w-8 h-8 mr-2" />
            vitaForge
          </Link>
        </div>
        <div className="navbar-end">
          <ul className="menu menu-horizontal p-0">
            <li>
              <Link to="/plans">Plans</Link>
            </li>
            <li>
              <Link to="/profile">View Profile</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
            <li>
              <Link to="/logout">Logout</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content – centered */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-20 pb-10">
        <div className="card w-full max-w-3xl bg-base-100 shadow-2xl rounded-xl mx-auto">
          <div className="card-body">
            {/* Profile Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="card-title text-3xl font-bold">My Profile</h2>
                <p className="text-sm text-gray-500">
                  Welcome, {userIdentifier}
                </p>
              </div>
              <div className="avatar">
                <div className="w-20 rounded-full">
                  <img src={defaultUser} alt="User Avatar" />
                </div>
              </div>
            </div>

            <div className="divider"></div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="font-semibold">Age:</span>
                <p>{profile.age || "N/A"}</p>
              </div>
              <div>
                <span className="font-semibold">Height:</span>
                <p>{profile.height ? profile.height + " cm" : "N/A"}</p>
              </div>
              <div>
                <span className="font-semibold">Weight:</span>
                <p>{profile.weight ? profile.weight + " kg" : "N/A"}</p>
              </div>
              <div>
                <span className="font-semibold">Dietary Preference:</span>
                <p>{profile.dietary_preference || "N/A"}</p>
              </div>
            </div>

            <div className="mt-6">
              <span className="font-semibold">Health Conditions:</span>
              <p>{healthConditions}</p>
            </div>

            {/* Profile Actions */}
            <div className="card-actions justify-end mt-8">
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/home")}
              >
                Home
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/edit-profile")}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
