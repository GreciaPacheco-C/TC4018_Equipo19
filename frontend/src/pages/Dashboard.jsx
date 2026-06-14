import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadedData, setUploadedData] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setUploadMessage("❌ Please upload a CSV file");
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

      // Almacenar los datos cargados
      setUploadedData(response.data);
      setUploadMessage(`✅ File uploaded successfully: ${file.name}`);
      
      // Mantener el mensaje visible por más tiempo
      setTimeout(() => setUploadMessage(""), 5000);
    } catch (error) {
      console.error("Upload error:", error);
      const errorDetail = error.response?.data?.detail || error.message;
      setUploadMessage(`❌ Error uploading file: ${errorDetail}`);
      setTimeout(() => setUploadMessage(""), 5000);
    } finally {
      setUploadingFile(false);
      // Reset file input
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
                {uploadingFile ? "Uploading..." : "📁 Load CSV"}
              </button>
            </label>

            {uploadMessage && (
              <p className="upload-message">{uploadMessage}</p>
            )}

            {uploadedData && (
              <div className="upload-preview">
                <h3>📊 File Information</h3>
                <div className="preview-info">
                  <p><strong>File:</strong> {uploadedData.filename}</p>
                  <p><strong>Rows:</strong> {uploadedData.rows_count}</p>
                  <p><strong>Columns:</strong> {uploadedData.columns.join(", ")}</p>
                </div>
                
                {uploadedData.data && uploadedData.data.length > 0 && (
                  <div className="data-table">
                    <h4>Preview (First 5 rows)</h4>
                    <table>
                      <thead>
                        <tr>
                          {uploadedData.columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedData.data.map((row, idx) => (
                          <tr key={idx}>
                            {uploadedData.columns.map((col) => (
                              <td key={`${idx}-${col}`}>{row[col] || "-"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <span>Patients analyzed</span>
            <h3>0</h3>
            <p>Feature coming next</p>
          </div>

          <div className="summary-card">
            <span>Files uploaded</span>
            <h3>0</h3>
            <p>Upload module under construction</p>
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