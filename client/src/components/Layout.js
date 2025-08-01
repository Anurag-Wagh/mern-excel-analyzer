import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaChartBar, FaUserShield, FaHistory, FaUser, FaMoon, FaSun } from "react-icons/fa";
import { useDarkMode } from "../context/DarkModeContext";
import { useAuth } from "../context/AuthContext";

const getNavLinks = (isAdmin) => [
  { to: "/dashboard", label: "Dashboard", icon: <FaChartBar /> },
  { to: "/history", label: "History", icon: <FaHistory /> },
  { to: "/profile", label: "Profile", icon: <FaUser /> },
  ...(isAdmin ? [{ to: "/admin", label: "Admin Panel", icon: <FaUserShield /> }] : []),
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
    }
  }, [navigate]);
  const { user, loading } = useAuth();
  
  console.log('Layout render - Auth state:', { 
    user, 
    loading,
    hasToken: !!localStorage.getItem('token')
  });
  
  const isAdmin = user?.role === 'admin';
  console.log('Is admin in Layout?', isAdmin, 'User role:', user?.role);
  
  const navLinks = getNavLinks(isAdmin);

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        backgroundImage: "url('/bg.gif')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
      }}
      className="dark:bg-gray-900"
    >
      <div className="min-h-screen flex flex-col md:flex-row bg-transparent">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-row md:flex-col justify-between">
          <div>
            <div className="p-6 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight flex items-center gap-2">
                <img src="/logo.png" alt="Excel Analytics Logo" className="w-50 h-70 mr-8" />
   <span role="img" aria-label="logo" className="text-3xl"></span>
             
            </div>
            <nav className="mt-8 flex flex-col gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-6 py-3 rounded-l-full text-lg font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                        : "text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`
                  }
                >
                  <span className="text-xl">{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </nav>
            
            {/* Dark Mode Toggle */}
            <div className="mt-6 px-6">
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
              >
                <span className="text-xl">
                  {isDarkMode ? <FaSun /> : <FaMoon />}
                </span>
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </button>
            </div>
          </div>
          <div className="p-6 text-sm text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} Excel Analytics
          </div>
        </aside>
        {/* Main Content with animation */}
        <main className="flex-1 p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="fade-in"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>   
   </div>
    </div>
  );
} 
