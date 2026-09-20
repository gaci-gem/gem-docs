import { describe, expect, it, vi } from 'vitest';
import { eventSuggestionItems, filterSuggestionItems, selectSuggestionItem, userSuggestionItems } from './suggestions';
import { isDocumentReference, markdownTokenizer, parseMarkdown, referenceCatalogKey, referenceColorFor, referenceHTMLAttributes, referenceLabelFor, referenceText, renderMarkdown } from './reference-node';
import MarkdownIt from 'markdown-it';

describe('editor references', () => {
  const items = [
    { id: '1', label: 'Ana Rossi', description: '@arossi' },
    { id: '2', label: 'Backend API', description: 'CAS-002' },
  ];

  it('returns first items for an empty query and filters label or description', () => {
    expect(filterSuggestionItems(items, '')).toEqual(items);
    expect(filterSuggestionItems(items, 'api')).toEqual([items[1]]);
    expect(filterSuggestionItems(items, '@AR')).toEqual([items[0]]);
  });

  it('serializes references with stable IDs and visible labels', () => {
    expect(referenceText({ referenceType: 'user', id: 'u-1', label: 'Ana Rossi' })).toBe('@usuario:u-1');
    expect(referenceText({ referenceType: 'event', id: 'e-1', label: 'CAS-002' })).toBe('@evento:e-1');
    expect(referenceText({ referenceType: 'doc', id: 'd-1', label: 'Manual' })).toBe('[[d-1|Manual]]');
  });

  it('round-trips stable Markdown references through tiptap-markdown hooks', () => {
    const markdown = new MarkdownIt({ html: false });
    parseMarkdown(markdown);
    parseMarkdown(markdown);

    expect(markdown.render('@usuario:u-1 @evento:e-1 [[d-1|Manual]]')).toContain(
      '<span class="editor-reference" data-reference-type="user" data-reference-id="u-1">u-1</span>',
    );
    expect(markdown.render('@usuario:u-1 @evento:e-1 [[d-1|Manual]]')).toContain(
      '<span class="editor-reference" data-reference-type="doc" data-reference-id="d-1">Manual</span>',
    );

    const write = vi.fn();
    renderMarkdown(
      { write } as unknown as import('prosemirror-markdown').MarkdownSerializerState,
      { attrs: { referenceType: 'doc', id: 'd-1', label: 'Manual' } },
    );
    expect(write).toHaveBeenCalledWith('[[d-1|Manual]]');
    expect(markdownTokenizer).toBeTypeOf('function');
  });

  it('uses the document reference marker that the editor click handler navigates', () => {
    expect(isDocumentReference('doc', 'd-1')).toBe(true);
    expect(isDocumentReference('user', 'd-1')).toBe(false);
  });

  it('keeps labels isolated by reference type when IDs collide', () => {
    expect(referenceCatalogKey('user', 'same-id')).not.toBe(referenceCatalogKey('event', 'same-id'));
    expect(referenceCatalogKey('event', 'same-id')).not.toBe(referenceCatalogKey('doc', 'same-id'));
  });

  it('resolves a label when its catalog arrives after the content', () => {
    const labels = new Map<string, string>();
    const reference = { referenceType: 'event' as const, id: 'closed-event' };

    expect(referenceLabelFor(labels, reference)).toBeUndefined();
    labels.set(referenceCatalogKey('event', 'closed-event'), 'Evento cerrado');
    expect(referenceLabelFor(labels, reference)).toBe('Evento cerrado');
  });

  it('turns loaded events into event suggestions', () => {
    expect(eventSuggestionItems([{
      id: 'event-1',
      tipoCodigo: 'CAS',
       numero: 2,
       titulo: 'Actualizar backend',
       tipo: { color: '#2563eb' },
    } as import('@core/interfaces/evento').Evento])).toEqual([{
      id: 'event-1',
      label: '#Actualizar backend',
       description: 'CAS-002',
       color: '#2563eb',
    }]);
  });

  it('keeps colors only for user and event references', () => {
    expect(referenceColorFor('user', '#2f855a')).toBe('#2f855a');
    expect(referenceColorFor('event', '#2563eb')).toBe('#2563eb');
    expect(referenceColorFor('doc', '#ef4444')).toBeUndefined();
  });

  it('renders colored attributes for users and events, never for documents', () => {
    expect(referenceHTMLAttributes('user', 'u-1', '#2f855a')).toEqual({
      'data-reference-type': 'user',
      'data-reference-id': 'u-1',
      'data-reference-color': '#2f855a',
      style: '--reference-color: #2f855a',
    });
    expect(referenceHTMLAttributes('event', 'e-1', '#2563eb')['data-reference-color']).toBe('#2563eb');
    expect(referenceHTMLAttributes('doc', 'd-1', '#ef4444')).toEqual({
      'data-reference-type': 'doc',
      'data-reference-id': 'd-1',
    });
  });

  it('turns loaded users into prefixed suggestions and carries their color', () => {
    expect(userSuggestionItems([{
      id: 'user-1',
      nombre: 'Ana',
      apellido: 'Rossi',
      usuario: 'arossi',
      email: 'ana@example.com',
      color: '#2f855a',
    }])).toEqual([{
      id: 'user-1',
      label: '@Ana Rossi',
      description: '@arossi',
      color: '#2f855a',
    }]);
  });

  it('selects suggestions with Tab but leaves Enter to the editor', () => {
    const command = vi.fn();
    const item = { id: 'event-1', label: 'Actualizar backend' };
    const enter = { key: 'Enter', defaultPrevented: false, preventDefault: vi.fn() } as unknown as KeyboardEvent;
    expect(selectSuggestionItem(command, item, enter)).toBe(false);
    expect(enter.preventDefault).not.toHaveBeenCalled();

    const tab = { key: 'Tab', defaultPrevented: false, preventDefault: vi.fn() } as unknown as KeyboardEvent;

    expect(selectSuggestionItem(command, item, tab)).toBe(true);
    expect(tab.preventDefault).toHaveBeenCalled();
    expect(command).toHaveBeenCalledWith(item);
  });
});
