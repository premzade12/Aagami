// FIXED CLEAN VERSION — stable continuous listening (no console spam or UI clutter)
import React, { useContext, useEffect, useRef, useState } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import aiImg from "../assets/voice2.gif";
import userImg from "../assets/Voice.gif";
import axios from "axios";
import { IoMenuOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import WhatsAppNotificationMonitor from "../utils/whatsappNotifications";
import WindowsWhatsAppMonitor from "../utils/windowsWhatsappMonitor";

function Home() {
  const navigate = useNavigate();
  const { userData, serverUrl, setUserData } = useContext(userDataContext);

  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(true);
  const [isAssistantAwake, setIsAssistantAwake] = useState(false);
  const isAssistantAwakeRef = useRef(false);
  const [lastHeard, setLastHeard] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false); // Global ref to block recognition
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [whatsappMonitoring, setWhatsappMonitoring] = useState(false);
  const whatsappMonitorRef = useRef(null);

  const inputRef = useRef();
  const inputValue = useRef("");
  const synth = window.speechSynthesis;
  const recognitionRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // --- Simple Speak Function ---
  async function speak(text, audioUrl = null, language = 'en-US') {
    if (!text) return;
    
    // COMPLETELY disable listening while speaking - CRITICAL for preventing feedback
    console.log('🔇 Disabling all listening during speech');
    setIsSpeaking(true);
    isSpeakingRef.current = true; // Global flag
    setIsWakeWordActive(false);
    stopListening();
    setIsListening(false);
    
    // Force abort any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      } catch (e) {}
    }
    
    // Cancel any existing speech
    synth.cancel();
    
    // For Hindi content, try Google TTS first, then fallback to browser
    if (language === 'hi-IN' && /[\u0900-\u097F]/.test(text)) {
      try {
        await useGoogleTTS(text, language);
        return;
      } catch (e) {
        console.log('Google TTS failed, using browser TTS');
      }
    }
    
    // Use browser TTS
    useBrowserTTS();
    
    async function useGoogleTTS(text, lang) {
      const audio = new Audio();
      const encodedText = encodeURIComponent(text);
      audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&tl=hi&client=tw-ob&q=${encodedText}`;
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          console.log('🔊 Google TTS finished, waiting before resuming listening');
          setTimeout(() => {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            if (!isProcessing) {
              console.log('🎤 Resuming listening after Google TTS');
              setIsWakeWordActive(true);
            }
            resolve();
          }, 3000);
        };
        
        audio.onerror = () => {
          reject(new Error('Google TTS failed'));
        };
        
        audio.play().catch(reject);
      });
    }
    
    function useBrowserTTS() {
      console.log(`🔊 Using browser TTS for ${language}:`, text.substring(0, 50) + '...');
      
      // Wait for voices to load
      if (synth.getVoices().length === 0) {
        console.log('⏳ Waiting for voices to load...');
        synth.addEventListener('voiceschanged', () => {
          console.log('✅ Voices loaded, speaking now');
          speakNow();
        }, { once: true });
        return;
      }
      
      speakNow();
    }
    
    function speakNow() {
    try {
      // Enhanced natural pauses for smoother speech
      const naturalText = text
        .replace(/\./g, '. ') 
        .replace(/,/g, ', ') 
        .replace(/!/g, '! ') 
        .replace(/\?/g, '? ') 
        .replace(/:/g, ': ')
        .replace(/;/g, '; ')
        .replace(/\s+/g, ' ') 
        .trim();
      
      // Detect emotional context for dynamic pitch
      const isExcited = /(!|awesome|great|perfect|amazing|wonderful|excited|love|happy)/i.test(text);
      const isQuestion = /\?/.test(text);
      const isCasual = /(sure|okay|alright|yep|yeah|cool|nice)/i.test(text);
      
      const utterance = new SpeechSynthesisUtterance(naturalText);
      
      // Force proper language setting based on content
      if (language === 'hi-IN') {
        // For Hindi content, use hi-IN to ensure proper pronunciation
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = language;
      }
      
      // Smooth and clear voice parameters
      if (language === 'hi-IN') {
        utterance.rate = 1.1;
        utterance.pitch = 0.95;
        utterance.volume = 1.0;
      } else if (language === 'mr-IN') {
        utterance.rate = 1.1;
        utterance.pitch = 0.95;
        utterance.volume = 1.0;
      } else if (isExcited) {
        utterance.rate = 1.15;
        utterance.pitch = 1.1;
        utterance.volume = 0.95;
      } else if (isQuestion) {
        utterance.rate = 1.1;
        utterance.pitch = 1.05;
        utterance.volume = 0.9;
      } else {
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
      }
      
      // Force female voice selection with enhanced language support
      const voices = synth.getVoices();
      console.log(`🎤 Available voices:`, voices.map(v => `${v.name} (${v.lang})`));
      let selectedVoice = null;
      
      if (language === 'en-US') {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('zira')
        ) || voices.find(voice => 
          voice.lang === 'en-US' && voice.name.toLowerCase().includes('female')
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('female') && voice.lang.startsWith('en')
        ) || voices.find(voice => voice.lang === 'en-US');
      } else if (language === 'hi-IN') {
        selectedVoice = voices.find(voice => 
          voice.name.includes('Google हिन्दी')
        ) || voices.find(voice => 
          voice.lang === 'hi-IN'
        ) || voices.find(voice => 
          voice.lang === 'hi'
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('hindi')
        ) || voices.find(voice => 
          voice.lang === 'en-IN'
        );
      } else if (language === 'mr-IN') {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('swara')
        ) || voices.find(voice => 
          voice.lang === 'mr-IN' && voice.name.toLowerCase().includes('female')
        ) || voices.find(voice => 
          voice.lang === 'mr-IN'
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('heera')
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('kalpana')
        ) || voices.find(voice => 
          voice.lang === 'hi-IN' && !voice.name.toLowerCase().includes('madhur')
        ) || voices.find(voice => 
          voice.lang === 'hi-IN'
        );
      } else {
        const langCode = language.split('-')[0];
        selectedVoice = voices.find(voice => 
          voice.lang.startsWith(langCode) && voice.name.toLowerCase().includes('female')
        ) || voices.find(voice => voice.lang.startsWith(langCode));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`✅ Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
      } else {
        console.log(`⚠️ No voice found for ${language}`);
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      }
      
      utterance.onend = () => {
        console.log('🔊 Browser TTS finished, waiting before resuming listening');
        setTimeout(() => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          if (!isProcessing) {
            console.log('🎤 Resuming listening after browser TTS');
            setIsWakeWordActive(true);
          }
        }, 3000);
      };
      
      utterance.onerror = () => {
        console.log('🔊 Browser TTS error, resuming listening');
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (!isProcessing) {
          setIsWakeWordActive(true);
        }
      };
      
      synth.speak(utterance);
    } catch (e) {
      console.log('Browser TTS failed:', e);
      // Resume listening even if TTS fails
      console.log('🔊 TTS failed, resuming listening immediately');
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (!isProcessing) {
        setIsWakeWordActive(true);
      }
    }
    }
  }

  // --- Logout ---
  async function handleLogOut() {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch {
      setUserData(null);
      navigate("/signin");
    }
  }

  // --- Camera Functions ---
  async function enableCamera() {
    try {
      console.log('📷 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('📷 Camera stream obtained:', stream);
      
      // Set camera active first to render the video element
      setCameraActive(true);
      console.log('📷 Camera UI activated');
      
      // Wait for next render cycle, then set the stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('📷 Stream assigned to video element');
        } else {
          console.log('⚠️ Video ref still not available after render');
        }
      }, 100);
      
    } catch (err) {
      console.log('❌ Camera access failed:', err);
      speak('Camera access denied. Please allow camera permission.');
    }
  }

  function disableCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
      console.log('📷 Camera disabled');
    }
  }

  async function captureAndSearch() {
    if (!videoRef.current || !canvasRef.current) {
      speak('Camera nahi mila. Pehle camera on kariye.', null, 'hi-IN');
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        speak('Image capture nahi hua. Phir try kariye.', null, 'hi-IN');
        return;
      }
      
      try {
        console.log('📷 Sending image for analysis, size:', blob.size);
        const formData = new FormData();
        formData.append('image', blob, 'camera-capture.jpg');
        
        const res = await fetch(`${serverUrl}/api/user/visualSearch`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        
        const data = await res.json();
        console.log('📷 Visual search response:', data);
        
        if (data.description) {
          speak(data.description, null, 'hi-IN');
          setResponse(data.description);
          setAiText(data.description);
          setShowOutput(true);
        } else {
          speak('Image analyze nahi kar saka.', null, 'hi-IN');
        }
      } catch (err) {
        console.log('Visual search failed:', err);
        speak('Visual search fail ho gaya. Phir se try kariye.', null, 'hi-IN');
      }
    }, 'image/jpeg', 0.8);
  }

  // --- Screenshot Function ---
  async function takeScreenshot() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
          a.click();
          URL.revokeObjectURL(url);
        });
        
        stream.getTracks().forEach(track => track.stop());
      });
    } catch (err) {
      console.log('Screenshot failed:', err);
    }
  }

  // --- WhatsApp Monitoring Functions ---
  function toggleWhatsAppMonitoring() {
    if (!whatsappMonitoring) {
      // Start monitoring - detect Windows vs Web
      const isWindows = navigator.platform.toLowerCase().includes('win');
      
      if (!whatsappMonitorRef.current) {
        whatsappMonitorRef.current = isWindows ? 
          new WindowsWhatsAppMonitor(speak) : 
          new WhatsAppNotificationMonitor(speak);
      }
      
      whatsappMonitorRef.current.startMonitoring();
      setWhatsappMonitoring(true);
      
      const platform = isWindows ? 'Windows WhatsApp app' : 'WhatsApp Web';
      speak(`${platform} message monitoring enabled. I will announce new messages.`, null, 'en-US');
    } else {
      // Stop monitoring
      if (whatsappMonitorRef.current) {
        whatsappMonitorRef.current.stopMonitoring();
      }
      setWhatsappMonitoring(false);
      speak('WhatsApp message monitoring disabled.', null, 'en-US');
    }
  }

  // --- Handle command actions ---
  async function handleCommand(data) {
    const { type, action, url, userInput, query } = data;
    console.log('🔧 handleCommand called with:', data);
    console.log('🔧 Command type:', type);
    
    if (action === "open_url" && url) return window.open(url, "_blank");
    if (type === "google_search") {
      const searchQuery = query || userInput || "search";
      return window.open(
        `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        "_blank"
      );
    }
    if (type === "play_youtube" && url) {
      console.log('🎵 Opening YouTube URL:', url);
      return window.open(url, "_blank");
    }
    if (type === "open_instagram")
      return window.open("https://www.instagram.com", "_blank");
    if (type === "open_whatsapp")
      return window.open("https://web.whatsapp.com", "_blank");
    if (type === "open_calculator" || type === "calculator_open" || action === "open_calculator") {
      console.log('📊 Opening Calculator');
      return window.open("https://www.google.com/search?q=calculator", "_blank");
    }
    if (type === "take_screenshot" || type === "screenshot") {
      console.log('📸 Taking screenshot');
      return takeScreenshot();
    }
    if (type === "enable_camera" || type === "camera_on") {
      console.log('📷 Camera command detected, calling enableCamera()');
      return enableCamera();
    }
    if (type === "disable_camera" || type === "camera_off") {
      console.log('📷 Disabling camera');
      return disableCamera();
    }
    if (type === "visual_search" || type === "search_camera" || action === "capture_and_search") {
      console.log('🔍 Visual search - capturing and analyzing');
      return captureAndSearch();
    }
    if (type === "whatsapp_monitor" || type === "monitor_whatsapp" || action === "toggle_whatsapp_monitoring") {
      console.log('📱 Toggling WhatsApp monitoring');
      return toggleWhatsAppMonitoring();
    }
    
    if (type === "general") {
      console.log('📝 General response - no specific action needed');
      return;
    }
    if (type === "whatsapp_monitor") {
      console.log('📱 WhatsApp monitoring command');
      return toggleWhatsAppMonitoring();
    }
    console.log('⚠️ No matching command type found for:', type);
  }

  // --- Handle Text or Voice Command ---
  async function handleSubmit(command = null) {
    let value = command || inputValue.current?.trim();
    console.log('handleSubmit called with:', value, 'isAssistantAwake:', isAssistantAwake);
    if (!value || isProcessing) return;
    
    setIsProcessing(true);

    const assistantName = userData?.assistantName?.toLowerCase();
    
    // Check for sleep command FIRST (before any other processing)
    if ((isAssistantAwake || isAssistantAwakeRef.current) && value.toLowerCase().includes('sleep') && assistantName && value.toLowerCase().includes(assistantName)) {
      console.log('Sleep command detected in text input');
      setIsAssistantAwake(false);
      isAssistantAwakeRef.current = false;
      setInput("");
      inputValue.current = "";
      speak(`Thank you! I'll go to sleep now. Please type "wake up" or say "wake up ${userData?.assistantName}" whenever you need me.`);
      return;
    }
    
    // Check for wake up command in text input (ONLY when sleeping)
    if (!isAssistantAwake && !isAssistantAwakeRef.current && (value.toLowerCase().includes('wake up') || (assistantName && value.toLowerCase().includes(assistantName)))) {
      console.log('Wake up command detected in text input');
      setIsAssistantAwake(true);
      isAssistantAwakeRef.current = true;
      
      // Extract command after removing assistant name
      const command = assistantName ? value.replace(new RegExp(assistantName, 'gi'), '').trim() : value.trim();
      
      if (command && !command.toLowerCase().includes('wake up')) {
        // Process the command after waking up
        speak(`Thank you for waking me up! I'll process your command right away.`);
        setInput("");
        inputValue.current = "";
        setIsProcessing(false);
        setTimeout(() => {
          handleSubmit(command);
        }, 500);
      } else {
        speak(`Good day! I'm ${userData?.assistantName}, and I'm honored to assist you today.`);
        setInput("");
        inputValue.current = "";
        setIsProcessing(false);
      }
      return;
    }
    
    // Remove assistant name from command if present
    if (assistantName && value.toLowerCase().includes(assistantName)) {
      value = value.replace(new RegExp(assistantName, 'gi'), '').trim();
      console.log('Command after removing assistant name:', value);
    }
    
    // Only process commands if assistant is awake
    if (!isAssistantAwake && !isAssistantAwakeRef.current) {
      console.log('Assistant is sleeping, cannot process command');
      speak(`I'm currently resting. Please type "wake up" or say "wake up ${userData?.assistantName}" whenever you need my assistance.`);
      setInput("");
      inputValue.current = "";
      setIsProcessing(false);
      return;
    }
    
    console.log('Processing command - Assistant awake:', isAssistantAwake, 'Ref awake:', isAssistantAwakeRef.current);

    setUserText(value);
    setAiText("");
    setResponse("");
    setShowOutput(true);
    setLoading(true);
    setInput("");
    inputValue.current = "";

    try {
      const res = await fetch(`${serverUrl}/api/user/askToAssistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ command: value }),
      });
      const data = await res.json();

      if (data && data.response) {
        setAiText(data.response);
        setResponse(data.response);
        
        // Speak FIRST, then handle command
        const language = data.language || 'en-US';
        console.log('🔊 Speaking response:', data.response.substring(0, 50), 'Language:', language);
        await speak(data.response, data.audioUrl, language);
        
        // Then handle any actions
        await handleCommand(data);
      } else {
        setResponse("❌ Sorry, I didn't get a valid response.");
        await speak("Sorry, I didn't get a valid response.", null, 'en-US');
      }
    } catch {
      setResponse("❌ Internal server error. Please try again.");
      await speak("Internal server error. Please try again.", null, 'en-US');
    }

    setLoading(false);
    setIsProcessing(false);
    
    // Resume listening after response (longer delay)
    setTimeout(() => {
      if (!isSpeaking) {
        setIsWakeWordActive(true);
      }
    }, 3000);
  }

  // --- Enhanced Multi-language Recognition ---
  function createNewRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = false;  // Single recognition session
    rec.interimResults = false;  // Only final results
    rec.maxAlternatives = 1;  // Single alternative
    
    // Use Hindi-India for better Hindi/Marathi recognition
    rec.lang = "hi-IN"; // Hindi-India for mixed language support

    rec.onresult = (e) => {
      // CRITICAL: Block all recognition during speech using ref
      if (isSpeakingRef.current) {
        console.log('🚫 Ignoring recognition during speech');
        return;
      }
      
      const transcript = e.results[0][0].transcript.toLowerCase().trim();
      const confidence = e.results[0][0].confidence || 0.8;
      const assistantName = userData?.assistantName?.toLowerCase();
      
      if (!transcript || transcript.length < 2) return;
      
      setLastHeard(transcript);
      console.log('🎤 Final:', transcript, 'Confidence:', confidence);
      
      if (confidence < 0.2) {
        console.log('⚠️ Very low confidence, ignoring:', confidence);
        return;
      }

      // Process any speech when assistant is awake (check this FIRST)
      if (isAssistantAwakeRef.current && transcript) {
        // Check for sleep command first when awake
        if (transcript.includes('sleep') && assistantName && transcript.includes(assistantName)) {
          console.log('😴 Assistant going to sleep!');
          setIsAssistantAwake(false);
          isAssistantAwakeRef.current = false;
          setIsWakeWordActive(false);
          stopListening();
          speak(`Thank you! I'll rest now. Please say "wake up ${userData?.assistantName}" whenever you need me.`);
          setTimeout(() => {
            setIsWakeWordActive(true);
          }, 3000);
          return;
        }
        
        // When awake, process ALL commands normally (including assistant name)
        if (!isProcessing) {
          console.log('🎯 Command detected (awake):', transcript);
          setIsWakeWordActive(false);
          stopListening();
          handleSubmit(transcript);
        }
        return;
      }
      
      // Only check wake commands when assistant is sleeping
      if (!isAssistantAwakeRef.current) {
        // Check for wake up command in multiple languages
        if (transcript.includes('wake up') || transcript.includes('wake') || 
            transcript.includes('वेक अप') || transcript.includes('जाग') || 
            transcript.includes('उठ') || transcript.includes('जागो')) {
          console.log('🔆 Assistant waking up!');
          setIsAssistantAwake(true);
          isAssistantAwakeRef.current = true;
          setIsWakeWordActive(false);
          setIsProcessing(false);
          stopListening();
          speak(`Good day! I'm ${userData?.assistantName}, and I'm at your service.`);
          setTimeout(() => {
            setIsWakeWordActive(true);
          }, 1000);
          return;
        }
        
        // Only wake up with assistant name when sleeping (not when awake)
        if (assistantName && transcript.includes(assistantName)) {
          console.log('🔆 Assistant name detected, waking up!');
          setIsAssistantAwake(true);
          isAssistantAwakeRef.current = true;
          setIsWakeWordActive(false);
          stopListening();
          const command = transcript.replace(new RegExp(assistantName, 'gi'), '').trim();
          if (command && !isProcessing) {
            speak(`Thank you for calling me! I'm ready to help.`);
            setTimeout(() => {
              handleSubmit(command);
            }, 1000);
          } else {
            speak(`Good day! I'm ${userData?.assistantName}, at your service.`);
            setIsProcessing(false);
            setTimeout(() => {
              setIsWakeWordActive(true);
            }, 2000);
          }
          return;
        }
        
        // If assistant is sleeping and no wake command detected, ignore
        console.log('😴 Assistant is sleeping, ignoring:', transcript);
        return;
      }
    };

    rec.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      
      // Only restart if not speaking
      if (isWakeWordActive && !loading && !isProcessing && !isSpeaking) {
        setTimeout(() => {
          if (!isSpeaking && isWakeWordActive) {
            startListening();
          }
        }, 2000);
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      
      setIsListening(false);
      recognitionRef.current = null;
      
      if (e.error === 'not-allowed') {
        setIsWakeWordActive(false);
      }
    };

    return rec;
  }
  


  // --- Start Listening ---
  function startListening() {
    if (!isWakeWordActive || loading || isListening || isProcessing || isSpeaking || recognitionRef.current) {
      console.log('❌ Cannot start listening:', { isWakeWordActive, loading, isListening, isProcessing, isSpeaking, hasRecognition: !!recognitionRef.current });
      return;
    }
    
    const rec = createNewRecognition();
    if (!rec) return;
    
    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
      console.log('🎤 Started listening');
    } catch (e) {
      setIsListening(false);
      recognitionRef.current = null;
    }
  }

  function stopListening() {
    console.log('🛑 Stopping all speech recognition');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }

  // --- Effects ---
  useEffect(() => {
    if (userData?.assistantName && isWakeWordActive && !loading && !isProcessing && !isSpeaking) {
      const timer = setTimeout(() => {
        if (!isListening && !isProcessing && !isSpeaking && !recognitionRef.current) {
          startListening();
        }
      }, 2000); // Longer delay
      return () => clearTimeout(timer);
    } else {
      stopListening();
    }
  }, [userData?.assistantName, isWakeWordActive, loading, isAssistantAwake, isProcessing, isSpeaking]);

  useEffect(() => {
    return () => stopListening();
  }, []);
  
  // Sync ref with state for UI updates
  useEffect(() => {
    setIsAssistantAwake(isAssistantAwakeRef.current);
  }, [isAssistantAwakeRef.current]);

  // --- Initial Greeting (removed - assistant starts sleeping) ---

  // --- UI ---
  return (
    <div className="w-full h-screen bg-black text-white flex items-center justify-center relative">
      {/* Top-right menu */}
      <div className="absolute top-4 right-4 flex gap-4 z-50">
        {!menuOpen && (
          <IoMenuOutline
            onClick={() => setMenuOpen(true)}
            className="lg:hidden text-white w-[30px] h-[30px] cursor-pointer"
          />
        )}
        {menuOpen && (
          <div className="absolute lg:hidden top-0 left-0 w-full h-full bg-[#00000084] backdrop-blur-lg z-40 flex flex-col items-center justify-center gap-6">
            <RxCross2
              onClick={() => setMenuOpen(false)}
              className="text-white absolute top-[20px] right-[20px] w-[30px] h-[30px] cursor-pointer"
            />
            <button
              onClick={() => {
                handleLogOut();
                setMenuOpen(false);
              }}
              className="absolute top-[60px] right-[20px] px-4 py-2 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-black transition-all"
            >
              Logout
            </button>
          </div>
        )}
        <button
          onClick={handleLogOut}
          className="hidden lg:block px-4 py-2 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-black transition-all"
        >
          Logout
        </button>
      </div>

      {/* Assistant Center */}
      <div className="absolute top-[80px] flex flex-col items-center">
        <video
          src={userData?.assistantImage}
          className={`w-[300px] h-[300px] object-cover rounded-full transition-all duration-500 ${
            isAssistantAwake ? 'opacity-100 brightness-100' : 'opacity-50 brightness-50 grayscale'
          }`}
          autoPlay
          loop
          muted
          playsInline
        />
        <h1 className={`text-2xl font-semibold mt-4 transition-all duration-500 ${
          isAssistantAwake ? 'text-white' : 'text-gray-400'
        }`}>
          I'm <span className={isAssistantAwake ? 'text-blue-400' : 'text-gray-500'}>{userData?.assistantName}</span>
        </h1>
        <p className="text-sm text-blue-300 mt-2 animate-pulse">
          {(isAssistantAwake || isAssistantAwakeRef.current) ? 
            `🎙️ ${userData?.assistantName} is ${isListening ? 'listening' : 'ready'}...` : 
            `😴 ${userData?.assistantName} is sleeping. Say "wake up ${userData?.assistantName}" to wake me up.`
          }
        </p>
        {whatsappMonitoring && (
          <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <span className="animate-pulse">📱</span> WhatsApp monitoring active
          </p>
        )}
        


        {!aiText && !loading && (
          <img src={userImg} className="w-[300px]" alt="User listening" />
        )}
        {(aiText || loading) && (
          <img src={aiImg} className="w-[300px]" alt="AI speaking" />
        )}
      </div>

      {/* Left Input Panel */}
      <div className="absolute left-[30px] w-[30%] flex-col items-start gap-4 sm:flex hidden md:w-[20%]">
        {/* Camera View */}

        {cameraActive && (
          <div className="relative w-full aspect-square bg-black border border-blue-500 rounded-md overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <button
              onClick={disableCamera}
              className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600 transition"
            >
              ✕
            </button>

          </div>
        )}
        
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            inputValue.current = e.target.value;
          }}
          placeholder={isAssistantAwake ? "Type your command..." : "Type 'wake up' to wake assistant..."}
          rows={cameraActive ? 6 : 10}
          className="p-4 w-full bg-black border border-blue-500 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600 transition disabled:bg-gray-500"
          >
            {isAssistantAwake ? "Submit" : "Wake Up"}
          </button>
          
        </div>
        
        
      </div>

      {/* Right panel: AI Response */}
      {showOutput && (
        <div className="absolute right-[30px] w-[30%] md:w-[20%] bg-black border border-blue-500 p-4 rounded-lg text-green-400 whitespace-pre-wrap max-h-[50vh] overflow-auto shadow sm:flex hidden ">
          {loading ? "Loading..." : response}
          {response && !loading && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(response);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600 transition"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
