export default async function handler(req, res) {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request: messages missing" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    console.log("🔎 OpenAI raw response:", JSON.stringify(data, null, 2));


    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected OpenAI response:", data);
      return res.status(500).json({ error: "Invalid response from OpenAI" });
    }

    // ✅ This is the only correct line:
    return res.status(200).json({ reply: data.choices[0].message.content });

  } catch (err) {
    console.error("OpenAI API call failed:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
