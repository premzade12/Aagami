// user.controllers.js

import uploadOnCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import User from "../models/user.model.js";
import moment from "moment";
import geminiCorrectCode from "../geminiCorrectCode.js";
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

    // Try Gemini first, fallback to simple parsing
    let result;
    let gemResult;
    
    try {
      result = await geminiResponse(`${historyContext}\nUser: ${command}`, assistantName, userName);
      console.log('🤖 Gemini raw response:', result);
      
      // Parse Gemini response
      const jsonMatch = result.match(/```json([\s\S]*?)```|({[\s\S]*})/);
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[2];
        gemResult = JSON.parse(jsonString);
        console.log('🤖 Gemini parsed result:', gemResult);
      } else {
        console.log('🤖 Gemini response not JSON, treating as general');
        gemResult = { type: "general", userInput: command, response: result };
      }
    } catch (err) {
      console.error("❌ Gemini API failed, using fallback:", err.message);
      
      // Fallback system
      const lower = command.toLowerCase();
      console.log('🔍 Fallback processing command:', lower);
      if (lower.includes('search') && (lower.includes('google') || lower.includes('on google'))) {
        const assistantNameRegex = new RegExp(assistantName, 'gi');
        let searchTerm = command.replace(assistantNameRegex, '').replace(/search|google|on google|for/gi, '').trim();
        if (!searchTerm) searchTerm = "search query";
        gemResult = { type: 'google_search', query: searchTerm, response: `Of course! I'll search for "${searchTerm}" on Google for you.` };
      } else if (lower.includes('search') && !lower.includes('google')) {
        const assistantNameRegex2 = new RegExp(assistantName, 'gi');
        let searchTerm = command.replace(assistantNameRegex2, '').replace(/search|for/gi, '').trim();
        if (!searchTerm) searchTerm = "search query";
        gemResult = { type: 'google_search', query: searchTerm, response: `I'd be happy to search for "${searchTerm}" on Google for you.` };
      } else if (lower.includes('play')) {
        // Extract what to play
        let playQuery = command.replace(/play|music|song|video/gi, '').trim();
        if (!playQuery) playQuery = 'popular music 2024';
        gemResult = { type: 'play_youtube', query: playQuery, response: `Certainly! I'll play ${playQuery} on YouTube for you.` };
      } else if (lower.includes('open') && lower.includes('instagram')) {
        gemResult = { type: 'open_instagram', response: 'Of course! I\'ll open Instagram for you right away.' };
      } else if (lower.includes('open') && lower.includes('whatsapp')) {
        gemResult = { type: 'open_whatsapp', response: 'Certainly! I\'ll open WhatsApp for you.' };
      } else if (lower.includes('open') && lower.includes('calculator')) {
        gemResult = { type: 'open_calculator', response: 'I\'d be happy to open the calculator for you.' };
      } else if (lower.includes('calculator')) {
        gemResult = { type: 'open_calculator', response: 'Of course! I\'ll open the calculator for you.' };
      } else if (lower.includes('screenshot') || lower.includes('capture screen') || lower.includes('take screenshot')) {
        gemResult = { type: 'take_screenshot', response: 'Taking a screenshot for you!' };
      } else if (lower.includes('enable') && lower.includes('camera') || lower.includes('camera on') || lower.includes('turn on camera') || lower.includes('start camera')) {
        gemResult = { type: 'enable_camera', response: 'Enabling camera for you!' };
      } else if (lower.includes('disable') && lower.includes('camera') || lower.includes('camera off') || lower.includes('turn off camera') || lower.includes('stop camera')) {
        gemResult = { type: 'disable_camera', response: 'Disabling camera!' };
      } else if (lower.includes('search camera') || lower.includes('visual search') || lower.includes('search what i see') || lower.includes('identify this') || 
                 lower.includes('कैमरा में क्या') || lower.includes('क्या देख रहे') || lower.includes('क्या दिख रहा') || 
                 lower.includes('camera mein kya') || lower.includes('kya dekh rahe') || lower.includes('kya dikh raha') ||
                 lower.includes('seeing in') && lower.includes('camera') || lower.includes('see in') && lower.includes('camera') ||
                 lower.includes('what do you see') || lower.includes('camera view') || lower.includes('in my camera')) {
        gemResult = { type: 'visual_search', response: 'Analyzing camera feed!' };
      } else if (lower.includes('call')) {
        // Extract contact name and phone number from "call [name] on [number]" or "call [name] at [number]"
        let contactInfo = command.replace(/call/gi, '').trim();
        let contactName = 'contact';
        let phoneNumber = '';
        
        // Check for phone number patterns
        const phoneMatch = contactInfo.match(/(\d{10,})/); // Match 10+ digits
        if (phoneMatch) {
          phoneNumber = phoneMatch[1];
          contactName = contactInfo.replace(phoneMatch[0], '').replace(/on|at/gi, '').trim();
        } else if (contactInfo.includes(' at ')) {
          const parts = contactInfo.split(' at ');
          contactName = parts[0].trim();
          phoneNumber = parts[1].replace(/[^0-9+]/g, '').trim();
        } else if (contactInfo.includes(' on ')) {
          const parts = contactInfo.split(' on ');
          contactName = parts[0].trim();
          phoneNumber = parts[1].replace(/[^0-9+]/g, '').trim();
        } else {
          contactName = contactInfo || 'contact';
        }
        
        gemResult = { type: 'whatsapp_call', contact: contactName, phone: phoneNumber, response: `I'll be happy to call ${contactName} on WhatsApp for you.` };
      } else if (lower.includes('time')) {
        gemResult = { type: 'get_time', response: `Of course! The current time is ${moment().format('hh:mm A')}.` };
      } else {
        gemResult = { type: 'general', response: `Thank you for speaking with me! I heard you say: "${command}". How may I assist you today?` };
      }
    }



    const type = gemResult.type || "general";
    const userInput = gemResult.userInput || command;
    const assistantResponse = gemResult.response || "I'm here to help you!";
    const query = gemResult.query;
    
    // Enhanced language detection - prioritize input language
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

    // Handle command types
    switch (type) {
      case "get_date":
        const dateResponse = `Current date is ${moment().format("YYYY-MM-DD")}`;
        const dateAudio = null; // Simplified - use main audioUrl
        return res.json({ type, response: dateResponse, audioUrl: dateAudio || audioUrl, language: detectedLanguage });
      case "get_time":
        const timeResponse = `Current time is ${moment().format("hh:mm A")}`;
        const timeAudio = null;
        return res.json({ type, response: timeResponse, audioUrl: timeAudio || audioUrl, language: detectedLanguage });
      case "get_day":
        const dayResponse = `Today is ${moment().format("dddd")}`;
        const dayAudio = null;
        return res.json({ type, response: dayResponse, audioUrl: dayAudio || audioUrl, language: detectedLanguage });
      case "get_month":
        const monthResponse = `Current month is ${moment().format("MMMM")}`;
        const monthAudio = null;
        return res.json({ type, response: monthResponse, audioUrl: monthAudio || audioUrl, language: detectedLanguage });
      case "google_search":
        console.log("🔍 Google Search Debug:");
        console.log("gemResult.query:", gemResult.query);
        console.log("query:", query);
        console.log("userInput:", userInput);
        console.log("command:", command);
        
        let searchQuery = gemResult.query || query || userInput;
        if (!searchQuery) {
          // Extract search term from user input
          searchQuery = command.replace(/search|google|on google|for/gi, '').trim();
          console.log("Extracted searchQuery:", searchQuery);
          if (!searchQuery) searchQuery = command; // Use full command if extraction fails
        }
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        const searchResponse = `Searching for "${searchQuery}" on Google`;
        let searchAudio = null;
        try {
          searchAudio = await generateSpeechWithVoice(searchResponse, detectedLanguage, detectedLanguage);
        } catch (e) { /* ignore */ }
        return res.json({ type, response: searchResponse, query: searchQuery, url: googleUrl, audioUrl: searchAudio || audioUrl, language: detectedLanguage });
      case "play_youtube":
        try {
          const songQuery = query || userInput || "popular songs 2024";
          console.log('🎵 Searching YouTube for:', songQuery);
          
          // Search YouTube and scrape first video ID
          const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songQuery)}`;
          
          const searchResponse = await axios.get(searchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          // Extract first video ID from HTML
          const html = searchResponse.data;
          const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/); 
          
          if (videoIdMatch && videoIdMatch[1]) {
            const videoId = videoIdMatch[1];
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const playResponse = `Playing "${songQuery}" on YouTube`;
            
            console.log('🎵 Found video ID:', videoId);
            console.log('🎵 Playing:', videoUrl);
            
            let playAudio = null;
            try {
              playAudio = await generateSpeechWithVoice(playResponse, detectedLanguage, detectedLanguage);
            } catch (e) { /* ignore */ }
            
            return res.json({ type, response: playResponse, url: videoUrl, audioUrl: playAudio || audioUrl, language: detectedLanguage });
          } else {
            console.log('🎵 No video ID found, using search fallback');
            const fallbackResponse = `Searching for "${songQuery}" on YouTube`;
            
            let fallbackAudio = null;
            try {
              fallbackAudio = await generateSpeechWithVoice(fallbackResponse, detectedLanguage, detectedLanguage);
            } catch (e) { /* ignore */ }
            
            return res.json({ type, response: fallbackResponse, url: searchUrl, audioUrl: fallbackAudio || audioUrl, language: detectedLanguage });
          }
        } catch (error) {
          console.error('🎵 YouTube scraping error:', error.message);
          
          // Fallback to search
          const songQuery = query || userInput || "music";
          const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songQuery)}`;
          const errorResponse = `Opening YouTube search for "${songQuery}"`;
          
          let errorAudio = null;
          try {
            errorAudio = await generateSpeechWithVoice(errorResponse, detectedLanguage, detectedLanguage);
          } catch (e) { /* ignore */ }
          
          return res.json({ type, response: errorResponse, url: fallbackUrl, audioUrl: errorAudio || audioUrl, language: detectedLanguage });
        }
      case "open_instagram":
        let instaAudio = audioUrl; // Use main audio
        if (!instaAudio) {
          try {
            instaAudio = await generateSpeechWithVoice(assistantResponse, detectedLanguage, detectedLanguage);
          } catch (e) { /* ignore */ }
        }
        return res.json({ type, response: assistantResponse, url: "https://www.instagram.com", audioUrl: instaAudio, language: detectedLanguage });
      case "open_whatsapp":
        let whatsappAudio = audioUrl; // Use main audio
        if (!whatsappAudio) {
          try {
            whatsappAudio = await generateSpeechWithVoice(assistantResponse, detectedLanguage, detectedLanguage);
          } catch (e) { /* ignore */ }
        }
        return res.json({ type, response: assistantResponse, url: "https://web.whatsapp.com", audioUrl: whatsappAudio, language: detectedLanguage });
      case "open_calculator":
        let calcAudio = audioUrl;
        if (!calcAudio) {
          try {
            calcAudio = await generateSpeechWithVoice(assistantResponse, detectedLanguage, detectedLanguage);
          } catch (e) { /* ignore */ }
        }
        return res.json({ type, response: assistantResponse, action: "open_calculator", audioUrl: calcAudio, language: detectedLanguage });
      case "take_screenshot":
        const screenshotResponse = detectedLanguage === 'hi-IN' ? "Screenshot le raha hun!" : "Taking screenshot!";
        let screenshotAudio = null;
        try {
          screenshotAudio = await generateSpeechWithVoice(screenshotResponse, detectedLanguage, detectedLanguage);
        } catch (e) { /* ignore */ }
        return res.json({ type, response: screenshotResponse, audioUrl: screenshotAudio || audioUrl, language: detectedLanguage });
      case "enable_camera":
        const cameraOnResponse = detectedLanguage === 'hi-IN' ? "Camera on kar raha hun!" : "Enabling camera!";
        return res.json({ type, response: cameraOnResponse, audioUrl, language: detectedLanguage });
      case "disable_camera":
        const cameraOffResponse = detectedLanguage === 'hi-IN' ? "Camera off kar raha hun!" : "Disabling camera!";
        return res.json({ type, response: cameraOffResponse, audioUrl, language: detectedLanguage });
      case "visual_search":
        // For visual search, we need to trigger the actual camera capture and analysis
        const visualSearchResponse = detectedLanguage === 'hi-IN' ? "Camera se dekh raha hun..." : "Analyzing camera feed...";
        return res.json({ type, response: visualSearchResponse, audioUrl, language: detectedLanguage, action: "capture_and_search" });
      case "whatsapp_message":
        const contact = gemResult.contact || "";
        const message = gemResult.message || "Hi";
        let phone = gemResult.phone || "";
        
        // If no phone provided, check saved contacts
        if (!phone && contact && user.contacts) {
          phone = user.contacts.get(contact.toLowerCase());
          console.log(`📞 Retrieved saved number for ${contact}: ${phone}`);
        }
        
        if (phone) {
          // Save contact if new phone number provided
          if (gemResult.phone && contact) {
            if (!user.contacts) user.contacts = new Map();
            user.contacts.set(contact.toLowerCase(), phone);
            await user.save();
            console.log(`💾 Saved contact: ${contact} -> ${phone}`);
          }
          
          // Open WhatsApp Web with the contact and pre-filled message
          const msgUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
          const msgResponse = `Opening WhatsApp to send "${message}" to ${contact}. Click send when WhatsApp opens.`;
          let msgAudio = null;
          try {
            msgAudio = await generateSpeechWithVoice(msgResponse, detectedLanguage, detectedLanguage);
          } catch (e) { /* ignore */ }
          return res.json({ type, response: msgResponse, action: "open_url", url: msgUrl, audioUrl: msgAudio || audioUrl, language: detectedLanguage });
        } else {
          // Fallback without phone number
          const msgResponse = `To message ${contact}, I need their phone number. Please say "message ${contact} at" followed by their number.`;
          let msgAudio = null;
          try {
            msgAudio = await generateSpeechWithVoice(msgResponse, detectedLanguage, detectedLanguage);
          } catch (e) { /* ignore */ }
          return res.json({ type: "general", response: msgResponse, audioUrl: msgAudio || audioUrl, language: detectedLanguage });
        }
      case "whatsapp_call":
        const callContact = gemResult.contact || "contact";
        let callPhone = gemResult.phone || "";
        
        // If no phone provided, check saved contacts
        if (!callPhone && callContact && user.contacts) {
          callPhone = user.contacts.get(callContact.toLowerCase());
          console.log(`📞 Retrieved saved number for ${callContact}: ${callPhone}`);
        }
        
        if (callPhone) {
          // Save contact if new phone number provided
          if (gemResult.phone && callContact) {
            if (!user.contacts) user.contacts = new Map();
            user.contacts.set(callContact.toLowerCase(), callPhone);
            await user.save();
            console.log(`💾 Saved contact: ${callContact} -> ${callPhone}`);
          }
          
          // Open WhatsApp Web with the contact
          const callUrl = `https://wa.me/${callPhone}`;
          const callResponse = `Opening WhatsApp to call ${callContact}. Click the call button when WhatsApp opens.`;
          let callAudio = null;
          try {
            callAudio = await generateSpeechWithVoice(callResponse, detectedLanguage, detectedLanguage);
          } catch (e) { /* ignore */ }
          return res.json({ type, response: callResponse, action: "open_url", url: callUrl, audioUrl: callAudio || audioUrl, language: detectedLanguage });
        } else {
          // Fallback - ask for phone number
          const callResponse = `To call ${callContact}, I need their phone number. Please say "call ${callContact} at" followed by their number.`;
          let callAudio = null;
          try {
            callAudio = await generateSpeechWithVoice(callResponse, detectedLanguage, detectedLanguage);
          } catch (e) { /* ignore */ }
          return res.json({ type: "general", response: callResponse, audioUrl: callAudio || audioUrl, language: detectedLanguage });
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

// ✅ Test Gemini API
export const testGemini = async (req, res) => {
  try {
    const result = await geminiResponse("Hello, just testing", "Assistant", "User");
    res.json({ success: true, result });
  } catch (error) {
    console.error("❌ Gemini test error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Test Vision API
export const testVision = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const visionApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    
    // Test with image data
    const testPayload = {
      "contents": [{
        "parts": [
          { "text": "What do you see?" },
          {
            "inline_data": {
              "mime_type": "image/jpeg",
              "data": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"
            }
          }
        ]
      }]
    };
    
    console.log('🔍 Testing Vision API with key:', apiKey?.substring(0, 10) + '...');
    const result = await axios.post(`${visionApiUrl}?key=${apiKey}`, testPayload);
    console.log('✅ Vision API Success:', result.data);
    res.json({ success: true, result: result.data });
    
  } catch (error) {
    console.error('❌ Vision API Error Details:');
    console.error('- Status:', error.response?.status);
    console.error('- Status Text:', error.response?.statusText);
    console.error('- Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('- Message:', error.message);
    
    res.status(500).json({ 
      success: false, 
      error: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      }
    });
  }
};

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

// ✅ Visual Search with Google Cloud Vision API
export const visualSearch = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No image buffer provided" });
    }

    const base64Image = req.file.buffer.toString('base64');
    
    // Google Cloud Vision API credentials
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
    console.error('❌ Google Vision API Error:', error.response?.status, error.response?.data || error.message);
    const errorMsg = error.response?.data?.error?.message || error.message;
    res.json({ 
      description: `Vision API Error: ${errorMsg}`,
      debug: {
        status: error.response?.status,
        data: error.response?.data
      }
    });
  }
};


