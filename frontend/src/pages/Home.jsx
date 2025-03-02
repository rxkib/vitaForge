// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost normal-case text-xl">
            vitaForge
          </Link>
        </div>
        <div className="flex-none">
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

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <div className="hero min-h-screen bg-base-200">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h2 className="text-5xl font-bold">Welcome Back!</h2>
              <p className="py-6">
                Your personalized fitness journey starts here. Check your
                progress, explore tailored workout plans, and manage your
                profile.
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/plans" className="btn btn-primary">
                  View Plans
                </Link>
                <Link to="/profile" className="btn btn-secondary">
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
