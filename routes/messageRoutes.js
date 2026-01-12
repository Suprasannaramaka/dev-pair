import express from "express";
import { sessionAuth } from "../middleware/sessionAuth.js";
import { getMessages } from "../controllers/messageController.js";
import { verifyAuth } from "../middleware/authMiddleware.js";

const messageRoutes = express.Router();

messageRoutes.get(
  "/:sessionId",
  verifyAuth,
  sessionAuth,
  getMessages
);

export default messageRoutes;
