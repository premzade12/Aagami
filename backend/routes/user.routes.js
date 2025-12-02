import express from "express";
import {
  askToAssistant,
  getCurrentUser,
  updateAssistant,
  correctCode,
  addHistory,        // ✅ new controller
  getHistory,        // ✅ new controller
  testGemini,        // ✅ test controller
  testVision,        // ✅ vision test controller
  getVoices,         // ✅ voice controller
  setUserVoice,      // ✅ voice controller
  visualSearch       // ✅ visual search controller
} from "../controllers/user.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import upload, { memoryUpload } from "../middlewares/multer.js";

const userRouter = express.Router();

// ✅ Existing routes
userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update", isAuth, upload.single("assistantImage"), updateAssistant);
userRouter.post("/askToAssistant", isAuth, askToAssistant);
userRouter.post("/correct-code", isAuth, correctCode);

// ✅ New routes for history
userRouter.post("/add-history", isAuth, addHistory);   // Add history entry
userRouter.get("/get-history", isAuth, getHistory);    // Get all history entries

// ✅ Test routes
userRouter.get("/test-gemini", testGemini);            // Test Gemini API
userRouter.get("/test-vision", testVision);            // Test Vision API

// ✅ Voice routes
userRouter.get("/voices", getVoices);                  // Get available voices
userRouter.post("/set-voice", isAuth, setUserVoice);   // Set user voice

// ✅ Visual search route
userRouter.post("/visualSearch", isAuth, memoryUpload.single("image"), visualSearch);

export default userRouter;
