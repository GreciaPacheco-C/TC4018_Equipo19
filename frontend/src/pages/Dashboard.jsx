import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="login-card">
          <h2>No active session</h2>
          <button onClick={() => navigate("/")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="login-card">
        <h1>Dashboard</h1>

        <p>Welcome, {user.name}</p>
        <p>Email: {user.email}</p>
        <p>User ID: {user.user_id}</p>

        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Dashboard;