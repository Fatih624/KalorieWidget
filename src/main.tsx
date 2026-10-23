import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Badge from "./Badge";
import "./styles.css";
import "./refined-theme.css";
const badgeView = new URLSearchParams(location.search).get('view') === 'badge';
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {badgeView ? <Badge /> : <App />}
  </React.StrictMode>,
);
