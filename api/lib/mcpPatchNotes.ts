/**
 * Patch-note payload helpers matching createNews in src/hooks/useNews.ts.
 * MCP never turns on is_popup.
 */
export interface PublishPatchNoteInput {
  title: string;
  content: string;
  version?: string;
}

export interface PatchNotePayload {
  title: string;
  content: string;
  imageUrl: null;
  published: true;
  is_popup: false;
  active: false;
  highlights: [];
  cta_label: null;
  cta_url: null;
  version: string | null;
  is_patch_note: true;
}

export interface PatchNoteListItem {
  id?: string;
  title?: string;
  content?: string;
  version?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

function requireTrimmed(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} Is Required.`);
  }
  return value.trim();
}

export function buildPatchNotePayload(input: PublishPatchNoteInput): PatchNotePayload {
  const title = requireTrimmed(input.title, 'Title');
  const content = requireTrimmed(input.content, 'Content');
  const version =
    typeof input.version === 'string' && input.version.trim() ? input.version.trim() : null;

  return {
    title,
    content,
    imageUrl: null,
    published: true,
    is_popup: false,
    active: false,
    highlights: [],
    cta_label: null,
    cta_url: null,
    version,
    is_patch_note: true,
  };
}

export function normalizePatchNotesList(data: unknown): PatchNoteListItem[] {
  if (Array.isArray(data)) return data as PatchNoteListItem[];
  if (data && typeof data === 'object') {
    const record = data as { patchNotes?: unknown; news?: unknown; items?: unknown };
    if (Array.isArray(record.patchNotes)) return record.patchNotes as PatchNoteListItem[];
    if (Array.isArray(record.news)) return record.news as PatchNoteListItem[];
    if (Array.isArray(record.items)) return record.items as PatchNoteListItem[];
  }
  return [];
}

export function sortPatchNotesNewestFirst(items: PatchNoteListItem[]): PatchNoteListItem[] {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(String(a.createdAt || '')) || 0;
    const bTime = Date.parse(String(b.createdAt || '')) || 0;
    return bTime - aTime;
  });
}
