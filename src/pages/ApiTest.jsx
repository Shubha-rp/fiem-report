import { useState } from "react";

export default function ApiTest() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");  // ← empty, user types their own URL

  const fetchData = () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setData(null);
    setError(null);

    fetch(url.trim(), {
      headers: {
        Accept: "application/json",
        Loginid: "401122",
        Logintype: "P",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") fetchData();
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>API Response Tester</h2>
      <p style={{ fontSize: "13px", color: "#888", marginBottom: "1rem" }}>
        Type any URL path (e.g. <code>/sap/opu/odata/...</code>) and hit Fetch
      </p>

      {/* URL input */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="/api/sap/opu/odata/shiv/YOUR_SERVICE/YourEntitySet"
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontFamily: "monospace",
            outline: "none",
          }}
        />
        <button
          onClick={fetchData}
          disabled={loading || !url.trim()}
          style={{
            padding: "8px 20px",
            background: loading || !url.trim() ? "#aaa" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading || !url.trim() ? "not-allowed" : "pointer",
            fontSize: "14px",
          }}
        >
          {loading ? "Fetching..." : "Fetch"}
        </button>
      </div>

      {/* States */}
      {loading && <p style={{ color: "#888" }}>Fetching...</p>}

      {error && (
        <div style={{
          background: "#fff0f0",
          border: "1px solid #ffcccc",
          borderRadius: "6px",
          padding: "1rem",
          color: "#cc0000",
          marginBottom: "1rem",
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div>
          <div style={{
            background: "#f0fff4",
            border: "1px solid #b2f5cc",
            borderRadius: "6px",
            padding: "8px 16px",
            marginBottom: "8px",
            fontSize: "13px",
            color: "#276749",
          }}>
            Response received —{" "}
            {Array.isArray(data?.value)
              ? `${data.value.length} records`
              : "object"}
          </div>
          <pre style={{
            background: "#f6f8fa",
            border: "1px solid #e1e4e8",
            borderRadius: "6px",
            padding: "1rem",
            overflow: "auto",
            fontSize: "13px",
            maxHeight: "600px",
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}