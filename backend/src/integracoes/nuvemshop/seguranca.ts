import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { exigirConfiguracao } from './config';

export const hashEstado = (state: string) => createHash('sha256').update(state).digest('hex');

export function criptografar(token: string): string {
  const key = Buffer.from(exigirConfiguracao().chave, 'base64');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(b => b.toString('base64')).join('.');
}

export function descriptografar(value: string): string {
  const [iv, tag, encrypted] = value.split('.').map(s => Buffer.from(s, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(exigirConfiguracao().chave, 'base64'), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function assinaturaValida(raw: Buffer, assinatura: string | undefined, secret: string): boolean {
  if (!secret || !assinatura || !/^[a-f0-9]{64}$/i.test(assinatura)) return false;
  const expected = createHmac('sha256', secret).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(assinatura, 'hex'));
}
