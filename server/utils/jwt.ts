import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  username: string;
}

export const signToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_mms_2026_secure';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_mms_2026_secure';
  return jwt.verify(token, secret) as TokenPayload;
};
