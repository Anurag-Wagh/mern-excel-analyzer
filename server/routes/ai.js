const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
// FREE HuggingFace AI
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
    const HF_API = process.env.HF_API_KEY;

    const model = "mistralai/Mistral-7B-Instruct-v0.2";


    const result = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_API}`,
          "Content-Type": "application/json"
        },
        timeout: 200000,
      }
    );

    const aiText =
      result.data?.[0]?.generated_text ||
      "AI model did not return a response.";

    res.json({ insights: aiText });
  } catch (err) {
    console.error("HF Error:", err.response?.data || err.message);
    res.status(500).json({ msg: "AI analysis failed" });
  }
});

module.exports = router;
