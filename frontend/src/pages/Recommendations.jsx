import React, { useState } from "react";
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

function fetchUserProfile() {
  return api.get("/api/health-profile/detail/").then((res) => res.data);
}

// Helper: Linearly interpolate between two colors (arrays of [r, g, b])
function interpolateColor(color1, color2, factor) {
  return color1.map((c, i) => Math.round(c + factor * (color2[i] - c)));
}

function Recommendations() {
  const queryParams = useQueryParams();
  const goal = queryParams.get("goal") || "maintain";
  const region = queryParams.get("region") || "";
  const condition = queryParams.get("condition") || "";

  const {
    data: recommendations,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["recommendations", goal, region, condition],
    queryFn: () => fetchRecommendations(goal, region, condition),
    staleTime: 1000 * 60 * 5,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["healthProfile"],
    queryFn: fetchUserProfile,
    staleTime: 1000 * 60 * 5,
  });

  const [selectedFood, setSelectedFood] = useState(null);
  const closeModal = () => setSelectedFood(null);

  // Helper to display full goal text.
  const getGoalText = (goal) => {
    switch (goal) {
      case "lose":
        return "Losing Weight";
      case "gain":
        return "Gaining Weight";
      case "maintain":
        return "Maintaining Weight";
      default:
        return goal.charAt(0).toUpperCase() + goal.slice(1);
    }
  };

  // Colors: using light shades.
  const pureGreen = [16, 185, 129]; // bright green (Tailwind green-500)
  const midColor = [234, 179, 8]; // bright yellow (Tailwind yellow-500)
  const pureRed = [239, 68, 68]; // bright red (Tailwind red-500)

  // Compute background color based on index.
  const getCardBackground = (index, total) => {
    if (total === 1) return `rgba(${pureGreen.join(",")}, 0.8`;
    const mid = Math.floor(total / 2);
    let color;
    if (index <= mid) {
      const ratio = mid === 0 ? 0 : index / mid; // 0 (best) to 1 (mid)
      color = interpolateColor(pureGreen, midColor, ratio);
    } else {
      const ratio = (index - mid) / (total - 1 - mid); // 0 (mid) to 1 (worst)
      color = interpolateColor(midColor, pureRed, ratio);
    }
    return `rgba(${color.join(",")}, 0.8)`;
  };

  if (isLoading) return <div>Loading recommendations...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const categories = Object.keys(recommendations.recommended_foods);

  return (
    <div>
      {/* Navbar */}
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
      <br />
      <br />
      <br />

      {/* Header Section */}
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-2">
          Food Recommendations for {getGoalText(goal)}
        </h1>
        <br />
        {profileLoading ? (
          <p className="mb-4 text-lg text-green-600 font-semibold">
            Your Health Condition(s): Loading...
          </p>
        ) : profile ? (
          <div className="mb-4 flex items-center space-x-3">
            <span className="text-lg font-semibold text-green-700">
              Your Health Condition(s):
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-lg font-bold">
              {profile.health_conditions || "None"}
            </span>
          </div>
        ) : null}
        <p className="mb-6 text-base text-gray-600">
          The score displayed as a superscript next to each food name represents
          a penalty-based measure indicating how well the food meets your
          nutrient targets. A higher (less negative) score means a closer match
          to the recommended nutrient limits.
        </p>

        {/* Food Cards Section per Category */}
        {categories.map((category) => {
          // Sort foods by score descending.
          const foods = [...recommendations.recommended_foods[category]].sort(
            (a, b) => b.score - a.score
          );
          return (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {foods.map((food, idx) => {
                  const bgColor = getCardBackground(idx, foods.length);
                  return (
                    <div
                      key={food.food_id}
                      className="border border-black rounded-lg p-4 shadow transition-shadow cursor-pointer"
                      style={{
                        backgroundColor: bgColor,
                      }}
                      onClick={() => setSelectedFood(food)}
                    >
                      <h3 className="text-xl font-semibold relative">
                        {food.name}
                        <sup className="absolute top-0 right-0 bg-green-50 text-xs text-green-700 rounded-full px-1">
                          {food.score}
                        </sup>
                      </h3>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <br />

      {/* Modal for Food Details */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closeModal}></div>
          <div className="relative bg-black bg-opacity-70 rounded-lg p-6 max-w-2xl w-full z-10 border border-white shadow-lg overflow-y-auto max-h-[80vh]">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-green-700 text-3xl leading-none hover:text-green-300 transition-colors"
            >
              &times;
            </button>
            <h2 className="text-3xl text-green-500 font-bold mb-6">
              {selectedFood.name}
            </h2>

            {/* Macronutrients Section */}
            <div className="mb-4">
              <h3 className="text-xl text-green-300 font-semibold mb-2">
                Macronutrients
              </h3>
              <div className="grid grid-cols-2 gap-2 text-green-100">
                <div>
                  <strong>Protein:</strong> {selectedFood.protein_g} g
                </div>
                <div>
                  <strong>Total Fat:</strong> {selectedFood.total_fat_g} g
                </div>
                <div>
                  <strong>Carbs:</strong>{" "}
                  {selectedFood.carbs
                    ? selectedFood.carbs
                    : selectedFood.total_available_cho_g}{" "}
                  g
                </div>
                <div>
                  <strong>Sugars:</strong> {selectedFood.total_free_sugars_g} g
                </div>
                <div>
                  <strong>Fiber:</strong> {selectedFood.dietary_fibre_g} g
                </div>
                <div>
                  <strong>Sat. Fat:</strong>{" "}
                  {selectedFood.total_saturated_fatty_acids_g} g
                </div>
                <div>
                  <strong>Cholesterol:</strong> {selectedFood.cholesterol_mg} mg
                </div>
                <div>
                  <strong>Sodium:</strong> {selectedFood.sodium_mg} mg
                </div>
                <div>
                  <strong>Potassium:</strong> {selectedFood.potassium_mg} mg
                </div>
                <div>
                  <strong>Linoleic:</strong> {selectedFood.linoleic_mg} mg
                </div>
                <div>
                  <strong>Energy:</strong> {selectedFood.energy_kj} kJ
                </div>
              </div>
            </div>

            {/* Vitamins Section */}
            <div className="mb-4">
              <h3 className="text-xl text-green-300 font-semibold mb-2">
                Vitamins
              </h3>
              <div className="grid grid-cols-2 gap-2 text-green-100">
                <div>
                  <strong>Vit. B1:</strong> {selectedFood.vitamin_b1_mg} mg
                </div>
                <div>
                  <strong>Vit. B2:</strong> {selectedFood.vitamin_b2_mg} mg
                </div>
                <div>
                  <strong>Vit. B3:</strong> {selectedFood.vitamin_b3_mg} mg
                </div>
                <div>
                  <strong>Vit. B5:</strong> {selectedFood.vitamin_b5_mg} mg
                </div>
                <div>
                  <strong>Vit. B6:</strong> {selectedFood.vitamin_b6_mg} mg
                </div>
                <div>
                  <strong>Vit. B7:</strong> {selectedFood.vitamin_b7_ug} µg
                </div>
                <div>
                  <strong>Vit. B9:</strong> {selectedFood.vitamin_b9_ug} µg
                </div>
                <div>
                  <strong>Vit. C:</strong> {selectedFood.vitamin_c_mg} mg
                </div>
                <div>
                  <strong>Retinol:</strong> {selectedFood.retinol_ug} µg
                </div>
                <div>
                  <strong>Vit. D2:</strong> {selectedFood.vitamin_d2_ug} µg
                </div>
                <div>
                  <strong>Vit. D3:</strong> {selectedFood.vitamin_d3_ug} µg
                </div>
                <div>
                  <strong>Vit. E:</strong> {selectedFood.alpha_tocopherol_eq_mg}{" "}
                  mg
                </div>
                <div>
                  <strong>Vit. K1:</strong> {selectedFood.vitamin_k1_ug} µg
                </div>
                <div>
                  <strong>Vit. K2:</strong> {selectedFood.vitamin_k2_ug} µg
                </div>
              </div>
            </div>

            {/* Minerals Section */}
            <div className="mb-4">
              <h3 className="text-xl text-green-300 font-semibold mb-2">
                Minerals
              </h3>
              <div className="grid grid-cols-2 gap-2 text-green-100">
                <div>
                  <strong>Calcium:</strong> {selectedFood.calcium_mg} mg
                </div>
                <div>
                  <strong>Chromium:</strong> {selectedFood.chromium_mg} mg
                </div>
                <div>
                  <strong>Copper:</strong> {selectedFood.copper_mg} mg
                </div>
                <div>
                  <strong>Iron:</strong> {selectedFood.iron_mg} mg
                </div>
                <div>
                  <strong>Magnesium:</strong> {selectedFood.magnesium_mg} mg
                </div>
                <div>
                  <strong>Manganese:</strong> {selectedFood.manganese_mg} mg
                </div>
                <div>
                  <strong>Molybdenum:</strong> {selectedFood.molybdenum_mg} mg
                </div>
                <div>
                  <strong>Phosphorus:</strong> {selectedFood.phophorous_mg} mg
                </div>
                <div>
                  <strong>Selenium:</strong> {selectedFood.selenium_ug} µg
                </div>
                <div>
                  <strong>Zinc:</strong> {selectedFood.zinc_mg} mg
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recommendations;
