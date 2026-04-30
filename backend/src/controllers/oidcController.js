import { PrismaClient } from "@prisma/client";
import fs from "fs";
import crypto from "crypto";
import tokenService from "../services/tokenService.js";

const prisma = new PrismaClient();

export const openidConfig = (req, res) => {
	const issuer = process.env.ISSUER;
	res.json({
		issuer,
		authorization_endpoint: `${issuer}/oauth/authorize`,
		token_endpoint: `${issuer}/oauth/token`,
		userinfo_endpoint: `${issuer}/oauth/userinfo`,
		jwks_uri: `${issuer}/jwks`,
		response_types_supported: ["code"],
		subject_types_supported: ["public"],
		id_token_signing_alg_values_supported: ["RS256"],
		grant_types_supported: ["authorization_code", "refresh_token"],
	});
};

export const jwks = (_, res) => {
	const pem = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, "utf8");
	const keyObject = crypto.createPublicKey(pem);
	const jwk = keyObject.export({ format: "jwk" });
	res.json({
		keys: [{ ...jwk, use: "sig", alg: "RS256", kid: "auth-key-1" }],
	});
};

// GET /oauth/userinfo — standard OIDC userinfo endpoint
// Requires: Authorization: Bearer <access_token>
export const userinfo = async (req, res) => {
	const token = req.headers.authorization?.split(" ")[1];
	if (!token) return res.status(401).json({ error: "No token provided" });

	const result = tokenService.verifyToken(token);
	if (!result.valid) return res.status(401).json({ error: result.error });

	const user = await prisma.user.findUnique({
		where: { id: result.decoded.sub },
		select: { id: true, email: true, name: true },
	});
	if (!user) return res.status(404).json({ error: "User not found" });

	res.json({
		sub: user.id,
		email: user.email,
		name: user.name,
	});
};
