import  { useEffect, useState } from "react";
import axios from "axios";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visibleRows, setVisibleRows] = useState(10);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("/api/history", {
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
      });
      setHistory(res.data);
    } catch (err) {}
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your entire history? This cannot be undone.")) return;
    setLoading(true);
    try {
      await axios.delete("/api/history", {
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
      });
      setHistory([]);
      setVisibleRows(10);
    } catch (err) {
      alert("Failed to clear history.");
    }
    setLoading(false);
  };

  const handleShowMore = () => {
    setVisibleRows((prev) => prev + 10);
  };

  const handleDeleteRow = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    setLoading(true);
    try {
      await axios.delete(`/api/history/${id}`, {
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
      });
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      alert("Failed to delete entry.");
    }
    setLoading(false);
  };

  const handleDownloadCSV = () => {
    if (!history.length) return;
    const headers = ["File Name", "Upload Date", "Columns"];
    const rows = history.map(item => [
      item.fileName,
      new Date(item.uploadDate).toLocaleString(),
      (item.columns || []).join("; ")
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8">
      <div className="w-full max-w-3xl bg-white/90 p-8 rounded-2xl shadow-2xl mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-indigo-700">Upload & Analysis History</h3>
          <div className="flex gap-2">
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow transition disabled:opacity-50"
              onClick={handleDownloadCSV}
              disabled={history.length === 0}
            >
              Download CSV
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow transition disabled:opacity-50"
              onClick={handleClearHistory}
              disabled={loading || history.length === 0}
            >
              Clear History
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg shadow">
            <thead>
              <tr>
                <th className="border px-2 py-1 bg-gray-200">File Name</th>
                <th className="border px-2 py-1 bg-gray-200">Upload Date</th>
                <th className="border px-2 py-1 bg-gray-200">Columns</th>
                <th className="border px-2 py-1 bg-gray-200 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, visibleRows).map((item, idx) => (
                <tr key={item._id || idx}>
                  <td className="border px-2 py-1">{item.fileName}</td>
                  <td className="border px-2 py-1">{new Date(item.uploadDate).toLocaleString()}</td>
                  <td className="border px-2 py-1">{item.columns?.join(", ")}</td>
                  <td className="border px-2 py-1 text-center">
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow text-sm"
                      onClick={() => handleDeleteRow(item._id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleRows < history.length && (
          <div className="flex justify-center mt-4">
            <button
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded shadow transition"
              onClick={handleShowMore}
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default History; 