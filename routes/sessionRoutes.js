import express from "express";

import {
  createSession,
  joinSession,
  getSessionDetails,
  getSessionHistory,
  endSession,
} from "../controllers/sessionController.js";
import { verifyAuth } from "../middleware/authMiddleware.js";

const sessionRoutes = express.Router();

sessionRoutes.post("/create", verifyAuth, createSession);
sessionRoutes.post("/join/:sessionId", verifyAuth, joinSession);

sessionRoutes.get("/history", verifyAuth, getSessionHistory);
sessionRoutes.get("/:sessionId", verifyAuth, getSessionDetails);

sessionRoutes.post("/end/:sessionId", verifyAuth, endSession);

export default sessionRoutes;
