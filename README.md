# Auth System — customm

## What's running

| Thing | Where |
|---|---|
| Backend (Express) | `http://localhost:8080` |
| Frontend (static) | `http://localhost:3000` |
| Database (Postgres) | `localhost:5432` via Docker |

---

## Backend files

```
backend/
├── prisma/
│   └── schema.prisma        # DB models (User, OAuthClient, AuthCode)
├── src/
│   ├── app.js               # Express setup, mounts all routes
│   ├── routes/
│   │   ├── authRoutes.js    # /auth/*
│   │   ├── oauthRoutes.js   # /oauth/*
│   │   └── oidcRoutes.js    # /.well-known/*, /jwks
│   ├── controllers/
│   │   ├── authController.js   # signup / login / verify logic
│   │   ├── oauthController.js  # OAuth authorize + token exchange
│   │   └── oidcController.js   # OIDC discovery + JWKS
│   ├── services/
│   │   └── tokenService.js  # JWT sign/verify using RSA keys
│   ├── middleware/
│   │   └── validation.js    # Zod input validation
│   └── utils/keys/          # RSA private + public key files
```

---

## API endpoints

### Auth (`/auth`)
| Method | Path | What it does |
|---|---|---|
| POST | `/auth/signup` | Creates user, returns JWT |
| POST | `/auth/login` | Checks password, returns JWT |
| GET | `/auth/verify` | Validates a JWT using public key only |

### OAuth (`/oauth`)
| Method | Path | What it does |
|---|---|---|
| GET | `/oauth/authorize` | Issues a short-lived auth code for a user |
| POST | `/oauth/token` | Exchanges auth code → JWT access token |

### OIDC
| Method | Path | What it does |
|---|---|---|
| GET | `/.well-known/openid-configuration` | Discovery doc (issuer, endpoints) |
| GET | `/jwks` | Public key in JWK format (for external token verification) |

---

## DB models (why so many fields)

**User** — `id, email, password (hashed), name, createdAt, updatedAt`
Standard user record. Password is bcrypt-hashed, never stored plain.

**OAuthClient** — `clientId, clientSecret, redirectUri, name`
Represents a registered app (like "Demo App"). Needed to validate OAuth requests — only known clients can request tokens.

**AuthCode** — `code, clientId, userId, expiresAt, used`
Temporary one-time code issued during OAuth authorize step. Expires in 5 min, marked `used` after exchange to prevent replay attacks.

---

## Token flow

```
Signup/Login
  → bcrypt verify password
  → tokenService.signAccessToken()  (RS256 JWT, 15min)
  → returns accessToken + refreshToken

Verify
  → tokenService.verifyToken()
  → uses PUBLIC key only — no DB call, any service can do this

OAuth flow
  → GET /oauth/authorize?user_id=...  → issues AuthCode in DB
  → POST /oauth/token (code + client_secret) → marks code used, returns JWT
```

---

## Frontend tabs

| Tab | Hits |
|---|---|
| Signup / Login | `POST /auth/signup`, `POST /auth/login` |
| Verify Token | `GET /auth/verify` (auto-fills token after login) |
| OIDC Discovery | `GET /.well-known/openid-configuration`, `GET /jwks` |

---

## Why RSA (asymmetric) keys?

The JWT is **signed with a private key** (only the auth server has it) but **verified with the public key** (anyone can have it). This means any downstream service can verify tokens without calling the auth server — that's what the `/jwks` endpoint exposes.
