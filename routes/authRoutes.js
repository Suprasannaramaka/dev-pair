import express from "express";
import { signup, login, logout, profile,  uploadImage, deleteProfileImage, updateProfile, sendResetPassword } from "../controllers/authController.js";
import { verifyAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const authRoutes = express.Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.get("/profile", verifyAuth, profile);
authRoutes.post("/upload-image", verifyAuth,upload.single('image') ,uploadImage);
authRoutes.post("/logout", logout);
authRoutes.delete("/delete", verifyAuth, deleteProfileImage);
authRoutes.put("/update-profile", verifyAuth, updateProfile);
authRoutes.post("/reset-password", sendResetPassword);
export default authRoutes;
