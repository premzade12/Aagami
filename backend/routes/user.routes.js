import express from "express";
import {
  askToAssistant,
  getCurrentUser,
  updateAssistant,
  correctCode, // ✅ Import the new controller
} from "../controllers/user.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

// ✅ Routes
userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update", isAuth, upload.single("assistantImage"), updateAssistant);
userRouter.post("/asktoassistant", isAuth, askToAssistant);

// ✅ Code correction endpoint (for "Jarvis, correct the code")
userRouter.post("/correct-code", isAuth, correctCode);

export default userRouter;
