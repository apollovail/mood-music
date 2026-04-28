// api/recommend.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { mood, genre } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  const genreLabel = genre || "any genre";
  const moodLabel = mood || "general";

  const prompt = `You are a music expert. Recommend exactly 1 song that perfectly fits the following:
- Genre: ${genreLabel}
- Mood/Vibe: ${moodLabel}

Reply in this exact format (nothing else):
Song: [Song Title] - [Artist Name]
Why: [One sentence explaining why this song fits the mood]

Make sure the song is actually a ${genreLabel} song.`;

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
          content: "You are a knowledgeable music curator who recommends songs based on genre and mood.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.8,
    }),
  });

  const data = await response.json();
  res.status(200).json(data);
}
