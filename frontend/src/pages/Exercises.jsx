import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";

// Fetch filtered exercises using current filter selections.
async function fetchExercises({ queryKey }) {
  const [_, muscle, category, difficulty, force] = queryKey;
  const params = new URLSearchParams();
  if (muscle) params.append("muscle", muscle);
  if (category) params.append("category", category);
  if (difficulty) params.append("difficulty", difficulty);
  if (force) params.append("force", force);

  const url = `http://127.0.0.1:8000/api/proxy/exercises?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch exercises from proxy");
  }
  return res.json();
}

// Fetch global search suggestions (ignores filters).
async function fetchSearchSuggestions(searchQuery) {
  const params = new URLSearchParams();
  if (searchQuery) params.append("name", searchQuery);
  const url = `http://127.0.0.1:8000/api/proxy/exercises?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch search suggestions");
  }
  return res.json();
}

function Exercises() {
  const navigate = useNavigate();

  // Filter states (for the filtered exercise list)
  const [muscle, setMuscle] = useState("Chest");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [force, setForce] = useState("");

  // Global search input (separate from filters)
  const [searchQuery, setSearchQuery] = useState("");

  // State for selected exercise (to show details in modal)
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Query for filtered exercises (based on current filter selections)
  const {
    data: exercises,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["musclewikiExercises", muscle, category, difficulty, force],
    queryFn: fetchExercises,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Query for global search suggestions (ignores filters)
  const {
    data: searchSuggestions,
    isLoading: searchLoading,
    refetch: refetchSuggestions,
  } = useQuery({
    queryKey: ["exerciseSuggestions", searchQuery],
    queryFn: () => fetchSearchSuggestions(searchQuery),
    enabled: searchQuery.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Debounce search input: refetch suggestions 300ms after user stops typing.
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.length > 0) {
        refetchSuggestions();
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, refetchSuggestions]);

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
    // Optionally clear search query to hide suggestions.
    setSearchQuery("");
  };

  const closeModal = () => {
    setSelectedExercise(null);
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Fixed Navbar */}
      <div className="navbar bg-base-100 bg-opacity-90 shadow-lg fixed top-0 left-0 w-full z-50 backdrop-blur-sm">
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

      {/* Main Content with extra top padding */}
      <div className="pt-24 px-4">
        {/* Gradient Header */}
        <div
          className="p-8 mb-6 rounded-b-2xl"
          style={{
            background: "linear-gradient(to right, #1A252F, #2C5364)",
          }}
        >
          <div className="flex justify-between items-center">
            <h1
              className="text-3xl md:text-4xl"
              style={{
                fontFamily: "'Audiowide', cursive",
                fontWeight: "bold",
                color: "#fff",
                textShadow: "0 0 8px rgba(44,83,100,0.7)",
              }}
            >
              Exercises
            </h1>
            <button
              className="btn btn-neutral"
              onClick={() => navigate("/home")}
              style={{
                fontFamily: "'Audiowide', cursive",
                textShadow: "0 0 3px rgba(0,0,0,0.4)",
              }}
            >
              Return Home
            </button>
          </div>
        </div>

        {/* Global Search Input for Suggestions */}
        <div className="px-4 mb-4 relative">
          <input
            type="text"
            placeholder="Search all exercises..."
            className="input input-bordered w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <div className="absolute left-3.5 right-3.5 bg-base-100 border border-gray-300 mt-1 rounded shadow-md z-10">
              {searchLoading ? (
                <div className="p-2 text-gray-500">Loading...</div>
              ) : searchSuggestions && searchSuggestions.length > 0 ? (
                <ul>
                  {searchSuggestions.map((exercise, index) => (
                    <li
                      key={exercise.id || index}
                      className="p-2 hover:bg-gray-200 transition-colors cursor-pointer"
                      onClick={() => handleSelectExercise(exercise)}
                    >
                      {exercise.exercise_name}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-2 text-gray-500">
                  Sorry, couldn't find what you're looking for.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters Section (for filtered list) */}
        <div className="px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="form-control">
              <label className="label">
                <span
                  className="label-text font-bold"
                  style={{ fontFamily: "'Audiowide', cursive" }}
                >
                  Muscle
                </span>
              </label>
              <select
                className="select select-bordered"
                style={{ fontFamily: "'Audiowide', cursive" }}
                value={muscle}
                onChange={(e) => setMuscle(e.target.value)}
              >
                <option value="Biceps">Biceps</option>
                <option value="Forearms">Forearms</option>
                <option value="Shoulders">Shoulders</option>
                <option value="Triceps">Triceps</option>
                <option value="Quads">Quads</option>
                <option value="Glutes">Glutes</option>
                <option value="Lats">Lats</option>
                <option value="Mid back">Mid back</option>
                <option value="Lower back">Lower back</option>
                <option value="Hamstrings">Hamstrings</option>
                <option value="Chest">Chest</option>
                <option value="Abdominals">Abdominals</option>
                <option value="Obliques">Obliques</option>
                <option value="Traps">Traps</option>
                <option value="Calves">Calves</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span
                  className="label-text font-bold"
                  style={{ fontFamily: "'Audiowide', cursive" }}
                >
                  Category
                </span>
              </label>
              <select
                className="select select-bordered"
                style={{ fontFamily: "'Audiowide', cursive" }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All</option>
                <option value="Barbell">Barbell</option>
                <option value="Dumbbells">Dumbbells</option>
                <option value="Kettlebells">Kettlebells</option>
                <option value="Stretches">Stretches</option>
                <option value="Cables">Cables</option>
                <option value="Band">Band</option>
                <option value="Plate">Plate</option>
                <option value="TRX">TRX</option>
                <option value="Bodyweight">Bodyweight</option>
                <option value="Yoga">Yoga</option>
                <option value="Machine">Machine</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span
                  className="label-text font-bold"
                  style={{ fontFamily: "'Audiowide', cursive" }}
                >
                  Difficulty
                </span>
              </label>
              <select
                className="select select-bordered"
                style={{ fontFamily: "'Audiowide', cursive" }}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span
                  className="label-text font-bold"
                  style={{ fontFamily: "'Audiowide', cursive" }}
                >
                  Force
                </span>
              </label>
              <select
                className="select select-bordered"
                style={{ fontFamily: "'Audiowide', cursive" }}
                value={force}
                onChange={(e) => setForce(e.target.value)}
              >
                <option value="">All</option>
                <option value="Pull">Pull</option>
                <option value="Push">Push</option>
                <option value="Hold">Hold</option>
              </select>
            </div>
          </div>

          {isLoading && <p className="mt-4">Loading exercises...</p>}
          {isError && (
            <p className="text-red-500 mt-4">Error: {error.message}</p>
          )}

          {/* Filtered Exercises List */}
          {exercises && (
            <div className="mt-8 space-y-6">
              {exercises.map((exercise, index) => (
                <div
                  key={exercise.id || exercise.exercise_name || index}
                  className="max-w-3xl mx-auto p-6 bg-base-200 rounded-lg border border-gray-300 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Video Preview */}
                    <div className="flex-shrink-0 w-full md:w-60">
                      {exercise.videoURL && exercise.videoURL.length > 0 ? (
                        <div className="relative w-full aspect-video bg-gray-300 rounded overflow-hidden flex items-center justify-center">
                          <video
                            src={exercise.videoURL[0]}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover rounded opacity-0 transition-opacity duration-500"
                            onCanPlay={(e) => {
                              e.currentTarget.style.opacity = 1;
                            }}
                          />
                          {/* Play Icon Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-12 w-12 text-white opacity-70"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M14.752 11.168l-5.197-3.033A1 1 0 008 9.034v5.932a1 1 0 001.555.832l5.197-3.033a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">
                            No Preview
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Divider for md+ screens */}
                    <div className="hidden md:block w-px bg-gray-300"></div>

                    {/* Exercise Summary */}
                    <div className="flex-grow text-center md:text-left">
                      <h3
                        className="font-semibold text-xl mb-2"
                        style={{
                          fontFamily: "'Audiowide', cursive",
                          textShadow: "0 0 3px rgba(0,0,0,0.3)",
                        }}
                      >
                        {exercise.exercise_name || "Unnamed Exercise"}
                      </h3>
                      <p className="text-sm mb-1">
                        <strong>Category:</strong> {exercise.Category ?? "N/A"}
                      </p>
                      <p className="text-sm mb-1">
                        <strong>Difficulty:</strong>{" "}
                        {exercise.Difficulty ?? "N/A"}
                      </p>
                      <p className="text-sm mb-1">
                        <strong>Force:</strong> {exercise.Force ?? "N/A"}
                      </p>
                      {exercise.Grips && (
                        <p className="text-sm mb-1">
                          <strong>Grips:</strong> {exercise.Grips}
                        </p>
                      )}
                      <p className="text-sm mb-3">
                        <strong>Target:</strong>{" "}
                        {exercise.target && exercise.target.Primary
                          ? exercise.target.Primary.join(", ")
                          : "N/A"}
                      </p>
                      <button
                        onClick={() => handleSelectExercise(exercise)}
                        className="btn btn-primary btn-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        style={{
                          fontFamily: "'Audiowide', cursive",
                          background:
                            "linear-gradient(45deg, #1A252F, #2C5364)",
                          boxShadow: "0 0 8px rgba(44,83,100,0.8)",
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          {/* Clickable backdrop */}
          <div className="absolute inset-0" onClick={closeModal}></div>
          <div className="relative max-w-3xl w-full mx-4 rounded-xl shadow-2xl z-10 max-h-[80vh] overflow-y-auto">
            {/* Modal Header with Enhanced Gradient */}
            <div className="p-6 rounded-t-xl bg-gradient-to-r from-blue-900 to-cyan-600">
              <h3
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'Audiowide', cursive" }}
              >
                {selectedExercise.exercise_name || "Unnamed Exercise"}
              </h3>
            </div>
            {/* Modal Content */}
            <div className="p-6 bg-base-100">
              <p className="text-sm mb-2">
                <strong>Category:</strong> {selectedExercise.Category ?? "N/A"}
              </p>
              <p className="text-sm mb-2">
                <strong>Difficulty:</strong>{" "}
                {selectedExercise.Difficulty ?? "N/A"}
              </p>
              <p className="text-sm mb-2">
                <strong>Force:</strong> {selectedExercise.Force ?? "N/A"}
              </p>
              {selectedExercise.Grips && (
                <p className="text-sm mb-2">
                  <strong>Grips:</strong> {selectedExercise.Grips}
                </p>
              )}
              <p className="text-sm mb-2">
                <strong>Target:</strong>{" "}
                {selectedExercise.target && selectedExercise.target.Primary
                  ? selectedExercise.target.Primary.join(", ")
                  : "N/A"}
              </p>
              <p className="text-sm mb-4">
                <strong>Details:</strong>{" "}
                {selectedExercise.details ?? "No details available"}
              </p>
              {selectedExercise.steps && selectedExercise.steps.length > 0 && (
                <div className="mb-4 text-sm">
                  <strong>Steps:</strong>
                  <ul className="list-disc list-inside">
                    {selectedExercise.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedExercise.videoURL &&
                selectedExercise.videoURL.length > 0 && (
                  <video
                    src={selectedExercise.videoURL[0]}
                    controls
                    preload="auto"
                    className="mt-4 w-full rounded"
                  />
                )}
            </div>
            {/* Modal Footer */}
            <div className="p-4 bg-base-100 flex justify-end">
              <button
                className="btn btn-outline transition-all duration-300 hover:scale-105"
                style={{
                  fontFamily: "'Audiowide', cursive",
                  boxShadow: "0 0 6px rgba(44,83,100,0.6)",
                }}
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exercises;
