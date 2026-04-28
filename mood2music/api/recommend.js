// api/recommend.js
// Bulletproof version: never returns empty body, always JSON

export default async function handler(req, res) {
  // Always set JSON header up front
  res.setHeader("Content-Type", "application/json");

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Parse body safely (Vercel may give string OR object)
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    if (!body || typeof body !== "object") body = {};

    const mood = (body.mood || "").toString().trim() || "general";
    const genre = (body.genre || "").toString().trim() || "any";

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Server missing OPENAI_API_KEY environment variable. Add it in Vercel Settings > Environment Variables and redeploy."
      });
    }

    const prompt = `You are a music recommendation expert.
Recommend EXACTLY ONE real, well-known song that fits BOTH of the following:
- Genre: ${genre}  (the song MUST clearly belong to this genre)
- Mood / Vibe: ${mood}

Respond in this EXACT format, two lines, nothing else:
Song: <Song Title> - <Artist Name>
Why: <one short sentence explaining why this ${genre} song fits a "${mood}" mood>`;

    let openaiRes, openaiText;
    try {
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a precise music recommender. You always follow the requested format exactly." },
            { role: "user", content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 160
        })
      });
      openaiText = await openaiRes.text();
    } catch (netErr) {
      return res.status(502).json({ error: "Network error calling OpenAI: " + (netErr && netErr.message ? netErr.message : String(netErr)) });
    }

    if (!openaiRes.ok) {
      // Try to surface OpenAI's own error message
      let detail = openaiText;
      try {
        const j = JSON.parse(openaiText);
        if (j && j.error && j.error.message) detail = j.error.message;
      } catch {}
      return res.status(openaiRes.status).json({
        error: "OpenAI API error (" + openaiRes.status + "): " + detail
      });
    }

    let parsed;
    try { parsed = JSON.parse(openaiText); }
    catch (e) {
      return res.status(500).json({ error: "Could not parse OpenAI response as JSON. Raw: " + openaiText.slice(0, 300) });
    }

    const recommendation =
      parsed &&
      parsed.choices &&
      parsed.choices[0] &&
      parsed.choices[0].message &&
      parsed.choices[0].message.content
        ? parsed.choices[0].message.content.trim()
        : "";

    if (!recommendation) {
      return res.status(500).json({ error: "OpenAI returned empty content." });
    }

    return res.status(200).json({ recommendation, genre, mood });
  } catch (err) {
    return res.status(500).json({
      error: "Server error: " + (err && err.message ? err.message : String(err))
    });
  }
}
