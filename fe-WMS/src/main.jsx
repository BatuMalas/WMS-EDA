import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

// Debug: cek apakah root element ada
const rootElement = document.getElementById("root");
console.log("Root element:", rootElement);

if (!rootElement) {
  throw new Error("Root element #root not found in HTML");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
