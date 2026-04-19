import fs from "fs";
import crypto from "crypto";

export const openidConfig = (req, res) => {
	const issuer = process.env.ISSUER;
	res.json({
		issuer,
		authorization_endpoint: `${issuer}/oauth/authorize`,
		token_endpoint: `${issuer}/oauth/token`,
		jwks_uri: `${issuer}/jwks`,

		response_types_supported: ["code"],
		subject_types_supported: ["public"],
		id_token_signing_alg_values_supported: ["RS256"],
	});
};

export const jwks = (_,res) => {
	const pem = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, "utf8");
	const keyObject = crypto.createPublicKey(pem);
	const jwk = keyObject.export({ format: "jwk" });
	res.json({
		keys: [{ ...jwk, use : 'sig', alg: 'RS256' , kid: 'auth-key-1' }],
	});
};
