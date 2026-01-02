// Pasta, Mayonnaise, olive and broccoli

const express = require("express")
const app = express()
const cors = require('cors')
const dotenv = require("dotenv");
const multer = require("multer");
const axios = require("axios");
const OpenAI = require("openai")

// Enable CORS for all routes
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });
dotenv.config();

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

app.listen(process.env.PORT,function(){
    console.log("Listening on port 8000!")
})

app.get("/",function(req,res){
    console.log("User is at home page")
    res.json({success:"welcome"})
})
const ai_role = 'You are an AI-native consumer health assistant. Your task: Given a packaged food ingredient list or an image or both, decide whether a person should eat it right now. Rules: - Infer what the user likely cares about (health, digestion, safety) - Do NOT list all ingredients - Give a clear decision: "Good", "Okay occasionally", or "Better avoid" - Explain WHY in simple human language - Be honest about uncertainty - Avoid medical claims Output format: Decision: Explanation: Who should avoid it.Return STRICT JSON:{"decision": "good | okay | avoid","explanation": "string","caution": ["array"]}'

app.post("/search1", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "";
    const image = req.file;

    console.log(req.body)

    if (!prompt && !image) {
      return res.status(400).json({ error: "Provide text or image" });
    }

    const messages = [
      { role: "system", content: ai_role },
      {
        role: "user",
        content: [],
      },
    ];

    if (prompt) {
      messages[1].content.push({
        type: "text",
        text: `Food Info: ${prompt}`,
      });
    }

    if (image) {
      const base64 = image.buffer.toString("base64");
      messages[1].content.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${base64}` },
      });
    }

    const response = await client.chat.completions.create({
      model: "Qwen/Qwen2.5-VL-7B-Instruct",
      messages,
    });

    let reply = response.choices[0].message.content;

    reply = reply.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(reply);
    } catch {
      console.log("Invalid JSON:", reply);
      return res.status(500).json({ error: "AI returned invalid JSON", raw: reply });
    }

    let decision = "okay";
    const d = parsed.decision?.toLowerCase() || "";
    if (d.includes("good")) decision = "good";
    else if (d.includes("avoid") || d.includes("bad")) decision = "avoid";
    output ={
      decision,
      explanation: parsed.explanation || "",
      caution: Array.isArray(parsed.caution)
        ? parsed.caution
        : parsed.caution
        ? [parsed.caution]
        : [],
    } 
    console.log(output)
    res.json(output);
  } catch (err) {
    console.log(err?.response?.data || err);
    res.status(500).json({ error: "HF Router failed" });
  }
});

app.post("/search", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "";
    const image = req.file;

    console.log("BODY:", req.body);
    console.log("IMAGE:", !!image);

    if (!prompt && !image) {
      return res.status(400).json({ error: "Provide text or image" });
    }

    // SYSTEM ROLE — tells model to ALWAYS return JSON
    const systemPrompt = `
You are a health assistant. Given a food ingredient list or food image:

Return ONLY valid JSON in this EXACT shape:

{
  "decision": "good | okay | avoid",
  "explanation": "short human explanation",
  "caution": ["risk1", "risk2"]
}

Rules:
- No markdown
- No commentary
- No extra keys
- If nothing risky → caution = []
`;

    const messages = [
      { role: "system", content: ai_role },
      {
        role: "user",
        content: []
      }
    ];

    if (prompt) {
      messages[1].content.push({
        type: "text",
        text: `Food Info: ${prompt}`
      });
    }

    if (image) {
      const base64 = image.buffer.toString("base64");
      messages[1].content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64}`
        }
      });
    }

    const response = await client.chat.completions.create({
      model: "Qwen/Qwen2.5-VL-7B-Instruct",
      messages
    });

    let reply = response.choices[0].message.content;
    console.log("RAW MODEL:", reply);

    // Strip markdown fences if any
    reply = reply.replace(/```json|```/g, "").trim();

    // ---------- SAFE JSON PARSER ----------
    function formatFoodAIResponse(text) {
      // First try JSON parse
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch {}

      // fallback extraction
      const clean = text.replace(/[*`]/g, "");

      const decisionMatch = clean.match(/decision\s*[:=-]\s*(.*)/i);
      const explanationMatch = clean.match(/explanation\s*[:=-]\s*([\s\S]*?)(caution|$)/i);
      const cautionMatch = clean.match(/caution\s*[:=-]\s*([\s\S]*)/i);

      return {
        decision: decisionMatch ? decisionMatch[1].trim() : "okay",
        explanation: explanationMatch ? explanationMatch[1].trim() : "",
        caution: cautionMatch
          ? cautionMatch[1]
              .split(/[\n,-]/)
              .map(s => s.trim())
              .filter(Boolean)
          : []
      };
    }

    const parsed = formatFoodAIResponse(reply);

    // normalize decision
    let decision = parsed.decision?.toLowerCase() || "okay";
    if (decision.includes("good")) decision = "good";
    else if (decision.includes("avoid") || decision.includes("bad")) decision = "avoid";
    else decision = "okay";

    const output = {
      decision,
      explanation: parsed.explanation || "",
      caution: Array.isArray(parsed.caution)
        ? parsed.caution
        : parsed.caution
        ? [parsed.caution]
        : []
    };

    console.log("FINAL OUTPUT:", output);
    return res.json(output);
  } catch (err) {
    console.error(err?.response?.data || err);
    return res.status(500).json({ error: "HF Router failed" });
  }
});
