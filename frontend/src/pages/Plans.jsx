import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function Plans() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [region, setRegion] = useState("");
  const [loadingGoal, setLoadingGoal] = useState(false);

  // On mount, check if a saved meal plan exists. If it does, automatically navigate to it.
  useEffect(() => {
    api
      .get("/api/meal-plan/")
      .then((res) => {
        // If a saved meal plan is found, navigate immediately to meal plan results.
        navigate("/meal-plan-results", {
          state: {
            daily_targets: res.data.daily_targets,
            meal_plan: res.data.plan,
          },
        });
      })
      .catch((error) => {
        // If no saved plan is found, remain on this page.
      });
  }, [navigate]);

  // Set the selected goal.
  const handleGoalSelection = (selectedGoal) => {
    setGoal(selectedGoal);
  };

  // Once the region is selected, show a loading indicator then navigate to generate a new meal plan.
  const handleContinue = () => {
    if (!region) {
      alert("Please select your region");
      return;
    }
    setLoadingGoal(true);
    setTimeout(() => {
      setLoadingGoal(false);
      navigate(`/recommendations?goal=${goal}&region=${region}`);
    }, 800);
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
        {/* If no goal is selected, show the goal selection card */}
        {!goal && !loadingGoal && (
          <div className="card w-full max-w-3xl mx-auto bg-base-200 shadow-2xl glass border border-base-content/10 animate__animated animate__fadeInDown">
            <div className="card-body text-center p-10">
              <h2 className="card-title mx-auto text-3xl font-bold mb-4">
                What's Your Goal?
              </h2>
              <p className="text-white text-sm mb-8 leading-relaxed tracking-wide">
                Choose an option to receive personalized meal plan recommendations.
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

        {/* Once a goal is selected, show the region selection card */}
        {goal && !loadingGoal && (
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
              <option value="EU">Europe</option>
              <option value="SA">South Asia</option>
            </select>
            <button className="btn btn-primary w-full" onClick={handleContinue}>
              Continue
            </button>
          </div>
        )}

        {loadingGoal && (
          <div className="flex flex-col items-center">
            <span className="loading loading-bars loading-md"></span>
            <p className="mt-4 text-lg">Generating personalized meal plan...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Plans;
