import React, { useState, useEffect } from "react";
import api from "../api";

// Helper to pad a number to two digits.
const pad = (num) => (num < 10 ? "0" + num : num);
// Helper: Get a local ISO date string (YYYY-MM-DD) from a Date object.
const getLocalIso = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = pad(dateObj.getMonth() + 1);
  const d = pad(dateObj.getDate());
  return `${y}-${m}-${d}`;
};

function WorkoutCalendar({ accountCreated }) {
  const [logs, setLogs] = useState({});
  const [selectedDate, setSelectedDate] = useState(null); // For today's logging modal.
  const [recapDate, setRecapDate] = useState(null); // For past day recap.
  const [recapData, setRecapData] = useState(null); // Recap details.
  const [recapLoaded, setRecapLoaded] = useState(false); // Whether recap fetch is complete.
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth()); // 0-indexed

  // Minimum allowed date is based on account creation.
  const minDate = accountCreated
    ? new Date(accountCreated)
    : new Date(displayYear, displayMonth, 1);

  // Today's date (local)
  const today = new Date();
  const todayIso = getLocalIso(today);

  // Days in the displayed month.
  const daysInDisplayedMonth = new Date(
    displayYear,
    displayMonth + 1,
    0
  ).getDate();

  // Determine start day: if displayed month is the account creation month, start from that day; otherwise, 1.
  const startDay =
    displayYear === minDate.getFullYear() && displayMonth === minDate.getMonth()
      ? minDate.getDate()
      : 1;

  // Calculate the number of in-month cells from startDay to the end.
  const currentMonthDaysCount = daysInDisplayedMonth - startDay + 1;
  const remainder = currentMonthDaysCount % 7;
  const extraCells = remainder === 0 ? 0 : 7 - remainder;
  const totalCells = currentMonthDaysCount + extraCells;

  // Determine if the displayed month is the current month.
  const isCurrentMonth =
    displayYear === today.getFullYear() && displayMonth === today.getMonth();

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/api/daily-log/");
      const logData = res.data.reduce((acc, { date, status }) => {
        acc[date] = status;
        return acc;
      }, {});
      setLogs(logData);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  // Fetch recap details for a given date from backend.
  const fetchDailyRecap = async (date) => {
    try {
      const res = await api.get(`/api/daily-log/${date}/recap/`);
      setRecapData(res.data);
    } catch (error) {
      console.error("Error fetching daily recap:", error);
      setRecapData(null);
    } finally {
      setRecapLoaded(true);
    }
  };

  const updateLog = async (date, status) => {
    try {
      await api.post("/api/daily-log/", { date, status });
      setLogs((prev) => ({ ...prev, [date]: status }));
    } catch (error) {
      console.error("Error updating log:", error);
    }
  };

  // Handlers for today's logging modal.
  const handleYes = async () => {
    if (!selectedDate) return;
    await updateLog(selectedDate, "completed");
    setSelectedDate(null);
  };

  const handleNo = async () => {
    if (!selectedDate) return;
    await updateLog(selectedDate, "missed");
    setSelectedDate(null);
  };

  const handleCancel = () => {
    setSelectedDate(null);
    setRecapDate(null);
    setRecapData(null);
    setRecapLoaded(false);
  };

  // Month navigation handlers.
  const goToPreviousMonth = () => {
    const prevMonth = displayMonth - 1;
    let newMonth = prevMonth;
    let newYear = displayYear;
    if (prevMonth < 0) {
      newMonth = 11;
      newYear = displayYear - 1;
    }
    // Prevent navigating before the account creation month.
    if (
      newYear < minDate.getFullYear() ||
      (newYear === minDate.getFullYear() && newMonth < minDate.getMonth())
    ) {
      return;
    }
    setDisplayYear(newYear);
    setDisplayMonth(newMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = displayMonth + 1;
    let newMonth = nextMonth;
    let newYear = displayYear;
    if (nextMonth > 11) {
      newMonth = 0;
      newYear = displayYear + 1;
    }
    setDisplayYear(newYear);
    setDisplayMonth(newMonth);
  };

  // Build the calendar cells.
  const calendarCells = [];
  for (let i = 0; i < totalCells; i++) {
    let cellDate, isCurrentDisplayed;
    if (i < currentMonthDaysCount) {
      const day = startDay + i;
      cellDate = new Date(displayYear, displayMonth, day);
      isCurrentDisplayed = true;
    } else {
      const day = i - currentMonthDaysCount + 1;
      cellDate = new Date(displayYear, displayMonth + 1, day);
      isCurrentDisplayed = false;
    }

    const iso = getLocalIso(cellDate);

    // Determine if cell is in the past relative to today.
    let isPast = false;
    if (isCurrentDisplayed && iso < todayIso) {
      isPast = true;
    }

    // Determine if cell is today (only if displayed month is current).
    const isToday = isCurrentMonth && iso === todayIso;

    // If in current displayed month, use logs or default "missed" if it's past and no log.
    let status = "none";
    if (isCurrentDisplayed) {
      status = logs[iso] || (iso < todayIso ? "missed" : "none");
    }

    calendarCells.push({
      iso,
      day: cellDate.getDate(),
      status,
      isCurrentDisplayed,
      isToday,
      isPast,
    });
  }

  return (
    <div className="card bg-base-100 shadow-xl p-4 w-full h-full">
      {/* Gradient heading with title + nav */}
      <div className="rounded-md bg-gradient-to-r from-blue-900 to-cyan-600 text-white p-4 mb-4">
        <h2 className="text-2xl font-bold">Health Calendar</h2>
        {/* Navigation Header */}
        <div className="flex justify-between items-center mt-2">
          <button
            className="btn btn-ghost text-white"
            onClick={goToPreviousMonth}
            disabled={
              displayYear === minDate.getFullYear() &&
              displayMonth === minDate.getMonth()
            }
          >
            &#8592;
          </button>
          <div className="text-lg font-bold">
            {new Date(displayYear, displayMonth).toLocaleString("default", {
              month: "long",
            })}{" "}
            {displayYear}
          </div>
          <button className="btn btn-ghost text-white" onClick={goToNextMonth}>
            &#8594;
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 auto-rows-fr h-96">
        {calendarCells.map((cell) => {
          const { iso, day, status, isCurrentDisplayed, isToday, isPast } =
            cell;
          const extraClass = !isCurrentDisplayed ? "opacity-50" : "";
          const highlight = isToday ? "border-4 border-blue-500" : "";
          return (
            <div
              key={iso}
              className={`relative flex items-center justify-center border border-base-300 rounded bg-base-200 transition-colors w-full h-full aspect-square ${extraClass} ${highlight} ${
                isCurrentDisplayed
                  ? "cursor-pointer hover:bg-base-300"
                  : "cursor-not-allowed"
              }`}
              onClick={async () => {
                if (!isCurrentDisplayed) return;
                if (isPast && !isToday) {
                  // Past date: open recap modal.
                  setSelectedDate(null);
                  setRecapDate(iso);
                  setRecapData(null);
                  setRecapLoaded(false);
                  await fetchDailyRecap(iso);
                } else if (isToday) {
                  // Today: open logging modal.
                  setRecapDate(null);
                  setSelectedDate(iso);
                }
              }}
            >
              {/* Day number in bottom-left */}
              <span className="absolute bottom-1 left-1 text-base">{day}</span>
              {/* Status icon in top-right */}
              {(status === "completed" || status === "missed") && (
                <span className="absolute top-1 right-1 text-sm">
                  {status === "completed" ? "✔️" : "❌"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for Today's Logging */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          {/* Clickable backdrop */}
          <div className="absolute inset-0" onClick={handleCancel} />
          <div className="relative p-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg shadow-xl max-w-sm w-full transform transition-all">
            <div className="bg-base-100 p-6 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">
                Log Entry for {selectedDate}
              </h3>
              <p className="mb-4 text-lg">
                Did you work out and eat well on this day?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  className="btn btn-soft btn-success"
                  onClick={handleYes}
                >
                  Mark Completed
                </button>
                <button className="btn btn-soft btn-error" onClick={handleNo}>
                  Mark Missed
                </button>
                <button className="btn btn-soft" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recap Modal for Past Days */}
      {recapDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          {/* Clickable backdrop */}
          <div className="absolute inset-0" onClick={handleCancel} />
          <div className="relative max-w-md w-full p-1 rounded-xl shadow-lg z-10 bg-gradient-to-r from-cyan-400 to-blue-500">
            <div className="bg-black rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-4">
                Recap for {recapDate}
              </h3>
              {!recapLoaded ? (
                <p className="text-gray-300">Loading recap...</p>
              ) : !recapData ? (
                <p className="text-gray-300">No data was recorded this day.</p>
              ) : (
                <>
                  <p className="mb-2 text-white">
                    <strong>Status:</strong> {recapData.status}
                  </p>
                  <p className="mb-2 text-white">
                    <strong>Weight:</strong> {recapData.weight} kg
                  </p>
                  <p className="mb-2 text-white">
                    <strong>BMI:</strong> {recapData.bmi}
                  </p>
                </>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  className="btn btn-soft text-white"
                  onClick={handleCancel}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutCalendar;
