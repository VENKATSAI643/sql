import React, { useState } from "react";
import "../styles/UploadFilePage.css";

function UploadFilePage() {
  const [schema, setSchema] = useState([]);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [databaseName, setDatabaseName] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const lines = content.split("\n");
        if (lines.length > 0) {
          const headers = lines[0].split(",").map((header) => header.trim());
          const initialSchema = headers.map((header) => ({
            columnName: header,
            dataType: "VARCHAR", // Default type
            constraints: "", // Default constraint
          }));
          setSchema(initialSchema);
          setFileUploaded(true);
          setUploadMessage("File read successfully! Define the schema below.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSchemaChange = (index, field, value) => {
    const updatedSchema = [...schema];
    updatedSchema[index][field] = value;
    setSchema(updatedSchema);
  };

  const handleSubmit = () => {
    if (!databaseName.trim()) {
      alert("Please provide a valid database name.");
      return;
    }

    const fileInput = document.querySelector("input[type='file']");
    const file = fileInput?.files[0];

    if (!file) {
      alert("No file uploaded. Please upload a CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("databaseName", databaseName);
    formData.append("schema", JSON.stringify(schema));

    fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          alert(data.message);
        } else {
          alert("An error occurred. Please check the backend.");
        }
      })
      .catch((error) => {
        console.error("Submission failed:", error);
        alert("Submission failed. Please try again.");
      });
  };

  return (
    <div className="upload-container">
      <h2 className="upload-title">Upload Your File</h2>
      <div className="input-container">
        <label htmlFor="database-name">Database Name:</label>
        <input
          type="text"
          id="database-name"
          value={databaseName}
          onChange={(e) => setDatabaseName(e.target.value)}
          placeholder="Enter the database name"
        />
      </div>
      <div className={`drop-zone ${fileUploaded ? "uploaded" : ""}`}>
        <input type="file" onChange={handleFileUpload} accept=".csv" />
        <p>{uploadMessage || "Drag & Drop or Click to Upload a CSV File"}</p>
      </div>
      {fileUploaded && schema.length > 0 && (
        <div className="schema-container">
          <h3>Define Schema</h3>
          {schema.map((col, index) => (
            <div key={index} className="schema-row">
              <span>{col.columnName}:</span>
              <select
                value={col.dataType}
                onChange={(e) => handleSchemaChange(index, "dataType", e.target.value)}
              >
                <option value="VARCHAR">VARCHAR</option>
                <option value="INT">INT</option>
                <option value="FLOAT">FLOAT</option>
              </select>
              <select
                value={col.constraints}
                onChange={(e) => handleSchemaChange(index, "constraints", e.target.value)}
              >
                <option value="">No Constraint</option>
                <option value="NOT NULL">NOT NULL</option>
                <option value="PRIMARY KEY">PRIMARY KEY</option>
                <option value="UNIQUE">UNIQUE</option>
              </select>
            </div>
          ))}
        </div>
      )}
      {fileUploaded && (
        <button className="submit-button" onClick={handleSubmit}>
          Submit Schema
        </button>
      )}
    </div>
  );
}

export default UploadFilePage;
