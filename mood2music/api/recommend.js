// api/recommend.js
export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }
  
    // 클라이언트에서 받는 'mood' 파라미터
    const { mood } = req.body;
  
    // Vercel의 환경변수로부터 API 키를 불러옴
    const apiKey = process.env.OPENAI_API_KEY;
  
    // OpenAI API 호출
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that recommends songs.",
          },
          {
            role: "user",
            content: `Recommend 1 song for the mood: ${mood}`,
          },
        ],
        max_tokens: 100,
      }),
    });
  
    const data = await response.json();
    res.status(200).json(data);
  }