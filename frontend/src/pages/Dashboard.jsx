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
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>No active session</h2>
          <p>Please sign in to access the platform.</p>
          <button className="primary-button" onClick={() => navigate("/")}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>🧬</span>
          <h2>BioAge AI</h2>
        </div>

        <nav>
          <a className="active">Dashboard</a>
          <a>Patients</a>
          <a>Upload Data</a>
          <a>Predictions</a>
          <a>Reports</a>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Clinical Dashboard</h1>
            <p>Welcome, {user.name}</p>
          </div>

          <div className="user-badge">
            <span>{user.name?.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>
        </header>

        <section className="summary-grid">
          <div className="summary-card">
            <span>Patients analyzed</span>
            <h3>0</h3>
            <p>Feature coming next</p>
          </div>

          <div className="summary-card">
            <span>Files uploaded</span>
            <h3>0</h3>
            <p>Upload module coming next</p>
          </div>

          <div className="summary-card">
            <span>Predictions generated</span>
            <h3>0</h3>
            <p>Feature coming next</p>
          </div>
        </section>


      </main>
    </div>
  );
}

export default Dashboard;