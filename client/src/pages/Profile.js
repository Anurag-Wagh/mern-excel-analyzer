import  { useEffect, useState } from "react";
import axios from "axios";

function Profile() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
      });
      setForm({ name: res.data.name, email: res.data.email, password: "" });
    } catch (err) {
      setError("Failed to load profile.");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axios.put("http://localhost:5000/api/auth/me", form, {
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token"),
          "Content-Type": "application/json"
        }
      });
      setSuccess("Profile updated successfully!");
      setForm({ ...form, password: "" });
    } catch (err) {
      setError(err.response?.data?.msg || "Update failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white/90 p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center">
        <h2 className="text-3xl font-extrabold mb-2 text-indigo-700">Profile</h2>
        <p className="mb-6 text-gray-500">View and update your account details.</p>
        <form className="w-full" onSubmit={handleSubmit}>
          <input
            className="w-full mb-4 p-3 border-2 border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-400 bg-indigo-50 placeholder-gray-400"
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            className="w-full mb-4 p-3 border-2 border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-400 bg-indigo-50 placeholder-gray-400"
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="w-full mb-4 p-3 border-2 border-indigo-100 rounded-lg focus:outline-none focus:border-indigo-400 bg-indigo-50 placeholder-gray-400"
            type="password"
            name="password"
            placeholder="New Password (leave blank to keep current)"
            value={form.password}
            onChange={handleChange}
          />
          {error && <div className="text-red-500 mb-3 text-center">{error}</div>}
          {success && <div className="text-green-600 mb-3 text-center">{success}</div>}
          <button
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-3 rounded-lg font-bold shadow hover:scale-105 transition mb-2"
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;