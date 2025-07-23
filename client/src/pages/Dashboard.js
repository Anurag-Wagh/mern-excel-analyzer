import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AnimatedChart from "../components/AnimatedChart";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Chart, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from "chart.js";
import * as XLSX from "xlsx";

Chart.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const chartTypes = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "pie", label: "Pie" },
  { value: "scatter", label: "Scatter" },
];

function Dashboard() {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState("");
  const chartRef = useRef();
  const [history, setHistory] = useState([]);
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [visibleRows, setVisibleRows] = useState(10);
  const [chartTitle, setChartTitle] = useState("");
  const [chartColor, setChartColor] = useState("#a78bfa");
  const [filePreview, setFilePreview] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/history", {
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
      });
      setHistory(res.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setColumns([]);
    setData([]);
    setXAxis("");
    setYAxis("");
    setError("");
    setVisibleRows(10);
    setFilePreview([]);
    // File preview logic
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const previewRows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 6); // header + 5 rows
        setFilePreview(previewRows);
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please select a file.");
      toast.error("Please select a file.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token"),
          "Content-Type": "multipart/form-data",
        }
      });
      const realColumns = res.data.columns.filter(col => col !== "0");
      setColumns(realColumns);
      setXAxis(realColumns[0] || "");
      setYAxis(realColumns[1] || "");
      setData(res.data.data);
      toast.success("File uploaded and parsed successfully!");
      fetchHistory();
      setChartTitle("");
      setChartColor("#a78bfa");
    } catch (err) {
      setError(err.response?.data?.msg || "Upload failed");
      toast.error(err.response?.data?.msg || "Upload failed");
    }
    setLoading(false);
  };

  const handleGetInsights = async () => {
    setAiLoading(true);
    setAiInsights("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/ai/insights",
        { columns, data },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setAiInsights(res.data.insights);
    } catch (err) {
      toast.error("Failed to get AI insights.");
    }
    setAiLoading(false);
  };

  const chartData = () => {
    if (!xAxis || !yAxis || !data.length) return null;
    if (chartType === "pie") {
      return {
        labels: data.map((row) => row[xAxis]),
        datasets: [
          {
            label: yAxis,
            data: data.map((row) => Number(row[yAxis])),
            backgroundColor: [
              chartColor, "#f472b6", "#34d399", "#fbbf24", "#a78bfa", "#f87171", "#38bdf8", "#facc15"
            ],
          },
        ],
      };
    }
    if (chartType === "scatter") {
      return {
        datasets: [
          {
            label: `${xAxis} vs ${yAxis}`,
            data: data.map((row) => ({
              x: Number(row[xAxis]),
              y: Number(row[yAxis]),
            })),
            backgroundColor: chartColor,
          },
        ],
      };
    }
    // Bar/Line
    return {
      labels: data.map((row) => row[xAxis]),
      datasets: [
        {
          label: yAxis,
          data: data.map((row) => Number(row[yAxis])),
          backgroundColor: chartColor,
          borderColor: chartColor,
          fill: chartType === "line" ? false : true,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: chartTitle || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart` },
    },
    animation: {
      duration: 1200,
      easing: "easeInOutQuart",
    },
  };

  const handleDownloadPNG = () => {
    if (chartRef.current) {
      const chartInstance = chartRef.current;
      if (chartInstance && chartInstance.toBase64Image) {
        const url = chartInstance.toBase64Image();
        const link = document.createElement("a");
        link.href = url;
        link.download = "chart.png";
        link.click();
      } else if (chartInstance && chartInstance.chart && chartInstance.chart.toBase64Image) {
        const url = chartInstance.chart.toBase64Image();
        const link = document.createElement("a");
        link.href = url;
        link.download = "chart.png";
        link.click();
      } else {
        toast.error("Chart download not supported in this browser/version.");
      }
    }
  };

  const handleDownloadPDF = async () => {
    const chartDiv = document.getElementById("chart-container");
    if (!chartDiv) {
      toast.error("Chart not found!");
      return;
    }
    const canvas = await html2canvas(chartDiv);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("chart.pdf");
  };

  const handleShowMore = () => {
    setVisibleRows((prev) => prev + 10);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">
            Excel Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload your Excel files and create beautiful visualizations
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-2xl shadow-2xl mb-8">
          <h2 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-300">Upload Excel File</h2>
          
          {/* File Preview */}
          {filePreview.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">File Preview</h3>
              <div className="overflow-x-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      {filePreview[0]?.map((header, index) => (
                        <th key={index} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filePreview.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-600">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Excel File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="w-full p-3 border-2 border-indigo-200 rounded-lg bg-indigo-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {loading ? "Uploading..." : "Upload & Analyze"}
            </button>
          </form>
        </div>

        {/* Chart Configuration */}
        {columns.length > 0 && (
          <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-2xl shadow-2xl mb-8">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-300">Chart Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chart Type
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="w-full p-3 border-2 border-indigo-200 rounded-lg bg-indigo-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-indigo-500 focus:outline-none"
                >
                  {chartTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  X-Axis
                </label>
                <select
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value)}
                  className="w-full p-3 border-2 border-indigo-200 rounded-lg bg-indigo-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select X-Axis</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Y-Axis
                </label>
                <select
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value)}
                  className="w-full p-3 border-2 border-indigo-200 rounded-lg bg-indigo-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select Y-Axis</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chart Color
                </label>
                <input
                  type="color"
                  value={chartColor}
                  onChange={(e) => setChartColor(e.target.value)}
                  className="w-full h-12 border-2 border-indigo-200 rounded-lg bg-indigo-50 dark:bg-gray-700 dark:border-gray-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chart Title
              </label>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                placeholder="Enter chart title..."
                className="w-full p-3 border-2 border-indigo-200 rounded-lg bg-indigo-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Chart Display */}
        {chartData() && (
          <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-2xl shadow-2xl mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">Chart Visualization</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadPNG}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Download PNG
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Download PDF
                </button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
              <AnimatedChart
                ref={chartRef}
                type={chartType}
                data={chartData()}
                options={chartOptions}
              />
            </div>
          </div>
        )}

        {/* AI Insights */}
        {columns.length > 0 && (
          <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-2xl shadow-2xl mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">AI Insights</h2>
              <button
                onClick={handleGetInsights}
                disabled={aiLoading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {aiLoading ? "Analyzing..." : "Get Insights"}
              </button>
            </div>
            
            {aiInsights && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-3">Data Analysis</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{aiInsights}</p>
              </div>
            )}
          </div>
        )}

        {/* Data Table */}
        {data.length > 0 && (
          <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-2xl shadow-2xl mb-8">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-300">Data Preview</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border rounded-lg shadow">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="border px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, visibleRows).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {columns.map((col) => (
                        <td key={col} className="border px-4 py-2 text-gray-700 dark:text-gray-300">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {data.length > visibleRows && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleShowMore}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Show More
                </button>
              </div>
            )}
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-300">Recent Uploads</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border rounded-lg shadow">
                <thead>
                  <tr>
                    <th className="border px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white">File Name</th>
                    <th className="border px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white">Upload Date</th>
                    <th className="border px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 5).map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="border px-4 py-2 text-gray-700 dark:text-gray-300">{item.fileName}</td>
                      <td className="border px-4 py-2 text-gray-700 dark:text-gray-300">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="border px-4 py-2">
                        <button
                          onClick={() => {
                            setColumns(item.columns);
                            setData(item.chartData);
                            setXAxis(item.columns[0] || "");
                            setYAxis(item.columns[1] || "");
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
