import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MetadataDialogComponent } from './metadata-dialog.component';
import { DocMetadata, DOC_METADATA_FIELDS } from '@core/interfaces/doc-metadata';

/**
 * Test host that mirrors how the parent (DocEditorComponent) binds the
 * MetadataDialogComponent inputs via template signals.
 */
@Component({
  template: `
    <app-metadata-dialog
      [visible]="visibleSig()"
      [metadata]="metadataSig()"
      (visibleChange)="onVisibleChange($event)"
    />
  `,
  imports: [MetadataDialogComponent],
})
class TestHostComponent {
  visibleSig = signal(true);
  metadataSig = signal<DocMetadata | null | undefined>(null);
  emittedValue: boolean | null = null;
  onVisibleChange(value: boolean) { this.emittedValue = value; }
}

/**
 * Factory for a fully-populated metadata fixture (all 9 keys) — matches the
 * shape produced by `buildMetadataFromEvento` on the backend.
 *
 * `usuarioActual` is now an OBJECT `{ nombre, usuario, color }` — the modal
 * renders the full name alongside a `<p-tag>` badge with `@<usuario>` painted
 * with `color` as background. See the `usuarioActual cell` describe block.
 */
function populatedMetadata(): DocMetadata {
  return {
    cliente: 'ACME Corp',
    producto: 'GEM',
    modulo: 'Autenticación',
    proyecto: 'Migración 2026',
    etapaActual: 'Desarrollo',
    usuarioActual: {
      nombre: 'Juan Pérez',
      usuario: 'jperez',
      color: '#3b82f6',
    },
    eventoCode: 'EVT-0042',
    titulo: 'Sprint planning Q3',
    eventoId: 'evt-abc-123',
  };
}

/** Factory for an all-null metadata fixture. */
function emptyMetadata(): DocMetadata {
  return {
    cliente: null,
    producto: null,
    modulo: null,
    proyecto: null,
    etapaActual: null,
    usuarioActual: null,
    eventoCode: null,
    titulo: null,
    eventoId: null,
  };
}

describe('MetadataDialogComponent', () => {
  let host: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  function detectChanges() { fixture.detectChanges(); }

  function getDialog(): HTMLElement | null {
    return fixture.debugElement.query(By.css('p-dialog'))?.nativeElement ?? null;
  }

  function getMetadataRows(): HTMLElement[] {
    return Array.from(document.body.querySelectorAll('.metadata-row')) as HTMLElement[];
  }

  function getRowByLabel(label: string): HTMLElement | null {
    const rows = getMetadataRows();
    return rows.find(r => r.querySelector('.metadata-label')?.textContent?.trim() === label) ?? null;
  }

  function getCerrarButton(): HTMLElement | null {
    const dialogFooter = document.body.querySelector('[class*="p-dialog-footer"]');
    const footerBtns = dialogFooter?.querySelectorAll('button') ?? [];
    return Array.from(footerBtns).find(btn => btn.textContent?.trim() === 'Cerrar') as HTMLElement ?? null;
  }

  describe('DocMetadata shape — CRITICAL contract with backend DocsMetadata', () => {
    it('exports a DocMetadata interface with the 9 expected nullable keys', () => {
      // This is a structural assertion — the interface MUST contain exactly
      // the 9 keys that the backend `DocsMetadata` produces. Drift here
      // breaks the modal end-to-end.
      const expectedKeys: Array<keyof DocMetadata> = [
        'cliente', 'producto', 'modulo', 'proyecto', 'etapaActual',
        'usuarioActual', 'eventoCode', 'titulo', 'eventoId',
      ];
      const fields = DOC_METADATA_FIELDS.map(f => f.key);
      expect(fields).toEqual(expectedKeys);
    });
  });

  describe('visible input', () => {
    it('renders the dialog when visible is true', () => {
      detectChanges();
      expect(getDialog()).toBeTruthy();
    });
  });

  describe('metadata rendering — populated payload', () => {
    beforeEach(() => {
      host.metadataSig.set(populatedMetadata());
      host.visibleSig.set(true);
      detectChanges();
    });

    it('renders 9 rows (one per field, matching DOC_METADATA_FIELDS)', () => {
      // 9 fields defined in DOC_METADATA_FIELDS → 9 rows. No field is hidden
      // even when null — null fields render as em-dash (see em-dash specs).
      const allRows = getMetadataRows();
      expect(allRows.length).toBe(9);
    });

    it('shows the Cliente label and value', () => {
      const row = getRowByLabel('Cliente');
      expect(row).toBeTruthy();
      const value = row!.querySelector('.metadata-value');
      expect(value?.textContent?.trim()).toBe('ACME Corp');
    });

    it('shows the Evento ID label and value as plain text (no <a> wrap)', () => {
      const row = getRowByLabel('ID del evento');
      expect(row).toBeTruthy();
      const value = row!.querySelector('.metadata-value');
      expect(value?.textContent?.trim()).toBe('evt-abc-123');
      // eventoId is plain text per spec R20 — no anchor wrapping.
      expect(value?.querySelector('a')).toBeNull();
    });
  });

  describe('usuarioActual cell — full name + badge with @username (object shape)', () => {
    beforeEach(() => {
      host.metadataSig.set(populatedMetadata());
      host.visibleSig.set(true);
      detectChanges();
    });

    it('renders the full name as plain text inside the Usuario actual row', () => {
      const row = getRowByLabel('Usuario actual');
      expect(row).toBeTruthy();
      const name = row!.querySelector('.user-name');
      expect(name?.textContent?.trim()).toBe('Juan Pérez');
    });

    it('renders a <p-tag> badge with @<usuario> as its label', () => {
      const row = getRowByLabel('Usuario actual');
      expect(row).toBeTruthy();
      const badge = row!.querySelector('p-tag');
      expect(badge).toBeTruthy();
      // PrimeNG renders the value text inside `.p-tag-label`
      const label = badge!.querySelector('.p-tag-label');
      expect(label?.textContent?.trim()).toBe('@jperez');
    });

    it('binds the user color as the badge background and white as foreground', () => {
      const row = getRowByLabel('Usuario actual');
      expect(row).toBeTruthy();
      const badge = row!.querySelector('p-tag') as HTMLElement | null;
      expect(badge).toBeTruthy();
      const inlineStyle = badge!.getAttribute('style') ?? '';
      expect(inlineStyle.toLowerCase()).toContain('background: rgb(59, 130, 246)');
      expect(inlineStyle).toContain('color: rgb(255, 255, 255)');
    });

    it('renders em-dash when usuarioActual is null', () => {
      host.metadataSig.set({ ...populatedMetadata(), usuarioActual: null });
      detectChanges();

      const row = getRowByLabel('Usuario actual');
      expect(row).toBeTruthy();
      // No badge and no name when null
      expect(row!.querySelector('p-tag')).toBeNull();
      expect(row!.querySelector('.user-name')).toBeNull();
      // The row falls back to the em-dash placeholder
      expect(row!.querySelector('.metadata-value')?.textContent?.trim()).toBe('—');
    });

    it('renders em-dash when usuarioActual is a legacy STRING (pre-migration data)', () => {
      // Docs created before the object-shape migration stored the full name
      // as a plain string. The modal must not crash on legacy data — it falls
      // back to `—` via `usuarioActualSafe` (typeof !== 'object' guard).
      host.metadataSig.set({
        ...populatedMetadata(),
        usuarioActual: 'Juan Pérez' as any,
      });
      detectChanges();

      const row = getRowByLabel('Usuario actual');
      expect(row).toBeTruthy();
      expect(row!.querySelector('p-tag')).toBeNull();
      expect(row!.querySelector('.user-name')).toBeNull();
      expect(row!.querySelector('.metadata-value')?.textContent?.trim()).toBe('—');
    });
  });

  describe('metadata rendering — null fields render as em-dash (R17)', () => {
    it('renders 9 rows with — for every field when metadata is empty', () => {
      host.metadataSig.set(emptyMetadata());
      host.visibleSig.set(true);
      detectChanges();

      const allRows = getMetadataRows();
      expect(allRows.length).toBe(9);
      const values = allRows.map(r => r.querySelector('.metadata-value')?.textContent?.trim() ?? '');
      // All 9 values should be the em-dash placeholder.
      expect(values.every(v => v === '—')).toBe(true);
    });

    it('renders — for null values while non-null values keep their content', () => {
      host.metadataSig.set({
        cliente: 'ACME',
        producto: null,
        modulo: null,
        proyecto: null,
        etapaActual: null,
        usuarioActual: null,
        eventoCode: null,
        titulo: null,
        eventoId: null,
      });
      host.visibleSig.set(true);
      detectChanges();

      expect(getRowByLabel('Cliente')?.querySelector('.metadata-value')?.textContent?.trim()).toBe('ACME');
      expect(getRowByLabel('Producto')?.querySelector('.metadata-value')?.textContent?.trim()).toBe('—');
      expect(getRowByLabel('Módulo')?.querySelector('.metadata-value')?.textContent?.trim()).toBe('—');
      expect(getRowByLabel('ID del evento')?.querySelector('.metadata-value')?.textContent?.trim()).toBe('—');
    });
  });

  describe('modal config (CRITICAL #2 — uses modalConfig, not hardcoded 560px)', () => {
    it('binds modalConfig width into the dialog wrapper (not the old hardcoded 560px)', () => {
      host.metadataSig.set(populatedMetadata());
      detectChanges();

      // p-dialog renders into a portal appended to <body>. The inline style
      // that PrimeNG applies from [style] lives on the wrapper div inside
      // the portal — not on the host <p-dialog> element.
      const portalWrapper = document.body.querySelector('.metadata-dialog') as HTMLElement | null;
      expect(portalWrapper).toBeTruthy();
      const inlineStyle = portalWrapper?.getAttribute('style') ?? '';
      expect(inlineStyle).toContain('70%');
      expect(inlineStyle).not.toContain('560px');
    });

    it('does not bind maxWidth on the dialog (modalConfig uses breakpoints instead)', () => {
      host.metadataSig.set(populatedMetadata());
      detectChanges();

      const portalWrapper = document.body.querySelector('.metadata-dialog') as HTMLElement | null;
      const inlineStyle = portalWrapper?.getAttribute('style') ?? '';
      // Old code had maxWidth: '95vw' — modalConfig doesn't define maxWidth
      // because the breakpoints property handles responsive sizing.
      expect(inlineStyle).not.toContain('maxWidth');
      expect(inlineStyle).not.toContain('max-width');
    });
  });

  describe('visibleChange output (WARNING #3 — boolean, not void)', () => {
    it('emits visibleChange(false) when the Cerrar button is clicked', () => {
      host.visibleSig.set(true);
      host.metadataSig.set(populatedMetadata());
      detectChanges();

      const closeBtn = getCerrarButton();
      expect(closeBtn).toBeTruthy();
      closeBtn!.click();
      detectChanges();

      expect(host.emittedValue).toBe(false);
    });
  });
});
