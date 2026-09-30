import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

export class InvalidGoogleTokenError extends Error {}

type Verifier = (credential: string) => Promise<GoogleIdentity>;

const client = new OAuth2Client();

/**
 * Verifies a Google Identity Services ID token: signature (Google's public keys),
 * expiry, issuer, and that it was issued for this app's client id.
 */
const verifyWithGoogle: Verifier = async (credential) => {
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: config.googleClientId });
    payload = ticket.getPayload();
  } catch (error) {
    throw new InvalidGoogleTokenError((error as Error).message);
  }
  if (!payload?.sub || !payload.email) throw new InvalidGoogleTokenError('Token is missing the account id or email');
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: payload.name || payload.email.split('@')[0],
  };
};

let verifier: Verifier = verifyWithGoogle;

export const verifyGoogleCredential = (credential: string) => verifier(credential);

/** Test hook. */
export const setGoogleVerifier = (custom: Verifier | null) => {
  verifier = custom ?? verifyWithGoogle;
};
