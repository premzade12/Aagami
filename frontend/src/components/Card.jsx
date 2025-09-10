import React, { useContext } from 'react';
import { userDataContext } from '../context/UserContext';

function Card({ video }) {
  const {serverUrl,userData, setUserData, backendImage,setBackendImage, frontendImage,setFrontendImage, selectedImage,setSelectedImage} = useContext(userDataContext);
  return (
    <div className={`w-[160px] h-[160px] lg:w-[290px] lg:h-[290px] bg-gradient-to-br from-[#030326] to-[#000040] border-2 border-blue-950 rounded-2xl shadow-lg shadow-blue-950 hover:shadow-2xl
     hover:shadow-cyan-400 transform hover:scale-105 transition duration-300 overflow-hidden cursor-pointer ${selectedImage==video?"border-4 border-white shadow-lg shadow-blue-950":null}`}
     onClick={()=>{
      setSelectedImage(video)
      setBackendImage(null)
      setFrontendImage(null)
      }}>
      <video
        src={video}
        className='w-full h-full object-cover rounded-2xl'
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        disablePictureInPicture
      />
    </div>
  );
}

export default Card;
