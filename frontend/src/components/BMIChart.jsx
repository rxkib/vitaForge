// src/components/BMIChart.jsx
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import api from "../api";

// Helper to determine BMI category text
const getBmiCategory = (bmi) => {
  if (bmi < 18.5) return "Underweight";
  else if (bmi < 25) return "Healthy";
  else if (bmi < 30) return "Overweight";
  else return "Obese";
};

function BMIChart({ height }) {
  const [bmiData, setBmiData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBmiData();
  }, []);

  const fetchBmiData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/health-profile/weight/");
      const weightHistory = res.data; // Expected: [{ date: "YYYY-MM-DD", weight: 80 }, ...]
      const data = weightHistory.map((record) => {
        const bmi = record.weight / Math.pow(height / 100, 2);
        return { date: record.date, bmi: parseFloat(bmi.toFixed(1)) };
      });
      setBmiData(data);
    } catch (error) {
      console.error("Error fetching BMI data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format date from "YYYY-MM-DD" to "MM-DD"
  const formatDate = (isoString) => {
    const [, month, day] = isoString.split("-");
    return `${month}-${day}`;
  };

  const latestBmi = bmiData.length > 0 ? bmiData[bmiData.length - 1].bmi : null;
  const bmiCategory = latestBmi !== null ? getBmiCategory(latestBmi) : "";

  return (
    <div className="card bg-base-100 shadow-xl p-4 w-full h-full">
      <h2 className="text-xl font-bold mb-2">BMI Trend</h2>
      {loading ? (
        <p>Loading BMI data...</p>
      ) : bmiData.length === 0 ? (
        <p>No BMI data available.</p>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={bmiData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                {/* Draw only horizontal grid lines */}
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis domain={[0, 40]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#333",
                    borderColor: "#555",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                />
                {/* Reference areas for BMI ranges */}
                <ReferenceArea
                  y1={0}
                  y2={18.5}
                  fill="#42A5F5"
                  fillOpacity={0.25}
                  label="Underweight"
                />
                <ReferenceArea
                  y1={18.5}
                  y2={25}
                  fill="#81C784"
                  fillOpacity={0.25}
                  label="Healthy"
                />
                <ReferenceArea
                  y1={25}
                  y2={30}
                  fill="#FFB74D"
                  fillOpacity={0.25}
                  label="Overweight"
                />
                <ReferenceArea
                  y1={30}
                  y2={40}
                  fill="#E57373"
                  fillOpacity={0.25}
                  label="Obese"
                />
                <Line
                  type="linear"
                  dataKey="bmi"
                  stroke="white"
                  strokeWidth={3}
                  dot={{ r: 1.5, fill: "white" }}
                  activeDot={{ r: 3, fill: "white" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2">
            Your current BMI is <strong>{latestBmi}</strong> – classified as{" "}
            <strong>{bmiCategory}</strong>.
          </p>
        </>
      )}
    </div>
  );
}

export default BMIChart;
