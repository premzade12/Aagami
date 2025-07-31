// backend/geminiCorrectCode.js
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const geminiCorrectCode = async (code) => {
  const prompt = `
You are an expert developer. Correct the following code and return only the corrected code.
Do not include any explanation, comments, or markdown. Just return plain fixed code.

Here is the code:
${code}
  `;

  try {
    const apiUrl = process.env.GEMINI_API_URL;

    const result = await axios.post(apiUrl, {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    return result.data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error("Gemini correction error:", error.message);
    return "Failed to correct the code.";
  }
};

export default geminiCorrectCode;
