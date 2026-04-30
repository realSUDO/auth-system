import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import oidcRouter from "./routes/oidcRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Health
app.get("/health", (_, res) => {
	res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/", oidcRouter);
app.use("/auth", authRoutes);
app.use("/", oauthRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
	console.log(`Key issuer : ${process.env.ISSUER}`);
});
