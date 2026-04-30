import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import oidcRouter from "./routes/oidcRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js"

const app = express();

// middleware

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev")); // log reqs..
app.use(express.json()); // parse json bodies

// routes

// health
app.get("/health", (_, res) => {
	res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// add more routees here later...
app.use('/', oidcRouter);
app.use("/auth", authRoutes);
app.use('/',oauthRoutes);

// start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
	console.log(`Key issuer : ${process.env.ISSUER}`);
});
