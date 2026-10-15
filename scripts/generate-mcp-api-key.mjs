#!/usr/bin/env node
/**
 * Print a new MCP bearer key and its SHA-256 hex digest.
 *
 *   node scripts/generate-mcp-api-key.mjs [name] [scopes]
 *
 * scopes is a comma-separated list: read, monsters, patch_notes.
 * Put the sha256 value in MCP_API_KEYS. Keep the bearer key in a secret manager.
 * The digest is SHA-256 over the UTF-8 key, matching crypto.subtle in api/mcp.ts.
 */
import { createHash, randomBytes } from 'node:crypto';

const name = process.argv[2] || 'bot';
const scopes = (process.argv[3] || 'read')
  .split(',')
  .map((scope) => scope.trim())
  .filter(Boolean);

const key = randomBytes(32).toString('base64url');
const sha256 = createHash('sha256').update(key, 'utf8').digest('hex');

const entry = { [name]: { sha256, scopes } };

console.log(`Key name: ${name}`);
console.log('Bearer key (show once; do not commit or log it):');
console.log(key);
console.log('');
console.log('sha256:');
console.log(sha256);
console.log('');
console.log('MCP_API_KEYS entry:');
console.log(JSON.stringify(entry, null, 2));
