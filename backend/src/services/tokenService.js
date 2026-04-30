import jwt from "jsonwebtoken";
import fs from "fs";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class TokenService {
	constructor() {
		this.privateKey = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, "utf8");
		this.publicKey  = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, "utf8");
	}

	signAccessToken(payload) {
		return jwt.sign(
			{ sub: payload.userId, email: payload.email, type: "access" },
			this.privateKey,
			{ algorithm: "RS256", expiresIn: "15m", issuer: process.env.ISSUER }
		);
	}

	verifyToken(token) {
		try {
			const decoded = jwt.verify(token, this.publicKey, {
				algorithms: ["RS256"],
				issuer: process.env.ISSUER,
			});
			return { valid: true, decoded };
		} catch (err) {
			return { valid: false, error: err.message };
		}
	}

	// Creates a refresh token, stores it in DB, returns { token, record }
	async createRefreshToken(userId) {
		const token = crypto.randomBytes(64).toString("hex");
		const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
		const record = await prisma.refreshToken.create({
			data: { token, userId, expiresAt },
		});
		return { token, record };
	}
}

export default new TokenService();
