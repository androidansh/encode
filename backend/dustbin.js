const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const { GoogleGenAI } = require("@google/genai");
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/search-text", async (req, res) => {
  try {
    console.log("User is in post function")
    const { prompt } = req.body;
    console.log(prompt);
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.5-flash-image-preview",   // free model
        messages: [
          { role: "system", content: ai_role },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPEN_ROUTER_KEY}`,
          "Content-Type": "application/json",
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json( formatFoodAIResponse(reply));
    console.log("AI has answered")

  } catch (error) {
    console.error(error);
    res.status(500).json({
    message: "Something went wrong!",
    error: error.message,
  });
  }
});

function formatFoodAIResponse(modelReply) {
  if (!modelReply) return null;
  const text = modelReply.replace(/\*/g, "").replace(/`/g, "");
  const decisionMatch = text.match(/Decision:\s*(.*)/i);
  const explanationMatch = text.match(/Explanation:\s*([\s\S]*?)(Who should avoid it:|$)/i);
  const cautionMatch = text.match(/Who should avoid it:\s*([\s\S]*)/i);

  const decisionRaw = decisionMatch ? decisionMatch[1].trim() : "";
  const explanationRaw = explanationMatch ? explanationMatch[1].trim() : "";
  const cautionRaw = cautionMatch ? cautionMatch[1].trim() : "";

  return {
    decision: decisionRaw,
    explanation: explanationRaw,
    caution: Array.isArray(cautionRaw)
    ? cautionRaw
    : typeof cautionRaw === "string"
      ? [cautionRaw]
      : []
  };
}

app.post("/search-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const base64Image = req.file.buffer.toString("base64");

    const systemPrompt = ai_role

    const openRouterRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.5-flash-image", // Or any other supported vision model
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "input_image",
                image_base64: base64Image,
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPEN_ROUTER_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let reply = openRouterRes.data.choices[0].message.content;

    // --- SAFETY: sometimes model sends markdown JSON ---
    reply = reply.replace(/```json|```/g, "").trim();

    let parsed = {};
    try {
      parsed = JSON.parse(reply);
    } catch (err) {
      console.log("JSON parse fail:", reply);
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    // Normalize decision for frontend
    let normalizedDecision = "okay";
    const d = parsed.decision?.toLowerCase() || "";

    if (d.includes("good")) normalizedDecision = "good";
    else if (d.includes("avoid") || d.includes("bad")) normalizedDecision = "avoid";

    return res.json({
      decision: normalizedDecision,
      explanation: parsed.explanation || "",
      caution: Array.isArray(parsed.caution)
        ? parsed.caution
        : parsed.caution
        ? [parsed.caution]
        : [],
    });
  } catch (error) {
    console.error(error?.response?.data || error);
    return res.status(500).json({ error: "Something went wrong processing image" });
  }
});

app.post("/search1", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "";
    const base64Image = req.file ? req.file.buffer.toString("base64") : null;

    console.log("BODY:", req.body);
    console.log("IMAGE:", !!req.file);

    if (!prompt && !base64Image) {
      return res.status(400).json({ error: "Provide text or image" });
    }

    const content = [];

    // If text exists → add it
    if (req.body.prompt) {
      content.push({
        type: "input_text",
        text: req.body.prompt
      });
    }

    // If image exists → add it
    if (req.file) {
      const base64Image = req.file.buffer.toString("base64");
      content.push({
        type: "input_image",
        image_base64: base64Image
      });
    }

    // If still empty → invalid request
    if (content.length === 0) {
      return res.status(400).json({ error: "No text or image provided" });
    }

    // const ai_role =
    //   "You are an AI-native consumer health assistant. Given ingredients or image, output JSON: {decision, explanation, caution[]}";

    const openRouterRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model:"qwen/qwen3-vl-8b-thinking",
        messages: [
          { role: "system", content: ai_role },
          { role: "user", content: content }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPEN_ROUTER_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let reply = openRouterRes.data.choices[0].message.content;

    // strip markdown fences if AI returns them
    reply = reply.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(reply);
    } catch (e) {
      console.log("AI returned non-JSON:", reply);
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    let normalizedDecision = "okay";
    const d = parsed.decision?.toLowerCase() || "";

    if (d.includes("good")) normalizedDecision = "good";
    else if (d.includes("avoid") || d.includes("bad"))
      normalizedDecision = "avoid";

    return res.json({
      decision: normalizedDecision,
      explanation: parsed.explanation || "",
      caution: Array.isArray(parsed.caution)
        ? parsed.caution
        : parsed.caution
        ? [parsed.caution]
        : []
    });
  } catch (err) {
    console.error(err?.response?.data || err);
    res.status(500).json({ error: "AI request failed" });
  }
});

app.post("/search2", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "";
    let content = [];

    // Text prompt
    if (prompt) {
      content.push({ type: "text", text: prompt });
    }

    // Image prompt
    if (req.file) {
      const base64 = req.file.buffer.toString("base64");
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64}`,
        },
      });
    }

    if (!content.length) {
      return res.status(400).json({ error: "Provide text or image" });
    }

    const result = await client.chatCompletion({
      model: "Qwen/Qwen2.5-VL-7B-Instruct",
      messages: [
        { role: "system", content: ai_role },
        { role: "user", content },
      ],
    });

    let reply = result.choices[0].message.content.trim();
    reply = reply.replace(/```json|```/g, "");

    let parsed = {};
    try {
      parsed = JSON.parse(reply);
    } catch (e) {
      console.log("Model returned non-JSON:", reply);
      return res.status(500).json({ error: "Model returned invalid JSON" });
    }

    // normalize decision
    let decision = "okay";
    const d = parsed.decision?.toLowerCase() || "";
    if (d.includes("good")) decision = "good";
    else if (d.includes("avoid")) decision = "avoid";

    return res.json({
      decision,
      explanation: parsed.explanation || "",
      caution: Array.isArray(parsed.caution)
        ? parsed.caution
        : parsed.caution
        ? [parsed.caution]
        : [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Hugging Face request failed" });
  }
});

app.post("/search3", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "";

    console.log("BODY:", req.body);
    console.log("IMAGE:", !!req.file);

    if (!prompt && !req.file) {
      return res.status(400).json({ error: "Provide text or image" });
    }

    let finalPrompt = ai_role + "\n\n";

    if (prompt) finalPrompt += `Food Description:\n${prompt}\n\n`;

    if (req.file) {
      const base64 = req.file.buffer.toString("base64");
      finalPrompt += `Food Image (Base64): data:image/jpeg;base64,${base64}`;
    }

    const response = await axios.post(
      HF_API,
      { inputs: finalPrompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    let text =
      response.data?.[0]?.generated_text || response.data.generated_text;

    // cleanup
    text = text.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.log("JSON parse failed → raw:", text);
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: text,
      });
    }

    // Normalize decision
    let decision = "okay";
    const d = parsed.decision?.toLowerCase() || "";

    if (d.includes("good")) decision = "good";
    else if (d.includes("avoid") || d.includes("bad")) decision = "avoid";

    return res.json({
      decision,
      explanation: parsed.explanation || "",
      caution: Array.isArray(parsed.caution)
        ? parsed.caution
        : parsed.caution
        ? [parsed.caution]
        : [],
    });
  } catch (err) {
    console.log(err.response?.data || err);
    return res.status(500).json({
      error: "HuggingFace request failed",
    });
  }
});
