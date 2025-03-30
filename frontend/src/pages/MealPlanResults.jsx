import React from "react";
import { useLocation, Link } from "react-router-dom";

function MealPlanResults() {
  const location = useLocation();
  const { daily_targets, meal_plan } = location.state || {};

  if (!daily_targets || !meal_plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl">No meal plan data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue">
      <header className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold">Daily Meal Plan</h1>
          <p className="mt-2 text-lg">
            Your personalized plan based on your TDEE and macro ratios.
          </p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-2xl text-green-700 font-semibold mb-4">
            Daily Targets
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded shadow">
              <h3 className="text-xl text-green-500 font-bold">Calories</h3>
              <p className="text-gray-700">
                {daily_targets.calories.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h3 className="text-xl text-green-500 font-bold">Carbs (g)</h3>
              <p className="text-gray-700">{daily_targets.carbs.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h3 className="text-xl text-green-500 font-bold">Protein (g)</h3>
              <p className="text-gray-700">
                {daily_targets.protein.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h3 className="text-xl text-green-500 font-bold">Fat (g)</h3>
              <p className="text-gray-700">{daily_targets.fat.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h3 className="text-xl text-green-500 font-bold">Fiber (g)</h3>
              <p className="text-gray-700">{daily_targets.fiber.toFixed(2)}</p>
            </div>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4">Meal Plan</h2>
          <div className="mb-6">
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <h3 className="text-xl text-green-700 font-bold mb-3">
                Optimized Plan
              </h3>
              <ul className="divide-y divide-gray-200">
                {Object.entries(meal_plan).map(([foodName, portion]) => (
                  <li
                    key={foodName}
                    className="py-2 text-green-500 flex justify-between"
                  >
                    <span className="font-medium">{foodName}</span>
                    <span className="text-gray-600">
                      {Number(portion).toFixed(1)} g
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <div className="mt-8 text-center">
          <Link to="/plans" className="text-blue-600 hover:underline">
            Back to Plans
          </Link>
        </div>
      </main>
    </div>
  );
}

export default MealPlanResults;
