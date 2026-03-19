import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors());
app.use(express.json({ limit: "10mb" }));

// Initialize AI clients
const googleAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// PostgreSQL pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

let dbInitialized = false;

async function initDb() {
  if (dbInitialized) return;

  try {
    // Attempt a simple connection check first
    await pool.query('SELECT 1');

    // Create chats table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'New chat',
        messages JSONB NOT NULL DEFAULT '[]',
        model TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_chats_user_email ON chats(user_email);
    `);

    dbInitialized = true;
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("DB init error:", err);
    throw new Error("Failed to initialize database connection.");
  }
}

// Model to provider mapping
let MODEL_MAP = {};
if (process.env.MODEL_MAP) {
  try {
    MODEL_MAP = JSON.parse(process.env.MODEL_MAP);
  } catch (err) {
    console.error("Failed to parse MODEL_MAP from environment variables:", err.message);
  }
} else {
  console.warn("MODEL_MAP is not defined in environment variables");
}

// ===== CHAT ENDPOINTS =====

// Save/update a chat
app.post("/api/chats", async (req, res) => {
  try {
    await initDb();
    const { chat, userEmail } = req.body;
    if (!chat || !userEmail) return res.status(400).json({ error: "Missing chat or userEmail" });

    await pool.query(
      `INSERT INTO chats (id, user_email, title, messages, model, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         messages = EXCLUDED.messages,
         model = EXCLUDED.model,
         updated_at = EXCLUDED.updated_at`,
      [chat.id, userEmail, chat.title, JSON.stringify(chat.messages), chat.model, chat.createdAt, chat.updatedAt]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Save chat error:", err);
    res.status(500).json({ error: "Failed to save chat" });
  }
});
app.get('/', (req, res) => {
  res.json({ message: 'Hello' }); // Sends JSON with correct Content-Type
});
// Get all chats for a user
app.get("/api/chats", async (req, res) => {
  try {
    await initDb();
    const { userEmail } = req.query;
    if (!userEmail) return res.status(400).json({ error: "Missing userEmail" });

    const result = await pool.query(
      "SELECT * FROM chats WHERE user_email = $1 ORDER BY updated_at DESC",
      [userEmail]
    );
    const chats = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      messages: row.messages,
      model: row.model,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    res.json(chats);
  } catch (err) {
    console.error("Get chats error:", err);
    res.status(500).json({ error: "Failed to get chats" });
  }
});

// Delete a chat
app.delete("/api/chats/:id", async (req, res) => {
  try {
    await initDb();
    const { userEmail } = req.body;
    await pool.query("DELETE FROM chats WHERE id = $1 AND user_email = $2", [req.params.id, userEmail]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete chat error:", err);
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

// ===== AI CHAT ENDPOINT =====

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model } = req.body;
    const config = MODEL_MAP[model] || MODEL_MAP["gemini-2.0-flash"];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (config.provider === "google") {
      await streamGoogle(config.model, messages, res);
    } else if (config.provider === "openai") {
      await streamOpenAI(config.model, messages, res);
    } else if (config.provider === "anthropic") {
      await streamAnthropic(config.model, messages, res);
    }
  } catch (err) {
    console.error("Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  }
});

async function streamGoogle(model, messages, res) {
  try {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const stream = await googleAI.models.generateContentStream({
      model,
      contents,
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        const data = JSON.stringify({ choices: [{ delta: { content: text } }] });
        res.write(`data: ${data}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
  } catch (err) {
    console.error("Google AI Stream Error:", err);
    let errorMessage = "An error occurred with the AI provider.";
    if (err.status === "PERMISSION_DENIED" || (err.message && err.message.includes("API key"))) {
      errorMessage = "API Key Error: " + (err.message || "Your API key may be invalid or leaked. Please update it.");
    }
    const data = JSON.stringify({ choices: [{ delta: { content: `\n\n**Error**: ${errorMessage}` } }] });
    res.write(`data: ${data}\n\n`);
    res.write("data: [DONE]\n\n");
  } finally {
    res.end();
  }
}

async function streamOpenAI(model, messages, res) {
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        const data = JSON.stringify({ choices: [{ delta: { content } }] });
        res.write(`data: ${data}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
  } catch (err) {
    console.error("OpenAI Stream Error:", err);
    let errorMessage = "An error occurred with the AI provider.";
    if (err.status === 401 || err.status === 403 || (err.message && err.message.includes("API key"))) {
      errorMessage = "API Key Error: " + (err.message || "Your API key may be invalid or leaked. Please update it.");
    } else if (err.error && err.error.message) {
      try {
        const parsed = JSON.parse(err.error.message);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {
        errorMessage = err.error.message;
      }
    }
    const data = JSON.stringify({ choices: [{ delta: { content: `\n\n**Error**: ${errorMessage}` } }] });
    res.write(`data: ${data}\n\n`);
    res.write("data: [DONE]\n\n");
  } finally {
    res.end();
  }
}

async function streamAnthropic(model, messages, res) {
  try {
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const stream = await anthropic.messages.stream({
      model,
      max_tokens: 4096,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        const data = JSON.stringify({ choices: [{ delta: { content: event.delta.text } }] });
        res.write(`data: ${data}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
  } catch (err) {
    console.error("Anthropic Stream Error:", err);
    let errorMessage = "An error occurred with the AI provider.";
    if (err.status === 401 || err.status === 403 || (err.message && err.message.includes("API key"))) {
      errorMessage = "API Key Error: " + (err.message || "Your API key may be invalid or leaked. Please update it.");
    }
    const data = JSON.stringify({ choices: [{ delta: { content: `\n\n**Error**: ${errorMessage}` } }] });
    res.write(`data: ${data}\n\n`);
    res.write("data: [DONE]\n\n");
  } finally {
    res.end();
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Guru backend running on port ${PORT}`));
