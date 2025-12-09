import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// OpenAI 클라이언트 생성
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/summary", async (req, res) => {
  try {
    const { text } = req.body;

    // AI 요청
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Summarize the user's text in Korean.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const summary = completion.choices[0].message.content;

    res.json({ summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI summary failed" });
  }
});

// Render용 포트 설정
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
