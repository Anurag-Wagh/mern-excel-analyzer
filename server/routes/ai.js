const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

let openai;
try {
  const { OpenAI } = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.log('OpenAI not configured, using mock responses');
}

// POST /api/ai/insights
router.post('/insights', auth, async (req, res) => {
  const { columns, data } = req.body;
  if (!columns || !data) {
    return res.status(400).json({ msg: 'Columns and data are required' });
  }

  // Prepare a prompt for OpenAI
  const prompt = `
You are a data analyst. Given the following table columns and data, provide a concise summary, highlight any trends or outliers, and suggest possible business insights.

Columns: ${columns.join(', ')}
Data (first 10 rows): ${JSON.stringify(data.slice(0, 10))}

Summary:
`;
  try {
    if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      });
      const aiText = completion.choices[0].message.content.trim();
      res.json({ insights: aiText });
    } else {
  // Mock AI response for free usage
      // Mock AI response when OpenAI is not configured
      const aiText = `
        This is a mock AI insight.
        - Your data has ${data.length} rows and ${columns.length} columns.
        - Example columns: ${columns.slice(0, 3).join(", ")}...
        - (Add credits to your OpenAI account to get real AI insights!)
      `;
      res.json({ insights: aiText });
    }
  } catch (err) {
    console.error("AI Insights Error:", err);
    res.status(500).json({ msg: 'AI analysis failed', error: err.message });
  }
});

module.exports = router;
