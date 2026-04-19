import jwt from "jsonwebtoken";
import fs from "fs";
import crypto from "crypto";

class TokenService {
	constructor() {
		// loading the rsa keys
		this.privateKey = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, "utf8");
		this.publicKey = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, "utf8");
	}

	signAccessToken(payload) {
		return jwt.sign(
			{
				sub: payload.userId, // standard claim for subject (user id)
				email: payload.email,
				type: "access",
			},

			this.privateKey,
			{
				algorithm: "RS256", // rsa + sha256 assymetric
				expiresIn: "15m", // short lived on purpose..
				issuer: process.env.ISSUER,
			},
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

	generateRefreshToken() {
		return crypto.randomBytes(64).toString('hex'); 
	}
}

export default new TokenService();


