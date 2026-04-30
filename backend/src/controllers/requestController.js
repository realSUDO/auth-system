import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendAccessRequestNotification, sendCredentials } from "../services/emailService.js";

const prisma = new PrismaClient();

// POST /oauth/request-access
export const requestAccess = async (req, res) => {
	const { appName, redirectUri, email, description } = req.body;
	if (!appName || !redirectUri || !email)
		return res.status(400).json({ error: "appName, redirectUri and email are required" });

	try {
		await prisma.clientRequest.create({
			data: { appName, redirectUri, email, description },
		});
	} catch (err) {
		if (err.code === "P2002")
			return res.status(409).json({ error: "A request from this email for this redirect URI already exists" });
		throw err;
	}

	await sendAccessRequestNotification({ appName, redirectUri, email, description }).catch(console.error);

	res.status(201).json({ message: "Request submitted. You will receive credentials by email once approved." });
};

// GET /oauth/requests  (admin only)
export const listRequests = async (req, res) => {
	const requests = await prisma.clientRequest.findMany({
		where: { status: "pending" },
		orderBy: { createdAt: "desc" },
	});
	res.json(requests);
};

// POST /oauth/requests/:id/approve  (admin only)
export const approveRequest = async (req, res) => {
	const { id } = req.params;
	const request = await prisma.clientRequest.findUnique({ where: { id } });
	if (!request) return res.status(404).json({ error: "Request not found" });
	if (request.status !== "pending") return res.status(400).json({ error: "Request already processed" });

	const clientId     = crypto.randomBytes(16).toString("hex");
	const clientSecret = crypto.randomBytes(32).toString("hex");

	await prisma.oAuthClient.create({
		data: { clientId, clientSecret, redirectUri: request.redirectUri, name: request.appName },
	});

	await prisma.clientRequest.update({ where: { id }, data: { status: "approved" } });

	await sendCredentials({
		to: request.email,
		appName: request.appName,
		clientId,
		clientSecret,
		redirectUri: request.redirectUri,
	}).catch(console.error);

	res.json({ message: "Approved and credentials sent", clientId });
};

// POST /oauth/requests/:id/reject  (admin only)
export const rejectRequest = async (req, res) => {
	const { id } = req.params;
	const request = await prisma.clientRequest.findUnique({ where: { id } });
	if (!request) return res.status(404).json({ error: "Request not found" });
	await prisma.clientRequest.update({ where: { id }, data: { status: "rejected" } });
	res.json({ message: "Rejected" });
};
