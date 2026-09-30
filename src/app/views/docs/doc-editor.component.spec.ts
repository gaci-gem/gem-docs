import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DocEditorComponent } from './doc-editor.component';
import { DocService } from '@core/services/doc.service';
import { EspacioService } from '@core/services/espacio.service';
import { AuthService } from '@core/services/auth';
import { DocExportService } from '@core/services/doc-export.service';
import { ToolbarService } from '../../components/toolbar/toolbar.service';
import { UsuarioService } from '@core/services/usuario';
import { EventoService } from '@core/services/evento.service';
import { ImageUploadService } from '@core/services/image-upload.service';

describe('DocEditorComponent save flow', () => {
  let fixture: ComponentFixture<DocEditorComponent>;
  let component: DocEditorComponent;
  let docService: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    notifyChanges: ReturnType<typeof vi.fn>;
  };
  let request: Subject<{ id: string; metadata: Record<string, never> }>;

  beforeEach(async () => {
    docService = { create: vi.fn(), update: vi.fn(), getById: vi.fn(), list: vi.fn(), notifyChanges: vi.fn() };
    docService.getById.mockReturnValue(of(undefined));
    docService.list.mockReturnValue(of([]));
    docService.create.mockImplementation(() => request.asObservable());
    docService.update.mockReturnValue(of(undefined));
    request = new Subject();

    const espacioService = { list: vi.fn(), getById: vi.fn() };
    espacioService.list.mockReturnValue(of([]));
    espacioService.getById.mockReturnValue(of({ nombre: 'Espacio' }));
    const usuarioService = { getAll: vi.fn().mockReturnValue(of([])) };
    const eventoService = {
      list: vi.fn().mockReturnValue(of([])),
      listComplete: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [DocEditorComponent],
      providers: [
        { provide: DocService, useValue: docService as unknown as DocService },
        { provide: EspacioService, useValue: espacioService },
        { provide: UsuarioService, useValue: usuarioService },
        { provide: EventoService, useValue: eventoService },
        { provide: AuthService, useValue: { currentUser$: of(null) } },
        { provide: DocExportService, useValue: { exportDocx: vi.fn(), exportPdf: vi.fn() } },
        { provide: ImageUploadService, useValue: { uploadBase64: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of() } },
        { provide: ActivatedRoute, useValue: {
          paramMap: of(convertToParamMap({})),
          queryParamMap: of(convertToParamMap({ espacioId: 'space-1' })),
        } },
        MessageService,
        ToolbarService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocEditorComponent);
    component = fixture.componentInstance;
    component.titulo = 'Nuevo documento';
    component.espacioId = 'space-1';
    component.contenido.set('Contenido');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-milkdown-editor')).not.toBeNull();
  });

  it('marks title edits as dirty', () => {
    component.onTitleInput({ target: { innerText: 'Título editado' } } as unknown as Event);

    expect(TestBed.inject(ToolbarService).saveStatus()).toBe('dirty');
  });

  it('routes replace and append imports through content change handling', async () => {
    component.docId = 'doc-1';
    component.showImportDialog.set(true);
    await component.onImportConfirm({ markdown: '[[evento:new]]', suggestedTitle: 'Imported', mode: 'replace', imagesBase64: [] });

    expect(component.showImportDialog()).toBe(false);
    expect(component.titulo).toBe('Imported');
    expect(component.contenido()).toBe('[[evento:new]]');
    expect(component.detectedLinks()).toEqual(['[[evento:new]]']);
    expect(TestBed.inject(ToolbarService).saveStatus()).toBe('dirty');

    await component.onImportConfirm({ markdown: 'More', suggestedTitle: 'Ignored', mode: 'append', imagesBase64: [] });
    expect(component.titulo).toBe('Imported');
    expect(component.contenido()).toBe('[[evento:new]]\n\n---\n\nMore');
  });

  it('changes view mode and falls back to code after Mermaid render failure', () => {
    component.setViewMode('graph');
    component.onMermaidRenderStatus(false);
    expect(component.viewMode()).toBe('code');

    component.setViewMode('both');
    component.onMermaidRenderStatus(false);
    expect(component.viewMode()).toBe('both');
  });

  it('serializes a new-document save and uses the returned id for the next save', async () => {
    await component.save();
    await component.save();

    expect(docService.create).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(ToolbarService).saveStatus()).toBe('saving');

    request.next({ id: 'doc-1', metadata: {} });
    request.complete();
    await component.save();

    expect(component.docId).toBe('doc-1');
    expect(docService.update).toHaveBeenCalledWith('doc-1', { titulo: 'Nuevo documento', content: 'Contenido' }, undefined);
  });

  it('keeps error visible and retries through the save action', async () => {
    const failed = new Subject<never>();
    docService.create.mockReturnValueOnce(failed.asObservable()).mockReturnValueOnce(of({ id: 'doc-2', metadata: {} }));

    await component.save();
    failed.error(new Error('offline'));

    expect(TestBed.inject(ToolbarService).saveStatus()).toBe('error');
    await component.save();

    expect(docService.create).toHaveBeenCalledTimes(2);
    expect(component.docId).toBe('doc-2');
  });
});
