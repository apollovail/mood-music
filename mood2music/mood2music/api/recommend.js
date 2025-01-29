export default async function handler(req, res) {
  // 1) 메서드 체크 (POST만 허용)
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // 2) 클라이언트에서 보낸 "mood" 파라미터 추출
  const { mood } = req.body;

  // 3) Vercel 환경변수로부터 API 키 가져오기
  const apiKey = process.env.OPENAI_API_KEY;

  // 4) OpenAI API 호출
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that recommends songs." },
          { role: "user", content: `Recommend 1 song for the mood: ${mood}` },
        ],
        max_tokens: 100,
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}