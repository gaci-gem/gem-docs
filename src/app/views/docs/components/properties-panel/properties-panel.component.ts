import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  parseSimpleFrontmatter,
  removeSimpleFrontmatterProperty,
  updateSimpleFrontmatterProperty,
} from '@core/markdown/frontmatter';

interface PropertyRow {
  key: string;
  value: string;
  editorial: boolean;
}

@Component({
  selector: 'app-properties-panel',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './properties-panel.component.html',
  styleUrl: './properties-panel.component.scss',
})
export class PropertiesPanelComponent {
  markdown = input('');
  markdownChange = output<string>();
  close = output<void>();

  protected readonly rows = signal<PropertyRow[]>([]);
  protected readonly newKey = new FormControl('', { nonNullable: true });
  protected readonly newValue = new FormControl('', { nonNullable: true });
  private controls: Record<string, FormControl<string>> = {};

  constructor() {
    effect(() => {
      const parsed = parseSimpleFrontmatter(this.markdown());
      const byKey = new Map(parsed.map((property) => [property.key, property.value]));
      const ordered = ['tipo', 'estado', ...parsed.map((property) => property.key)];
      const uniqueKeys = [...new Set(ordered)];
      this.controls = Object.fromEntries(
        uniqueKeys.map((key) => [key, new FormControl(byKey.get(key) ?? '', { nonNullable: true })]),
      );
      this.rows.set(uniqueKeys.map((key) => ({
        key,
        value: byKey.get(key) ?? '',
        editorial: key === 'tipo' || key === 'estado',
      })));
    });
  }

  protected controlFor(key: string): FormControl<string> {
    return this.controls[key] ?? new FormControl('', { nonNullable: true });
  }

  protected updateProperty(key: string): void {
    this.markdownChange.emit(updateSimpleFrontmatterProperty(this.markdown(), key, this.controlFor(key).value));
  }

  protected addProperty(): void {
    const key = this.newKey.value.trim();
    if (!key || !/^[A-Za-z_][\w-]*$/.test(key) || this.rows().some((row) => row.key === key)) return;
    const updated = updateSimpleFrontmatterProperty(this.markdown(), key, this.newValue.value);
    this.newKey.reset();
    this.newValue.reset();
    this.markdownChange.emit(updated);
  }

  protected removeProperty(key: string): void {
    this.markdownChange.emit(removeSimpleFrontmatterProperty(this.markdown(), key));
  }
}
