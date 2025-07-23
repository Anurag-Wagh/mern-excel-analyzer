import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="text-7xl mb-4">🚧</div>
      <h1 className="text-4xl font-bold text-indigo-700 mb-2">404 - Page Not Found</h1>
      <p className="text-muted mb-6">Sorry, the page you are looking for does not exist.</p>
      <Link
        to="/dashboard"
        className="btn"
      >
        Go to Dashboard
      </Link>
    </motion.div>
  );
}
