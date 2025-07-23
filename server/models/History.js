const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  selectedXAxis: { type: String },
  selectedYAxis: { type: String },
  chartType: { type: String },
  columns: [String],
  chartData: { type: Object }, // Store chart data for re-download/review
});

module.exports = mongoose.model('History', HistorySchema);
