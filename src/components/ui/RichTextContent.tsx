import React from 'react';
import { cn } from '../../lib/utils';
import { sanitizeRichHtml } from '../../lib/richText';

type RichTextContentProps = {
  html: string;
  className?: string;
  as?: 'div' | 'p' | 'span';
};

export default function RichTextContent({
  html,
  className,
  as: Tag = 'div',
}: RichTextContentProps) {
  const safe = sanitizeRichHtml(html);
  if (!safe) return null;

  return (
    <Tag
      className={cn('rich-text-content', className)}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
