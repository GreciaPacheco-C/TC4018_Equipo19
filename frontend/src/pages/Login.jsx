import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("test.user@example.com");
  const [password, setPassword] = useState("Test1234");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("user", JSON.stringify(response.data));

      setMessage("Login successful");
      navigate("/dashboard");
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.detail || "Invalid email or password");
      } else {
        setMessage("Could not connect to backend");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="login-card">
        <h1>Age Assessment Platform</h1>
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              placeholder="Enter your email"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              placeholder="Enter your password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default Login;