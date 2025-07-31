import express from "express";
import { Login, logOut, signUp } from "../controllers/auth.controller.js";

const authRouter = express.Router();

// All routes will be prefixed with /api/auth
authRouter.post("/signup", signUp);
authRouter.post("/signin", Login);
authRouter.get("/logout", logOut);

export default authRouter;
