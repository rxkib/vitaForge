// src/components/WeightCard.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../api";

function WeightCard() {
  const [weights, setWeights] = useState([]);
  const [newWeight, setNewWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchWeights();
  }, []);

  const fetchWeights = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/health-profile/weight/");
      setWeights(res.data);
    } catch (error) {
      console.error("Error fetching weight data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeight = async () => {
    if (!newWeight) return;
    try {
      const res = await api.post("/api/health-profile/weight/", {
        weight: parseFloat(newWeight),
      });
      setWeights(res.data);
      setNewWeight("");
      setShowForm(false);
    } catch (error) {
      console.error("Error adding weight:", error);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl p-4 w-full h-full">
      <h2 className="text-xl font-bold mb-2">Weight Tracking</h2>
      {loading ? (
        <p>Loading weight data...</p>
      ) : weights.length === 0 ? (
        <p>No weight data yet.</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weights}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              {/* Draw only horizontal grid lines */}
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#333", borderColor: "#555" }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Line
                type="linear"
                dataKey="weight"
                name="Weight (kg)"
                stroke="#1976d2"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {!showForm ? (
        <div
          className="tooltip tooltip-info text-l"
          data-tip="Click to enter your current weight and save it to your 7-day history"
        >
          <button
            className="btn btn-primary mt-2"
            onClick={() => setShowForm(true)}
          >
            Log New Weight
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="number"
            step="0.1"
            className="input input-bordered w-full"
            placeholder="Enter new weight"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
          />
          <button className="btn btn-accent" onClick={handleAddWeight}>
            Save
          </button>
          <button className="btn" onClick={() => setShowForm(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default WeightCard;
