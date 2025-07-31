import React, { useContext, useState } from 'react'
import { userDataContext } from '../context/userContext';
import axios from 'axios';
import { TiArrowBack } from "react-icons/ti";
import { useNavigate } from 'react-router-dom';

function Customize2() {
    const {userData, backendImage, selectedImage, serverUrl, setUserData} = useContext(userDataContext);
    const [assistantName,setAssistantName] = useState(userData?.assistantName || "");
    const [loading,setLoading] = useState(false);
    const navigate = useNavigate();

    const handleUpdateAssistant = async()=>{
        try {
            let formData = new FormData();
            formData.append("assistantName",assistantName);
            if(backendImage){
                formData.append("assistantImage",backendImage);
            }else{
                formData.append("imageUrl",selectedImage);
            }
            const result = await axios.post(`${serverUrl}/api/user/update`,formData,{withCredentials:true});
            console.log(result.data);
            setUserData(result.data);
            
        } catch (error) {
            console.log(error);
        }
    }
  return (
    <div className='w-full h-[100vh] bg-black text-white flex justify-center items-center flex-col p-[20px] relative'>
        <TiArrowBack className="absolute top-[30px] left-[30px] text-white w-[40px] h-[40px] cursor-pointer
             border border-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center
             hover:text-black 
             shadow-[0_0_10px_#00f2ff]
             transition-all duration-300" onClick={()=>navigate("/customize")}/>
        <h1 className='text-white mb-[30px] text-[30px]'>Enter Your <span className="text-blue-500">Assistant Name</span></h1>

        <input type="text" placeholder='eg: Nova' required onChange={(e)=>setAssistantName(e.target.value)} value={assistantName}
            className='w-full h-[60px] max-w-[600px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]'
          />
          {assistantName && <button className="cursor-pointer mt-4 px-8 py-3 rounded-full bg-black text-white font-semibold border border-blue-500 hover:bg-blue-600 hover:text-black 
          shadow-[0_0_20px_rgba(0,191,255,0.6)] transition-all duration-300" disabled={loading} onClick={async()=>{
            await handleUpdateAssistant()
            if(assistantName){
            navigate("/");
            }
            else {
                navigate("/customize");
            }
            }}>{!loading?"Create Your Assistant":"Loading..."}</button>}
          
    </div>
  )
}

export default Customize2