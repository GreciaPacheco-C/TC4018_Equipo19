import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadedData, setUploadedData] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    filesUploaded: 0,
    predictionsGenerated: 0,
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setUploadMessage("Please upload a CSV file");
      setTimeout(() => setUploadMessage(""), 3000);
      return;
    }

    setUploadingFile(true);
    setUploadMessage("");
    setUploadedData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadedData(response.data);
      setSessionStats((currentStats) => ({
        filesUploaded: currentStats.filesUploaded + 1,
        predictionsGenerated:
          currentStats.predictionsGenerated + (response.data.predictions?.length || 0),
      }));
      setUploadMessage("File processed successfully");
      setTimeout(() => setUploadMessage(""), 5000);
    } catch (error) {
      console.error("Upload error:", error);
      const errorDetail = error.response?.data?.detail || error.message;
      setUploadMessage(`Error uploading file: ${errorDetail}`);
      setTimeout(() => setUploadMessage(""), 5000);
    } finally {
      setUploadingFile(false);
      event.target.value = "";
    }
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

        <section className="upload-section">
          <div className="upload-card">
            <h2>Upload Data for Inference</h2>
            <p>Upload a CSV file containing patient data to run inference</p>

            <label htmlFor="csv-input" className="upload-button-label">
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={uploadingFile}
                style={{ display: "none" }}
              />
              <button
                className="upload-button primary-button"
                disabled={uploadingFile}
                onClick={() => document.getElementById("csv-input").click()}
              >
                {uploadingFile ? "Uploading..." : "Load CSV"}
              </button>
            </label>

            {uploadMessage && <p className="upload-message">{uploadMessage}</p>}

            {uploadedData?.predictions?.length > 0 && (
              <div className="upload-preview">
                <div className="prediction-results">
                  <h3>Prediction results</h3>
                  <div className="prediction-table">
                    <table className="prediction-results-table">
                      <thead>
                        <tr>
                          <th>Risk</th>
                          <th>Predicted disease</th>
                          <th>Biological age</th>
                          <th>Biological group</th>
                          <th>Age acceleration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedData.predictions.map((prediction) => (
                          <tr key={prediction.row}>
                            <td className={`risk-cell risk-cell-${prediction.alzheimer_risk_level}`}>
                              <span className={`risk-badge risk-${prediction.alzheimer_risk_level}`}>
                                {prediction.alzheimer_risk_percentage}% · {prediction.alzheimer_risk_level}
                              </span>
                            </td>
                            <td>{prediction.predicted_disease}</td>
                            <td>{prediction.biological_age ?? "N/A"}</td>
                            <td>{prediction.biological_age_range}</td>
                            <td>{prediction.age_acceleration ?? "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <span>Patients analyzed</span>
            <h3>{uploadedData?.predictions?.length || 0}</h3>
            <p>In the latest uploaded file</p>
          </div>

          <div className="summary-card">
            <span>Files uploaded</span>
            <h3>{sessionStats.filesUploaded}</h3>
            <p>In this session</p>
          </div>

          <div className="summary-card">
            <span>Predictions generated</span>
            <h3>{sessionStats.predictionsGenerated}</h3>
            <p>Risk and biological-age pairs</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
