import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await api.post("/auth/signup", {
        name,
        email,
        password,
      });

      setMessage("Account created successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.detail || "Could not create account");
      } else {
        setMessage("Could not connect to backend");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="brand">
          <div className="brand-icon">🧬</div>
          <h1>BioAge Clinical AI</h1>
        </div>

        <h2>Create a professional account</h2>

        <p>
          Register to access biological age assessment and disease risk
          prediction tools for clinical and biomedical research workflows.
        </p>

        <div className="feature-list">
          <div>✓ Designed for healthcare professionals</div>
          <div>✓ Supports DNA methylation data analysis</div>
          <div>✓ Built for secure patient-related insights</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <span className="tag">New Account</span>

          <h2>Sign Up</h2>
          <p className="subtitle">Create your account to start using the platform.</p>

          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label>Full name</label>
              <input
                type="text"
                value={name}
                placeholder="Dra. Ana Martínez"
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                placeholder="doctor@example.com"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                placeholder="Create a password"
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {message && <p className="info-message">{message}</p>}

          <p className="auth-footer">
            Already have an account? <Link to="/">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;