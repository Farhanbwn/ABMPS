import jwt from 'jsonwebtoken';

export interface TokenPayload {
  id: string;
  username: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

let hasWarned = false;

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secret || secret === 'super_secret_jwt_key_mms_2026_secure' || secret.length < 32) {
    if (!hasWarned) {
      if (isProduction) {
        console.warn(
          '[Security Warning] JWT_SECRET is not configured or shorter than 32 characters in production. Using fallback secret. Please set a strong, unique JWT_SECRET in your production environment variables.'
        );
      } else if (!secret) {
        console.warn(
          '[Security Warning] JWT_SECRET is not defined in environment variables. Falling back to development secret.'
        );
      }
      hasWarned = true;
    }
    return secret || 'super_secret_jwt_key_mms_2026_secure';
  }

  return secret;
};

export const signToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as TokenPayload;
};
