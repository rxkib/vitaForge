// src/pages/EditProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function EditProfile() {
  const navigate = useNavigate();
  const [dietaryPreference, setDietaryPreference] = useState("");
  const [healthConditions, setHealthConditions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch current profile details on mount and ensure health_conditions is an array
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/health-profile/detail/");
        setDietaryPreference(res.data.dietary_preference || "");
        const conditions = res.data.health_conditions;
        let conditionsArray = [];
        if (typeof conditions === "string") {
          conditionsArray = conditions
            ? conditions.split(",").map((s) => s.trim())
            : [];
        } else if (Array.isArray(conditions)) {
          conditionsArray = conditions;
        }
        setHealthConditions(conditionsArray);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setHealthConditions((prev) => {
      // Ensure we work with an array
      const current = Array.isArray(prev) ? prev : [];
      if (value === "none") {
        return checked ? ["none"] : current.filter((cond) => cond !== "none");
      } else {
        // Remove "none" if present
        let updated = current.filter((cond) => cond !== "none");
        if (checked) {
          if (!updated.includes(value)) {
            updated.push(value);
          }
        } else {
          updated = updated.filter((cond) => cond !== value);
        }
        return updated;
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Convert the health conditions array to a comma-separated string
    const payload = {
      dietary_preference: dietaryPreference,
      health_conditions: Array.isArray(healthConditions)
        ? healthConditions.join(", ")
        : healthConditions,
    };

    try {
      await api.patch("/api/health-profile/detail/", payload);
      alert("Profile updated successfully");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Edit Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dietary Preference */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Dietary Preference</span>
              </label>
              <select
                className="select select-bordered"
                value={dietaryPreference}
                onChange={(e) => setDietaryPreference(e.target.value)}
                required
              >
                <option value="">Select...</option>
                <option value="vegan">Vegan</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="gluten_free">Gluten-Free</option>
                <option value="non_vegetarian">Non-Vegetarian</option>
              </select>
            </div>

            {/* Health Conditions */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Health Conditions</span>
              </label>
              <div className="space-y-2">
                <label className="cursor-pointer label flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="diabetes"
                    className="checkbox checkbox-primary"
                    checked={healthConditions.includes("diabetes")}
                    onChange={handleCheckboxChange}
                  />
                  <span>Diabetes (Type 1 & 2)</span>
                </label>
                <label className="cursor-pointer label flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="hypertension"
                    className="checkbox checkbox-primary"
                    checked={healthConditions.includes("hypertension")}
                    onChange={handleCheckboxChange}
                  />
                  <span>Hypertension</span>
                </label>
                <label className="cursor-pointer label flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="heart_disease"
                    className="checkbox checkbox-primary"
                    checked={healthConditions.includes("heart_disease")}
                    onChange={handleCheckboxChange}
                  />
                  <span>Heart Disease</span>
                </label>
                <label className="cursor-pointer label flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="high_cholesterol"
                    className="checkbox checkbox-primary"
                    checked={healthConditions.includes("high_cholesterol")}
                    onChange={handleCheckboxChange}
                  />
                  <span>High Cholesterol</span>
                </label>
                <label className="cursor-pointer label flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="arthritis"
                    className="checkbox checkbox-primary"
                    checked={healthConditions.includes("arthritis")}
                    onChange={handleCheckboxChange}
                  />
                  <span>Arthritis</span>
                </label>
                <label className="cursor-pointer label flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="none"
                    className="checkbox checkbox-secondary"
                    checked={healthConditions.includes("none")}
                    onChange={handleCheckboxChange}
                  />
                  <span>None</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/profile")}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
