import { $prose } from '@milkdown/kit/utils';
import { EditorState, Plugin, PluginKey, TextSelection } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';

export type MentionKind = 'user' | 'event' | 'page';
export interface MentionItem {
  id: string;
  label: string;
  description?: string;
  kind: MentionKind;
}
export interface MentionAttrs {
  kind: MentionKind;
  id: string;
  label: string;
  display: string;
}

const syntax = /@usuario:([^\s]+)|@evento:([^\s]+)|\[\[([^|\]\s]+)\|([^\]]+)\]\]/g;

const serializedMention = (attrs: MentionAttrs): string =>
  attrs.kind === 'user' ? `@usuario:${attrs.id}` : attrs.kind === 'event' ? `@evento:${attrs.id}` : `[[${attrs.id}|${attrs.label}]]`;

const matchAttrs = (value: string, fallbackLabel = ''): MentionAttrs | undefined => {
  const match = /^(?:@usuario:([^\s]+)|@evento:([^\s]+)|\[\[([^|\]\s]+)\|([^\]]+)\]\])$/.exec(value);
  if (!match) return undefined;
  const kind: MentionKind = match[1] ? 'user' : match[2] ? 'event' : 'page';
  const id = match[1] ?? match[2] ?? match[3] ?? '';
  const display = match[4] ?? fallbackLabel ?? id;
  return { kind, id, label: display, display };
};

// Crepe owns the schema and markdown parser. Registering an atom here makes
// existing mention syntax parse as an unknown/empty node, so the editor can
// display only the prefix. Keep mentions as decorated text until Crepe exposes
// a supported schema extension point.

const textRanges = (state: EditorState): Array<{ from: number; to: number; attrs: MentionAttrs }> => {
  const ranges: Array<{ from: number; to: number; attrs: MentionAttrs }> = [];
  state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    syntax.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = syntax.exec(node.text))) {
      const value = match[0];
      const attrs = matchAttrs(value);
      if (attrs) ranges.push({ from: pos + match.index, to: pos + match.index + value.length, attrs });
    }
  });
  return ranges;
};

const mentionPluginKey = new PluginKey('gem-docs-mentions');
const decorations = (state: EditorState, getItems: () => MentionItem[]): DecorationSet =>
  DecorationSet.create(state.doc, textRanges(state).flatMap((range) => {
    const item = getItems().find((candidate) => candidate.kind === range.attrs.kind && candidate.id === range.attrs.id);
    const label = item?.label ?? range.attrs.label;
    return [
      Decoration.inline(range.from, range.to, { class: 'gem-mention-source' }),
      Decoration.widget(range.from, () => {
        const element = document.createElement('span');
        element.className = `gem-mention-label gem-mention-label-${range.attrs.kind}`;
        element.dataset['mentionKind'] = range.attrs.kind;
        element.dataset['mentionId'] = range.attrs.id;
        element.setAttribute('role', 'link');
        element.setAttribute('tabindex', '0');
        element.setAttribute('aria-label', label);
        element.textContent = label;
        return element;
      }),
    ];
  }));

const mentionRangeAt = (state: EditorState, pos: number, key: string): { from: number; to: number } | undefined => {
  const ranges = textRanges(state);
  return ranges.find((range) => key === 'Backspace' ? range.to === pos : range.from === pos);
};

export const mentionPlugin = (
  getItems: () => MentionItem[],
  onOpen: (item: MentionItem) => void,
  getItemsVersion: () => number,
) =>
  $prose(() => new Plugin({
    key: mentionPluginKey,
    state: {
       init: (_, state) => decorations(state, getItems),
       apply: (transaction, decorationSet, _oldState, newState) => transaction.docChanged || transaction.getMeta(mentionPluginKey) === 'refresh'
         ? decorations(newState, getItems)
         : decorationSet,
    },
    props: {
      decorations: (state) => mentionPluginKey.getState(state) ?? DecorationSet.empty,
      handleClick: (_view, _pos, event) => {
        const element = (event.target as HTMLElement).closest<HTMLElement>('.gem-mention-label');
        const kind = element?.dataset['mentionKind'] as MentionKind | undefined;
        const id = element?.dataset['mentionId'];
        const item = kind && id ? getItems().find((candidate) => candidate.kind === kind && candidate.id === id) : undefined;
        if (!item) return false;
        onOpen(item);
        return true;
      },
      handleKeyDown: (view, event) => {
        const { from, to } = view.state.selection;
        const range = mentionRangeAt(view.state, from, event.key);
        if (range && (event.key === 'Backspace' || event.key === 'Delete')) {
          event.preventDefault();
          view.dispatch(view.state.tr.delete(range.from, range.to));
          return true;
        }
        const handler = (view.dom as HTMLElement & { mentionKeydown?: (event: KeyboardEvent) => void }).mentionKeydown;
        if (!handler) return false;
        handler(event);
        return event.defaultPrevented;
      },
    },
    view: (view) => {
      let popup: HTMLDivElement | undefined;
      let currentItems: MentionItem[] = [];
      let selected = 0;
       let replacement: { from: number; to: number } | undefined;
       let itemsVersion = getItemsVersion();
       const refreshTimer = window.setInterval(() => {
         if (getItemsVersion() === itemsVersion) return;
         itemsVersion = getItemsVersion();
         view.dispatch(view.state.tr.setMeta(mentionPluginKey, 'refresh'));
       }, 100);
      const remove = () => {
        popup?.remove();
        popup = undefined;
        replacement = undefined;
      };
      const refreshActiveOption = () => {
        popup?.querySelectorAll<HTMLButtonElement>('[role="option"]').forEach((button, index) => {
          const active = index === selected;
          button.classList.toggle('gem-mention-option-active', active);
          button.setAttribute('aria-selected', String(active));
        });
      };
      const keydown = (event: KeyboardEvent) => {
        if (!popup || !currentItems.length) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          selected = (selected + (event.key === 'ArrowDown' ? 1 : -1) + currentItems.length) % currentItems.length;
          refreshActiveOption();
        } else if ((event.key === 'Enter' || event.key === 'Tab') && currentItems[selected]) {
          event.preventDefault();
          popup.querySelectorAll<HTMLButtonElement>('[role="option"]')[selected]?.click();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          remove();
        }
      };
      (view.dom as HTMLElement & { mentionKeydown?: (event: KeyboardEvent) => void }).mentionKeydown = keydown;
       const update = () => {
        const { from } = view.state.selection;
        const before = view.state.doc.textBetween(Math.max(0, from - 80), from, '\n', '\n');
        const match = /(?:^|\s)(@([^\s]*)|#([^\s]*)|\[\[([^\s\]]*))$/.exec(before);
        if (!match) { remove(); return; }
        const kind: MentionKind = match[1].startsWith('@') ? 'user' : match[1].startsWith('#') ? 'event' : 'page';
        const query = match[2] ?? match[3] ?? match[4] ?? '';
        const start = from - match[1].length;
        const nextItems = getItems().filter((item) => item.kind === kind && `${item.label} ${item.description ?? ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
        remove();
        currentItems = nextItems;
        replacement = { from: start, to: from };
        selected = 0;
        if (!currentItems.length) return;
        popup = document.createElement('div');
        popup.className = 'gem-mention-popup';
        popup.setAttribute('role', 'listbox');
        currentItems.forEach((item, index) => {
          const button = document.createElement('button');
          button.type = 'button';
          const label = document.createElement('span');
          label.textContent = item.label;
          button.appendChild(label);
          if (item.description) {
            const description = document.createElement('small');
            description.textContent = item.description;
            button.appendChild(description);
          }
          button.setAttribute('role', 'option');
          button.setAttribute('aria-selected', index === selected ? 'true' : 'false');
          button.id = `gem-mention-option-${kind}-${index}`;
          button.classList.toggle('gem-mention-option-active', index === selected);
          button.addEventListener('mousedown', (event) => event.preventDefault());
          button.addEventListener('click', () => {
            if (!replacement) return;
            const attrs: MentionAttrs = { kind: item.kind, id: item.id, label: item.label, display: item.label };
            const value = serializedMention(attrs);
            const transaction = view.state.tr.insertText(value, replacement.from, replacement.to);
            transaction.setSelection(TextSelection.create(transaction.doc, replacement.from + value.length));
            view.dispatch(transaction);
            remove();
          });
          popup?.appendChild(button);
        });
        const coords = view.coordsAtPos(from);
        popup.style.left = `${coords.left}px`;
        popup.style.top = `${coords.bottom + 4}px`;
        document.body.appendChild(popup);
       };
       update();
       return {
         update: () => {
           update();
           if (getItemsVersion() !== itemsVersion) {
             itemsVersion = getItemsVersion();
             view.dispatch(view.state.tr.setMeta(mentionPluginKey, 'refresh'));
           }
         },
         destroy: () => {
           window.clearInterval(refreshTimer);
           delete (view.dom as HTMLElement & { mentionKeydown?: unknown }).mentionKeydown;
          remove();
        },
      };
    },
  }));

export const mentionSyntaxAttrs = matchAttrs;
