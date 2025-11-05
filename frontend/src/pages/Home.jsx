// FIXED CLEAN VERSION — stable continuous listening (no console spam or UI clutter)
import React, { useContext, useEffect, useRef, useState } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import aiImg from "../assets/voice2.gif";
import userImg from "../assets/Voice.gif";
import axios from "axios";
import { IoMenuOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";

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

  const inputRef = useRef();
  const inputValue = useRef("");
  const synth = window.speechSynthesis;
  const recognitionRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // --- Simple Speak Function ---
  async function speak(text, audioUrl = null, language = 'en-US') {
    if (!text) return;
    
    // COMPLETELY disable listening while speaking
    setIsSpeaking(true);
    setIsWakeWordActive(false);
    stopListening();
    setIsListening(false);
    
    // Cancel any existing speech
    synth.cancel();
    
    // Always use browser TTS for now (external TTS is failing)
    useBrowserTTS();
    
    function useBrowserTTS() {
      console.log(`🔊 Using browser TTS for ${language}:`, text.substring(0, 50) + '...');
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
      utterance.lang = language;
      
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
          voice.lang === 'hi-IN'
        ) || voices.find(voice => 
          voice.lang === 'hi'
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('hindi')
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('heera')
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('kalpana')
        ) || voices.find(voice => 
          voice.lang === 'en-IN'
        );
      } else if (language === 'mr-IN') {
        selectedVoice = voices.find(voice => 
          voice.lang === 'mr-IN' && voice.name.toLowerCase().includes('female')
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('swara')
        ) || voices.find(voice => 
          voice.lang === 'mr-IN'
        ) || voices.find(voice => 
          voice.lang === 'hi-IN' && voice.name.toLowerCase().includes('female')
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('heera')
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
        setTimeout(() => {
          setIsSpeaking(false);
          if (!isProcessing) {
            setIsWakeWordActive(true);
          }
        }, 2000);
      };
      
      utterance.onerror = () => {
        setTimeout(() => {
          setIsSpeaking(false);
          if (!isProcessing) {
            setIsWakeWordActive(true);
          }
        }, 2000);
      };
      
      synth.speak(utterance);
    } catch (e) {
      console.log('Browser TTS failed:', e);
      // Resume listening even if TTS fails
      setTimeout(() => {
        setIsSpeaking(false);
        if (!isProcessing) {
          setIsWakeWordActive(true);
        }
      }, 10000); // Even longer delay for failures
    }
    } // Close useBrowserTTS function
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

  // --- Handle command actions ---
  async function handleCommand(data) {
    const { type, action, url, userInput, query } = data;
    console.log('handleCommand called with:', data);
    
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
        await handleCommand(data);
        await speak(data.response, data.audioUrl, data.language);
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
      const transcript = e.results[0][0].transcript.toLowerCase().trim();
      const confidence = e.results[0][0].confidence || 0.8; // Default confidence
      const assistantName = userData?.assistantName?.toLowerCase();
      
      if (!transcript || transcript.length < 2) return; // Ignore very short inputs
      
      setLastHeard(transcript);
      console.log('🎤 Final:', transcript, 'Confidence:', confidence);
      
      // Lower confidence threshold for better recognition
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
      
      if (isWakeWordActive && !loading && !isProcessing && !isSpeaking) {
        setTimeout(startListening, 2000);
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
    if (recognitionRef.current) {
      try {
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
        

        {!aiText && !loading && (
          <img src={userImg} className="w-[300px]" alt="User listening" />
        )}
        {(aiText || loading) && (
          <img src={aiImg} className="w-[300px]" alt="AI speaking" />
        )}
      </div>

      {/* Left Input Panel */}
      <div className="absolute left-[30px] w-[30%] flex-col items-start gap-4 sm:flex hidden md:w-[20%]">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            inputValue.current = e.target.value;
          }}
          placeholder={isAssistantAwake ? "Type your command..." : "Type 'wake up' to wake assistant..."}
          rows={10}
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
        <div className="absolute right-[-500px] w-[30%] md:w-[20%] bg-black border border-blue-500 p-4 rounded-lg text-green-400 whitespace-pre-wrap max-h-[50vh] overflow-auto shadow sm:flex hidden relative">
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
