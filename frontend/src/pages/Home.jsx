import React, { useContext, useEffect, useRef, useState } from 'react';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import aiImg from "../assets/voice2.gif";
import userImg from "../assets/Voice.gif";
import axios from 'axios';
import { IoMenuOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

function Home() {
  const navigate = useNavigate();
  const { userData, serverUrl, setUserData } = useContext(userDataContext);
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const inputRef = useRef();
  const inputValue = useRef('');
  const synth = window.speechSynthesis;

  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  // Hamburger Menu
  const [menuOpen, setMenuOpen] = useState(false);

  const speak = async (text) => {
    synth.cancel();
    const voices = await new Promise(resolve => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) resolve(list);
      window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    });
    const selectedVoice = voices.find(v => v.name === localStorage.getItem("assistantVoice"));
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    isSpeakingRef.current = true;
    utterance.onend = () => {
      setAiText("");
      isSpeakingRef.current = false;
      startRecognition();
    };
    synth.speak(utterance);
  };

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
      if (!error.message.includes("start")) {
        console.error("Recognition error:", error);
      }
    }
  };

  // ✅ Fetch chat history from backend
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

  const handleSubmit = async () => {
    const value = inputValue.current.trim();
    if (!value) return;

    setUserText(value);
    setAiText("");
    setResponse("");
    setShowOutput(true);
    setLoading(true);

    // Fetch last 5 Q&A for context
    const history = await fetchHistory();
    const last5 = history.slice(-5);
    const contextString = last5.map(h => `Q: ${h.question}\nA: ${h.answer}`).join("\n");

    // Send user input + context to backend
    let data;
    try {
      const res = await fetch(`${serverUrl}/api/user/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ command: `${contextString}\nUser: ${value}` }),
      });
      data = await res.json();
    } catch (err) {
      console.error("Failed to get assistant response:", err);
      setLoading(false);
      return;
    }

    if (!data) return;

    setAiText(data.response);
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView();

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
          setResponse("Failed to correct code.");
        }
      }
    } else {
      await handleCommand(data);
      setResponse(data.response);
    }

    speak(data.response);

    // Save chat history
    try {
      await fetch(`${serverUrl}/api/user/add-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question: value,
          answer: data.response,
        }),
      });
    } catch (error) {
      console.error("❌ Failed to save history:", error);
    }

    setLoading(false);
  };

  const handleCommand = async (data) => {
    const { type, userInput } = data;
    const lowerInput = userInput?.toLowerCase() || "";

    if (type === 'google_search') {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(userInput)}`, '_blank');
    }

    if (type === 'youtube_play') {
      const cleaned = userInput.replace(/^(jarvis\s*)?play\s*/i, "").replace(/(from|on)\s*youtube/i, "").trim();
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(cleaned)}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        const videoId = data.items?.[0]?.id?.videoId;
        if (videoId) window.open(`https://www.youtube.com/watch?v=${videoId}&autoplay=1`, "YouTubeAssistantTab");
        else speak("Sorry, no video found.");
      } catch {
        speak("Failed to fetch video.");
      }
    }

    if (type === 'change_voice') {
      const voiceName = userInput.split("to ").pop();
      const voices = await new Promise(resolve => {
        const list = window.speechSynthesis.getVoices();
        if (list.length) resolve(list);
        window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
      });
      const selected = voices.find(v => v.name.toLowerCase() === voiceName.toLowerCase());
      if (selected) {
        localStorage.setItem("assistantVoice", selected.name);
        speak(`Voice changed to ${selected.name}`);
      } else speak("Sorry, I couldn't find that voice.");
    }

    // ... rest of handleCommand logic unchanged (news, whatsapp, youtube open/close, etc.)
  };

  // Speech recognition setup unchanged
  useEffect(() => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    const isRecognizingRef = { current: false };

    const safeRecognition = () => {
      if (!isSpeakingRef.current && !isRecognizingRef.current) {
        try { recognition.start(); } catch (err) { if (err.name !== "InvalidStateError") console.error("Start error", err); }
      }
    };

    recognition.onstart = () => { isRecognizingRef.current = true; setListening(true); };
    recognition.onend = () => { isRecognizingRef.current = false; setListening(false); };
    recognition.onerror = (event) => {
      isRecognizingRef.current = false; setListening(false);
      if (event.error !== "aborted" && !isSpeakingRef.current) setTimeout(() => safeRecognition(), 1000);
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      if (transcript.toLowerCase().includes(userData.assistantName.toLowerCase())) {
        try {
          setUserText(transcript);
          recognition.stop();
          isRecognizingRef.current = false;
          setListening(false);
          const history = await fetchHistory();
          const last5 = history.slice(-5);
          const contextString = last5.map(h => `Q: ${h.question}\nA: ${h.answer}`).join("\n");

          const res = await fetch(`${serverUrl}/api/user/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ command: `${contextString}\nUser: ${transcript}` }),
          });
          const data = await res.json();
          if (data) {
            setAiText(data.response);
            await handleCommand(data);
            speak(data.response);
            setResponse(data.response);
            setShowOutput(true);
          }
        } catch (err) { console.error("Voice command error:", err); }
      }
    };

    safeRecognition();
    const fallback = setInterval(() => { if (!isSpeakingRef.current && !isRecognizingRef.current) safeRecognition(); }, 10000);

    return () => { recognition.stop(); setListening(false); isRecognizingRef.current = false; clearInterval(fallback); };
  }, []);

  useEffect(() => {
    if (userData?.name && userData?.assistantName) speak(`Hello ${userData.name}, what can I help you with?`);
  }, [userData]);

  // JSX rendering left unchanged
  return (
    <div className="w-full h-screen bg-black text-white flex items-center justify-center relative">
      {/* ... all your existing JSX ... */}
    </div>
  );
}

export default Home;
