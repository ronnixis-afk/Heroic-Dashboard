import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = ['p', 'ul', 'ol', 'li', 'br', 'div', 'strong', 'em', 'b', 'i'];

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
 * Allowlist-sanitize rich text for safe display via DOMPurify.
 * Plain text (legacy) is escaped and keeps newlines.
 */
export function sanitizeRichHtml(html: string): string {
  const value = html ?? '';
  if (!value.trim()) return '';

  if (!looksLikeHtml(value)) {
    return escapeHtml(value).replace(/\r\n|\r|\n/g, '<br>');
  }

  const cleaned = DOMPurify.sanitize(value, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });

  return cleaned
    .replace(/<\/?b>/gi, (m) => (m.startsWith('</') ? '</strong>' : '<strong>'))
    .replace(/<\/?i>/gi, (m) => (m.startsWith('</') ? '</em>' : '<em>'))
    .replace(/<\/?div>/gi, (m) => (m.startsWith('</') ? '</p>' : '<p>'));
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
