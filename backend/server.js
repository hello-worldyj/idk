import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// CORS 허용 (모든 도메인)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Google Books API로 책 설명 가져오기
app.post('/api/book', async (req, res) => {
  const { title, author } = req.body;
  if (!title) return res.status(400).json({ error: "책 제목이 필요합니다." });

  try {
    const query = encodeURIComponent(`${title} ${author || ''}`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${process.env.GOOGLE_KEY}&maxResults=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return res.json({ description: "" });
    }

    const info = data.items[0].volumeInfo;
    res.json({ description: info.description || "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OpenAI API로 요약 생성
app.post('/api/summary', async (req, res) => {
  const { title, author, description, tone, lang, num } = req.body;

  if (!description) return res.status(400).json({ error: "책 설명이 필요합니다." });

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_KEY,
    });

    // 프롬프트 작성 (요약 요청)
    const prompt = `
책 제목: ${title}
저자: ${author}
책 설명: ${description}
요청 사항: ${num}개의 문장으로, 톤: ${tone}, 언어: ${lang}으로 요약해줘.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const summary = completion.choices[0].message.content.trim();
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
