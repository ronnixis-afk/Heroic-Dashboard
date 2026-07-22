const BLOCK_TAGS = new Set(['P', 'UL', 'OL', 'LI', 'BR', 'DIV']);
const INLINE_TAGS = new Set(['STRONG', 'B', 'EM', 'I']);
const ALLOWED_TAGS = new Set([...BLOCK_TAGS, ...INLINE_TAGS]);

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function looksLikeHtml(value: string): boolean {
  return /<\/?(?:p|br|strong|b|em|i|ul|ol|li|div)\b/i.test(value);
}

function serializeAllowed(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toUpperCase();

  if (tag === 'BR') return '<br>';

  if (!ALLOWED_TAGS.has(tag)) {
    return Array.from(el.childNodes).map(serializeAllowed).join('');
  }

  // Normalize presentation tags
  const outTag =
    tag === 'B' ? 'strong' : tag === 'I' ? 'em' : tag === 'DIV' ? 'p' : tag.toLowerCase();

  const children = Array.from(el.childNodes).map(serializeAllowed).join('');

  if (outTag === 'br') return '<br>';
  return `<${outTag}>${children}</${outTag}>`;
}

/** Collapse empty editor shells to '' so required checks work. */
export function normalizeRichHtml(html: string): string {
  const trimmed = (html || '').trim();
  if (!trimmed) return '';
  const plain = trimmed
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')
    .trim();
  return plain ? trimmed : '';
}

/**
 * Allowlist-sanitize rich text for safe display.
 * Plain text (legacy) is escaped and keeps newlines.
 */
export function sanitizeRichHtml(html: string): string {
  const value = html ?? '';
  if (!value.trim()) return '';

  if (!looksLikeHtml(value)) {
    return escapeHtml(value).replace(/\r\n|\r|\n/g, '<br>');
  }

  if (typeof DOMParser === 'undefined') {
    return escapeHtml(value.replace(/<[^>]+>/g, ' '));
  }

  const doc = new DOMParser().parseFromString(value, 'text/html');
  return Array.from(doc.body.childNodes).map(serializeAllowed).join('');
}

export function richTextToPlain(html: string): string {
  const value = html ?? '';
  if (!value.trim()) return '';

  if (!looksLikeHtml(value)) return value;

  if (typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.innerHTML = sanitizeRichHtml(value);
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|li|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
