import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

// Build the URL dynamically using all the filters
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

function Exercises() {
  const navigate = useNavigate();

  // Filter states with defaults
  const [muscle, setMuscle] = useState("Chest");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [force, setForce] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(null);

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

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
  };

  const closeModal = () => {
    setSelectedExercise(null);
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Gradient Header */}
      <div
        className="p-8 mb-6"
        style={{
          background: "linear-gradient(to right, #1A252F, #2C5364)",
          borderRadius: "0 0 20px 20px",
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

      {/* Filters */}
      <div className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span
                className="label-text"
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
                className="label-text"
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
                className="label-text"
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
                className="label-text"
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
        {isError && <p className="text-red-500 mt-4">Error: {error.message}</p>}

        {/* Exercises List - Responsive Card Layout */}
        {exercises && (
          <div className="mt-8 space-y-4">
            {exercises.map((exercise, index) => (
              <div
                key={exercise.id || exercise.exercise_name || index}
                className="max-w-3xl mx-auto p-4 bg-base-200 rounded shadow flex flex-col md:flex-row gap-4 hover:shadow-2xl hover:-translate-y-1 transition-transform duration-200"
                style={{
                  border: "1px solid rgba(44,83,100,0.3)",
                  boxShadow: "0 0 8px rgba(44,83,100,0.3)",
                }}
              >
                {/* Left Column: Video Preview */}
                <div className="flex-shrink-0 w-full md:w-60">
                  {exercise.videoURL && exercise.videoURL.length > 0 ? (
                    <div className="w-full aspect-video">
                      <video
                        src={exercise.videoURL[0]}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">No Preview</span>
                    </div>
                  )}
                </div>

                {/* Divider: Only visible on medium screens and above */}
                <div className="hidden md:block w-px bg-gray-300 mx-2 self-stretch"></div>

                {/* Right Column: Exercise Summary */}
                <div className="flex-grow text-center md:text-left">
                  <h3
                    className="font-semibold text-lg mb-1"
                    style={{
                      fontFamily: "'Audiowide', cursive",
                      textShadow: "0 0 3px rgba(0,0,0,0.3)",
                    }}
                  >
                    {exercise.exercise_name || "Unnamed Exercise"}
                  </h3>
                  <p className="text-sm">
                    <strong>Category:</strong> {exercise.Category ?? "N/A"}
                  </p>
                  <p className="text-sm">
                    <strong>Difficulty:</strong> {exercise.Difficulty ?? "N/A"}
                  </p>
                  <p className="text-sm">
                    <strong>Force:</strong> {exercise.Force ?? "N/A"}
                  </p>
                  {exercise.Grips && (
                    <p className="text-sm">
                      <strong>Grips:</strong> {exercise.Grips}
                    </p>
                  )}
                  <p className="text-sm">
                    <strong>Target:</strong>{" "}
                    {exercise.target && exercise.target.Primary
                      ? exercise.target.Primary.join(", ")
                      : "N/A"}
                  </p>
                  <button
                    onClick={() => handleSelectExercise(exercise)}
                    style={{
                      fontFamily: "'Audiowide', cursive",
                      background: "linear-gradient(45deg, #1A252F, #2C5364)",
                      color: "#fff",
                      boxShadow: "0 0 8px rgba(44,83,100,0.8)",
                      border: "none",
                    }}
                    className="btn mt-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Selected Exercise Details */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          {/* Clickable backdrop to close */}
          <div className="absolute inset-0" onClick={closeModal}></div>
          <div className="relative max-w-2xl w-full rounded-xl shadow-lg z-10 max-h-[80vh] overflow-y-auto">
            {/* Modal Header with Gradient */}
            <div
              style={{
                background: "linear-gradient(to right, #1A252F, #2C5364)",
              }}
              className="p-4 rounded-t-xl"
            >
              <h3
                className="text-2xl font-bold mb-0 text-white"
                style={{ fontFamily: "'Audiowide', cursive" }}
              >
                {selectedExercise.exercise_name || "Unnamed Exercise"}
              </h3>
            </div>
            {/* Modal Content */}
            <div className="p-4 bg-base-100">
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
                    className="mt-2 w-full rounded"
                  />
                )}
            </div>
            {/* Modal Footer */}
            <div className="p-4 bg-base-100 flex justify-end">
              <button
                className="btn btn-soft transition-all duration-300 hover:scale-105"
                style={{
                  fontFamily: "'Audiowide', cursive",
                  boxShadow: "0 0 4px rgba(44,83,100,0.6)",
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
