// src/pages/Plans.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Plans() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Top Navbar */}
      <header className="p-4">
        <Link to="/home" className="btn btn-ghost normal-case text-xl">
          vitaForge
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8">Your Plans</h1>
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
      </div>
    </div>
  );
}

export default Plans;
