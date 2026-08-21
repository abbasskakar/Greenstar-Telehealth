import "server-only";
import jwt from "jsonwebtoken";

/**
 * JaaS (Jitsi as a Service, by 8x8) integration.
 *
 * When these env vars are set, the app signs a short-lived JWT so doctors and
 * patients join the call directly — no Google/moderator login. When they are
 * absent, video falls back to the public meet.jit.si server.
 *
 *   JAAS_APP_ID          vpaas-magic-cookie-xxxxxxxx   (the tenant / "AppID")
 *   JAAS_KEY_ID          the API key id (kid) from the JaaS console
 *   JAAS_PRIVATE_KEY_B64 the RSA private key (PEM), base64-encoded
 *                        (or JAAS_PRIVATE_KEY as a raw PEM with \n escapes)
 */
function privateKeyPem(): string | null {
  const b64 = process.env.JAAS_PRIVATE_KEY_B64;
  if (b64) return Buffer.from(b64, "base64").toString("utf8");
  const raw = process.env.JAAS_PRIVATE_KEY;
  return raw ? raw.replace(/\\n/g, "\n") : null;
}

export function jaasAppId(): string | null {
  return process.env.JAAS_APP_ID || null;
}

export function jaasConfigured(): boolean {
  return !!(process.env.JAAS_APP_ID && process.env.JAAS_KEY_ID && privateKeyPem());
}

/** Full JaaS room name is prefixed with the tenant/AppID. */
export function jaasRoom(room: string): string {
  const appId = process.env.JAAS_APP_ID;
  return appId ? `${appId}/${room}` : room;
}

export function makeJaasToken(opts: {
  room: string;
  userId: string;
  name: string;
  moderator: boolean;
}): string | null {
  const appId = process.env.JAAS_APP_ID;
  const keyId = process.env.JAAS_KEY_ID;
  const privateKey = privateKeyPem();
  if (!appId || !keyId || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      aud: "jitsi",
      iss: "chat",
      sub: appId,
      room: opts.room,
      nbf: now - 10,
      exp: now + 3 * 60 * 60, // 3 hours
      context: {
        user: {
          id: opts.userId,
          name: opts.name,
          avatar: "",
          email: "",
          moderator: opts.moderator ? "true" : "false",
        },
        features: {
          livestreaming: "false",
          recording: "false",
          transcription: "false",
          "outbound-call": "false",
        },
      },
    },
    privateKey,
    { algorithm: "RS256", header: { alg: "RS256", kid: `${appId}/${keyId}` } },
  );
}
