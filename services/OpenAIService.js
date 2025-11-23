import axios from "axios";

const API_KEY = "YOUR_PAID_API_KEY";

const openAI = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
  },
});

export const generateText = async (prompt) => {
  try {
    const response = await openAI.post("/responses", {
      model: "gpt-4o-mini", 
      input: prompt,
      max_output_tokens: 150
    });

    return response.data.output_text;
  } catch (error) {
    console.log("Error generating text:", error?.response?.data || error);
    throw error;
  }
};
