import React, { useContext, useEffect, useRef, useState } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import aiImg from "../assets/voice2.gif";
import userImg from "../assets/Voice.gif";
import axios from "axios";
import { IoMenuOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

function Home() {
  const navigate = useNavigate();
  const { userData, serverUrl, setUserData } = useContext(userDataContext);

  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const inputRef = useRef();
  const inputValue = useRef("");
  const synth = window.speechSynthesis;

  // ------------------- SPEAK FUNCTION -------------------
  const speak = async (text) => {
    if (!text) return;
    synth.cancel();
    const voices = await new Promise((resolve) => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) resolve(list);
      window.speechSynthesis.onvoiceschanged = () =>
        resolve(window.speechSynthesis.getVoices());
    });
    const selectedVoice = voices.find(
      (v) => v.name === localStorage.getItem("assistantVoice")
    );
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;

    isSpeakingRef.current = true;
    utterance.onend = () => {
      setAiText("");
      isSpeakingRef.current = false;
      setTimeout(() => {
        if (!isSpeakingRef.current) {
          startRecognition();
        }
      }, 1000);
    };
    synth.speak(utterance);
  };

  // ------------------- LOGOUT -------------------
  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.error(error);
    }
  };

  const startRecognition = () => {
    try {
      recognitionRef.current?.start();
      setListening(true);
    } catch (error) {
      if (!error.message.includes("start")) console.error("Recognition error:", error);
    }
  };

  // ------------------- FETCH HISTORY -------------------
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/user/get-history`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      return data.history || [];
    } catch (err) {
      console.error("Failed to fetch history:", err);
      return [];
    }
  };

  // ------------------- HANDLE SUBMIT -------------------
  const handleSubmit = async () => {
    const value = inputValue.current?.trim();
    if (!value) return;

    setUserText(value);
    setAiText("");
    setResponse("");
    setShowOutput(true);
    setLoading(true);

    // Fetch last 5 valid history items
    let history = [];
    try {
      history = await fetchHistory();
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }

    const last5 = history
      .filter(h => h.userInput && h.assistantResponse)
      .slice(-5);

    const contextString = last5
      .map(h => `Q: ${h.userInput}\nA: ${h.assistantResponse}`)
      .join("\n");

    let data;
    try {
      const res = await fetch(`${serverUrl}/api/user/askToAssistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          command: `${contextString ? contextString + "\n" : ""}User: ${value}`,
        }),
      });
      data = await res.json();
    } catch (err) {
      console.error("Failed to get assistant response:", err);
      setResponse("❌ Internal server error. Please try again.");
      setLoading(false);
      return;
    }

    if (!data || !data.response) {
      console.error("Assistant returned empty response:", data);
      setResponse("❌ Assistant returned empty response.");
      setLoading(false);
      return;
    }

    setAiText(data.response);
    setResponse(data.response);
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView();

    // Handle commands or code correction
    if (data.type === "correct_code") {
      if (!value) {
        speak("❌ Please paste your code first.");
        setResponse("❌ Please paste your code first.");
      } else {
        try {
          const res = await fetch(`${serverUrl}/api/user/correct-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ code: value }),
          });
          const json = await res.json();
          setResponse(json.corrected || "No correction provided.");
        } catch (err) {
          setResponse("❌ Failed to correct code.");
        }
      }
    } else {
      await handleCommand(data);
      setResponse(data.response);
    }

    speak(data.response);

    // Save chat history only if both fields exist
    if (value && data.response) {
      try {
        const res = await fetch(`${serverUrl}/api/user/add-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userInput: value,
            assistantResponse: data.response,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Failed to save history:", errorData);
        }
      } catch (err) {
        console.error("❌ Error saving history:", err);
      }
    }

    setLoading(false);
  };

  // ------------------- HANDLE COMMAND -------------------
  const handleCommand = async (data) => {
    const { type, action, url, userInput } = data;

    // Handle URL opening actions
    if (action === "open_url" && url) {
      window.open(url, "_blank");
      return;
    }

    // Handle specific command types
    if (type === "google_search") {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(userInput)}`, "_blank");
    }

    if (type === "play_youtube" && url) {
      window.open(url, "_blank");
    }

    if (type === "open_instagram") {
      window.open("https://www.instagram.com", "_blank");
    }

    if (type === "open_whatsapp") {
      window.open("https://web.whatsapp.com", "_blank");
    }

    if (type === "change_voice") {
      const voiceName = userInput.split("to ").pop();
      const voices = await new Promise((resolve) => {
        const list = window.speechSynthesis.getVoices();
        if (list.length) resolve(list);
        window.speechSynthesis.onvoiceschanged = () =>
          resolve(window.speechSynthesis.getVoices());
      });
      const selected = voices.find((v) => v.name.toLowerCase() === voiceName.toLowerCase());
      if (selected) {
        localStorage.setItem("assistantVoice", selected.name);
        speak(`Voice changed to ${selected.name}`);
      } else speak("Sorry, I couldn't find that voice.");
    }
  };

  // ------------------- VOICE RECOGNITION -------------------
  useEffect(() => {
    const initVoiceRecognition = async () => {
      console.log('🎤 Initializing voice recognition...');
      
      // Request microphone permission first
      try {
        console.log('🎙️ Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone permission granted');
        stream.getTracks().forEach(track => track.stop()); // Stop the stream
      } catch (err) {
        console.error('❌ Microphone permission denied:', err);
        alert('Please allow microphone access for voice commands to work.');
        return;
      }

      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!SpeechRecognition) {
        console.error('❌ Speech recognition not supported in this browser');
        alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
      }
      
      console.log('✅ Speech recognition supported');
      const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    const isRecognizingRef = { current: false };

    const safeRecognition = () => {
      if (!isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          console.log('▶️ Starting voice recognition...');
          recognition.start();
        } catch (err) {
          console.error('❌ Recognition start error:', err);
          if (err.name !== "InvalidStateError") console.error("Recognition start error:", err);
        }
      } else {
        console.log('⏸️ Skipping start - already active or speaking');
      }
    };

    recognition.onstart = () => { 
      console.log('🎤 Voice recognition started');
      isRecognizingRef.current = true; 
      setListening(true); 
    };
    recognition.onend = () => { 
      console.log('🛑 Voice recognition ended');
      isRecognizingRef.current = false; 
      setListening(false);
      if (!isSpeakingRef.current) {
        console.log('🔄 Restarting voice recognition...');
        setTimeout(safeRecognition, 1000);
      }
    };
    recognition.onerror = (event) => {
      console.error('❌ Voice recognition error:', event.error);
      isRecognizingRef.current = false;
      setListening(false);
      if (event.error !== "aborted" && !isSpeakingRef.current) {
        console.log('🔄 Restarting after error...');
        setTimeout(safeRecognition, 1000);
      }
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      console.log('🎤 Voice detected:', transcript);
      console.log('👤 Assistant name:', userData?.assistantName);
      
      // Respond to any voice input for testing
      if (transcript.length > 0) {
        console.log('✅ Processing voice command...');
        try {
          console.log('🔄 Starting voice command processing...');
          setUserText(transcript);
          recognition.stop();
          isRecognizingRef.current = false;

          console.log('📚 Fetching history...');
          const history = await fetchHistory();
          const last5 = history
            .filter(h => h.userInput && h.assistantResponse)
            .slice(-5);

          const contextString = last5
            .map(h => `Q: ${h.userInput}\nA: ${h.assistantResponse}`)
            .join("\n");

          const commandPayload = { command: `${contextString ? contextString + "\n" : ""}User: ${transcript}` };
          console.log('📤 Sending API request:', commandPayload);
          console.log('🌐 Server URL:', serverUrl);

          const res = await fetch(`${serverUrl}/api/user/askToAssistant`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(commandPayload),
          });

          console.log('📥 API Response status:', res.status);
          const data = await res.json();
          console.log('📥 API Response data:', data);
          
          if (data && data.response) {
            setAiText(data.response);
            setResponse(data.response);
            setShowOutput(true);
            await handleCommand(data);
            speak(data.response);

            // Save history
            if (transcript && data.response) {
              try {
                await fetch(`${serverUrl}/api/user/add-history`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ userInput: transcript, assistantResponse: data.response }),
                });
              } catch (err) { console.error("Failed to save voice history:", err); }
            }
          } else {
            console.error('❌ No valid response from API');
          }
        } catch (err) { 
          console.error("❌ Voice command error:", err);
          speak("Sorry, I encountered an error processing your request.");
        }
      }
    };

      safeRecognition();
      const fallback = setInterval(() => { if (!isSpeakingRef.current && !isRecognizingRef.current) safeRecognition(); }, 10000);

      return () => {
        recognition.stop();
        setListening(false);
        isRecognizingRef.current = false;
        clearInterval(fallback);
      };
    };

    initVoiceRecognition();
  }, [userData]);

  // ------------------- WELCOME SPEECH -------------------
  useEffect(() => {
    if (userData?.name && userData?.assistantName)
      speak(`Hello ${userData.name}, what can I help you with?`);
  }, [userData]);

  // ------------------- JSX -------------------
  return (
    <div className="w-full h-screen bg-black text-white flex items-center justify-center relative">
      {/* Top Buttons */}
      <div className="absolute top-4 right-4 flex gap-4 z-50">
        {!menuOpen && <IoMenuOutline onClick={() => setMenuOpen(true)} className="lg:hidden text-white w-[30px] h-[30px] cursor-pointer" />}
        {menuOpen && (
          <div className="absolute lg:hidden top-0 left-0 w-full h-full bg-[#00000084] backdrop-blur-lg z-40 flex flex-col items-center justify-center gap-6">
            <RxCross2 onClick={() => setMenuOpen(false)} className="text-white absolute top-[20px] right-[20px] w-[30px] h-[30px] cursor-pointer" />
            <button onClick={() => { navigate("/customize"); setMenuOpen(false); }} className="absolute top-[60px] right-[20px] px-4 py-2 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-black transition-all">Customize</button>
            <button onClick={() => { handleLogOut(); setMenuOpen(false); }} className="absolute top-[120px] right-[20px] px-4 py-2 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-black transition-all">Logout</button>
          </div>
        )}
        <button onClick={() => navigate("/customize")} className="hidden lg:block px-4 py-2 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-black transition-all">Customize</button>
        <button onClick={handleLogOut} className="hidden lg:block px-4 py-2 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-black transition-all">Logout</button>
      </div>

      {/* Avatar */}
      <div className="absolute top-[80px] flex flex-col items-center">
        <video src={userData?.assistantImage} className="w-[300px] h-[300px] object-cover rounded-full" autoPlay loop muted playsInline />
        <h1 className="text-2xl font-semibold mt-4">I'm <span className="text-blue-400">{userData?.assistantName}</span></h1>
        {!aiText && <img src={userImg} className="w-[300px]" />}
        {aiText && <img src={aiImg} className="w-[300px]" />}
      </div>

      {/* Left Column */}
      <div className="absolute left-[30px] w-[30%] flex-col items-start gap-4 sm:flex hidden md:w-[20%]">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); inputValue.current = e.target.value; }}
          placeholder="Type your code or ask something..."
          rows={10}
          className="p-4 w-full bg-black border border-blue-500 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow"
        />
        <button onClick={handleSubmit} className="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600 transition">Submit</button>
        {showOutput && <div className="w-full mt-2 text-green-300 font-mono text-sm whitespace-pre-wrap"><span className="text-blue-400">You:</span> {userText || input}</div>}
      </div>

      {/* Right Column */}
      {showOutput && (
        <div className="absolute right-[30px] w-[30%] md:w-[20%] bg-black border border-blue-500 p-4 rounded-lg text-green-400 whitespace-pre-wrap max-h-[50vh] overflow-auto shadow sm:flex hidden">
          {loading ? "Loading..." : response}
          {response && (
            <button onClick={() => { navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600 transition">{copied ? "Copied!" : "Copy"}</button>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
