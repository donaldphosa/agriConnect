import axios from "axios";

const GEMINI_API_KEY = "AIzaSyAfBLq5UZ__Ea8o_E8RcoiHmvmoCTP5IL8";

export async function runGemini(prompt) {
  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: { "Content-Type": "application/json" },
        params: { key: GEMINI_API_KEY }
      }
    );

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (err) {
    console.error("Gemini API Error:", err.response?.data || err.message);
    return null;
  }
}
