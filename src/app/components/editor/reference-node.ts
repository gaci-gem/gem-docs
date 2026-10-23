import { Node, mergeAttributes } from '@tiptap/core';
import type MarkdownIt from 'markdown-it';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline';
import type Token from 'markdown-it/lib/token';
import type { MarkdownSerializerState } from 'prosemirror-markdown';

export type ReferenceType = 'user' | 'event' | 'doc';

export interface ReferenceAttrs {
  referenceType: ReferenceType;
  id: string;
  label: string;
  color?: string;
}

export const referenceCatalogKey = (referenceType: ReferenceType, id: string): string => `${referenceType}:${id}`;

export const referenceLabelFor = (
  labels: ReadonlyMap<string, string>,
  attrs: Pick<ReferenceAttrs, 'referenceType' | 'id'>,
): string | undefined => labels.get(referenceCatalogKey(attrs.referenceType, attrs.id));

const safeReferenceColor = (color: string | undefined): string | undefined => {
  if (!color || !/^(?:#[0-9a-f]{3,8}|rgba?\([^()]+\)|hsla?\([^()]+\)|[a-z]+)$/i.test(color.trim())) return undefined;
  return color.trim();
};

export const referenceColorFor = (referenceType: ReferenceType, color: string | undefined): string | undefined =>
  referenceType === 'user' || referenceType === 'event' ? safeReferenceColor(color) : undefined;

export const referenceHTMLAttributes = (referenceType: ReferenceType, id: string, color?: string): Record<string, string> => {
  const safeColor = referenceColorFor(referenceType, color);
  return {
    'data-reference-type': referenceType,
    'data-reference-id': id,
    ...(safeColor ? { 'data-reference-color': safeColor, style: `--reference-color: ${safeColor}` } : {}),
  };
};

export const referenceText = (attrs: ReferenceAttrs): string => {
  const prefix = attrs.referenceType === 'user' ? '@usuario:' : attrs.referenceType === 'event' ? '@evento:' : '[[';
  return attrs.referenceType === 'doc'
    ? `${prefix}${attrs.id}|${attrs.label}]]`
    : `${prefix}${attrs.id}`;
};

export const isDocumentReference = (referenceType: string | undefined, id: string | undefined): id is string => referenceType === 'doc' && !!id;

const referencePattern = /^(?:@usuario:([^\s]+)|@evento:([^\s]+)|\[\[([^|\]\s]+)\|([^\]]+)\]\])/;
const configuredMarkdown = new WeakSet<MarkdownIt>();

/** Serializes a reference node through tiptap-markdown's node serializer API. */
export const renderMarkdown = (state: MarkdownSerializerState, node: { attrs: ReferenceAttrs }): void => {
  state.write(referenceText(node.attrs));
};

/** markdown-it inline rule for the stable persisted reference formats. */
export const markdownTokenizer = (state: StateInline, silent: boolean): boolean => {
  const previous = state.src[state.pos - 1];
  if (state.pos > 0 && previous && !/\s/.test(previous)) return false;

  const match = referencePattern.exec(state.src.slice(state.pos));
  if (!match) return false;
  if (silent) return true;

  const type: ReferenceType = match[1] ? 'user' : match[2] ? 'event' : 'doc';
  const id = match[1] ?? match[2] ?? match[3];
  const label = match[4] ?? match[1] ?? match[2] ?? '';
  const token = state.push('reference', 'span', 0);
  token.attrSet('data-reference-type', type);
  token.attrSet('data-reference-id', id);
  token.attrSet('data-reference-label', label);
  token.content = label;
  state.pos += match[0].length;
  return true;
};

/** Installs the tokenizer and HTML renderer used by tiptap-markdown's parser. */
export const parseMarkdown = (markdownit: MarkdownIt): void => {
  if (configuredMarkdown.has(markdownit)) return;
  configuredMarkdown.add(markdownit);
  markdownit.inline.ruler.before('text', 'reference', markdownTokenizer);
  markdownit.renderer.rules['reference'] = (tokens: Token[], index: number) => {
    const token = tokens[index];
    const type = token.attrGet('data-reference-type') ?? '';
    const id = token.attrGet('data-reference-id') ?? '';
    const label = token.attrGet('data-reference-label') ?? token.content;
    return `<span class="editor-reference" data-reference-type="${markdownit.utils.escapeHtml(type)}" data-reference-id="${markdownit.utils.escapeHtml(id)}">${markdownit.utils.escapeHtml(label)}</span>`;
  };
};

export const ReferenceNode = Node.create({
  name: 'reference',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,
  addAttributes() {
    return {
      referenceType: {
        default: 'doc',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-reference-type') ?? element.getAttribute('referenceType') ?? 'doc',
      },
      id: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-reference-id') ?? element.getAttribute('id') ?? '',
      },
      label: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-reference-label') ?? element.textContent ?? '',
      },
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-reference-color') ?? null,
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-reference-type]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const referenceType = HTMLAttributes['referenceType'] as ReferenceType;
    return [
      'span',
      mergeAttributes({ class: 'editor-reference' }, referenceHTMLAttributes(referenceType, HTMLAttributes['id'], HTMLAttributes['color'])),
      HTMLAttributes['label'],
    ];
  },
  addStorage() {
    return {
      markdown: {
        serialize: renderMarkdown,
        parse: { setup: parseMarkdown },
      },
    };
  },
  renderText({ node }) {
    return referenceText(node.attrs as ReferenceAttrs);
  },
});
