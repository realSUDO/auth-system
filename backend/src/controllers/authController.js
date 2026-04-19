import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import tokenService from "../services/tokenService.js";

const prisma = new PrismaClient();

export const signup = async (req, res) => {
	try {
		const { email, password, name } = req.validateBody;

		// check if email is there already..
		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing)
			return res.status(400).json({ error: "Email already registered" });

		// hash the password..
		const hashed = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({
			data: { email, password: hashed, name },
		});

		const accessToken = tokenService.signAccessToken({
			userId: user.id,
			email: user.email,
		});
		const refreshToken = tokenService.generateRefreshToken();

		res.status(201).json({
			user: { id: user.id, email: user.email, name: user.name },
			accessToken,
			refreshToken,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.validateBody;

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) return res.status(401).json({ error: "Invalid credentials" });

		const valid = await bcrypt.compare(password, user.password);
		if (!valid) return res.status(401).json({ error: "Invalid credentials" });

		const accessToken = tokenService.signAccessToken({
			userId: user.id,
			email: user.email,
		});
		const refreshToken = tokenService.generateRefreshToken();

		res.json({
			user: { id: user.id, email: user.email, name: user.name },
			accessToken,
			refreshToken,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal server error" });
	}
};

// any serivce can call this to check if a token is valid...
// it uses public key no database call needed..

export const verify = (req, res) => {
	const token = req.headers.authorization?.split(" ")[1]; // bearer token
	if (!token) return res.status(401).json({ error: "No token provided" });

	const result = tokenService.verifyToken(token);
	if (!result.valid) return res.status(401).json({ error: result.error });

	res.json({ valid: true, decoded: result.decoded });
};
