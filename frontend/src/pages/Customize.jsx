import React, { useContext, useRef, useState, useEffect } from 'react'
import Card from '../components/Card.jsx'
import circle1 from "../assets/circle1.mp4"
import circle2 from "../assets/circle3.mp4"
import { RiVideoUploadLine } from "react-icons/ri";
import { userDataContext } from '../context/UserContext.jsx';
import { useNavigate } from 'react-router-dom';
import { TiArrowBack } from "react-icons/ti";

function Customize() {
  const inputImage = useRef();
  const navigate = useNavigate();
  const {
    serverUrl, userData, setUserData,
    backendImage, setBackendImage,
    frontendImage, setFrontendImage,
    selectedImage, setSelectedImage
  } = useContext(userDataContext);

  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(localStorage.getItem("assistantVoice") || "");

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) setAvailableVoices(voices);
      else window.speechSynthesis.onvoiceschanged = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
    };
    loadVoices();
  }, []);

  const handleVoiceChange = (e) => {
    const voiceName = e.target.value;
    setSelectedVoice(voiceName);
    localStorage.setItem("assistantVoice", voiceName);

    // Optional: Speak sample
    const utterance = new SpeechSynthesisUtterance(`Hi, I'm your assistant in ${voiceName} voice.`);
    const voiceObj = availableVoices.find(v => v.name === voiceName);
    if (voiceObj) utterance.voice = voiceObj;
    window.speechSynthesis.speak(utterance);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  };

  return (
    <div className='w-full h-[100vh] bg-black text-white flex justify-center items-center flex-col p-[20px]'>
      <TiArrowBack className="absolute top-[30px] left-[30px] text-white w-[40px] h-[40px] cursor-pointer
                   border border-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center
                   hover:text-black shadow-[0_0_10px_#00f2ff] transition-all duration-300"
        onClick={() => navigate("/")}
      />

      <h1 className='text-white mb-[30px] text-[30px]'>
        Select Your <span className="text-blue-500">Assistant</span>
      </h1>

      {/* 👤 Video Selector */}
      <div className='w-[100%] max-w-[90%] flex justify-center items-center flex-wrap gap-[50px] mb-[30px] mt-[20px]'>
        <Card video={circle2} />
        <Card video={circle1} />
        <div className={`w-[160px] h-[160px] lg:w-[290px] lg:h-[290px] bg-gradient-to-br from-[#030326] to-[#000040] border-2 border-blue-950 rounded-2xl shadow-lg shadow-blue-950 hover:shadow-2xl
           hover:shadow-cyan-400 transform hover:scale-105 transition duration-300 overflow-hidden cursor-pointer flex justify-center items-center ${selectedImage === "input" ? "border-4 border-white shadow-lg shadow-blue-950" : ""}`}
          onClick={() => {
            inputImage.current.click();
            setSelectedImage("input");
          }}>
          {!frontendImage && <RiVideoUploadLine className='text-white h-[25px] w-[25px]' />}
          {frontendImage && <video
            src={frontendImage}
            className='w-full h-full object-cover rounded-2xl'
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            disablePictureInPicture
          />}
        </div>
        <input type="file" accept='video/*' ref={inputImage} hidden onChange={handleImage} />
      </div>

      {/* 🗣 Voice Selector */}
      <div className='mb-[20px] flex flex-col items-center gap-2'>
        <label className="text-lg font-semibold">Select Voice</label>
        <select
          className='bg-black text-white border border-blue-500 px-4 py-2 rounded-md'
          value={selectedVoice}
          onChange={handleVoiceChange}
        >
          <option value="">-- Choose Voice --</option>
          {availableVoices.map((voice, index) => (
            <option key={index} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Next Button */}
      {selectedImage && (
        <button
          className="cursor-pointer mt-4 px-8 py-3 rounded-full bg-black text-white font-semibold border border-blue-500 hover:bg-blue-600 hover:text-black 
            shadow-[0_0_20px_rgba(0,191,255,0.6)] transition-all duration-300"
          onClick={() => navigate("/customize2")}
        >
          Next
        </button>
      )}
    </div>
  );
}

export default Customize;
