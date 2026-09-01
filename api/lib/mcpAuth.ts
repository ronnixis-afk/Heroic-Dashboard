import { timingSafeEqual } from 'node:crypto';

function asHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function extractBearerToken(
  authorization: string | string[] | undefined
): string | null {
  const header = asHeaderValue(authorization);
  if (!header) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match?.[1] ?? null;
}

export function timingSafeEqualString(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  if (leftBuf.length !== rightBuf.length) {
    const dummy = Buffer.alloc(leftBuf.length);
    timingSafeEqual(leftBuf, dummy);
    return false;
  }
  return timingSafeEqual(leftBuf, rightBuf);
}

export function isAuthorizedMcpRequest(
  authorization: string | string[] | undefined,
  expectedKey: string | undefined
): boolean {
  if (!expectedKey) return false;
  const token = extractBearerToken(authorization);
  if (!token) return false;
  return timingSafeEqualString(token, expectedKey);
}
