import React,{ forwardRef } from "react";
import { motion } from "framer-motion";
import { Bar, Line, Pie, Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler,
} from "chart.js";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  Filler
);

const chartMap = {
  bar: Bar,
  line: Line,
  pie: Pie,
  scatter: Scatter,
};
const AnimatedChart = forwardRef(({ type, data, options }, ref) => {
  const ChartComponent = chartMap[type] || Bar;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="w-full"
    >
      <ChartComponent ref={ref} data={data} options={options} />
    </motion.div>
  );
});
export default AnimatedChart;
