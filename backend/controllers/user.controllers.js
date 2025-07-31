import { response } from "express";
import uploadOnCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import User from "../models/user.model.js";
import moment from "moment";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Get Current Logged-In User
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: "Get current user error" });
  }
};

// ✅ Update Assistant Name & Image
export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, imageUrl } = req.body;

    let assistantImage;
    if (req.file) {
      assistantImage = await uploadOnCloudinary(req.file.path);
    } else {
      assistantImage = imageUrl;
    }

    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID" });
    }

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

// ✅ Ask to Assistant (Handles voice commands)
export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ response: "User not found." });

    user.history.push(command);
    await user.save();

    const userName = user.name;
    const assistantName = user.assistantName;

    const result = await geminiResponse(command, assistantName, userName);

    // ✅ Extract JSON safely
    const jsonMatch = result.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      return res.status(400).json({ response: "Sorry, I can't understand." });
    }

    let gemResult;
    try {
      gemResult = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("❌ JSON Parse Error:", err.message);
      return res.status(400).json({ response: "Invalid Gemini response." });
    }

    const { type, userInput, response: assistantResponse } = gemResult;

    switch (type) {
      case 'get_date':
        return res.json({
          type,
          userInput,
          response: `Current date is ${moment().format("YYYY-MM-DD")}`,
        });

      case 'get_time':
        return res.json({
          type,
          userInput,
          response: `Current time is ${moment().format("hh:mm A")}`,
        });
      case 'get_news': {
  try {
    const newsRes = await fetch(`https://newsapi.org/v2/top-headlines?country=in&category=general&apiKey=${process.env.NEWS_API_KEY}`);
    const newsData = await newsRes.json();

    if (!newsData.articles || newsData.articles.length === 0) {
      return res.json({
        type,
        userInput,
        response: "Sorry, I couldn't find any news right now.",
      });
    }

    const top3 = newsData.articles.slice(0, 3).map((a, i) => `${i + 1}. ${a.title}`).join(" ");
    return res.json({
      type,
      userInput,
      response: `Here are the top headlines: ${top3}`,
    });
  } catch (err) {
    console.error("NewsAPI error:", err);
    return res.json({
      type,
      userInput,
      response: "⚠️ Failed to fetch news.",
    });
  }
}


      case 'get_day':
        return res.json({
          type,
          userInput,
          response: `Today is ${moment().format("dddd")}`,
        });

      case 'get_month':
        return res.json({
          type,
          userInput,
          response: `Current month is ${moment().format("MMMM")}`,
        });

      case 'sing_song':
        const lyrics = [
          "🎵 Tum se hi, tum se hi...", 
          "🎵 Kamariya lachke re...", 
          "🎵 Dil Diyan Gallan, karange naal naal beh ke...",
          "🎵 Let me love you, and I will love you...",
          "🎵 Ooo Antava Mava Ooo Oo Antava..."
        ];
        const randomLyric = lyrics[Math.floor(Math.random() * lyrics.length)];
        return res.json({
          type,
          userInput,
          response: assistantResponse || randomLyric,
        });

      case 'correct_code':
        return res.json({
          type,
          userInput: "", // keep input empty
          response: "Okay, I will correct your code now.",
        });

      case 'change_voice':
      case 'whatsapp_message':
      case 'youtube_close':
      case 'google_search':
      case 'youtube_search':
      case 'youtube_play':
      case 'general':
      case 'calculator_open':
      case 'instagram_open':
      case 'facebook_open':
      case 'weather-show':
        return res.json({
          type,
          userInput,
          response: assistantResponse || "Okay.",
        });

      default:
        return res.status(400).json({ response: "I didn't understand that command." });
    }

  } catch (error) {
    console.error("❌ AskToAssistant error:", error.message);
    return res.status(500).json({ response: "Internal server error." });
  }
};


// ✅ Correct Code (used when "Jarvis, correct the code" is said)
import geminiCorrectCode from "../geminiCorrectCode.js"; // update path as needed

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

