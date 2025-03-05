import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WeightCard from "../components/WeightCard";
import BMIChart from "../components/BMIChart";
import api from "../api";
import WorkoutCalendar from "../components/WorkoutCalendar"; // Note: the file is now correctly named

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
      <div className="container mx-auto p-20 text-center">
        <h2 className="text-5xl font-bold mb-4">Welcome Back!</h2>
        <p className="mb-6">
          Your personalized fitness journey starts here.<br />
          Check your progress, explore tailored workout plans, and manage your profile.
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

        {/* Render the calendar, passing the account creation date */}
        <div className="container mx-auto p-4">
          {profile && <WorkoutCalendar accountCreated={profile.created_at} />}
        </div>
      </div>
    </div>
  );
}

export default Home;
