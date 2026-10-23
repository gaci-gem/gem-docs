export interface FrontmatterParts {
  /** The original Frontmatter block, including its opening and closing delimiters. */
  prefix: string;
  /** Markdown after the Frontmatter block. */
  body: string;
}

export interface SimpleFrontmatterProperty {
  key: string;
  value: string;
}

export type SimplePropertyType = 'text' | 'list' | 'select' | 'number' | 'checkbox' | 'date';

/** Infers a type from its scalar representation, using a UI preference for empty values. */
export function inferSimplePropertyType(value: string, preferredType?: SimplePropertyType): SimplePropertyType {
  if (preferredType === 'select' || value.trim() === '' && preferredType) return preferredType;
  if (parseStringList(value) !== null) return 'list';
  if (value === 'true' || value === 'false') return 'checkbox';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))) return 'date';
  if (value.trim() !== '' && Number.isFinite(Number(value))) return 'number';
  return 'text';
}

export function convertSimplePropertyValue(value: string, type: SimplePropertyType): string {
  switch (type) {
    case 'list': return serializeStringList(parseStringList(value) ?? value.split(',').map((item) => item.trim()).filter(Boolean));
    case 'number': {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? String(parsed) : '';
    }
    case 'select': {
      const values = parseStringList(value);
      return (values?.[0] ?? value.split(',')[0] ?? '').trim();
    }
    case 'checkbox': return value === 'true' ? 'true' : 'false';
    case 'date': return value.trim() === '' ? localIsoDate() : /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
    default: return parseStringList(value) ? (parseStringList(value) ?? []).join(', ') : value;
  }
}

function localIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseStringList(value: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(value.trim());
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : null;
  } catch {
    return null;
  }
}

export function serializeStringList(values: string[]): string {
  return JSON.stringify(values.map((value) => value.trim()).filter(Boolean));
}

export const EDITORIAL_STATUSES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
export type EditorialStatus = typeof EDITORIAL_STATUSES[number];

export function normalizeEditorialStatus(value: string | undefined): EditorialStatus {
  return EDITORIAL_STATUSES.includes(value as EditorialStatus) ? value as EditorialStatus : 'DRAFT';
}

/**
 * Separates an initial, delimiter-only YAML block without interpreting its contents.
 *
 * YAML parsing, property editing, and editorial state intentionally remain outside this
 * utility. The prefix is kept byte-for-byte so the document can be recomposed losslessly.
 */
export function splitFrontmatter(markdown: string): FrontmatterParts {
  if (!markdown.startsWith('---')) return { prefix: '', body: markdown };

  const openingEnd = lineEnd(markdown, 0);
  if (markdown.slice(0, openingEnd.contentEnd) !== '---' || openingEnd.next === openingEnd.contentEnd) {
    return { prefix: '', body: markdown };
  }

  let cursor = openingEnd.next;
  while (cursor < markdown.length) {
    const end = lineEnd(markdown, cursor);
    if (markdown.slice(cursor, end.contentEnd) === '---') {
      const prefixEnd = end.next === end.contentEnd ? end.contentEnd : end.next;
      return { prefix: markdown.slice(0, prefixEnd), body: markdown.slice(prefixEnd) };
    }
    cursor = end.next === end.contentEnd ? markdown.length : end.next;
  }

  return { prefix: '', body: markdown };
}

/** Recombines an untouched Frontmatter prefix with the editor-produced Markdown body. */
export function composeFrontmatter(prefix: string, body: string): string {
  return prefix + body;
}

/**
 * Reads only top-level `key: value` entries. Nested YAML, lists, and block
 * scalars are deliberately excluded so the first properties UI cannot damage
 * structures it does not understand.
 */
export function parseSimpleFrontmatter(markdown: string): SimpleFrontmatterProperty[] {
  const { prefix } = splitFrontmatter(markdown);
  if (!prefix) return [];

  const lines = prefix.split('\n');
  const properties: SimpleFrontmatterProperty[] = [];
  for (let index = 1; index < lines.length - 1; index++) {
    const line = lines[index].replace(/\r$/, '');
    const match = /^(?<key>[A-Za-z_][\w-]*):[ \t]*(?<value>.*)$/.exec(line);
    if (!match || !isSupportedValue(match.groups?.['value'] ?? '', lines[index + 1])) continue;
    if (properties.some((property) => property.key === match.groups?.['key'])) continue;
    properties.push({ key: match.groups?.['key'] ?? '', value: match.groups?.['value'] ?? '' });
  }
  return properties;
}

/** Updates or adds one supported property while preserving the body and unsupported YAML. */
export function updateSimpleFrontmatterProperty(markdown: string, key: string, value: string): string {
  const normalizedKey = key.trim();
  if (!/^[A-Za-z_][\w-]*$/.test(normalizedKey)) return markdown;
  if (value.trim().startsWith('[') && !isStringList(value.trim())) return markdown;

  const parts = splitFrontmatter(markdown);
  if (!parts.prefix) {
    return composeFrontmatter(`---\n${normalizedKey}: ${value}\n---\n\n`, markdown);
  }

  const lines = parts.prefix.split('\n');
  const lineIndex = findSimplePropertyLine(lines, normalizedKey);
  const ending = lines[lineIndex ?? 1]?.endsWith('\r') ? '\r' : '';
  const replacement = `${normalizedKey}: ${value}${ending}`;
  if (lineIndex !== undefined) lines[lineIndex] = replacement;
  else {
    const closingIndex = lines[lines.length - 1] === '' ? lines.length - 2 : lines.length - 1;
    lines.splice(closingIndex, 0, replacement);
  }
  return composeFrontmatter(lines.join('\n'), parts.body);
}

/** Removes one supported property; unsupported/nested YAML is left untouched. */
export function removeSimpleFrontmatterProperty(markdown: string, key: string): string {
  const parts = splitFrontmatter(markdown);
  if (!parts.prefix) return markdown;
  const lines = parts.prefix.split('\n');
  const lineIndex = findSimplePropertyLine(lines, key.trim());
  if (lineIndex === undefined) return markdown;
  lines.splice(lineIndex, 1);
  return composeFrontmatter(lines.join('\n'), parts.body);
}

function findSimplePropertyLine(lines: string[], key: string): number | undefined {
  for (let index = 1; index < lines.length - 1; index++) {
    const line = lines[index].replace(/\r$/, '');
    const match = /^(?<candidate>[A-Za-z_][\w-]*):[ \t]*(?<value>.*)$/.exec(line);
    if (match?.groups?.['candidate'] === key && isSupportedValue(match.groups['value'] ?? '', lines[index + 1])) {
      return index;
    }
  }
  return undefined;
}

function isSupportedValue(value: string, nextLine: string | undefined): boolean {
  const trimmed = value.trim();
  if (/^[\{>|&*!]/.test(trimmed)) return false;
  if (trimmed.startsWith('[') && !isStringList(trimmed)) return false;
  if (!trimmed && nextLine !== undefined && (/^\s+/.test(nextLine) || /^\s*-\s/.test(nextLine))) return false;
  return true;
}

function isStringList(value: string): boolean {
  return parseStringList(value) !== null;
}

function lineEnd(markdown: string, start: number): { contentEnd: number; next: number } {
  const lineBreak = markdown.indexOf('\n', start);
  if (lineBreak === -1) return { contentEnd: markdown.length, next: markdown.length };

  const contentEnd = lineBreak > start && markdown[lineBreak - 1] === '\r' ? lineBreak - 1 : lineBreak;
  return { contentEnd, next: lineBreak + 1 };
}
