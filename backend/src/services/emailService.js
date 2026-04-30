import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "noreply@mail.sudohq.me";
const ADMIN_EMAIL = "justmultiplythinks@gmail.com";

export async function sendAccessRequestNotification({ appName, redirectUri, email, description }) {
	await resend.emails.send({
		from: FROM,
		to: ADMIN_EMAIL,
		subject: `New OAuth access request: ${appName}`,
		html: `
			<h2>New OAuth Access Request</h2>
			<p><strong>App:</strong> ${appName}</p>
			<p><strong>Redirect URI:</strong> ${redirectUri}</p>
			<p><strong>Contact:</strong> ${email}</p>
			${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
		`,
	});
}

export async function sendCredentials({ to, appName, clientId, clientSecret, redirectUri }) {
	await resend.emails.send({
		from: FROM,
		to,
		subject: `Your OAuth credentials for ${appName}`,
		html: `
			<h2>Your OAuth credentials are ready</h2>
			<p>Your access request for <strong>${appName}</strong> has been approved.</p>
			<table>
				<tr><td><strong>Client ID</strong></td><td><code>${clientId}</code></td></tr>
				<tr><td><strong>Client Secret</strong></td><td><code>${clientSecret}</code></td></tr>
				<tr><td><strong>Redirect URI</strong></td><td><code>${redirectUri}</code></td></tr>
			</table>
			<p>Authorization endpoint: <code>https://auth.sudohq.me/oauth/authorize</code></p>
			<p>Token endpoint: <code>https://auth.sudohq.me/oauth/token</code></p>
			<p style="color:#888;font-size:12px">Keep your client secret safe — do not expose it in client-side code.</p>
		`,
	});
}
