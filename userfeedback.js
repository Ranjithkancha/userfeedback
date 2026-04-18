import { useState, useEffect } from "react";
import axios from "axios";
import "@/App.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState({
    stats: null,
    feedback: [],
    themes: [],
    sentiment: [],
    insights: [],
    changes: [],
  });
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [feedbackForm, setFeedbackForm] = useState({
    content: "",
    source: "manual",
    channel: "",
    user_email: "",
  });

  const [uploadFile, setUploadFile] = useState(null);

  // 🔹 Generic fetch helper
  const fetchData = async (endpoint) => {
    try {
      const res = await axios.get(`${API}/${endpoint}`);
      return res.data;
    } catch (e) {
      console.error(`Error loading ${endpoint}`, e);
      return null;
    }
  };

  // 🔹 Load all data
  const loadData = async () => {
    setLoading(true);
    const [stats, feedback, themes, sentiment, insights, changes] =
      await Promise.all([
        fetchData("stats"),
        fetchData("feedback"),
        fetchData("themes"),
        fetchData("sentiment"),
        fetchData("insights"),
        fetchData("product-changes"),
      ]);

    setData({ stats, feedback, themes, sentiment, insights, changes });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Submit feedback
  const submitFeedback = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/feedback/manual`, feedbackForm);
      setFeedbackForm({ content: "", source: "manual", channel: "", user_email: "" });
      loadData();
    } catch (e) {
      alert("Error submitting feedback");
    }
    setLoading(false);
  };

  // 🔹 Upload file
  const upload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return alert("Select file");

    const fd = new FormData();
    fd.append("file", uploadFile);

    setLoading(true);
    try {
      await axios.post(`${API}/feedback/upload`, fd);
      setUploadFile(null);
      loadData();
    } catch {
      alert("Upload failed");
    }
    setLoading(false);
  };

  // 🔹 Run AI analysis
  const analyze = async () => {
    setAnalyzing(true);
    await axios.post(`${API}/analyze`);
    await loadData();
    setAnalyzing(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <header className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">Feedback Synthesizer</h1>
        <button onClick={analyze} disabled={analyzing}>
          {analyzing ? "Analyzing..." : "Run AI"}
        </button>
      </header>

      {/* Tabs */}
      <nav className="flex gap-4 mb-6">
        {["dashboard", "feedback", "themes"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      {/* Dashboard */}
      {activeTab === "dashboard" && data.stats && (
        <div>
          <p>Total Feedback: {data.stats.total_feedback}</p>
          <p>Themes: {data.stats.total_themes}</p>
        </div>
      )}

      {/* Feedback */}
      {activeTab === "feedback" && (
        <div>
          <form onSubmit={submitFeedback}>
            <textarea
              value={feedbackForm.content}
              onChange={(e) =>
                setFeedbackForm({ ...feedbackForm, content: e.target.value })
              }
              placeholder="Feedback..."
            />
            <button type="submit">Submit</button>
          </form>

          <form onSubmit={upload}>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />
            <button type="submit">Upload</button>
          </form>

          <ul>
            {data.feedback.map((f) => (
              <li key={f.id}>{f.content}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Themes */}
      {activeTab === "themes" && (
        <ul>
          {data.themes.map((t) => (
            <li key={t.id}>{t.name}</li>
          ))}
        </ul>
      )}

      {loading && <p>Loading...</p>}
    </div>
  );
}