import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WeightCard from "../components/WeightCard";
import BMIChart from "../components/BMIChart";
import api from "../api";
import WorkoutCalendar from "../components/WorkoutCalendar";
import { HelpCircle } from "lucide-react";
import { Mail } from "lucide-react";

function Home() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Fetch the user's health profile for height, created_at, etc.
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/health-profile/detail/");
        setProfile(res.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar */}
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
      <div className="container mx-auto p-20 text-center">
        <h2 className="text-5xl font-bold mb-4">Welcome Back!</h2>
        <p className="mb-6">
          Your personalized fitness journey starts here.
          <br />
          Check your progress, explore tailored workout plans, and manage your
          profile.
        </p>
        <div className="flex justify-center gap-4 mb-4">
          <Link to="/plans" className="btn btn-primary">
            View Plans
          </Link>
          <Link to="/profile" className="btn btn-secondary">
            View Profile
          </Link>
        </div>

        {/* Full-width divider */}
        <div className="divider w-full my-8"></div>

        {/* Charts: side by side on medium+ screens */}
        <div className="flex flex-col md:flex-row gap-6 w-full">
          <div className="flex-1">
            <WeightCard />
          </div>
          <div className="flex-1">
            {profile && <BMIChart height={profile.height} />}
          </div>
        </div>

        {/* Full-width divider */}
        <div className="divider w-full my-8"></div>

        {/* Workout Calendar */}
        <div className="container mx-auto p-4">
          {profile && <WorkoutCalendar accountCreated={profile.created_at} />}
        </div>

        {/* Full-width divider */}
        <div className="divider w-full my-8"></div>

        {/* Full-width Exercise Card */}
        <Link to="/exercises">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "150px",
              background: "linear-gradient(to right, #1A252F, #2C5364)",
              borderRadius: "10px",
              overflow: "hidden",
            }}
            className="cursor-pointer"
          >
            <h2
              style={{
                color: "white",
                fontFamily: "'Audiowide', cursive",
                fontStyle: "italic",
                fontWeight: "bold",
                fontSize: "35px",
                textShadow: "1px 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              Exercises
            </h2>
            <div
              className="ml-2 tooltip tooltip-top tooltip-warning text-xl"
              data-tip="This page leads to our own hosted MuscleWiki API for exercises."
            >
              <HelpCircle className="w-5 h-5 text-white opacity-80 hover:opacity-100 cursor-pointer" />
            </div>
          </div>
        </Link>
      </div>{" "}
      <br />
      {/* Footer */}
      <footer className="footer footer-center bg-base-100 text-base-content p-10">
        <div className="flex flex-col items-center">
          <img
            src="/logo.png"
            alt="vitaForge logo"
            className="w-16 h-16 mb-2"
          />
          <p className="mb-0">
            © {new Date().getFullYear()} vitaForge™. All rights reserved.
          </p>
          <a
            href="mailto:rakibsaysxo@gmail.com"
            className="flex items-center space-x-2 link link-hover text-sm"
          >
            <Mail className="w-4 h-4" />
            <span>rakibsaysxo@gmail.com</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default Home;
