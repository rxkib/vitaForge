// src/pages/Plans.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Plans() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [region, setRegion] = useState(""); // Region will be chosen from options
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [showCards, setShowCards] = useState(false);

  // When a goal is selected, simply set it
  const handleGoalSelection = (selectedGoal) => {
    setGoal(selectedGoal);
  };

  // When user confirms their region, then start processing
  const handleContinue = () => {
    if (!region) {
      alert("Please select your region");
      return;
    }
    setLoadingGoal(true);
    setTimeout(() => {
      setLoadingGoal(false);
      setShowCards(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
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

      <div className="flex-grow flex flex-col items-center justify-center p-4 mt-20">
        {/* Step 1: Goal Selection */}
        {!goal && !loadingGoal && (
          <div className="card w-full max-w-3xl mx-auto bg-base-200 shadow-2xl glass border border-base-content/10 animate__animated animate__fadeInDown">
            <div className="card-body text-center p-10">
              <h2 className="card-title mx-auto text-3xl font-bold mb-4">
                What's Your Goal?
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed tracking-wide">
                Choose an option to receive personalized recommendations.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  className="btn btn-wide text-white font-bold transition-transform duration-300 ease-in-out bg-gradient-to-r from-blue-500 to-green-500 hover:scale-105 shadow-lg"
                  onClick={() => handleGoalSelection("lose")}
                >
                  Lose Weight
                </button>
                <button
                  className="btn btn-wide text-white font-bold transition-transform duration-300 ease-in-out bg-gradient-to-r from-pink-500 to-red-500 hover:scale-105 shadow-lg"
                  onClick={() => handleGoalSelection("gain")}
                >
                  Gain Weight
                </button>
                <button
                  className="btn btn-wide text-white font-bold transition-transform duration-300 ease-in-out bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105 shadow-lg"
                  onClick={() => handleGoalSelection("maintain")}
                >
                  Maintain Weight
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Region Selection (shown after goal is selected) */}
        {goal && !loadingGoal && !showCards && (
          <div className="card w-full max-w-md mx-auto bg-base-200 shadow-2xl glass border border-base-content/10 animate__animated animate__fadeInDown p-6 mt-4">
            <h2 className="card-title text-2xl font-bold mb-4">
              Select Your Region
            </h2>
            <select
              className="select select-bordered w-full mb-4"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">Select Region</option>
              <option value="EU">EU</option>
              <option value="SA">SA</option>
            </select>
            <button className="btn btn-primary w-full" onClick={handleContinue}>
              Continue
            </button>
          </div>
        )}

        {/* Step 3: Loading Indicator */}
        {loadingGoal && (
          <div className="flex flex-col items-center">
            <span className="loading loading-bars loading-md"></span>
            <p className="mt-4 text-lg">Generating personalized plans...</p>
          </div>
        )}

        {/* Step 4: Show Meals/Exercises Cards */}
        {showCards && (
          <div className="flex w-full flex-col lg:flex-row items-center justify-center gap-8">
            {/* Meals Card */}
            <div
              className="card bg-base-300 rounded-box w-full max-w-md h-56 grid place-items-center transform transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 cursor-pointer"
              onClick={() =>
                navigate(`/recommendations?goal=${goal}&region=${region}`)
              }
            >
              <h2 className="text-3xl font-bold">Meals</h2>
            </div>
            <div className="divider lg:divider-horizontal"></div>
            {/* Exercises Card */}
            <div
              className="card bg-base-300 rounded-box w-full max-w-md h-56 grid place-items-center transform transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 cursor-pointer"
              onClick={() => navigate("/exercises")}
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
