import React from "react";
import "./Login.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

function Login() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">🛡️</div>

        <h1>CyberGuard</h1>

        <p className="login-subtitle">
          Secure your emails, messages and digital communication.
        </p>

        <button className="google-login-btn" onClick={handleGoogleLogin}>
          <span className="google-icon">G</span>
          Continue with Google
        </button>

        <p className="login-security">
          🔒 Secure authentication powered by Google
        </p>
      </div>
    </div>
  );
}

export default Login;
