import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { HelpCircle } from "lucide-react";

function MealPlanResults() {
  const location = useLocation();
  const { daily_targets, meal_plan } = location.state || {};
  const [saveStatus, setSaveStatus] = useState(null);
  const navigate = useNavigate();

  if (!daily_targets || !meal_plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <p className="text-xl">No meal plan data available.</p>
      </div>
    );
  }

  const handleSavePlan = async () => {
    try {
      const payload = { plan: meal_plan, daily_targets };
      await api.post("/api/meal-plan/", payload);
      setSaveStatus("Plan saved successfully!");
    } catch (error) {
      console.error("Error saving plan:", error);
      setSaveStatus("Error saving plan.");
    }
  };

  const handleCreateNewPlan = async () => {
    if (
      window.confirm(
        "Are you sure you want to create a new plan? This will delete your current saved plan."
      )
    ) {
      try {
        await api.delete("/api/meal-plan/");
        // Redirect to Plans to start over with goal and region selection
        navigate("/plans");
      } catch (error) {
        console.error("Error deleting saved plan:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Navbar Header */}
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

      {/* Page Header Section */}
      <div className="flex justify-center mt-20">
        <h1 className="text-4xl font-bold">Daily Meal Plan</h1>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <section className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-2xl text-green-700 font-semibold">
              Daily Targets
            </h2>
            <div
              className="ml-2 tooltip tooltip-warning text-lg"
              data-tip="Calculated from your TDEE (Total Daily Energy Expenditure)."
            >
              <HelpCircle className="w-5 h-5 text-green-700 cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Calories", value: daily_targets.calories },
              { label: "Carbs (g)", value: daily_targets.carbs },
              { label: "Protein (g)", value: daily_targets.protein },
              { label: "Fat (g)", value: daily_targets.fat },
              { label: "Fiber (g)", value: daily_targets.fiber },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-4 bg-white rounded shadow-md border border-green-200"
              >
                <h3 className="text-xl text-green-500 font-bold">{label}</h3>
                <p className="text-gray-700 font-medium">
                  {Number(value).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-semibold">Meal Plan</h2>
            <div
              className="ml-2 tooltip tooltip-right tooltip-warning text-lg"
              data-tip="Our algorithm may sometimes make mistakes, and these proportions aren’t always perfectly accurate."
            >
              <HelpCircle className="w-5 h-5 text-gray-500 hover:text-gray-200 cursor-pointer" />
            </div>
          </div>

          <div className="mb-6">
            <div className="p-6 bg-white rounded-lg shadow-md border border-green-200">
              <h3 className="text-xl text-green-700 font-bold mb-3">
                Optimized Plan
              </h3>
              <ul className="divide-y divide-gray-200">
                {Object.entries(meal_plan).map(([foodName, portion]) => (
                  <li
                    key={foodName}
                    className="py-2 flex justify-between bg-green-50 px-2 rounded text-green-600 font-semibold"
                  >
                    <span>{foodName}</span>
                    <span>{Number(portion).toFixed(1)} g</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {saveStatus && <p className="text-center text-lg">{saveStatus}</p>}
          <br />
          <div className="flex justify-center space-x-4">
            <div
              className="tooltip tooltip-content"
              data-tip="Saves the plan to the database. Next time you click ‘Plans’, you'll see this stored meal plan."
            >
              <button onClick={handleSavePlan} className="btn btn-success">
                Save Plan
              </button>
            </div>
            <div
              className="tooltip tooltip-content"
              data-tip="Discards your current plan and restarts the meal‐planning process from the beginning."
            >
              <button onClick={handleCreateNewPlan} className="btn btn-warning">
                Create New Plan
              </button>
            </div>
          </div>
        </section>
      </main>
      <div className="flex justify-center pb-20">
        <Link to="/recommendations" className="btn btn-primary">
          Back to Recommendations
        </Link>
      </div>
    </div>
  );
}

export default MealPlanResults;
