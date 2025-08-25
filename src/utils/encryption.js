// Fernet encryption helper for payloads: { data: "<token>" }
import * as fernet from "fernet";

// NOTE: The secret must be a 32-byte URL-safe base64 string (same as backend)
const FERNET_SECRET = process.env.REACT_APP_FERNET_SECRET || "";

export function encryptPayload(obj) {
  if (!FERNET_SECRET) throw new Error("Missing REACT_APP_FERNET_SECRET");
  const secret = new fernet.Secret(FERNET_SECRET);
  const token = new fernet.Token({ secret });
  const json = JSON.stringify(obj);
  const encoded = token.encode(json);
  return { data: encoded };
}
