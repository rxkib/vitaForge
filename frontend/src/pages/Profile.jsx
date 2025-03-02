// src/pages/Profile.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import defaultUser from "../assets/default_user.jpg"; // Import your default user image

function Profile() {
  const { authState } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/health-profile/detail/");
        console.log("Profile data:", res.data);
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

  // Ensure health_conditions is an array before joining
  const healthConditions = Array.isArray(profile.health_conditions)
    ? profile.health_conditions.length > 0
      ? profile.health_conditions.join(", ")
      : "None"
    : profile.health_conditions || "None";

  // Use email or fallback to username from the decoded token
  const userIdentifier = authState.user
    ? authState.user.email || authState.user.username || "User"
    : "User";

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-3xl bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Profile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="card-title text-3xl font-bold">My Profile</h2>
              <p className="text-sm text-gray-500">Welcome, {userIdentifier}</p>
            </div>
            <div className="avatar">
              <div className="w-16 rounded-full">
                <img src={defaultUser} alt="User Avatar" />
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="mt-4">
            <span className="font-semibold">Health Conditions:</span>
            <p>{healthConditions}</p>
          </div>

          {/* Edit Profile Button */}
          <div className="card-actions justify-end mt-6">
            <button className="btn btn-primary">Edit Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
