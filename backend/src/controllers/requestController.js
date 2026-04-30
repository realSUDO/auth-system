import { sendAccessRequestNotification } from "../services/emailService.js";

// POST /oauth/request-access
export const requestAccess = async (req, res) => {
	const { appName, redirectUri, email, description } = req.body;
	if (!appName || !redirectUri || !email)
		return res.status(400).json({ error: "appName, redirectUri and email are required" });

	await sendAccessRequestNotification({ appName, redirectUri, email, description }).catch(console.error);

	res.status(201).json({ message: "Request submitted. You will be contacted once approved." });
};
