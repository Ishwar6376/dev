import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.get("/health", (req, res) => res.status(200).json({ message: "server is healthy" }));

export { app };