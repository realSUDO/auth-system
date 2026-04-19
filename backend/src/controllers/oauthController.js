import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import tokenService from "../services/tokenService.js";

const prisma = new PrismaClient();

// get /oauth/authorize?client_id=something&redirect_uri=something&response_type=code&user_id=something

// for now accepting user_id as query param to keep it simple, .. otherwise would create a login page

export const authorize = async (req, res) => {
	const { client_id, redirect_uri, response_type, user_id } = req.query;

	if (response_type !== "code")
		return res
			.status(400)
			.json({ error: "Only response_type=code is supported" });

	const client = await prisma.oAuthClient.findUnique({
		where: { clientId: client_id },
	});

	if (!client || client.redirectUri !== redirect_uri)
		return res.status(400).json({ error: "Invalid client_id or redirect_uri" });
	if (!user_id)
		return res
			.status(400)
			.json({ error: "user_id is required for this demo atleast.." });

	const code = crypto.randomBytes(32).toString("hex");
	const expiresAt = new Date(Date.now() + 5 * 60 * 1000); //code valid for 5 mins

	await prisma.authCode.create({
		data: {
			code,
			clientId: client_id,
			userId: user_id,
			expiresAt,
		},
	});

	res.redirect(`${redirect_uri}?code=${code}`);
};

// post /oauth/token..

export const token = async (req, res) => {
	const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

	if (grant_type !== "authorization_code")
		return res
			.status(400)
			.json({ error: "Only grant_type=authorization_code is supported" });

	const client = await prisma.oAuthClient.findUnique({
		where: { clientId: client_id },
	});
	if (!client || client.clientSecret !== client_secret || client.redirectUri !== redirect_uri)
		return res.status(400).json({error: "Invalid client credentials "});
	const authCode = await prisma.authCode.findUnique({ where: { code } });
	if (!authCode || authCode.used || authCode.expiresAt < new Date())
		return res.status(400).json({ error: "Invalid or expired code" });

	await prisma.authCode.update({where: { code }, data: { used : true }});

	const accessToken = tokenService.signAccessToken({
		userId: authCode.userId,
		email: "" , // ... can add email to auth code if needed, but skipping for now
	})
	const refreshToken = tokenService.generateRefreshToken();

	res.json({
		access_token: accessToken,
		refresh_token: refreshToken,
		token_type: "Bearer",
		expires_in: 15 * 60, // 15 mins 
	})
};
