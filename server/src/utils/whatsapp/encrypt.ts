import crypto from 'crypto';
import { env } from '../../config/env';

const ALGORITHM = 'aes-256-cbc';

// Generate a 32-byte key from the JWT access secret
const getSecretKey = (): Buffer => {
  const secret = env.JWT_ACCESS_SECRET || 'proton_default_secret_key_whatsapp_2026';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts cleartext using AES-256-CBC.
 * Returns formatted string: "ivHex:encryptedHex"
 * 
 * @param text Clear text string
 * @returns Encrypted string
 */
export function encrypt(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
}

/**
 * Decrypts an AES-256-CBC encrypted string.
 * Expects formatted string: "ivHex:encryptedHex"
 * 
 * @param encryptedText Encrypted string
 * @returns Decrypted clear text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      return '';
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}
