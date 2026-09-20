import { ApplicationRef, createComponent, EnvironmentInjector, ComponentRef } from '@angular/core';
import { Editor, Range } from '@tiptap/core';
import Suggestion, { SuggestionProps, SuggestionKeyDownProps, findSuggestionMatch } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import { Evento } from '@core/interfaces/evento';
import { Usuario } from '@core/interfaces/usuario';
import { Doc } from '@core/interfaces/doc';
import { ReferenceType } from './reference-node';
import { SuggestionListComponent } from './suggestion-list.component';

export interface ReferenceSuggestionItem {
  id: string;
  label: string;
  description?: string;
  color?: string;
}

export const selectSuggestionItem = (
  command: (item: ReferenceSuggestionItem) => void,
  item: ReferenceSuggestionItem | undefined,
  event: KeyboardEvent,
): boolean => {
  if (!item || event.key !== 'Tab') return false;
  event.preventDefault();
  command(item);
  return true;
};

export const filterSuggestionItems = (items: ReferenceSuggestionItem[], query: string): ReferenceSuggestionItem[] => {
  const normalized = query.trim().toLocaleLowerCase();
  return items.filter((item) => !normalized || `${item.label} ${item.description ?? ''}`.toLocaleLowerCase().includes(normalized)).slice(0, 8);
};

export const userSuggestionItems = (users: Usuario[]): ReferenceSuggestionItem[] => users.flatMap((user) => user.id ? [{ id: user.id, label: `@${`${user.nombre} ${user.apellido}`.trim() || user.usuario}`, description: `@${user.usuario}`, color: user.color || undefined }] : []);
export const eventSuggestionItems = (events: Evento[]): ReferenceSuggestionItem[] => events.flatMap((event) => event.id ? [{ id: event.id, label: `#${event.titulo}`, description: `${event.tipoCodigo}-${String(event.numero).padStart(3, '0')}`, color: event.tipo?.color || undefined }] : []);
export const docSuggestionItems = (docs: Doc[]): ReferenceSuggestionItem[] => docs.map((doc) => ({ id: doc.id, label: doc.titulo }));

type ItemLoader = () => ReferenceSuggestionItem[];
type ReferenceCommand = (editor: Editor, range: Range, item: ReferenceSuggestionItem, type: ReferenceType) => void;

const doubleBracketMatch = (config: Parameters<typeof findSuggestionMatch>[0]) => {
  const node = config.$position.nodeBefore;
  if (!node?.isText || !node.text) return null;
  const match = /(?:^|\s)\[\[([^\s\]]*)$/.exec(node.text);
  if (!match || match.index === undefined) return null;
  const from = config.$position.pos - node.text.length + match.index + match[0].length - match[1].length - 2;
  return { range: { from, to: config.$position.pos }, query: match[1], text: match[0].slice(match[0].length - match[1].length - 2) };
};

export const createSuggestionPlugin = (options: {
  editor: Editor;
  char: string;
  type: ReferenceType;
  pluginKey: string;
  loadItems: ItemLoader;
  command: ReferenceCommand;
  appRef: ApplicationRef;
  environmentInjector: EnvironmentInjector;
  doubleBracket?: boolean;
}) => {
  let component: ComponentRef<SuggestionListComponent> | undefined;
  let unmount: (() => void) | undefined;
  let activeProps: SuggestionProps<ReferenceSuggestionItem> | undefined;
  let selected = 0;

  const position = (props: SuggestionProps<ReferenceSuggestionItem>): void => {
    const rect = props.clientRect?.();
    if (!component || !rect) return;
    const element = component.location.nativeElement;
    element.style.position = 'fixed';
    element.style.left = `${Math.max(8, rect.left)}px`;
    element.style.top = `${Math.min(window.innerHeight - 8, rect.bottom + 6)}px`;
    element.style.zIndex = '1000';
  };

  const render = () => ({
    onStart: (props: SuggestionProps<ReferenceSuggestionItem>) => {
      activeProps = props;
      component = createComponent(SuggestionListComponent, { environmentInjector: options.environmentInjector });
      options.appRef.attachView(component.hostView);
      component.instance.select.subscribe((item) => props.command(item));
      component.setInput('items', props.items);
      component.setInput('selectedId', props.items[0]?.id ?? null);
      document.body.appendChild(component.location.nativeElement);
      unmount = () => component?.location.nativeElement.remove();
      position(props);
      selected = 0;
    },
    onUpdate: (props: SuggestionProps<ReferenceSuggestionItem>) => {
      activeProps = props;
      if (!component) return;
      component.setInput('items', props.items);
      selected = Math.min(selected, Math.max(0, props.items.length - 1));
      component.setInput('selectedId', props.items[selected]?.id ?? null);
      position(props);
    },
    onKeyDown: ({ event }: SuggestionKeyDownProps) => {
      const items = component?.instance.items() ?? [];
      if (event.key === 'ArrowDown') { selected = Math.min(selected + 1, items.length - 1); component?.setInput('selectedId', items[selected]?.id ?? null); return true; }
      if (event.key === 'ArrowUp') { selected = Math.max(selected - 1, 0); component?.setInput('selectedId', items[selected]?.id ?? null); return true; }
      if (event.key === 'Tab' && items[selected] && activeProps) {
        return selectSuggestionItem(activeProps.command, items[selected], event);
      }
      return false;
    },
    onExit: () => {
      activeProps = undefined;
      unmount?.();
      unmount = undefined;
      if (component) { options.appRef.detachView(component.hostView); component.destroy(); component = undefined; }
    },
  });

  return Suggestion<ReferenceSuggestionItem, ReferenceSuggestionItem>({
    editor: options.editor,
    char: options.char,
    pluginKey: new PluginKey(options.pluginKey),
    allowedPrefixes: [' ', '\n'],
    findSuggestionMatch: options.doubleBracket ? doubleBracketMatch : undefined,
    items: ({ query }) => filterSuggestionItems(options.loadItems(), query),
    command: ({ editor, range, props }) => options.command(editor, range, props, options.type),
    render,
  });
};
