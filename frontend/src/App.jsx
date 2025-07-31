import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup.jsx';
import Signin from './pages/Signin.jsx';
import Home from './pages/Home.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Customize from './pages/Customize.jsx';
import { userDataContext } from './context/userContext.jsx';
import { useContext } from 'react';
import Customize2 from './pages/Customize2.jsx';

function App() {

  const {userData,setUserData} = useContext(userDataContext);
  return (
    <>
      <Routes>
        {/* <Route path="/" element={<Navigate to="/signin" />} /> */}
        <Route path="/" element={(userData?.assistantImage && userData?.assistantName)?
          <Home/>:<Navigate to={"/customize"}/>} />
        <Route path="/signup" element={!userData?<Signup />:<Navigate to={"/"}/>} />
        <Route path="/signin" element={!userData?<Signin />:<Navigate to={"/"}/>} />
        <Route path="/customize" element={userData?<Customize/>:<Navigate to={"/signup"}/>}/>
        <Route path="/customize2" element={userData?<Customize2/>:<Navigate to={"/signup"}/>}/>
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;
