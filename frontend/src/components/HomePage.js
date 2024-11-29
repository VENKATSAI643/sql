import React from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";

function HomePage() {
  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to QueryMate</h1>
      <p className="home-description">Easily upload files, define schemas, and query your data in natural language!</p>
      <div className="button-container">
        <Link to="/upload">
          <button className="home-button">Upload File</button>
        </Link>
        <Link to="/ask-query">
          <button className="home-button">Ask Query</button>
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
