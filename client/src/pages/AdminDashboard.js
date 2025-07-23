import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from "chart.js";
import { FaUsers, FaUserCheck, FaFileAlt, FaClock, FaDownload, FaChartBar } from "react-icons/fa";

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

Chart.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);
function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsFilter, setLogsFilter] = useState({ action: '', startDate: '', endDate: '' });
  const navigate = useNavigate();

  // Security: Redirect non-admins or non-logged-in users
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.user?.role !== "admin") {
          toast.error("Access denied.");
          navigate("/dashboard");
        }
      } catch (e) {
        localStorage.removeItem("token");
        toast.error("Invalid session. Please log in again.");
        navigate("/login");
      }
    } else {
      toast.error("You must be logged in to view this page.");
      navigate("/login");
    }
  }, [navigate]);

  // Data Fetching for Users and Analytics
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const usersPromise = axios.get("http://localhost:5000/api/admin/users", { headers });
      const analyticsPromise = axios.get("http://localhost:5000/api/admin/analytics", { headers });

      try {
        const [usersResponse, analyticsResponse] = await Promise.all([usersPromise, analyticsPromise]);
        setUsers(usersResponse.data);
        setAnalytics(analyticsResponse.data);
      } catch (err) {
        toast.error(err.response?.data?.msg || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const fetchActivityLogs = async (page = 1, filters = {}) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...filters
      });
      
      const response = await axios.get(`/api/admin/activity-logs?${params}`);
      setActivityLogs(response.data.logs);
      setLogsTotalPages(response.data.totalPages);
      setLogsPage(response.data.currentPage);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const handleLogsFilter = () => {
    const filters = {};
    if (logsFilter.action) filters.action = logsFilter.action;
    if (logsFilter.startDate) filters.startDate = logsFilter.startDate;
    if (logsFilter.endDate) filters.endDate = logsFilter.endDate;
    fetchActivityLogs(1, filters);
  };

  const getActionColor = (action) => {
    const colors = {
      login: 'text-green-600 dark:text-green-400',
      logout: 'text-gray-600 dark:text-gray-400',
      file_upload: 'text-blue-600 dark:text-blue-400',
      file_delete: 'text-red-600 dark:text-red-400',
      profile_update: 'text-purple-600 dark:text-purple-400',
      password_change: 'text-orange-600 dark:text-orange-400',
      admin_action: 'text-indigo-600 dark:text-indigo-400'
    };
    return colors[action] || 'text-gray-600 dark:text-gray-400';
  };

const chartTypeData = analytics?.uploadsByType || [];
const chartLabels = chartTypeData.map(item => item._id || "Unknown");
const chartCounts = chartTypeData.map(item => item.count);

const chartColors = [
  "#6366f1", "#f59e42", "#10b981", "#f43f5e", "#fbbf24", "#3b82f6"
];

const barData = {
  labels: chartLabels,
  datasets: [
    {
      label: "Uploads by Chart Type",
      data: chartCounts,
      backgroundColor: chartColors,
      borderRadius: 8,
    },
  ],
};

const doughnutData = {
  labels: chartLabels,
  datasets: [
    {
      label: "Uploads by Chart Type",
      data: chartCounts,
      backgroundColor: chartColors,
      borderWidth: 2,
    },
],
};

const barOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
  },
};

const doughnutOptions = {
  responsive: true,
  plugins: {
    legend: { position: "right" },
    tooltip: { enabled: true },
  },
};
  const handleBlock = async (userId, currentRole) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}/block`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newRole = currentRole === "blocked" ? "user" : "blocked";
      toast.success(`User successfully ${newRole === 'blocked' ? 'blocked' : 'unblocked'}.`);

      setUsers(users.map(u =>
        u._id === userId ? { ...u, role: newRole } : u
      ));
    } catch (err) {
      toast.error(err.response?.data?.msg || "Action failed.");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("User deleted successfully.");
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to delete user.");
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

const handleExportUsers = () => {
  setExporting(true);
  
  const userData = filteredUsers.map(user => ({
    Name: user.name,
    Email: user.email,
    Role: user.role,
    'Created At': new Date(user.createdAt).toLocaleDateString()
  }));

  exportToCSV(userData, `users_${new Date().toISOString().split('T')[0]}.csv`);
  
  setExporting(false);
};


  const handleExportAnalytics = () => {
    setExporting(true);
    if (analytics) {
      const analyticsData = [
        {
          Metric: 'Total Users',
          Value: analytics.totalUsers,
          Date: new Date().toLocaleDateString()
        },
        {
          Metric: 'Active Users (Last 30 days)',
          Value: analytics.activeUsers,
          Date: new Date().toLocaleDateString()
        },
        {
          Metric: 'Total Files Processed',
          Value: analytics.totalFiles,
          Date: new Date().toLocaleDateString()
        },
        {
          Metric: 'Average Processing Time',
          Value: `${analytics.avgProcessingTime}ms`,
          Date: new Date().toLocaleDateString()
        }
      ];
      exportToCSV(analyticsData, `analytics_${new Date().toISOString().split('T')[0]}.csv`);
    }
    setExporting(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-lg">Loading Admin Dashboard...</div>;
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="bg-white/90 rounded-2xl shadow-2xl mb-8 px-8 py-6 inline-block">
        <h2 className="text-4xl font-extrabold mb-2 text-indigo-700">Admin Dashboard</h2>
        <p className="mb-0 text-lg text-gray-600">Welcome, Admin! Here's your analytics overview and user management panel.</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {analytics?.totalUsers || 0}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
              <FaUsers className="text-2xl text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Users</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {analytics?.activeUsers || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <FaUserCheck className="text-2xl text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Files Processed</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {analytics?.totalFiles || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <FaFileAlt className="text-2xl text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg Processing</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {analytics?.avgProcessingTime || 0}ms
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <FaClock className="text-2xl text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-2xl shadow-2xl mb-8">
        <h3 className="text-xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">Export Data</h3>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={handleExportUsers}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <FaDownload />
            {exporting ? 'Exporting...' : 'Export Users'}
          </button>
          <button
            onClick={handleExportAnalytics}
            disabled={exporting || !analytics}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <FaChartBar />
            {exporting ? 'Exporting...' : 'Export Analytics'}
          </button>
        </div>
      </div>

      {/* Charts Section */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white/90 p-6 rounded-xl shadow flex flex-col items-center">
            <h4 className="text-md font-semibold mb-4 text-indigo-700">Uploads by Chart Type (Bar)</h4>
            <Bar data={barData} options={barOptions} />
          </div>
          <div className="bg-white/90 p-6 rounded-xl shadow flex flex-col items-center">
            <h4 className="text-md font-semibold mb-4 text-pink-600">Uploads by Chart Type (Doughnut)</h4>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div className="bg-white/90 p-8 rounded-2xl shadow-2xl mt-8">
        <h3 className="text-2xl font-bold mb-4 text-indigo-700">User Management</h3>
        <div className="flex justify-end mb-4">
          <input
            type="text"
            className="p-2 border-2 border-indigo-200 rounded w-full max-w-xs bg-indigo-50 placeholder-gray-400"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg shadow">
            <thead>
              <tr>
                <th className="border px-2 py-1 bg-gray-200">Name</th>
                <th className="border px-2 py-1 bg-gray-200">Email</th>
                <th className="border px-2 py-1 bg-gray-200">Role</th>
                <th className="border px-2 py-1 bg-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td className="border px-2 py-1 flex items-center gap-2">
                    <span className="inline-block w-8 h-8 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                      {getInitials(user.name)}
                    </span>
                    {user.name}
                  </td>
                  <td className="border px-2 py-1">{user.email}</td>
                  <td className="border px-2 py-1 capitalize">{user.role}</td>
                  <td className="border px-2 py-1 flex gap-2">
                    <button
                      className={`px-3 py-1 rounded text-white font-semibold shadow transition ${user.role === "blocked" ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}`}
                      onClick={() => handleBlock(user._id, user.role)}
                    >
                      {user.role === "blocked" ? "Unblock" : "Block"}
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white font-semibold shadow transition"
                      onClick={() => handleDelete(user._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-2xl shadow-2xl mt-8">
        <h3 className="text-2xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">Activity Logs</h3>
        
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={logsFilter.action}
            onChange={(e) => setLogsFilter({...logsFilter, action: e.target.value})}
            className="p-2 border-2 border-indigo-200 rounded bg-indigo-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="file_upload">File Upload</option>
            <option value="file_delete">File Delete</option>
            <option value="profile_update">Profile Update</option>
            <option value="password_change">Password Change</option>
            <option value="admin_action">Admin Action</option>
          </select>
          
          <input
            type="date"
            value={logsFilter.startDate}
            onChange={(e) => setLogsFilter({...logsFilter, startDate: e.target.value})}
            className="p-2 border-2 border-indigo-200 rounded bg-indigo-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Start Date"
          />
          
          <input
            type="date"
            value={logsFilter.endDate}
            onChange={(e) => setLogsFilter({...logsFilter, endDate: e.target.value})}
            className="p-2 border-2 border-indigo-200 rounded bg-indigo-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="End Date"
          />
          
          <button
            onClick={handleLogsFilter}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
          >
            Filter
          </button>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg shadow">
            <thead>
              <tr>
                <th className="border px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white">User</th>
                <th className="border px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white">Action</th>
                <th className="border px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white">Description</th>
                <th className="border px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white">IP Address</th>
                <th className="border px-2 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Loading activity logs...
                  </td>
                </tr>
              ) : activityLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                activityLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="border px-2 py-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                          {getInitials(log.userId?.name || 'Unknown')}
                        </span>
                        <div>
                          <div className="font-medium">{log.userId?.name || 'Unknown User'}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{log.userId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border px-2 py-1">
                      <span className={`capitalize font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="border px-2 py-1 text-sm">{log.description}</td>
                    <td className="border px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                      {log.ipAddress || 'N/A'}
                    </td>
                    <td className="border px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logsTotalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => fetchActivityLogs(logsPage - 1, logsFilter)}
              disabled={logsPage === 1}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-gray-600 dark:text-gray-300">
              Page {logsPage} of {logsTotalPages}
            </span>
            <button
              onClick={() => fetchActivityLogs(logsPage + 1, logsFilter)}
              disabled={logsPage === logsTotalPages}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
