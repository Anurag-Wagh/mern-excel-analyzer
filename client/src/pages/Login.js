import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
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
      const res = await axios.post("/api/auth/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white/90 p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center">
        <FaUserCircle className="text-5xl text-indigo-400 mb-4" />
        <h2 className="text-3xl font-extrabold mb-2 text-indigo-700">Sign In</h2>
        <p className="mb-6 text-gray-500">Welcome back! Please login to your account.</p>
        <form className="w-full" onSubmit={handleSubmit}>
          <input
            className="w-full mb-4 p-3 border-2 border-blue-100 rounded-lg focus:outline-none focus:border-indigo-400 bg-blue-50 placeholder-gray-400"
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
           <style>backgroundImage: url('/bg.jpg')</style> 
          <div className="relative mb-4">
            <input
              className="w-full p-3 border-2 border-blue-100 rounded-lg focus:outline-none focus:border-indigo-400 bg-blue-50 placeholder-gray-400 pr-10"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-500"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {error && (
            <div className="text-red-500 mb-3 text-center">
              {error === "Your account has been blocked. Please contact support." ? (
                <>
                  <span role="img" aria-label="blocked" className="mr-2">🚫</span>
                  {error}
                  <br />
                  <a href="mailto:support@yourapp.com" className="text-indigo-600 underline">Contact Support</a>
                </>
              ) : (
                error
              )}
            </div>
          )}
          <button className="w-full bg-gradient-to-r from-blue-500 to-pink-500 text-white py-3 rounded-lg font-bold shadow hover:scale-105 transition mb-2" type="submit">
            Login
          </button>
        </form>
        <button
          className="mt-2 text-indigo-600 underline hover:text-pink-500 transition"
          onClick={() => navigate("/register")}
        >
          Don't have an account? Register
        </button>
      </div>
    </div>
  );
}

export default Login;
