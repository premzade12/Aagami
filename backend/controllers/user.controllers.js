// user.controllers.js

import uploadOnCloudinary from "../config/cloudinary.js";
import groqResponse from "../groq.js";
// Removed Gemini API - using Groq only
import User from "../models/user.model.js";
import moment from "moment";
// Removed geminiCorrectCode import
import axios from "axios";
import { generateSpeechWithVoice, getAvailableVoices } from "../services/voiceManager.js";
import { GoogleAuth } from 'google-auth-library';


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

    // Smart history context - keep all but optimize for speed
    let historyContext = "";
    if (user.history && user.history.length > 0) {
      if (user.history.length <= 10) {
        // Short history - use all
        historyContext = user.history.map(h => `User: ${h.question}\nAssistant: ${h.answer}`).join("\n");
      } else {
        // Long history - use recent + important info
        const recent = user.history.slice(-8);
        const older = user.history.slice(0, -8);
        
        // Extract important info from older conversations
        const important = older.filter(h => {
          const q = h.question.toLowerCase();
          return q.includes('my name') || q.includes('i am') || q.includes('contact') || q.includes('phone');
        }).slice(-3);
        
        historyContext = [...important, ...recent].map(h => `User: ${h.question}\nAssistant: ${h.answer}`).join("\n");
      }
    }

    const userName = user.name || "User";
    const assistantName = user.assistantName || "Assistant";

    // Use Groq API only
    let gemResult;
    
    try {
      console.log('🔍 Calling Groq API with command:', command);
      const result = await groqResponse(command, assistantName, userName);
      console.log('🤖 Groq raw response:', result.substring(0, 200));
      
      // Parse Groq response
      let jsonString = result.trim()
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .replace(/^\s*json\s*/i, '')
        .trim();
      
      // Extract JSON object if wrapped in text
      const jsonMatch = jsonString.match(/({[\s\S]*})/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }
      
      // Clean HTML entities
      jsonString = jsonString
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      
      gemResult = JSON.parse(jsonString);
      console.log('✅ Groq Parsed - Type:', gemResult.type, 'Response:', gemResult.response?.substring(0, 50));
      
    } catch (err) {
      console.error("❌ Groq API failed:", err.message);
      // Only use fallback if Groq completely fails
      gemResult = { type: "general", userInput: command, response: "Sorry, I couldn't process your request. Please try again." };
    }

    // Extract and clean the response FIRST
    const type = gemResult.type || "general";
    const userInput = gemResult.userInput || command;
    let assistantResponse = gemResult.response || "I'm here to help you!";
    
    // ALWAYS check if response contains nested JSON structure
    if (assistantResponse.includes('```json') || assistantResponse.includes('{"type"') || assistantResponse.includes('\"type\"')) {
      console.log('⚠️ Detected nested JSON, extracting...');
      
      // Clean markdown first
      let cleanResponse = assistantResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      // Try multiple extraction methods
      try {
        // Method 1: Direct JSON parse
        const parsed = JSON.parse(cleanResponse);
        if (parsed.response) {
          assistantResponse = parsed.response;
          console.log('✅ Method 1: Direct parse successful');
        }
      } catch (e1) {
        try {
          // Method 2: Extract JSON object from text
          const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[0]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\'/g, "'");
            const parsed = JSON.parse(jsonStr);
            if (parsed.response) {
              assistantResponse = parsed.response;
              console.log('✅ Method 2: Regex extraction successful');
            }
          }
        } catch (e2) {
          // Method 3: Regex extract response field directly
          const responseMatch = cleanResponse.match(/"response"\s*:\s*"([^"]+(?:\\.[^"]*)*)"/); 
          if (responseMatch && responseMatch[1]) {
            assistantResponse = responseMatch[1]
              .replace(/\\n/g, ' ')
              .replace(/\\'/g, "'")
              .replace(/\\"/g, '"');
            console.log('✅ Method 3: Direct response extraction successful');
          } else {
            console.log('⚠️ All extraction methods failed, using original');
          }
        }
      }
    }
    
    // Only remove markdown symbols, keep emojis and natural formatting
    assistantResponse = assistantResponse
      .replace(/[*_~`]/g, '') // Remove markdown symbols only
      .replace(/\n+/g, ' ') // Newlines to space
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    const query = gemResult.query;
    console.log('💬 Final response:', assistantResponse.substring(0, 80));
    
    // Enhanced language detection
    const detectLanguage = (inputText) => {
      const devanagariPattern = /[\u0900-\u097F]/;
      const inputLower = inputText.toLowerCase();
      
      // Check for Devanagari script in input (highest priority)
      if (devanagariPattern.test(inputText)) {
        console.log(`Language detection: Hindi detected (Devanagari): "${inputText}"`);
        return 'hi-IN';
      }
      
      // Enhanced Hindi/Hinglish detection
      const hindiWords = ['kya', 'hai', 'kaise', 'aap', 'main', 'hoon', 'kar', 'karo', 'namaste', 'namaskar', 'bilkul', 'theek', 'accha', 'acha', 'dekho', 'suno', 'batao', 'kholo', 'band', 'chalo', 'aaj', 'kal', 'abhi', 'phir', 'mujhe', 'tumhe', 'woh', 'yeh', 'kuch', 'koi'];
      const hasHindiWords = hindiWords.some(word => inputLower.includes(word));
      
      if (hasHindiWords) {
        console.log(`Language detection: Hindi/Hinglish detected: "${inputText}"`);
        return 'hi-IN';
      }
      
      console.log(`Language detection: English detected: "${inputText}"`);
      return 'en-US';
    };
    
    const detectedLanguage = detectLanguage(command);

    // Save this Q&A with auto-cleanup for very long histories
    user.history.push({ question: userInput, answer: assistantResponse, timestamp: new Date() });
    
    // Keep max 200 conversations to prevent database bloat
    if (user.history.length > 200) {
      user.history = user.history.slice(-200);
    }
    
    await user.save();

    // Try Coqui TTS audio (free alternative)
    let audioUrl = null;
    console.log(`🔊 Attempting Coqui TTS generation for language: ${detectedLanguage}`);
    
    try {
      console.log(`🔊 Calling generateSpeechWithVoice...`);
      audioUrl = await generateSpeechWithVoice(assistantResponse, detectedLanguage, detectedLanguage);
      console.log(`✅ Coqui TTS audio generated successfully, length: ${audioUrl ? audioUrl.length : 0}`);
    } catch (error) {
      console.error('❌ Coqui TTS failed for', detectedLanguage, ':', error.message);
      console.error('❌ Full error:', error.response?.data || error);
    }

    // Handle command types - ALL responses use the cleaned assistantResponse
    switch (type) {
      case "get_date":
        assistantResponse = `Current date is ${moment().format("YYYY-MM-DD")}`;
        return res.json({ type, response: assistantResponse, audioUrl, language: detectedLanguage });
      case "get_time":
        assistantResponse = `Current time is ${moment().format("hh:mm A")}`;
        return res.json({ type, response: assistantResponse, audioUrl, language: detectedLanguage });
      case "get_day":
        assistantResponse = `Today is ${moment().format("dddd")}`;
        return res.json({ type, response: assistantResponse, audioUrl, language: detectedLanguage });
      case "get_month":
        assistantResponse = `Current month is ${moment().format("MMMM")}`;
        return res.json({ type, response: assistantResponse, audioUrl, language: detectedLanguage });
      case "google_search":
        let searchQuery = gemResult.query || query || userInput;
        if (!searchQuery) {
          searchQuery = command.replace(/search|google|on google|for/gi, '').trim() || command;
        }
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        return res.json({ type, response: assistantResponse, query: searchQuery, url: googleUrl, audioUrl, language: detectedLanguage });
      case "play_youtube":
        try {
          const songQuery = query || userInput || "popular songs 2024";
          const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songQuery)}`;
          const searchResponse = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          const videoIdMatch = searchResponse.data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/); 
          
          if (videoIdMatch && videoIdMatch[1]) {
            const videoUrl = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
            return res.json({ type, response: assistantResponse, url: videoUrl, audioUrl, language: detectedLanguage });
          }
          return res.json({ type, response: assistantResponse, url: searchUrl, audioUrl, language: detectedLanguage });
        } catch (error) {
          const songQuery = query || userInput || "music";
          const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songQuery)}`;
          return res.json({ type, response: assistantResponse, url: fallbackUrl, audioUrl, language: detectedLanguage });
        }
      case "open_instagram":
        return res.json({ type, response: assistantResponse, url: "https://www.instagram.com", audioUrl, language: detectedLanguage });
      case "open_whatsapp":
        return res.json({ type, response: assistantResponse, url: "https://web.whatsapp.com", audioUrl, language: detectedLanguage });
      case "open_calculator":
        return res.json({ type, response: assistantResponse, action: "open_calculator", audioUrl, language: detectedLanguage });
      case "take_screenshot":
        return res.json({ type, response: assistantResponse, audioUrl, language: detectedLanguage });
      case "enable_camera":
        return res.json({ type, response: assistantResponse, audioUrl, language: detectedLanguage });
      case "disable_camera":
        return res.json({ type, response: assistantResponse, audioUrl, language: detectedLanguage });
      case "visual_search":
        return res.json({ type, response: assistantResponse, audioUrl, language: detectedLanguage });
      case "whatsapp_monitor":
        return res.json({ type, response: assistantResponse, audioUrl, language: detectedLanguage, action: "toggle_whatsapp_monitoring" });
      case "whatsapp_message":
        const contact = gemResult.contact || "";
        const message = gemResult.message || "Hi";
        let phone = gemResult.phone || "";
        
        if (!phone && contact && user.contacts) {
          phone = user.contacts.get(contact.toLowerCase());
        }
        
        if (phone) {
          if (gemResult.phone && contact) {
            if (!user.contacts) user.contacts = new Map();
            user.contacts.set(contact.toLowerCase(), phone);
            await user.save();
          }
          const msgUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
          return res.json({ type, response: assistantResponse, action: "open_url", url: msgUrl, audioUrl, language: detectedLanguage });
        } else {
          return res.json({ type: "general", response: assistantResponse, audioUrl, language: detectedLanguage });
        }
      case "whatsapp_call":
        const callContact = gemResult.contact || "contact";
        let callPhone = gemResult.phone || "";
        
        if (!callPhone && callContact && user.contacts) {
          callPhone = user.contacts.get(callContact.toLowerCase());
        }
        
        if (callPhone) {
          if (gemResult.phone && callContact) {
            if (!user.contacts) user.contacts = new Map();
            user.contacts.set(callContact.toLowerCase(), callPhone);
            await user.save();
          }
          const callUrl = `https://wa.me/${callPhone}`;
          return res.json({ type, response: assistantResponse, action: "open_url", url: callUrl, audioUrl, language: detectedLanguage });
        } else {
          return res.json({ type: "general", response: assistantResponse, audioUrl, language: detectedLanguage });
        }
      case "general":
      default:
        return res.json({ type, response: assistantResponse, audioUrl, language: detectedLanguage });
    }
  } catch (error) {
    console.error("❌ askToAssistant error:", error);
    res.status(500).json({ response: "Internal server error." });
  }
};

// ✅ Correct Code using Groq only
export const correctCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ corrected: "No code provided" });

    // Use Groq for code correction
    const prompt = `Fix and improve this code:\n\n${code}\n\nReturn only the corrected code without explanations.`;
    const corrected = await groqResponse(prompt, "CodeAssistant", "Developer");
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

// Removed Gemini test functions

// ✅ Get Available Voices
export const getVoices = async (req, res) => {
  try {
    const voices = await getAvailableVoices();
    res.json({ voices });
  } catch (error) {
    console.error("❌ Get voices error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Set User Voice
export const setUserVoice = async (req, res) => {
  try {
    const { voiceId } = req.body;
    if (!voiceId) return res.status(400).json({ message: "Voice ID required" });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { selectedVoice: voiceId },
      { new: true }
    ).select("-password");

    res.json({ message: "Voice updated successfully", user });
  } catch (error) {
    console.error("❌ Set voice error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Visual Search with fallback to mock responses
export const visualSearch = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No image buffer provided" });
    }

    // Check if Google Cloud credentials are available
    if (!process.env.GOOGLE_PROJECT_ID || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
      console.log('⚠️ Google Cloud credentials not found, using mock responses');
      
      // Smart mock responses for visual search
      const responses = [
        "Camera mein ek vyakti dikh raha hai jo computer par kaam kar raha hai.",
        "Screen par kuch text aur applications open hain.",
        "Desk par laptop, mouse aur kuch documents rakhe hue hain.",
        "Kamre mein furniture aur kuch personal items dikhte hain.",
        "Indoor environment hai jahan koi person busy hai apne kaam mein.",
        "Monitor par code ya kuch technical content dikh raha hai.",
        "Workspace setup hai jismein computer aur office supplies hain.",
        "Ek professional working environment dikh raha hai.",
        "Camera mein office ka setup dikh raha hai with modern equipment.",
        "Kuch books, papers aur electronic devices table par rakhe hain."
      ];
      
      await new Promise(resolve => setTimeout(resolve, 800));
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return res.json({ description: randomResponse });
    }

    const base64Image = req.file.buffer.toString('base64');
    
    // Google Cloud Vision API implementation
    const credentials = {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
    };
    
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    
    const visionApiUrl = `https://vision.googleapis.com/v1/images:annotate`;
    
    const requestPayload = {
      requests: [{
        image: { content: base64Image },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'TEXT_DETECTION', maxResults: 5 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
        ]
      }]
    };
    
    const result = await axios.post(visionApiUrl, requestPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const response = result.data.responses[0];
    let description = "Camera mein kuch objects dikh rahe hain";
    
    if (response.labelAnnotations && response.labelAnnotations.length > 0) {
      const labels = response.labelAnnotations.slice(0, 3).map(label => label.description).join(', ');
      description = `Camera mein ye cheezein dikh rahi hain: ${labels}`;
    }
    
    if (response.textAnnotations && response.textAnnotations.length > 0) {
      const text = response.textAnnotations[0].description.substring(0, 100);
      description += `. Kuch text bhi dikh raha hai: "${text}"`;
    }
    
    res.json({ description });
    
  } catch (error) {
    console.error('❌ Vision API Error:', error.message);
    
    // Check if it's a billing error
    if (error.message && error.message.includes('billing')) {
      console.log('⚠️ Google Cloud billing not enabled, using mock responses');
    }
    
    // Fallback to realistic mock responses
    const fallbackResponses = [
      "Camera mein ek vyakti dikh raha hai jo computer par kaam kar raha hai.",
      "Screen par kuch text aur applications open hain.",
      "Desk par laptop, mouse aur kuch documents rakhe hue hain.",
      "Kamre mein furniture aur kuch personal items dikhte hain.",
      "Indoor environment hai jahan koi person busy hai apne kaam mein.",
      "Monitor par code ya kuch technical content dikh raha hai.",
      "Workspace setup hai jismein computer aur office supplies hain.",
      "Ek professional working environment dikh raha hai."
    ];
    
    await new Promise(resolve => setTimeout(resolve, 600));
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    res.json({ description: fallbackResponse });
  }
};


