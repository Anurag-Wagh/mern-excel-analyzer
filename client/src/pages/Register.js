import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUserPlus, FaEye, FaEyeSlash } from "react-icons/fa";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white/90 p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center">
        <FaUserPlus className="text-5xl text-pink-400 mb-4" />
        <h2 className="text-3xl font-extrabold mb-2 text-pink-600">Create Account</h2>
        <p className="mb-6 text-gray-500">Join us and start analyzing your Excel data!</p>
        <form className="w-full" onSubmit={handleSubmit}>
          <input
            className="w-full mb-4 p-3 border-2 border-pink-100 rounded-lg focus:outline-none focus:border-pink-400 bg-pink-50 placeholder-gray-400"
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            className="w-full mb-4 p-3 border-2 border-pink-100 rounded-lg focus:outline-none focus:border-pink-400 bg-pink-50 placeholder-gray-400"
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <div className="relative mb-4">
            <input
              className="w-full p-3 border-2 border-pink-100 rounded-lg focus:outline-none focus:border-pink-400 bg-pink-50 placeholder-gray-400 pr-10"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-pink-500"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {error && <div className="text-red-500 mb-3 text-center">{error}</div>}
          <button className="w-full bg-gradient-to-r from-pink-500 to-yellow-400 text-white py-3 rounded-lg font-bold shadow hover:scale-105 transition mb-2" type="submit">
            Register
          </button>
        </form>
        <button
          className="mt-2 text-pink-600 underline hover:text-yellow-500 transition"
          onClick={() => navigate("/login")}
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}

export default Register;
