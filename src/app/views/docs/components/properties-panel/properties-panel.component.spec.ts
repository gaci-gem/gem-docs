import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { of } from 'rxjs';
import { PropertyValueCatalogService } from '@core/services/property-value-catalog.service';
import { PropertiesPanelComponent } from './properties-panel.component';
import { filterCatalogSuggestions, filterSelectSuggestions, selectSuggestions, shouldOpenSuggestions } from './select-suggestions';

describe('selectSuggestions', () => {
  it('shows the workspace tags catalog value Importante while typing Impo', () => {
    expect(filterCatalogSuggestions([
      { id: 'catalog-1', propertyKey: 'tags', value: 'Importante', color: null },
    ], 'tags', 'Impo')).toEqual(['Importante']);
  });

  it('filters catalog-backed values by a case-insensitive prefix', () => {
    expect(filterSelectSuggestions(['Importante', 'Urgente'], 'Impo')).toEqual(['Importante']);
  });

  it('expands and deduplicates serialized catalog values', () => {
    expect(filterCatalogSuggestions([
      { id: 'catalog-1', propertyKey: 'tags', value: '["Importante", "Urgente"]', color: null },
      { id: 'catalog-2', propertyKey: 'tags', value: 'Importante', color: null },
    ], 'tags', 'imp')).toEqual(['Importante']);
  });

  it('opens suggestions only after three non-whitespace characters', () => {
    expect(shouldOpenSuggestions('  ')).toBe(false);
    expect(shouldOpenSuggestions(' Im')).toBe(false);
    expect(shouldOpenSuggestions(' Imp ')).toBe(true);
  });

  it('includes current-document list values even when the list has another key', () => {
    const suggestions = selectSuggestions(
      'propiedad_4',
      [{ content: '---\npropiedad_4: from another document\n---' }],
      'actual',
      '---\ntags: ["importante", "dad", "daas"]\npropiedad_4: "actual"\n---',
    );

    expect(suggestions).toEqual(['actual', 'daas', 'dad', 'from another document', 'importante']);
  });

  it('expands the current document list value without showing its JSON representation', () => {
    const suggestions = selectSuggestions(
      'tags',
      [],
      '["Importante"]',
      '---\ntags: ["Importante"]\n---',
    );

    expect(filterSelectSuggestions(suggestions, 'impo')).toEqual(['Importante']);
    expect(suggestions).not.toContain('["Importante"]');
  });

  it('deduplicates values across current and other documents', () => {
    const suggestions = selectSuggestions(
      'propiedad_4',
      [{ content: '---\npropiedad_4: ["dad", "externo"]\n---' }],
      'dad',
      '---\ntags: ["dad", "local"]\npropiedad_4: "dad"\n---',
    );

    expect(suggestions).toEqual(['dad', 'externo', 'local']);
  });
});

describe('PropertiesPanelComponent interactions', () => {
  let fixture: ComponentFixture<PropertiesPanelComponent>;
  let component: PropertiesPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertiesPanelComponent],
      providers: [{ provide: PropertyValueCatalogService, useValue: { list: vi.fn().mockReturnValue(of([])), register: vi.fn().mockReturnValue(of(undefined)) } }],
    }).compileComponents();
    fixture = TestBed.createComponent(PropertiesPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('markdown', '---\nname: Initial\n---\nBody');
    fixture.detectChanges();
  });

  it('emits markdown when a property is edited and when the panel closes', () => {
    const changes: string[] = [];
    const close = vi.fn();
    component.markdownChange.subscribe((value) => changes.push(value));
    component.close.subscribe(close);

    const input = fixture.nativeElement.querySelector('[aria-label="name"]') as HTMLInputElement;
    input.value = 'Updated';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[aria-label="Ocultar propiedades"]').click();

    expect(changes.at(-1)).toContain('name: Updated');
    expect(close).toHaveBeenCalledOnce();
  });

  it('removes a property through the type menu', () => {
    const changes: string[] = [];
    component.markdownChange.subscribe((value) => changes.push(value));
    (component as unknown as { removeProperty: (key: string) => void }).removeProperty('name');
    expect(changes).toEqual(['---\n---\nBody']);
  });
});
