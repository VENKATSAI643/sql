import React, { useEffect, useState } from "react";
import "../styles/AskQueryPage.css";

function AskQueryPage() {
  const [query, setQuery] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [result, setResult] = useState("");
  const [dataset, setDataset] = useState("");
  const [databases, setDatabases] = useState([]);
  const [loadingDatabases, setLoadingDatabases] = useState(true);
  const [error, setError] = useState("");

  // Fetch the list of databases from the backend
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const response = await fetch("http://localhost:5000/databases"); // Backend endpoint for databases
        const data = await response.json();
        setDatabases(data.databases || []); // Assume the response contains a `databases` array
        if (data.databases.length > 0) {
          setDataset(data.databases[0]); // Default to the first database
        }
        setLoadingDatabases(false);
      } catch (error) {
        console.error("Error fetching databases:", error);
        setError("Failed to load databases.");
        setLoadingDatabases(false);
      }
    };

    fetchDatabases();
  }, []);

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
        {loadingDatabases ? (
          <p>Loading databases...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <select value={dataset} onChange={(e) => setDataset(e.target.value)}>
            {databases.map((db, index) => (
              <option key={index} value={db}>
                {db}
              </option>
            ))}
          </select>
        )}
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
          disabled={!query.trim() || !dataset}
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
