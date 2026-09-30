import { $prose } from '@milkdown/utils';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import type { EditorView, NodeView } from '@milkdown/prose/view';
import type { Node as ProseMirrorNode } from '@milkdown/prose/model';

export type GooglePreviewType = 'Docs' | 'Sheets' | 'Drive';
export interface GooglePreview { type: GooglePreviewType; url: string; }

export function classifyGoogleUrl(value: string): GooglePreview | null {
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  if (url.hostname === 'drive.google.com') return { type: 'Drive', url: value };
  if (url.hostname !== 'docs.google.com') return null;
  const [section] = url.pathname.split('/').filter(Boolean);
  if (section === 'document') return { type: 'Docs', url: value };
  if (section === 'spreadsheets') return { type: 'Sheets', url: value };
  if (section === 'drive') return { type: 'Drive', url: value };
  return null;
}

/** A preview is only valid when the whole link label is its canonical URL. */
export function isDirectGoogleLink(label: string, href: string): GooglePreview | null {
  const preview = classifyGoogleUrl(href);
  return preview && label === href ? preview : null;
}

function directPreview(node: ProseMirrorNode): GooglePreview | null {
  if (node.type.name !== 'paragraph' || node.childCount !== 1) return null;
  const text = node.firstChild;
  if (!text?.isText || text.marks.length !== 1 || text.marks[0].type.name !== 'link') return null;
  return isDirectGoogleLink(text.text ?? '', String(text.marks[0].attrs['href'] ?? ''));
}

function previewCard(preview: GooglePreview): HTMLElement {
  const card = document.createElement('aside');
  card.className = 'gem-google-preview';
  card.contentEditable = 'false';
  card.setAttribute('aria-label', `Vista previa de Google ${preview.type}`);
  const icon = document.createElement('span');
  icon.className = `gem-google-preview-icon gem-google-preview-icon-${preview.type.toLowerCase()}`;
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = preview.type === 'Docs' ? 'D' : preview.type === 'Sheets' ? 'S' : '▶';
  const details = document.createElement('span');
  details.className = 'gem-google-preview-details';
  const label = document.createElement('span');
  label.className = 'gem-google-preview-type';
  label.textContent = `Google ${preview.type}`;
  const domain = document.createElement('span');
  domain.className = 'gem-google-preview-domain';
  domain.textContent = new URL(preview.url).hostname;
  const action = document.createElement('a');
  action.className = 'gem-google-preview-open';
  action.href = preview.url;
  action.target = '_blank';
  action.rel = 'noopener noreferrer';
  action.textContent = 'Abrir';
  details.append(label, domain);
  card.append(icon, details, action);
  return card;
}

function paragraphNodeView(node: ProseMirrorNode, _view: EditorView): NodeView {
  const dom = document.createElement('p');
  const contentDOM = document.createElement('span');
  let preview = directPreview(node);
  dom.className = preview ? 'gem-google-preview-paragraph' : '';
  if (preview) dom.append(previewCard(preview));
  dom.append(contentDOM);
  return {
    dom,
    contentDOM,
    update(next) {
      const nextPreview = directPreview(next);
      if (next.type !== node.type || nextPreview?.url !== preview?.url || nextPreview?.type !== preview?.type) return false;
      node = next;
      preview = nextPreview;
      return true;
    },
    stopEvent: (event) => event.target instanceof HTMLAnchorElement,
    ignoreMutation: (mutation) => mutation.type === 'selection',
  };
}

const googlePreviewPluginKey = new PluginKey('gem-google-preview');

export const googlePreviewPlugin = $prose(() => new Plugin({
  key: googlePreviewPluginKey,
  props: { nodeViews: { paragraph: paragraphNodeView } },
}));
