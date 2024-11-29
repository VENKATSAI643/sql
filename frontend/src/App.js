import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import UploadFilePage from "./components/UploadFilePage";
import AskQueryPage from "./components/AskQueryPage";
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadFilePage />} />
        <Route path="/ask-query" element={<AskQueryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
