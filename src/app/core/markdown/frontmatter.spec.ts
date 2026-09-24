import {
  parseSimpleFrontmatter,
  removeSimpleFrontmatterProperty,
  updateSimpleFrontmatterProperty,
} from './frontmatter';
import { describe, expect, it } from 'vitest';

describe('simple frontmatter helpers', () => {
  it('parses editable properties without exposing complex YAML', () => {
    const markdown = '---\ntipo: pagina\nestado: borrador\ntags:\n  - docs\n---\n\n# Body';

    expect(parseSimpleFrontmatter(markdown)).toEqual([
      { key: 'tipo', value: 'pagina' },
      { key: 'estado', value: 'borrador' },
    ]);
  });

  it('edits and adds properties while preserving the body and complex blocks', () => {
    const markdown = '---\ntipo: pagina\ntags:\n  - docs\n---\n\n# Body';

    const updated = updateSimpleFrontmatterProperty(markdown, 'tipo', 'nota');
    const withOwner = updateSimpleFrontmatterProperty(updated, 'owner', 'GEM');

    expect(withOwner).toContain('tipo: nota');
    expect(withOwner).toContain('tags:\n  - docs');
    expect(withOwner).toContain('owner: GEM');
    expect(withOwner.endsWith('# Body')).toBe(true);
  });

  it('removes only a supported property and keeps the document body', () => {
    const markdown = '---\ntipo: pagina\ntags:\n  - docs\n---\n\n# Body';

    const updated = removeSimpleFrontmatterProperty(markdown, 'tipo');

    expect(updated).not.toContain('tipo:');
    expect(updated).toContain('tags:\n  - docs');
    expect(updated.endsWith('# Body')).toBe(true);
  });
});
