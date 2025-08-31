import React, { useState } from "react";
import { toast } from 'react-toastify';
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
      const response = await axios.post("/match", {
        juniorId,
        additionalNotes: notes,
      });

      const raw = response.data.result;
      const jsonText = raw.replace(/```json\n|```/g, "").trim();
      const parsed = JSON.parse(jsonText);
      setMatches(parsed);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error("Your session expired, kindly login again.");
        localStorage.clear();
        window.location.href = "/login";
      } else {
        console.error("Error fetching match results:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (!notes.trim()) {
      const confirmProceed = window.confirm("No preferences entered. Proceed anyway?");
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
          <button id="matchBtn" onClick={handleStart}>
            Click here to Start AI-powered Match
          </button>
        </div>
      )}

      {loading && start ? (
        <p style={{ color: "red" }}>Loading matches...</p>
      ) : (
        start && (
          <div className="match-list">
            {matches.map((senior, index) => (
              <div key={index} className="match-card">
                <h3>{senior.name}</h3>
                <div className="percentage-bar">
                  <div
                    className="fill"
                    style={{ width: `${senior.matchPercentage}%` }}
                  >
                    {senior.matchPercentage}%
                  </div>
                </div>
                <p className="reason">{senior.reason}</p>
                
                <button
                  className="profile-button"
                  onClick={() => window.location.href = `/profile/${senior.seniorId}`}
                >
                  View Profile
                </button>
              </div>
            ))}
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