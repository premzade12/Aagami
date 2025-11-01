import express from "express";
import {
  askToAssistant,
  getCurrentUser,
  updateAssistant,
  correctCode,
  addHistory,        // ✅ new controller
  getHistory         // ✅ new controller
} from "../controllers/user.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

// ✅ Existing routes
userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update", isAuth, upload.single("assistantImage"), updateAssistant);
userRouter.post("/askToAssistant", isAuth, askToAssistant);
userRouter.post("/correct-code", isAuth, correctCode);

// ✅ New routes for history
userRouter.post("/add-history", isAuth, addHistory);   // Add history entry
userRouter.get("/get-history", isAuth, getHistory);    // Get all history entries

export default userRouter;
