import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReferenceSuggestionItem } from './suggestions';

@Component({
  selector: 'app-suggestion-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="suggestion-list" role="listbox" [attr.aria-label]="title()">
      @for (item of items(); track item.id) {
        <button
          type="button"
          class="suggestion-item"
          [class.is-selected]="item.id === selectedId()"
          role="option"
          [attr.aria-selected]="item.id === selectedId()"
          (mousedown)="$event.preventDefault()"
          (click)="select.emit(item)">
          <span class="suggestion-label">{{ item.label }}</span>
          @if (item.description) { <span class="suggestion-description">{{ item.description }}</span> }
        </button>
      }
      @if (items().length === 0) { <div class="suggestion-empty">Sin resultados</div> }
    </div>
   `,
  styles: [`
    :host { display: block; }
    .suggestion-list { min-width: 240px; max-width: min(360px, calc(100vw - 24px)); padding: 4px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 8px 24px rgb(15 23 42 / 18%); }
    .suggestion-item { display: flex; flex-direction: column; align-items: flex-start; width: 100%; padding: 8px 10px; border: 0; border-radius: 5px; background: transparent; color: #172033; text-align: left; cursor: pointer; }
    .suggestion-item:hover, .suggestion-item.is-selected { background: #e0edff; }
    .suggestion-label { font-weight: 600; }
    .suggestion-description { color: #526174; font-size: 12px; }
    .suggestion-empty { padding: 10px; color: #526174; font-size: 13px; }
    @media (prefers-color-scheme: dark) { .suggestion-list { background: #18181b; border-color: #3f3f46; } .suggestion-item { color: #f4f4f5; } .suggestion-item:hover, .suggestion-item.is-selected { background: #1e3a5f; } .suggestion-description, .suggestion-empty { color: #a1a1aa; } }
   `],
})
export class SuggestionListComponent {
  items = input<ReferenceSuggestionItem[]>([]);
  selectedId = input<string | null>(null);
  title = input('Sugerencias');
  select = output<ReferenceSuggestionItem>();
}
