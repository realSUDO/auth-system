import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import tokenService from "../services/tokenService.js";

const prisma = new PrismaClient();

/*
  GET /oauth/authorize
    ?client_id=&redirect_uri=&response_type=code&state=&email=&password=

  UI-agnostic: the client sends credentials directly in the query (for API/custom UI flows).
  If credentials are missing, returns 401 JSON so the client can show its own login UI
  and re-submit with credentials — no forced redirect to a login page.
*/
export const authorize = async (req, res) => {
	const { client_id, redirect_uri, response_type, state, email, password } = req.query;

	if (response_type !== "code")
		return res.status(400).json({ error: "Only response_type=code is supported" });

	const client = await prisma.oAuthClient.findUnique({ where: { clientId: client_id } });
	if (!client || client.redirectUri !== redirect_uri)
		return res.status(400).json({ error: "Invalid client_id or redirect_uri" });

	// No credentials → tell the client to collect them
	if (!email || !password)
		return res.status(401).json({ error: "credentials_required", message: "Provide email and password to authorize" });

	const user = await prisma.user.findUnique({ where: { email } });
	const valid = user && await bcrypt.compare(password, user.password);
	if (!valid)
		return res.status(401).json({ error: "Invalid credentials" });

	const code = crypto.randomBytes(32).toString("hex");
	await prisma.authCode.create({
		data: {
			code,
			clientId: client_id,
			userId: user.id,
			email: user.email,
			state: state || null,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000),
		},
	});

	const redirectUrl = new URL(redirect_uri);
	redirectUrl.searchParams.set("code", code);
	if (state) redirectUrl.searchParams.set("state", state);
	res.redirect(redirectUrl.toString());
};

/*
  POST /oauth/token
  Body: grant_type, code, client_id, client_secret, redirect_uri
     or grant_type=refresh_token, refresh_token, client_id, client_secret
*/
export const token = async (req, res) => {
	const { grant_type, client_id, client_secret, redirect_uri, code, refresh_token } = req.body;

	const client = await prisma.oAuthClient.findUnique({ where: { clientId: client_id } });
	if (!client || client.clientSecret !== client_secret)
		return res.status(401).json({ error: "Invalid client credentials" });

	// --- authorization_code ---
	if (grant_type === "authorization_code") {
		if (!code || !redirect_uri)
			return res.status(400).json({ error: "code and redirect_uri required" });
		if (client.redirectUri !== redirect_uri)
			return res.status(400).json({ error: "redirect_uri mismatch" });

		const authCode = await prisma.authCode.findUnique({ where: { code } });
		if (!authCode || authCode.used || authCode.expiresAt < new Date())
			return res.status(400).json({ error: "Invalid or expired code" });
		if (authCode.clientId !== client_id)
			return res.status(400).json({ error: "Code was not issued to this client" });

		await prisma.authCode.update({ where: { code }, data: { used: true } });

		const accessToken = tokenService.signAccessToken({ userId: authCode.userId, email: authCode.email });
		const { token: newRefresh, record } = await tokenService.createRefreshToken(authCode.userId);

		return res.json({
			access_token: accessToken,
			refresh_token: newRefresh,
			token_type: "Bearer",
			expires_in: 15 * 60,
		});
	}

	// --- refresh_token ---
	if (grant_type === "refresh_token") {
		if (!refresh_token)
			return res.status(400).json({ error: "refresh_token required" });

		const stored = await prisma.refreshToken.findUnique({ where: { token: refresh_token } });
		if (!stored || stored.expiresAt < new Date())
			return res.status(401).json({ error: "Invalid or expired refresh token" });

		// Rotate: delete old, issue new
		await prisma.refreshToken.delete({ where: { token: refresh_token } });

		const user = await prisma.user.findUnique({ where: { id: stored.userId } });
		const accessToken = tokenService.signAccessToken({ userId: user.id, email: user.email });
		const { token: newRefresh } = await tokenService.createRefreshToken(user.id);

		return res.json({
			access_token: accessToken,
			refresh_token: newRefresh,
			token_type: "Bearer",
			expires_in: 15 * 60,
		});
	}

	res.status(400).json({ error: "Unsupported grant_type" });
};

/*
  POST /oauth/clients
  Body: { name, redirectUri }
  Returns: { clientId, clientSecret } — store the secret, it won't be shown again
*/
export const registerClient = async (req, res) => {
	const { name, redirectUri } = req.body;
	if (!name || !redirectUri)
		return res.status(400).json({ error: "name and redirectUri are required" });

	const clientId     = crypto.randomBytes(16).toString("hex");
	const clientSecret = crypto.randomBytes(32).toString("hex");

	await prisma.oAuthClient.create({
		data: { clientId, clientSecret, redirectUri, name },
	});

	res.status(201).json({ clientId, clientSecret, name, redirectUri });
};
