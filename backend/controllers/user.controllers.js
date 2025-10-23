// user.controllers.js

import uploadOnCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import User from "../models/user.model.js";
import moment from "moment";
import geminiCorrectCode from "../geminiCorrectCode.js";
import axios from "axios";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ✅ Get Current Logged-In User
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    console.error("❌ Get current user error:", error);
    return res.status(500).json({ message: "Internal server error" });
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
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Ask to Assistant with memory
export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ response: "Command is required." });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ response: "User not found." });

    // Build history context
    let historyContext = "";
    if (user.history && user.history.length > 0) {
      const last5 = user.history.slice(-5);
      historyContext = last5.map(h => `Q: ${h.question}\nA: ${h.answer}`).join("\n");
    }

    const userName = user.name || "User";
    const assistantName = user.assistantName || "Assistant";

    // Call Gemini model safely
    let result;
    try {
      result = await geminiResponse(`${historyContext}\nUser: ${command}`, assistantName, userName);
    } catch (err) {
      console.error("❌ Gemini API error:", err.message);
      return res.status(500).json({ response: "Internal server error from AI." });
    }

    // Safe JSON parsing
    // --- NEW: Robust JSON parsing ---
    let gemResult;
    try {
    // 1. Clean the response. Find text between ```json and ``` or just { and }
      const jsonMatch = result.match(/```json([\s\S]*?)```|({[\s\S]*})/);

      if (!jsonMatch || !jsonMatch[0]) {
        // --- THIS IS THE FIX ---
        // If no JSON is found, Gemini probably just sent a general text response.
        // We will *wrap* it in the JSON structure we expect.
        console.warn("⚠️ Gemini did not return JSON, wrapping response.");
        gemResult = {
          type: "general",
          userInput: command,   // Use the original command
          response: result,     // Use the raw result as the answer
        };
        // --- END FIX ---
        } else {
        // We found JSON, so parse it.
        // Use jsonMatch[1] (from ```json) or jsonMatch[2] (from {})
        const jsonString = jsonMatch[1] || jsonMatch[2];
        gemResult = JSON.parse(jsonString);
      }
    } catch (err) {
      console.error("❌ Gemini JSON parsing error:", err.message, "Raw result:", result);
      return res.status(500).json({ response: "Internal server error parsing AI response." });
    }
    // --- END: Robust JSON parsing ---

    const type = gemResult.type || "general";
    const userInput = gemResult.userInput || command;
    const assistantResponse = gemResult.response || "Sorry, I couldn't process that.";

    // Save this Q&A
    user.history.push({ question: userInput, answer: assistantResponse, timestamp: new Date() });
    await user.save();

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
      case "play_youtube":
        try {
          const songQuery = gemResult.query || "popular songs 2024";
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(songQuery)}&key=${YOUTUBE_API_KEY}&maxResults=10&type=video&videoCategoryId=10`;
          
          const searchResponse = await axios.get(searchUrl);
          const videos = searchResponse.data.items;
          
          if (videos && videos.length > 0) {
            // Pick a random video from the results
            const randomVideo = videos[Math.floor(Math.random() * videos.length)];
            const videoUrl = `https://www.youtube.com/watch?v=${randomVideo.id.videoId}&autoplay=1`;
            return res.json({ type, response: `Playing ${randomVideo.snippet.title}`, action: "open_url", url: videoUrl });
          } else {
            const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songQuery)}`;
            return res.json({ type, response: assistantResponse, action: "open_url", url: fallbackUrl });
          }
        } catch (error) {
          console.error("YouTube API error:", error);
          const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(gemResult.query || "music")}`;
          return res.json({ type, response: assistantResponse, action: "open_url", url: fallbackUrl });
        }
      case "open_instagram":
        return res.json({ type, response: assistantResponse, action: "open_url", url: "https://www.instagram.com" });
      case "open_whatsapp":
        return res.json({ type, response: assistantResponse, action: "open_url", url: "https://web.whatsapp.com" });
      case "general":
      default:
        return res.json({ type, response: assistantResponse });
    }
  } catch (error) {
    console.error("❌ askToAssistant error:", error);
    res.status(500).json({ response: "Internal server error." });
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

// ✅ Add new chat to user history safely
export const addHistory = async (req, res) => {
  try {
    const { userInput, assistantResponse } = req.body;

    if (!userInput || !assistantResponse) {
      return res.status(400).json({ message: "User input and assistant response required" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.history.push({
      question: String(userInput),
      answer: String(assistantResponse),
      timestamp: new Date(),
    });
    await user.save();

    res.status(200).json({ message: "History added successfully" });
  } catch (error) {
    console.error("❌ Add history error:", error);
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
    console.error("❌ Get history error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


