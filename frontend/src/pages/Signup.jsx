import React, { useContext, useState } from 'react';
import bg from "../assets/Login1.mp4";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios";
import { toast } from 'react-toastify';

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const { serverUrl,userData, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err,setErr] = useState("");
  const [loading,setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const result = await axios.post(`${serverUrl}/api/auth/signup`, {
        name, email, password
      }, { withCredentials: true });
      setUserData(result.data);
      toast.success("Signup Successful! Redirecting...");
      setLoading(false);
      navigate("/customize");
      // setTimeout(() => navigate("/signin"), 2000);
    } catch (error) {
      // toast.error(error.response?.data?.message || "Signup failed!");
      console.log(error);
      setUserData(null);
      setErr(error.response.data.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex w-screen h-screen ">
      {/* 🔹 Left Side: Video */}
      <div className="w-1/2 h-full relative ">
        <video
          src={bg}
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover "
        />
        <div className="absolute top-0 left-0 w-full h-full bg-black/40" />
      </div>

      {/* 🔹 Right Side: Signup Form */}
      <div className="w-1/2 h-full flex items-center justify-center bg-black">
        <form
          onSubmit={handleSignUp}
          className="w-[90%] h-[600px] max-w-[500px] bg-black/70 backdrop-blur-md shadow-lg shadow-blue-950 flex flex-col items-center justify-center gap-[20px] p-8 rounded-xl px-[20px]"
        >
          <h1 className="text-white text-[30px] font-semibold text-center mb-[30px]">
            Register to <span className="text-blue-500">Virtual Assistant</span>
          </h1>

          <input type="text" placeholder='Enter Your Name' required value={name}
            onChange={(e) => setName(e.target.value)}
            className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]'
          />

          <input type="email" placeholder='Email' required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]'
          />

          <div className='w-full h-[60px] border-2 relative border-white bg-transparent text-white rounded-full text-[18px]'>
            <input type={showPassword ? "text" : "password"} placeholder='Password' required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full h-full rounded-full outline-none bg-transparent placeholder-gray-300 px-[20px] py-[10px]'
            />
            {!showPassword ? (
              <IoEye className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer' onClick={() => setShowPassword(true)} />
            ) : (
              <IoEyeOff className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer' onClick={() => setShowPassword(false)} />
            )}
          </div>

          {err.length>0 && <p className='text-red-500 text-[17px]'>
            *{err}
            </p>}
          <button type="submit" className="mt-4 px-8 py-3 rounded-full bg-black text-white font-semibold border border-blue-500 hover:bg-blue-600 hover:text-black 
          shadow-[0_0_20px_rgba(0,191,255,0.6)] transition-all duration-300" disabled={loading}>
            {loading?"Loading...":"Log in"}
          </button>

          <p className="text-white text-[18px] mt-4">
            Already have an account?{' '}
            <span
              onClick={() => navigate("/signin")}
              className="text-blue-500 hover:underline hover:text-blue-400 transition duration-200 cursor-pointer"
            >
              Sign In
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
