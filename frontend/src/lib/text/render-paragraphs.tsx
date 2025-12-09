import { Fragment } from 'react';

const PARAGRAPH_REGEX = /\n{2,}/;

const normalizeText = (text?: string | null): string => {
  if (!text) return '';
  return text.replace(/\r\n/g, '\n').trim();
};

export function renderParagraphs(
  text?: string | null,
  paragraphClassName = 'event-paragraph',
) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }

  const paragraphs = normalized
    .split(PARAGRAPH_REGEX)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return null;
  }

  return paragraphs.map((paragraph, paragraphIndex) => {
    const lines = paragraph.split('\n');
    return (
      // eslint-disable-next-line react/no-array-index-key
      <p key={`paragraph-${paragraphIndex}`} className={paragraphClassName}>
        {lines.map((line, lineIndex) => (
          <Fragment key={`paragraph-${paragraphIndex}-line-${lineIndex}`}>
            {line}
            {lineIndex < lines.length - 1 && <br />}
          </Fragment>
        ))}
      </p>
    );
  });
}
