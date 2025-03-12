// src/pages/Plans.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function Plans() {
  const navigate = useNavigate();
  // Step 1: Ask for weight goal; null means no selection yet.
  const [goal, setGoal] = useState(null);
  // Step 2: Show loading while "processing" the selected goal.
  const [loadingGoal, setLoadingGoal] = useState(false);

  // When a goal is chosen, simulate processing (e.g., ML generation) before showing the cards.
  const handleGoalSelection = (selectedGoal) => {
    setGoal(selectedGoal);
    setLoadingGoal(true);
    // Simulate a delay (for example, 3 seconds).
    setTimeout(() => {
      setLoadingGoal(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Navbar - same as Home */}
      <div className="navbar bg-base-100 shadow-lg fixed top-0 left-0 w-full z-50">
        {/* Left (navbar-start) */}
        <div className="navbar-start">
          <Link
            to="/"
            className="btn btn-ghost normal-case text-xl flex items-center"
          >
            <img src="/logo.png" alt="Logo" className="w-8 h-8 mr-2" />
            vitaForge
          </Link>
        </div>
        {/* Right (navbar-end) */}
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

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center p-4 mt-20">
        {/* Step 1: If no goal is selected, show prompt */}
        {!goal && !loadingGoal && (
          <div className="card w-full max-w-3xl mx-auto bg-base-200 shadow-2xl glass border border-base-content/10 animate__animated animate__fadeInDown">
            <div className="card-body text-center p-10">
              <h2 className="card-title mx-auto text-3xl font-bold mb-4">
                What's Your Goal?
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed tracking-wide">
                Choose an option to receive personalized recommendations.
              </p>
              {/* Button Row with wrapping enabled */}
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  className="btn btn-wide text-white font-bold transition-transform duration-300 ease-in-out 
                     bg-gradient-to-r from-blue-500 to-green-500 hover:scale-105 shadow-lg"
                  onClick={() => handleGoalSelection("lose")}
                >
                  Lose Weight
                </button>
                <button
                  className="btn btn-wide text-white font-bold transition-transform duration-300 ease-in-out 
                     bg-gradient-to-r from-pink-500 to-red-500 hover:scale-105 shadow-lg"
                  onClick={() => handleGoalSelection("gain")}
                >
                  Gain Weight
                </button>
                <button
                  className="btn btn-wide text-white font-bold transition-transform duration-300 ease-in-out 
                     bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 shadow-lg"
                  onClick={() => handleGoalSelection("maintain")}
                >
                  Maintain Weight
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Show loading indicator */}
        {loadingGoal && (
          <div className="flex flex-col items-center">
            <span className="loading loading-bars loading-md"></span>
            <p className="mt-4 text-lg">Generating personalized plans...</p>
          </div>
        )}

        {/* Step 3: Once processing is done, show the cards */}
        {!loadingGoal && goal && (
          <div className="flex w-full flex-col lg:flex-row items-center justify-center gap-8">
            {/* Meals Card */}
            <div
              className="card bg-base-300 rounded-box w-full max-w-md h-56 grid place-items-center transform transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 cursor-pointer"
              onClick={() => navigate("/plans/meals")}
            >
              <h2 className="text-3xl font-bold">Meals</h2>
            </div>

            {/* Divider */}
            <div className="divider lg:divider-horizontal"></div>

            {/* Exercises Card */}
            <div
              className="card bg-base-300 rounded-box w-full max-w-md h-56 grid place-items-center transform transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 cursor-pointer"
              onClick={() => navigate("/plans/exercises")}
            >
              <h2 className="text-3xl font-bold">Exercises</h2>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Plans;
