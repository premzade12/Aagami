import React, { useState, useEffect, useRef } from "react";

function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const inputValue = useRef("");

  // 🗣️ Speak Function
  const speak = (text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // Stop listening while speaking
    recognitionRef.current?.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;

    utterance.onstart = () => {
      console.log("🔊 Speaking...");
    };

    utterance.onend = () => {
      console.log("✅ Speaking done, restarting listening...");
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
        } catch (err) {
          console.warn("Restart after speaking failed:", err.message);
        }
      }, 800);
    };

    synth.speak(utterance);
  };

  // 💬 Handle User Command
  const handleSubmit = async () => {
    if (!inputValue.current.trim()) return;
    const userText = inputValue.current.trim();

    // Show user message
    setMessages((prev) => [...prev, { from: "user", text: userText }]);
    setInput("");

    // Here you can replace this with your backend API call
    const responseText = `You said: "${userText}". Here’s my response!`;

    setMessages((prev) => [...prev, { from: "assistant", text: responseText }]);
    speak(responseText);
  };

  // 🎧 Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log("🎤 Listening...");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      console.log("🗣️ Heard:", transcript);

      const assistantName = "aagami"; // 👈 Change this name as your assistant’s name

      if (transcript.includes(assistantName)) {
        const command = transcript.replace(assistantName, "").trim();
        if (command.length > 0) {
          console.log("🎯 Command detected:", command);
          setInput(command);
          inputValue.current = command;
          handleSubmit();
        } else {
          console.log("Assistant name detected but no command given.");
        }
      } else {
        console.log("No assistant name detected — ignoring input.");
      }
    };

    recognition.onend = () => {
      console.log("🛑 Listening ended. Restarting...");
      setIsListening(false);
      setTimeout(() => {
        try {
          recognition.start();
        } catch (err) {
          console.warn("Restart blocked:", err.message);
        }
      }, 600);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);

      if (event.error === "no-speech" || event.error === "network") {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (err) {
            console.warn("Restart after error failed:", err.message);
          }
        }, 1000);
      }
    };

    recognitionRef.current = recognition;

    // Start listening on load
    try {
      recognition.start();
    } catch (err) {
      console.warn("Initial recognition start blocked:", err.message);
    }

    return () => {
      recognition.stop();
    };
  }, []);

  // 🧠 UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-2xl bg-[#121212] rounded-2xl p-6 shadow-lg border border-blue-500">
        <h1 className="text-3xl font-bold text-center mb-4 text-blue-400">
          🤖 Aagami - Your AI Assistant
        </h1>

        <div className="h-80 overflow-y-auto border border-gray-700 rounded-lg p-4 mb-4 bg-gray-900">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`my-2 p-2 rounded-lg ${
                msg.from === "user"
                  ? "bg-blue-600 text-right ml-auto max-w-[80%]"
                  : "bg-gray-700 text-left mr-auto max-w-[80%]"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 p-2 rounded-lg bg-gray-800 text-white outline-none border border-blue-400"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              inputValue.current = e.target.value;
            }}
            placeholder="Say 'Aagami ...' or type your command"
          />
          <button
            onClick={() => {
              inputValue.current = input;
              handleSubmit();
            }}
            className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>

        <div className="mt-4 text-center text-sm opacity-80">
          🎤 Status:{" "}
          <span
            className={`font-semibold ${
              isListening ? "text-green-400" : "text-red-400"
            }`}
          >
            {isListening ? "Listening..." : "Idle"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Home;
