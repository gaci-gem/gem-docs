import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MetadataDialogComponent } from './metadata-dialog.component';
import { DocMetadata } from '@core/interfaces/doc-metadata';

/**
 * Test host that mirrors how the parent (DocEditorComponent) binds the
 * MetadataDialogComponent inputs via template signals.
 */
@Component({
  template: `
    <app-metadata-dialog
      [visible]="visibleSig()"
      [metadata]="metadataSig()"
      (closed)="onClosed()"
    />
  `,
  imports: [MetadataDialogComponent],
})
class TestHostComponent {
  visibleSig = signal(true);
  metadataSig = signal<DocMetadata | null | undefined>(undefined);
  closedCalled = false;
  onClosed() { this.closedCalled = true; }
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
    return fixture.debugElement.queryAll(By.css('.metadata-row')).map(de => de.nativeElement);
  }

  function getEmptyMessage(): HTMLElement | null {
    return fixture.debugElement.query(By.css('.metadata-empty'))?.nativeElement ?? null;
  }

  describe('visible input', () => {
    it('renders the dialog when visible is true', () => {
      detectChanges();
      expect(getDialog()).toBeTruthy();
    });
  });

  describe('metadata rendering — populated payload', () => {
    beforeEach(() => {
      host.metadataSig.set({
        eventoTipo: 'Reunión',
        eventoFechaInicio: '2026-07-01',
        eventoFechaFin: null,
        eventoEstado: 'En curso',
        eventoUsuarioActual: 'Juan Pérez',
        eventoUsuarioAsignado: null,
        eventoEtapa: 'Especificación',
        eventoDescripcion: 'Reunión de planificación',
        eventoComentarios: null,
      });
      host.visibleSig.set(true);
      detectChanges();
    });

    it('renders 6 rows (null fields are hidden)', () => {
      // p-dialog uses portal rendering — look in the whole document body
      // Non-null: tipo, fechaInicio, estado, usuarioActual, etapa, descripcion = 6
      // Null: fechaFin, usuarioAsignado, comentarios = 3 hidden
      const allRows = document.body.querySelectorAll('.metadata-row');
      expect(allRows.length).toBe(6);
    });

    it('shows field labels next to values', () => {
      const allRows = document.body.querySelectorAll('.metadata-row');
      const label = allRows[0]?.querySelector('.metadata-label');
      expect(label?.textContent).toContain('Tipo de evento');
    });
  });

  describe('metadata rendering — empty state', () => {
    it('shows empty message when metadata is undefined', () => {
      host.metadataSig.set(undefined);
      host.visibleSig.set(true);
      detectChanges();

      const empty = getEmptyMessage();
      expect(empty).toBeTruthy();
      expect(empty!.textContent).toContain('no está asociado a un evento');
    });

    it('shows empty message when all fields are null', () => {
      host.metadataSig.set({
        eventoTipo: null,
        eventoFechaInicio: null,
        eventoFechaFin: null,
        eventoEstado: null,
        eventoUsuarioActual: null,
        eventoUsuarioAsignado: null,
        eventoEtapa: null,
        eventoDescripcion: null,
        eventoComentarios: null,
      });
      host.visibleSig.set(true);
      detectChanges();

      expect(getEmptyMessage()).toBeTruthy();
    });
  });

  describe('metadata rendering — whitespace trimming', () => {
    it('skips fields with whitespace-only strings', () => {
      host.metadataSig.set({
        eventoTipo: '   ',
        eventoFechaInicio: '2026-07-01',
        eventoFechaFin: null,
        eventoEstado: null,
        eventoUsuarioActual: null,
        eventoUsuarioAsignado: null,
        eventoEtapa: null,
        eventoDescripcion: null,
        eventoComentarios: null,
      });
      host.visibleSig.set(true);
      detectChanges();

      // Only Fecha de inicio is non-null after trim → 1 row
      expect(getMetadataRows().length).toBe(1);
    });
  });

  describe('closed output', () => {
    it('emits closed when the Cerrar button is clicked', () => {
      host.visibleSig.set(true);
      detectChanges();

      // p-dialog uses portal rendering. Find any button in dialog footer with "Cerrar" label.
      const dialogFooter = document.body.querySelector('[class*="p-dialog-footer"]');
      const footerBtns = dialogFooter?.querySelectorAll('button') ?? [];
      const closeBtnText = Array.from(footerBtns).find(btn => btn.textContent?.trim() === 'Cerrar') as HTMLElement | undefined;
      expect(closeBtnText).toBeTruthy();
      closeBtnText!.click();
      detectChanges();

      expect(host.closedCalled).toBe(true);
    });
  });
});