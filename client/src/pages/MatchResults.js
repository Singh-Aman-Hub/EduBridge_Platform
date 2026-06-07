import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "../axiosConfig";
import "./MatchResults.css";

const MatchResults = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState(false);
  const [notes, setNotes] = useState("");

  const juniorId = localStorage.getItem("user");

  const fetchMatches = async () => {
    try {
      setLoading(true);

      if (!juniorId) {
        toast.error("Your session expired, kindly login again.");
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      const response = await axios.post("/match", {
        juniorId,
        additionalNotes: notes,
      });

      const result = response.data.result;

      let finalMatches = [];

      // New backend: result is already an array
      if (Array.isArray(result)) {
        finalMatches = result;
      }

      // Old backend fallback: result is a raw Gemini string
      else if (typeof result === "string") {
        const jsonText = result
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        finalMatches = JSON.parse(jsonText);
      }

      // Extra fallback: backend may send rawResult as string
      else if (typeof response.data.rawResult === "string") {
        const jsonText = response.data.rawResult
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        finalMatches = JSON.parse(jsonText);
      }

      setMatches(finalMatches);

    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        toast.error("Your session expired, kindly login again.");
        localStorage.clear();
        window.location.href = "/login";
      } else {
        console.error("Error fetching match results:", error);
        toast.error("Failed to fetch match results. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!notes.trim()) {
      const confirmProceed = window.confirm(
        "No preferences entered. Proceed anyway?"
      );

      if (!confirmProceed) return;
    }

    setStart(true);
    fetchMatches();
  };

  return (
    <div className="match-container">
      <h2 className="match-heading">AI Suggestion for College Seniors</h2>

      {!start && (
        <div className="input-section">
          <textarea
            placeholder="Enter additional preferences (e.g., city, college facilities...)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="notes-textarea"
          />

          <button id="matchBtn" onClick={handleStart} disabled={loading}>
            {loading ? "Finding Matches..." : "Click here to Start AI-powered Match"}
          </button>
        </div>
      )}

      {loading && start ? (
        <p style={{ color: "red" }}>Loading matches...</p>
      ) : (
        start && (
          <div className="match-list">
            {matches.length > 0 ? (
              matches.map((senior, index) => (
                <div key={senior.seniorId || index} className="match-card">
                  <h3>{senior.name}</h3>

                  <div className="percentage-bar">
                    <div
                      className="fill"
                      style={{
                        width: `${Math.min(
                          Math.max(Number(senior.matchPercentage) || 0, 0),
                          100
                        )}%`,
                      }}
                    >
                      {Number(senior.matchPercentage) || 0}%
                    </div>
                  </div>

                  <p className="reason">{senior.reason}</p>

                  <button
                    className="profile-button"
                    onClick={() =>
                      (window.location.href = `/profile/${senior.seniorId}`)
                    }
                    disabled={!senior.seniorId}
                  >
                    View Profile
                  </button>
                </div>
              ))
            ) : (
              <p>No matches found.</p>
            )}

            <button id="backBtn" onClick={() => window.history.back()}>
              Go Back
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default MatchResults;
