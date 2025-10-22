import uploadOnCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import User from "../models/user.model.js";
import moment from "moment";
import { GoogleGenerativeAI } from "@google/generative-ai";
import geminiCorrectCode from "../geminiCorrectCode.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Get Current Logged-In User
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(400).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: "Get current user error" });
  }
};

// ✅ Update Assistant Name & Image
export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, imageUrl } = req.body;
    const assistantImage = req.file
      ? await uploadOnCloudinary(req.file.path)
      : imageUrl;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { assistantName, assistantImage },
      { new: true }
    ).select("-password");

    return res.status(200).json(user);
  } catch (error) {
    console.error("❌ Update Assistant error:", error);
    return res
      .status(400)
      .json({ message: "Update Assistant error", error: error.message });
  }
};

// ✅ Ask to Assistant with memory
export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ response: "Command is required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ response: "User not found." });

    // Check history for direct answers (like "father's name", "my age", etc.)
    const lowerCommand = command.toLowerCase();
    for (let i = user.history.length - 1; i >= 0; i--) {
      const h = user.history[i];
      if (h.question.toLowerCase().includes(lowerCommand)) {
        return res.status(200).json({ type: "memory", userInput: command, response: h.answer });
      }
    }

    // Prepare last 5 Q&A as context for Gemini
    let historyContext = "";
    if (user.history.length > 0) {
      const last5 = user.history.slice(-5);
      historyContext = last5
        .map((h) => `Q: ${h.question}\nA: ${h.answer}`)
        .join("\n");
    }

    const userName = user.name;
    const assistantName = user.assistantName;

    const result = await geminiResponse(
      `${historyContext}\nUser: ${command}`,
      assistantName,
      userName
    );

    const jsonMatch = result.match(/{[\s\S]*}/);
    if (!jsonMatch) return res.status(400).json({ response: "Cannot understand." });

    let gemResult;
    try {
      gemResult = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("❌ JSON Parse Error:", err.message);
      return res.status(400).json({ response: "Invalid Gemini response." });
    }

    const { type, userInput, response: assistantResponse } = gemResult;

    // Save Q&A to history
    user.history.push({ question: command, answer: assistantResponse || "No answer", timestamp: new Date() });
    await user.save();

    // Handle specific command types
    switch (type) {
      case "get_date":
        return res.json({ type, userInput, response: `Current date is ${moment().format("YYYY-MM-DD")}` });
      case "get_time":
        return res.json({ type, userInput, response: `Current time is ${moment().format("hh:mm A")}` });
      case "get_day":
        return res.json({ type, userInput, response: `Today is ${moment().format("dddd")}` });
      case "get_month":
        return res.json({ type, userInput, response: `Current month is ${moment().format("MMMM")}` });
      case "sing_song":
        const lyrics = [
          "🎵 Tum se hi, tum se hi...",
          "🎵 Kamariya lachke re...",
          "🎵 Dil Diyan Gallan, karange naal naal beh ke...",
          "🎵 Let me love you, and I will love you...",
          "🎵 Ooo Antava Mava Ooo Oo Antava...",
        ];
        const randomLyric = lyrics[Math.floor(Math.random() * lyrics.length)];
        return res.json({ type, userInput, response: assistantResponse || randomLyric });
      case "correct_code":
        return res.json({ type, userInput: "", response: "Okay, I will correct your code now." });
      default:
        return res.json({ type, userInput, response: assistantResponse || "Okay." });
    }
  } catch (error) {
    console.error("❌ AskToAssistant error:", error.message);
    return res.status(500).json({ response: "Internal server error." });
  }
};

// ✅ Correct Code
export const correctCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ corrected: "No code provided" });

    const corrected = await geminiCorrectCode(code);
    return res.status(200).json({ corrected });
  } catch (error) {
    console.error("Code correction error:", error);
    return res.status(500).json({ corrected: "Error correcting code" });
  }
};

// ✅ Add new chat to user history
export const addHistory = async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ message: "Question and answer required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.history.push({ question, answer, timestamp: new Date() });
    await user.save();

    res.status(200).json({ message: "History added successfully" });
  } catch (error) {
    console.error("❌ Add history error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Get all chat history for user
export const getHistory = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("history");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ history: user.history });
  } catch (error) {
    console.error("❌ Get history error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
