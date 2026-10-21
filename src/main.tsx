import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Badge from "./Badge";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {new URLSearchParams(location.search).get('view') === 'badge' ? <Badge /> : <App />}
  </React.StrictMode>,
);
