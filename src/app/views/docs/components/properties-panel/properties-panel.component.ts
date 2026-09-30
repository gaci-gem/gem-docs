import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  EDITORIAL_STATUSES,
  convertSimplePropertyValue,
  inferSimplePropertyType,
  normalizeEditorialStatus,
  parseSimpleFrontmatter,
  parseStringList,
  removeSimpleFrontmatterProperty,
  serializeStringList,
  SimplePropertyType,
  updateSimpleFrontmatterProperty,
} from '@core/markdown/frontmatter';
import { parseSimpleFrontmatter as parseDocumentFrontmatter } from '@core/markdown/frontmatter';
import { expandSuggestionValue, filterCatalogSuggestions, filterSelectSuggestions, PropertyDocument, selectSuggestions, shouldOpenSuggestions } from './select-suggestions';
import { PropertyValueCatalogEntry, PropertyValueCatalogService } from '@core/services/property-value-catalog.service';
import { forkJoin } from 'rxjs';

interface PropertyRow {
  key: string;
  value: string;
  editorial: boolean;
  type: SimplePropertyType;
  values: string[];
}

export type { PropertyDocument } from './select-suggestions';
export { selectSuggestions } from './select-suggestions';

export function replaceSelectValue(value: string): string {
  return value.trim();
}

@Component({
  selector: 'app-properties-panel',
  imports: [ReactiveFormsModule],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown)': 'onDocumentKeydown($event)',
    '(document:pointermove)': 'onPointerMove($event)',
    '(document:pointerup)': 'onPointerUp()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './properties-panel.component.html',
  styleUrl: './properties-panel.component.scss',
})
export class PropertiesPanelComponent {
  markdown = input('');
  markdownChange = output<string>();
  documents = input<PropertyDocument[]>([]);
  spaceId = input('');
  close = output<void>();

  protected readonly rows = signal<PropertyRow[]>([]);
  protected readonly newKey = new FormControl('', { nonNullable: true });
  protected readonly newValue = new FormControl('', { nonNullable: true });
  protected readonly addingProperty = signal(false);
  protected readonly panelWidth = signal(340);
  protected readonly openTypeMenu = signal<string | null>(null);
  protected readonly openSuggestions = signal<string | null>(null);
  protected readonly selectedSuggestion = signal(0);
  protected readonly catalog = signal<PropertyValueCatalogEntry[]>([]);
  protected readonly listInputs: Record<string, FormControl<string>> = {};
  protected readonly keyInputs: Record<string, FormControl<string>> = {};
  protected readonly editorialStatuses = EDITORIAL_STATUSES;
  private controls: Record<string, FormControl<string>> = {};
  /** Markdown has no type annotation for an empty scalar, so retain the user's UI choice locally. */
  private readonly preferredTypes = new Map<string, SimplePropertyType>();
  private readonly catalogService = inject(PropertyValueCatalogService);
  private resizing = false;
  private resizeStartX = 0;
  private resizeStartWidth = 340;
  protected readonly suggestions = computed(() => {
    const docs = this.documents();
    return (key: string, value: string) => this.catalogSuggestions(key, value, docs);
  });

  private catalogSuggestions(key: string, value: string, docs: PropertyDocument[]): string[] {
    const catalog = filterCatalogSuggestions(this.catalog(), key, '');
    const fallback = catalog.length ? [] : selectSuggestions(key, docs, value, this.markdown());
    return [...new Set([...fallback, ...catalog, ...expandSuggestionValue(value)].filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  protected filteredSuggestions(key: string): string[] {
    const value = this.listInputFor(key).value;
    return filterSelectSuggestions(this.catalogSuggestions(key, this.rowValue(key), this.documents()), value);
  }

  protected chipStyle(key: string, value: string): Record<string, string> {
    const color = this.catalog().find((entry) => entry.propertyKey === key && entry.value === value)?.color;
    if (!color) return {};
    const hex = color.slice(1);
    const rgb = hex.length === 3 ? hex.split('').map((part) => Number.parseInt(part + part, 16)) : [0, 1, 2].map((index) => Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16));
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return { 'background-color': color, color: luminance > 0.55 ? '#111827' : '#ffffff' };
  }

  private rowValue(key: string): string { return this.rows().find((row) => row.key === key)?.value ?? ''; }

  constructor() {
    effect(() => {
      const spaceId = this.spaceId();
      const keys = this.rows().filter((row) => row.type === 'select' || row.type === 'list').map((row) => row.key);
      if (!spaceId || !keys.length) { this.catalog.set([]); return; }
      this.catalogService.list(spaceId).subscribe((entries) => this.catalog.set(entries));
    });
    effect(() => {
      const parsed = parseSimpleFrontmatter(this.markdown());
      const byKey = new Map(parsed.map((property) => [property.key, property.value]));
      const ordered = ['tipo', 'estado', ...parsed.map((property) => property.key)];
      const uniqueKeys = [...new Set(ordered)];
      this.controls = Object.fromEntries(
        uniqueKeys.map((key) => [key, new FormControl(
          key === 'estado' ? normalizeEditorialStatus(byKey.get(key)) : byKey.get(key) ?? '',
          { nonNullable: true },
        )]),
      );
      this.rows.set(uniqueKeys.map((key) => ({
        key,
        value: key === 'estado' ? normalizeEditorialStatus(byKey.get(key)) : byKey.get(key) ?? '',
        editorial: key === 'tipo' || key === 'estado',
        type: inferSimplePropertyType(byKey.get(key) ?? '', this.preferredTypes.get(key)),
        values: parseStringList(byKey.get(key) ?? '') ?? [],
      })));
    });
  }

  protected controlFor(key: string): FormControl<string> {
    return this.controls[key] ?? new FormControl('', { nonNullable: true });
  }

  protected updateProperty(key: string): void {
    this.markdownChange.emit(updateSimpleFrontmatterProperty(this.markdown(), key, this.controlFor(key).value));
  }

  protected updateCheckbox(key: string, event: Event): void {
    this.controlFor(key).setValue((event.target as HTMLInputElement).checked ? 'true' : 'false');
    this.updateProperty(key);
  }

  protected changePropertyType(row: PropertyRow, type: SimplePropertyType): void {
    const value = convertSimplePropertyValue(row.type === 'list' ? serializeStringList(row.values) : row.value, type);
    this.preferredTypes.set(row.key, type);
    this.rows.update((rows) => rows.map((current) => current.key === row.key
      ? {
          ...current,
          type,
          value,
          values: type === 'list' ? parseStringList(value) ?? [] : [],
        }
      : current));
    this.controlFor(row.key).setValue(value);
    this.markdownChange.emit(updateSimpleFrontmatterProperty(this.markdown(), row.key, value));
    this.openTypeMenu.set(null);
    this.focusTypeButton(row.key);
  }

  protected toggleTypeMenu(key: string): void {
    this.openTypeMenu.update((openKey) => openKey === key ? null : key);
  }

  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.type-menu') && !target.closest('.type-button')) this.openTypeMenu.set(null);
    if (!target.closest('.list-editor')) this.openSuggestions.set(null);
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.openTypeMenu()) {
      const key = this.openTypeMenu();
      this.openTypeMenu.set(null);
      if (key) this.focusTypeButton(key);
    }
  }

  private focusTypeButton(key: string): void {
    setTimeout(() => document.querySelector<HTMLButtonElement>(`[data-type-button="${CSS.escape(key)}"]`)?.focus());
  }

  protected listInputFor(key: string): FormControl<string> {
    return this.listInputs[key] ??= new FormControl('', { nonNullable: true });
  }

  protected keyInputFor(key: string): FormControl<string> {
    return this.keyInputs[key] ??= new FormControl(key, { nonNullable: true });
  }

  protected renameProperty(row: PropertyRow): void {
    const key = this.keyInputFor(row.key).value.trim();
    if (!key || !/^[A-Za-z_][\w-]*$/.test(key) || key !== row.key && this.rows().some((item) => item.key === key)) {
      this.keyInputFor(row.key).setValue(row.key);
      return;
    }
    if (key === row.key) return;
    const withoutOld = removeSimpleFrontmatterProperty(this.markdown(), row.key);
    this.markdownChange.emit(updateSimpleFrontmatterProperty(withoutOld, key, row.type === 'list' ? serializeStringList(row.values) : row.value));
  }

  protected removeListValue(row: PropertyRow, index: number): void {
    const values = row.values.filter((_, valueIndex) => valueIndex !== index);
    this.markdownChange.emit(updateSimpleFrontmatterProperty(this.markdown(), row.key, serializeStringList(values)));
  }

  protected addListValues(row: PropertyRow): void {
    const input = this.listInputFor(row.key);
    const additions = input.value.split(',').map((value) => value.trim()).filter(Boolean);
    if (!additions.length) return;
    const values = [...row.values, ...additions.filter((value) => !row.values.includes(value))];
    input.reset();
    this.markdownChange.emit(updateSimpleFrontmatterProperty(this.markdown(), row.key, serializeStringList(values)));
    additions.forEach((value) => this.catalogService.register(this.spaceId(), row.key, value).subscribe());
  }

  protected addListSuggestion(row: PropertyRow, value: string): void {
    const values = [...row.values, value].filter((item, index, all) => item && all.indexOf(item) === index);
    this.listInputFor(row.key).reset();
    this.openSuggestions.set(null);
    this.markdownChange.emit(updateSimpleFrontmatterProperty(this.markdown(), row.key, serializeStringList(values)));
    this.catalogService.register(this.spaceId(), row.key, value).subscribe();
  }

  protected addSelectValue(row: PropertyRow, value = this.listInputFor(row.key).value): void {
    const selected = replaceSelectValue(value);
    if (!selected) return;
    this.listInputFor(row.key).reset();
    this.openSuggestions.set(null);
    this.selectedSuggestion.set(0);
    this.markdownChange.emit(updateSimpleFrontmatterProperty(this.markdown(), row.key, selected));
    this.catalogService.register(this.spaceId(), row.key, selected).subscribe((entry) => {
      if (entry) this.catalog.update((entries) => [...entries.filter((item) => item.id !== entry.id), entry]);
    });
  }

  protected updateSelectSuggestions(key: string): void {
    const query = this.listInputFor(key).value.trim();
    this.openSuggestions.set(shouldOpenSuggestions(query) ? key : null);
    this.selectedSuggestion.set(0);
  }

  protected selectSuggestion(row: PropertyRow, value: string): void { this.addSelectValue(row, value); }

  protected selectSuggestionKeydown(row: PropertyRow, event: KeyboardEvent): void {
    const items = this.filteredSuggestions(row.key);
    if (event.key === 'Escape') { event.preventDefault(); this.openSuggestions.set(null); return; }
    if (!items.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedSuggestion.update((index) => event.key === 'ArrowDown' ? Math.min(index + 1, items.length - 1) : Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && this.openSuggestions() === row.key) {
      event.preventDefault(); this.addSelectValue(row, items[this.selectedSuggestion()]);
    }
  }

  protected clearSelectValue(row: PropertyRow): void {
    this.markdownChange.emit(updateSimpleFrontmatterProperty(this.markdown(), row.key, ''));
  }

  protected addProperty(): void {
    const existing = new Set(this.rows().map((row) => row.key));
    let index = 1;
    let key = 'propiedad';
    while (existing.has(key)) key = `propiedad_${index++}`;
    this.markdownChange.emit(updateSimpleFrontmatterProperty(this.markdown(), key, ''));
    this.openTypeMenu.set(null);
    setTimeout(() => document.querySelector<HTMLInputElement>(`[data-key-input="${CSS.escape(key)}"]`)?.focus());
  }

  protected startResize(event: PointerEvent): void {
    event.preventDefault();
    this.resizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.panelWidth();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.resizing) return;
    const width = this.resizeStartWidth + this.resizeStartX - event.clientX;
    this.panelWidth.set(Math.min(520, Math.max(280, width)));
  }

  protected onPointerUp(): void { this.resizing = false; }

  protected resizeByKeyboard(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    this.panelWidth.update((width) => Math.min(520, Math.max(280, width + (event.key === 'ArrowLeft' ? 16 : -16))));
  }

  protected removeProperty(key: string): void {
    this.openTypeMenu.set(null);
    this.markdownChange.emit(removeSimpleFrontmatterProperty(this.markdown(), key));
  }
}
