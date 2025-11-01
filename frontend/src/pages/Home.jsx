import React, {
  useEffect,
  useRef,
  useState,
  useCallback, // Import useCallback
} from "react";
// import { userDataContext } from "../context/UserContext"; // Removed: Cannot resolve
// import { useNavigate } from "react-router-dom"; // Removed: Causes crash without <Router>
// import aiImg from "../assets/voice2.gif"; // Removed: Cannot resolve
// import userImg from "../assets/Voice.gif"; // Removed: Cannot resolve
// import axios from "axios"; // Removed: Not available in this environment
// import { IoMenuOutline } from "react-icons/io5"; // Removed: Cannot resolve
// import { RxCross2 } from "react-icons/rx"; // Removed: Cannot resolve

// --- FIXES for Missing Imports ---

// 1. Mock UserContext
// We create mock data because the context file is not available.
const useMockUserData = () => {
  const [userData, setUserData] = useState({
    name: "User",
    assistantName: "Assistant",
    assistantImage: "https://placehold.co/300x300/000000/FFFFFF?text=AI", // Placeholder video
  });
  const serverUrl = "https://your-mock-server.com"; // Mock server URL

  return { userData, serverUrl, setUserData };
};

// 2. Placeholder Images
const aiImg = "https://placehold.co/300x150/000000/4ADE80?text=AI+Speaking...";
const userImg = "https://placehold.co/300x150/000000/60A5FA?text=Listening...";

// 3. Inline SVG Icons (replaces react-icons)
const IoMenuOutline = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
);

const RxCross2 = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18 18 6M6 6l12 12"
    />
  </svg>
);

// 4. Removed YOUTUBE_API_KEY
// const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY; // Removed: import.meta not available

function Home() {
  // const navigate = useNavigate(); // Removed: Causes crash without <Router>
  // Use the mock hook instead of useContext
  const { userData, serverUrl, setUserData } = useMockUserData();

  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [voiceActivated, setVoiceActivated] = useState(true);

  const recognitionRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const isStartingRef = useRef(false);
  const inputRef = useRef();
  const inputValue = useRef("");
  const synth = window.speechSynthesis;

  // ------------------- START RECOGNITION (Wrapped in useCallback) -------------------
  const startRecognition = useCallback(() => {
    try {
      // Check if recognitionRef.current exists before starting
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setListening(true);
      }
    } catch (error) {
      // Prevent crash if start() is called in an invalid state
      if (!error.message.includes("start"))
        console.error("Recognition error:", error);
    }
  }, [setListening]); // setListening is stable, but good to list

  // ------------------- SPEAK FUNCTION (Wrapped in useCallback) -------------------
  const speak = useCallback(
    async (text) => {
      if (!text) return;
      if (!synth) {
        console.error("Speech synthesis not available.");
        return;
      }
      synth.cancel(); // Stop any previous speech
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
            startRecognition(); // This now calls the stable useCallback version
          }
        }, 1000); // Small delay before listening again
      };
      synth.speak(utterance);
    },
    [synth, setAiText, startRecognition] // Dependencies
  );

  // ------------------- LOGOUT (Wrapped in useCallback) -------------------
  const handleLogOut = useCallback(async () => {
    try {
      // Mock logout - in a real app, this would hit an endpoint
      console.log("Mock logout successful");
      // await axios.get(`${serverUrl}/api/auth/logout`, { // Removed: axios not available
      //   withCredentials: true,
      // });
      setUserData(null);
      // navigate("/signin"); // Removed: navigate is not available
    } catch (error) {
      setUserData(null);
      console.error(error);
    }
  }, [serverUrl, setUserData]); // Dependencies updated

  // ------------------- FETCH HISTORY (Wrapped in useCallback) -------------------
  const fetchHistory = useCallback(async () => {
    try {
      // Mock history fetch
      console.log("Fetching mock history");
      // const res = await fetch(`${serverUrl}/api/user/get-history`, {
      //   method: "GET",
      //   credentials: "include",
      // });
      // const data = await res.json();
      // return data.history || [];
      return Promise.resolve([]); // Return empty mock history
    } catch (err) {
      console.error("Failed to fetch history:", err);
      return [];
    }
  }, [serverUrl]); // Dependency

  // ------------------- HANDLE COMMAND (Wrapped in useCallback) -------------------
  const handleCommand = useCallback(
    async (data) => {
      const { type, action, url, userInput } = data;

      // Handle URL opening actions
      if (action === "open_url" && url) {
        window.open(url, "_blank");
        return;
      }

      // Handle specific command types
      if (type === "google_search") {
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(userInput)}`,
          "_blank"
        );
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
        if (!synth) return;
        const voiceName = userInput.split("to ").pop();
        const voices = await new Promise((resolve) => {
          const list = window.speechSynthesis.getVoices();
          if (list.length) resolve(list);
          window.speechSynthesis.onvoiceschanged = () =>
            resolve(window.speechSynthesis.getVoices());
        });
        const selected = voices.find(
          (v) => v.name.toLowerCase() === voiceName.toLowerCase()
        );
        if (selected) {
          localStorage.setItem("assistantVoice", selected.name);
          speak(`Voice changed to ${selected.name}`); // Calls stable speak
        } else speak("Sorry, I couldn't find that voice."); // Calls stable speak
      }
    },
    [speak, synth] // Dependency
  );

  // ------------------- HANDLE SUBMIT (Wrapped in useCallback) -------------------
  const handleSubmit = useCallback(async () => {
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
      history = await fetchHistory(); // Calls stable fetchHistory
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }

    const last5 = history
      .filter((h) => h.userInput && h.assistantResponse)
      .slice(-5);

    const contextString = last5
      .map((h) => `Q: ${h.userInput}\nA: ${h.assistantResponse}`)
      .join("\n");

    let data;
    try {
      // Mock API response
      console.log("Mocking API call to /api/user/askToAssistant");
      // const res = await fetch(`${serverUrl}/api/user/askToAssistant`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify({
      //     command: `${
      //       contextString ? contextString + "\n" : ""
      //     }User: ${value}`,
      //   }),
      // });
      // data = await res.json();

      // Simulated mock data
      await new Promise(res => setTimeout(res, 1000)); // Simulate network delay
      data = {
        response: `This is a mock response to your query: "${value}"`,
        type: "general",
        action: null,
        url: null,
        userInput: value,
      };

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
        // Mock code correction
        console.log("Mocking API call to /api/user/correct-code");
        // try {
        //   const res = await fetch(`${serverUrl}/api/user/correct-code`, {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     credentials: "include",
        //     body: JSON.stringify({ code: value }),
        //   });
        //   const json = await res.json();
        //   setResponse(json.corrected || "No correction provided.");
        // } catch (err) {
        //   setResponse("❌ Failed to correct code.");
        // }
        setResponse(`// This is a mock correction for:\n${value}`);
      }
    } else {
      await handleCommand(data); // Calls stable handleCommand
      setResponse(data.response);
    }

    speak(data.response); // Calls stable speak

    // Save chat history only if both fields exist
    if (value && data.response) {
      // Mock history save
      console.log("Mocking API call to /api/user/add-history");
      // try {
      //   const res = await fetch(`${serverUrl}/api/user/add-history`, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     credentials: "include",
      //     body: JSON.stringify({
      //       userInput: value,
      //       assistantResponse: data.response,
      //     }),
      //   });
      //   if (!res.ok) {
      //     const errorData = await res.json();
      //     console.error("Failed to save history:", errorData);
      //   }
      // } catch (err) {
      //   console.error("❌ Error saving history:", err);
      // }
    }

    setLoading(false);
  }, [
    fetchHistory,
    handleCommand,
    speak,
    serverUrl,
  ]);

  // ------------------- VOICE RECOGNITION (useEffect updated) -------------------
  useEffect(() => {
    const initVoiceRecognition = async () => {
      console.log("🎤 Initializing voice recognition...");

      // Request microphone permission first
      try {
        console.log("🎙️ Requesting microphone permission...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Microphone permission granted");
        stream.getTracks().forEach((track) => track.stop()); // Stop the stream
      } catch (err) {
        console.error("❌ Microphone permission denied:", err);
        // alert("Please allow microphone access for voice commands to work.");
        console.warn("Please allow microphone access for voice commands to work.");
        return;
      }

      const SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!SpeechRecognition) {
        console.error("❌ Speech recognition not supported in this browser");
        // alert(
        //   "Voice recognition is not supported in this browser. Please use Chrome or Edge."
        // );
        console.warn("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
        return;
      }

      console.log("✅ Speech recognition supported");
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;
      const isRecognizingRef = { current: false };

      console.log("⚙️ Recognition configured:", {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang,
      });

      const safeRecognition = () => {
        if (
          !isSpeakingRef.current &&
          !isRecognizingRef.current &&
          !isStartingRef.current &&
          voiceActivated
        ) {
          try {
            console.log("▶️ Starting voice recognition...");
            isStartingRef.current = true;
            if(recognitionRef.current) {
              recognitionRef.current.start();
            }
          } catch (err) {
            console.error("❌ Recognition start error:", err);
            isStartingRef.current = false;
            // Wait longer before retry on error
            if (err.name === "InvalidStateError") {
              setTimeout(safeRecognition, 3000);
            }
          }
        } else {
          console.log("⏸️ Skipping start - conditions not met");
        }
      };

      recognition.onstart = () => {
        console.log("🎤 Voice recognition started");
        isRecognizingRef.current = true;
        isStartingRef.current = false;
        setListening(true);
      };
      recognition.onend = () => {
        console.log("🛑 Voice recognition ended");
        isRecognizingRef.current = false;
        isStartingRef.current = false;
        setListening(false);

        // Only restart if not speaking and voice is still activated
        if (!isSpeakingRef.current && voiceActivated) {
          console.log("🔄 Restarting voice recognition...");
          setTimeout(safeRecognition, 2000); // Longer delay to prevent abort errors
        }
      };
      recognition.onerror = (event) => {
        console.error("❌ Voice recognition error:", event.error);
        isRecognizingRef.current = false;
        isStartingRef.current = false;
        setListening(false);

        // Only restart on specific errors, not on abort
        if (event.error === "no-speech" || event.error === "audio-capture") {
          console.log("🔄 Restarting after error...");
          setTimeout(safeRecognition, 3000);
        } else if (event.error === "aborted") {
          console.log("⏹️ Recognition aborted - not restarting");
        }
      };

      recognition.onresult = async (e) => {
        console.log("🔊 Speech results received:", e.results.length);

        // Process all results to find the best transcript
        let bestTranscript = "";
        let isFinal = false;

        for (let i = 0; i < e.results.length; i++) {
          const result = e.results[i];
          const transcript = result[0].transcript.trim();
          console.log(
            `Result ${i}: "${transcript}" (final: ${result.isFinal}, confidence: ${result[0].confidence})`
          );

          if (result.isFinal && transcript.length > bestTranscript.length) {
            bestTranscript = transcript;
            isFinal = true;
          } else if (!isFinal && transcript.length > bestTranscript.length) {
            bestTranscript = transcript;
          }
        }

        console.log(`🎤 Best transcript: "${bestTranscript}" (final: ${isFinal})`);

        if (bestTranscript.length > 2) {
          console.log("✅ Processing voice command:", bestTranscript);
          try {
            setUserText(bestTranscript);
            if (recognitionRef.current) {
               recognitionRef.current.stop();
            }
            isRecognizingRef.current = false;

            inputValue.current = bestTranscript;
            console.log("🚀 Calling handleSubmit with:", bestTranscript);
            
            await handleSubmit(); 
            
            console.log("✓ handleSubmit completed");
          } catch (err) {
            console.error("❌ Voice command error:", err);
            speak("Sorry, I encountered an error processing your request.");
          }
        } else {
          console.log("⚠️ Transcript too short, ignoring");
        }
      };

      recognition.onspeechstart = () => {
        console.log("🗣️ Speech started - user is speaking");
      };

      recognition.onspeechend = () => {
        console.log("🔇 Speech ended - user stopped speaking");
      };
      // Store recognition in ref for manual testing
      recognitionRef.current = recognition;

      // Auto-start voice recognition
      console.log("▶️ Auto-starting voice recognition");
      setTimeout(safeRecognition, 1000); // Small delay to ensure setup is complete

      const fallback = setInterval(() => {
        if (
          !isSpeakingRef.current &&
          !isRecognizingRef.current &&
          !isStartingRef.current
        ) {
          safeRecognition();
        }
      }, 10000);

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setListening(false);
        isRecognizingRef.current = false;
        isStartingRef.current = false;
        clearInterval(fallback);
      };
    };

    initVoiceRecognition();
  }, [userData, voiceActivated, handleSubmit, speak]); // <-- ADDED handleSubmit and speak

  // ------------------- WELCOME SPEECH (useEffect updated) -------------------
  useEffect(() => {
    if (userData?.name && userData?.assistantName) {
      // Calls the stable speak function
      speak(`Hello ${userData.name}, what can I help you with?`);

      // Test API call (mocked)
      setTimeout(async () => {
        try {
          console.log("🧪 Testing askToAssistant API (Mocked)...");
          // const res = await fetch(`${serverUrl}/api/user/askToAssistant`, {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   credentials: "include",
          //   body: JSON.stringify({ command: "Hello, testing connection" }),
          // });
          // console.log("📡 Response status:", res.status);
          
          // if (res.ok) {
          //   const data = await res.json();
          //   console.log("✅ API test successful:", data);
          // } else {
          //   const errorText = await res.text();
          //   console.error(
          //     "❌ API test failed with status:",
          //     res.status,
          //     errorText
          //   );
          // }
          console.log("✅ Mock API test successful.");
        } catch (err) {
          console.error("❌ API test failed:", err);
        }
      }, 2000);
    }
  }, [userData, speak, serverUrl]); // <-- ADDED speak and serverUrl

  // ------------------- JSX (Unchanged) -------------------
  return (
    <div className="w-full h-screen bg-black text-white flex items-center justify-center relative">
      {/* Voice Status */}
      <div className="absolute top-4 left-4 px-4 py-2 bg-green-500 text-white rounded-full z-50">
        🎤 Voice {listening ? "Listening..." : "Ready"}
      </div>

      {/* Manual Test Button */}
      <button
        onClick={() => {
          inputValue.current = "test voice command";
          handleSubmit();
        }}
        className="absolute top-16 left-4 px-4 py-2 bg-blue-500 text-white rounded z-50"
      >
        Test API
      </button>

      {/* Top Buttons */}
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
                // navigate("/customize"); // Removed: navigate is not available
                console.log("Navigate to /customize");
                setMenuOpen(false);
              }}
              className="absolute top-[60px] right-[20px] px-4 py-2 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-black transition-all"
            >
              Customize
            </button>
            <button
              onClick={() => {
                handleLogOut();
                setMenuOpen(false);
              }}
              className="absolute top-[120px] right-[20px] px-4 py-2 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-black transition-all"
            >
              Logout
            </button>
          </div>
        )}
        <button
          onClick={() => {
            // navigate("/customize"); // Removed: navigate is not available
            console.log("Navigate to /customize");
          }}
          className="hidden lg:block px-4 py-2 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-black transition-all"
        >
          Customize
        </button>
        <button
          onClick={handleLogOut}
          className="hidden lg:block px-4 py-2 rounded-full border border-blue-500 hover:bg-blue-600 hover:text-black transition-all"
        >
          Logout
        </button>
      </div>

      {/* Avatar */}
      <div className="absolute top-[80px] flex flex-col items-center">
        {/* Use <img> for placeholder video/image */}
        <img
          src={userData?.assistantImage}
          alt="Assistant Avatar"
          className="w-[300px] h-[300px] object-cover rounded-full"
        />
        <h1 className="text-2xl font-semibold mt-4">
          I'm <span className="text-blue-400">{userData?.assistantName}</span>
        </h1>
        {/* Use placeholder images */}
        {!aiText && <img src={userImg} alt="User listening" className="w-[300px]" />}
        {aiText && <img src={aiImg} alt="AI speaking" className="w-[300px]" />}
      </div>

      {/* Left Column */}
      <div className="absolute left-[30px] w-[30%] flex-col items-start gap-4 sm:flex hidden md:w-[20%]">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            inputValue.current = e.target.value;
          }}
          placeholder="Type your code or ask something..."
          rows={10}
          className="p-4 w-full bg-black border border-blue-500 rounded-md text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 shadow"
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600 transition"
        >
          Submit
        </button>
        {showOutput && (
          <div className="w-full mt-2 text-green-300 font-mono text-sm whitespace-pre-wrap">
            <span className="text-blue-400">You:</span> {userText || input}
          </div>
        )}
      </div>

      {/* Right Column */}
      {showOutput && (
        <div className="absolute right-[30px] w-[30%] md:w-[20%] bg-black border border-blue-500 p-4 rounded-lg text-green-400 whitespace-pre-wrap max-h-[50vh] overflow-auto shadow sm:flex hidden">
          {loading ? "Loading..." : response}
          {response && (
            <button
              onClick={() => {
                // Use execCommand as a fallback for clipboard
                try {
                  const ta = document.createElement('textarea');
                  ta.value = response;
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch (err) {
                  console.error("Failed to copy text: ", err);
                }
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

// We need a default export for the component to be rendered
export default Home;

