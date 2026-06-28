const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post("/insights", auth, async (req, res) => {
  const { columns, data } = req.body;
  if (!columns || !data) {
    return res.status(400).json({ msg: "Columns and data are required" });
  }

  const prompt = `
You are a data analyst. Summarize this dataset, highlight patterns, trends, correlations, and outliers.
Columns: ${columns.join(", ")}
Data (first 10 rows): ${JSON.stringify(data.slice(0, 10))}
Summary:
  `;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    res.json({ insights: result.response.text() });
  } catch (err) {
    console.error("Gemini Error:", err.message);
    res.status(500).json({ msg: "AI analysis failed" });
  }
});

module.exports = router;
