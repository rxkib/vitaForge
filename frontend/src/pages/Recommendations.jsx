// src/pages/Recommendations.jsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "react-router-dom";
import api from "../api";

function useQueryParams() {
  return new URLSearchParams(useLocation().search);
}

function fetchRecommendations(goal, region, condition) {
  let url = `/api/recommendations/?goal=${goal}&region=${region}`;
  if (condition) {
    url += `&condition=${condition}`;
  }
  return api.get(url).then((res) => res.data);
}

function Recommendations() {
  const queryParams = useQueryParams();
  const goal = queryParams.get("goal") || "maintain";
  const region = queryParams.get("region") || "";
  const condition = queryParams.get("condition") || ""; // override if provided

  const { data, error, isLoading } = useQuery({
    queryKey: ["recommendations", goal, region, condition],
    queryFn: () => fetchRecommendations(goal, region, condition),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <div>Loading recommendations...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const categories = Object.keys(data.recommended_foods);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">
        Food Recommendations for {goal} (based on your conditions)
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        The small score displayed as a superscript next to the food name is a
        penalty-based measure. A higher (less negative) score means the food is
        closer to meeting the recommended nutrient limits for your conditions.
      </p>
      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recommended_foods[category].map((food) => (
              <div
                key={food.food_id}
                className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow relative"
              >
                <h3 className="text-xl font-semibold">
                  {food.name}
                  <sup className="absolute top-0 right-0 bg-gray-200 text-xs text-gray-700 rounded-full px-1">
                    {food.score}
                  </sup>
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  <strong>Carbs:</strong> {food.carbs} g,{" "}
                  <strong>Sugars:</strong> {food.free_sugars} g,{" "}
                  <strong>Fiber:</strong> {food.fiber} g,{" "}
                  <strong>Sat. Fat:</strong> {food.saturated_fat_g} g,{" "}
                  <strong>Cholesterol:</strong> {food.cholesterol_mg} mg,{" "}
                  <strong>Sodium:</strong> {food.sodium_mg} mg,{" "}
                  <strong>Potassium:</strong> {food.potassium_mg} mg,{" "}
                  <strong>Linoleic:</strong> {food.linoleic_mg} mg
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-4">
        <Link to="/home" className="text-blue-500 underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default Recommendations;
