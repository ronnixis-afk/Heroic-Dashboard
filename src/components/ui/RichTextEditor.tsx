import React, { useEffect, useId, useRef } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { cn } from '../../lib/utils';
import { normalizeRichHtml } from '../../lib/richText';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
  id?: string;
};

type FormatCommand = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList';

function runCommand(command: FormatCommand) {
  document.execCommand(command, false);
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '',
  required = false,
  rows = 3,
  className,
  id,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const skipSyncRef = useRef(false);
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const minHeight = Math.max(rows * 22, 66);
  const isEmpty = !normalizeRichHtml(value);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    const next = value || '';
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [value]);

  const emitChange = () => {
    const el = editorRef.current;
    if (!el) return;
    skipSyncRef.current = true;
    onChange(normalizeRichHtml(el.innerHTML));
  };

  const handleToolbar = (command: FormatCommand) => {
    editorRef.current?.focus();
    runCommand(command);
    emitChange();
  };

  const toolbarBtn =
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-brand-text-muted hover:text-brand-text hover:bg-brand-primary/40 transition-colors disabled:opacity-40';

  return (
    <div
      className={cn(
        'rounded-md border border-brand-primary bg-brand-bg focus-within:border-brand-accent focus-within:ring-1 focus-within:ring-brand-accent transition-all',
        className,
      )}
    >
      <div
        className="flex items-center gap-0.5 border-b border-brand-primary/40 px-1.5 py-1"
        role="toolbar"
        aria-label="Text Formatting"
      >
        <button
          type="button"
          className={toolbarBtn}
          title="Bold"
          aria-label="Bold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbar('bold')}
        >
          <Bold size={13} />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title="Italic"
          aria-label="Italic"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbar('italic')}
        >
          <Italic size={13} />
        </button>
        <span className="mx-1 h-4 w-px bg-brand-primary/50" aria-hidden />
        <button
          type="button"
          className={toolbarBtn}
          title="Bullet List"
          aria-label="Bullet List"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbar('insertUnorderedList')}
        >
          <List size={13} />
        </button>
        <button
          type="button"
          className={toolbarBtn}
          title="Numbered List"
          aria-label="Numbered List"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleToolbar('insertOrderedList')}
        >
          <ListOrdered size={13} />
        </button>
      </div>

      <div className="relative">
        {isEmpty && placeholder && (
          <div
            className="pointer-events-none absolute inset-0 px-3 py-2 text-xs text-brand-text-muted"
            aria-hidden
          >
            {placeholder}
          </div>
        )}
        <div
          id={fieldId}
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-required={required || undefined}
          aria-label={placeholder || 'Rich Text'}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
              e.preventDefault();
              handleToolbar('bold');
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
              e.preventDefault();
              handleToolbar('italic');
            }
          }}
          className="rich-text-editor input-field !h-auto resize-none border-0 rounded-none focus:!ring-0 focus:!border-transparent py-2"
          style={{ minHeight }}
        />
      </div>

      {/* Keeps native form required validation working */}
      <input
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        required={required}
        value={normalizeRichHtml(value)}
        readOnly
      />
    </div>
  );
}
