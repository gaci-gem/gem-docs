import {
  parseSimpleFrontmatter,
  removeSimpleFrontmatterProperty,
  updateSimpleFrontmatterProperty,
  normalizeEditorialStatus,
  parseStringList,
  serializeStringList,
  convertSimplePropertyValue,
  inferSimplePropertyType,
} from './frontmatter';
import { describe, expect, it } from 'vitest';

describe('simple frontmatter helpers', () => {
  it('parses and serializes string lists without changing the JSON representation', () => {
    expect(parseStringList('["docs", "frontend"]')).toEqual(['docs', 'frontend']);
    expect(parseStringList('[1, "docs"]')).toBeNull();
    expect(serializeStringList([' docs ', '', 'frontend'])).toBe('["docs","frontend"]');
  });

  it('infers and converts supported scalar property types', () => {
    expect(inferSimplePropertyType('12.5')).toBe('number');
    expect(inferSimplePropertyType('true')).toBe('checkbox');
    expect(inferSimplePropertyType('2026-09-25')).toBe('date');
    expect(inferSimplePropertyType('12abc')).toBe('text');
    expect(convertSimplePropertyValue('12.50', 'number')).toBe('12.5');
    expect(convertSimplePropertyValue('anything', 'checkbox')).toBe('false');
    expect(convertSimplePropertyValue('2026-09-25', 'date')).toBe('2026-09-25');
    expect(convertSimplePropertyValue('["first", "second"]', 'select')).toBe('first');
    expect(convertSimplePropertyValue('new value', 'select')).toBe('new value');
  });

  it('retains a preferred selection type for an empty scalar without changing its value', () => {
    expect(convertSimplePropertyValue('', 'select')).toBe('');
    expect(inferSimplePropertyType('', 'select')).toBe('select');
    expect(inferSimplePropertyType('', 'text')).toBe('text');
    expect(inferSimplePropertyType('free entry', 'select')).toBe('select');
  });

  it('converts an empty property to the local current date', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    expect(convertSimplePropertyValue('', 'date')).toBe(expected);
    expect(inferSimplePropertyType(expected)).toBe('date');
  });
  it('parses editable properties without exposing complex YAML', () => {
    const markdown = '---\ntipo: pagina\nestado: DRAFT\ntags:\n  - docs\n---\n\n# Body';

    expect(parseSimpleFrontmatter(markdown)).toEqual([
      { key: 'tipo', value: 'pagina' },
      { key: 'estado', value: 'DRAFT' },
    ]);
  });

  it('parses JSON-compatible string lists as editable values', () => {
    const markdown = '---\ntags: ["docs", "guide"]\nlabels: []\n---\n\n# Body';

    expect(parseSimpleFrontmatter(markdown)).toEqual([
      { key: 'tags', value: '["docs", "guide"]' },
      { key: 'labels', value: '[]' },
    ]);
  });

  it.each([
    ['DRAFT', 'DRAFT'], ['IN_REVIEW', 'IN_REVIEW'], ['PUBLISHED', 'PUBLISHED'], ['ARCHIVED', 'ARCHIVED'],
    ['borrador', 'DRAFT'], ['', 'DRAFT'], [undefined, 'DRAFT'],
  ])('normalizes editorial status %s to %s', (value, expected) => {
    expect(normalizeEditorialStatus(value)).toBe(expected);
  });

  it('edits and adds properties while preserving the body and complex blocks', () => {
    const markdown = '---\ntipo: pagina\nestado: DRAFT\ncustom: keep\ntags:\n  - docs\n---\n\n# Body';

    const updated = updateSimpleFrontmatterProperty(markdown, 'tipo', 'nota');
    const withOwner = updateSimpleFrontmatterProperty(updated, 'owner', 'GEM');

    expect(withOwner).toContain('tipo: nota');
    expect(withOwner).toContain('tags:\n  - docs');
    expect(withOwner).toContain('owner: GEM');
    expect(withOwner.endsWith('# Body')).toBe(true);
    expect(withOwner).toContain('custom: keep');
  });

  it('removes only a supported property and keeps the document body', () => {
    const markdown = '---\ntipo: pagina\ntags:\n  - docs\n---\n\n# Body';

    const updated = removeSimpleFrontmatterProperty(markdown, 'tipo');

    expect(updated).not.toContain('tipo:');
    expect(updated).toContain('tags:\n  - docs');
    expect(updated.endsWith('# Body')).toBe(true);
  });

  it('updates, adds, and removes JSON-compatible string lists safely', () => {
    const markdown = '---\ntags: ["docs"]\nowner: GEM\n---\n\n# Body';

    const updated = updateSimpleFrontmatterProperty(markdown, 'tags', '["docs", "guide"]');
    const added = updateSimpleFrontmatterProperty(updated, 'labels', '["internal"]');

    expect(added).toContain('tags: ["docs", "guide"]');
    expect(added).toContain('labels: ["internal"]');
    expect(updateSimpleFrontmatterProperty(added, 'tags', '[invalid')).toBe(added);
    expect(removeSimpleFrontmatterProperty(added, 'tags')).not.toContain('tags:');
  });
});
