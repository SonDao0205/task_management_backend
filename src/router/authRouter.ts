import { Router } from "express";
import AuthController from "../controller/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const authRouter = Router();
const authController = AuthController.getInstance();
authRouter.post("/auth/login", authController.login);
authRouter.post("/auth/register", authController.register);
authRouter.get("/auth/me", authenticate, authController.me);
authRouter.post("/auth/refresh", authenticate, authController.refresh);
authRouter.get("/auth/logOut", authenticate, authController.logOut);
