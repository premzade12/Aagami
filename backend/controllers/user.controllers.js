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
    console.error("❌ Get current user error:", error);
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
    return res.status(400).json({ message: "Update Assistant error", error: error.message });
  }
};

// ✅ Ask to Assistant with memory
export const askToAssistant = async (req, res) => {
  try {
    console.log("✅ askToAssistant called");
    console.log("➡️ Request body:", req.body);
    console.log("➡️ User ID from token:", req.userId);

    const { command } = req.body;
    if (!command) {
      console.error("❌ Missing command in body");
      return res.status(400).json({ response: "Command is required." });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      console.error("❌ User not found");
      return res.status(404).json({ response: "User not found." });
    }

    console.log("✅ User found:", user.email);

    // Build last 5 history items
    let historyContext = "";
    if (user.history && user.history.length > 0) {
      const last5 = user.history
        .filter(h => h.question && h.answer) // only valid entries
        .slice(-5);
      historyContext = last5.map(h => `Q: ${h.question}\nA: ${h.answer}`).join("\n");
    }

    const userName = user.name || "User";
    const assistantName = user.assistantName || "Assistant";

    console.log("🧠 Sending to Gemini model...");
    console.log("🧩 Prompt:", `${historyContext}\nUser: ${command}`);

    const result = await geminiResponse(
      `${historyContext}\nUser: ${command}`,
      assistantName,
      userName
    );

    console.log("✅ Gemini response received:", result);

    const jsonMatch = result.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      console.error("❌ Gemini response did not contain JSON");
      return res.status(400).json({ response: "Cannot understand." });
    }

    let gemResult;
    try {
      gemResult = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("❌ JSON parse error:", err.message);
      return res.status(400).json({ response: "Invalid Gemini response format." });
    }

    const { type, userInput, response: assistantResponse } = gemResult;

    // Save this Q&A to user's history
    user.history.push({ question: command, answer: assistantResponse, timestamp: new Date() });
    await user.save();
    console.log("✅ History updated");

    // Handle command types
    switch (type) {
      case "get_date":
        return res.json({ type, response: `Current date is ${moment().format("YYYY-MM-DD")}` });
      case "get_time":
        return res.json({ type, response: `Current time is ${moment().format("hh:mm A")}` });
      case "get_day":
        return res.json({ type, response: `Today is ${moment().format("dddd")}` });
      case "get_month":
        return res.json({ type, response: `Current month is ${moment().format("MMMM")}` });
      case "general":
      default:
        return res.json({ type, response: assistantResponse || "Okay." });
    }
  } catch (error) {
    console.error("❌ askToAssistant error:", error);
    res.status(500).json({ response: "Internal server error.", error: error.message });
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
    console.error("❌ Code correction error:", error);
    return res.status(500).json({ corrected: "Error correcting code" });
  }
};

// ✅ Add new chat to user history
export const addHistory = async (req, res) => {
  try {
    const { userInput, assistantResponse } = req.body; // match frontend

    if (!userInput || !assistantResponse)
      return res.status(400).json({ message: "User input and assistant response required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.history.push({ question: userInput, answer: assistantResponse, timestamp: new Date() });
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
