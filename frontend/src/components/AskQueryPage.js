import React, { useState } from "react";
import "../styles/AskQueryPage.css";

function AskQueryPage() {
  const [query, setQuery] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [result, setResult] = useState("");
  const [dataset, setDataset] = useState("Database 1");

  const handleQuerySubmit = async () => {
    // Simulated Backend Request
    try {
      const response = await fetch("http://localhost:5000/ask-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset,
          naturalLanguageQuery: query,
        }),
      });
      const data = await response.json();

      // Update SQL query and result
      setSqlQuery(data.sqlQuery || "SQL query not generated.");
      setResult(data.result || "No results found.");
    } catch (error) {
      setSqlQuery("Error generating SQL query.");
      setResult("Error fetching results.");
    }
  };

  const resetQuery = () => {
    setQuery("");
    setSqlQuery("");
    setResult("");
  };

  return (
    <div className="query-container">
      <h2>Ask Query</h2>
      <div className="dataset-dropdown">
        <label>Select Database:</label>
        <select value={dataset} onChange={(e) => setDataset(e.target.value)}>
          <option value="Database 1">Database 1</option>
          <option value="Database 2">Database 2</option>
          <option value="Database 3">Database 3</option>
        </select>
      </div>
      <div className="query-input-container">
        <label>Enter Query:</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your query in natural language"
        />
        <button
          className="submit-query-button"
          onClick={handleQuerySubmit}
          disabled={!query.trim()}
        >
          Submit
        </button>
      </div>
      {sqlQuery && result && (
        <div className="query-result">
          <h3>Generated SQL Query:</h3>
          <pre>{sqlQuery}</pre>
          <h3>Result:</h3>
          <p>{result}</p>
          <button className="reset-query-button" onClick={resetQuery}>
            Ask Another Question
          </button>
        </div>
      )}
    </div>
  );
}

export default AskQueryPage;
