import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '@/environments/environment';
import { credentialsInterceptor } from '@core/interceptors/credentials-interceptor';
import { DocExportService } from './doc-export.service';
import { blobToDataUri, inlineExportImages, normalizeExportImageSources, pdfLinkAnnotations, pdfSliceHeights, renderExportMermaidBlocks, renderExportReferences } from './doc-export.service';

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

describe('renderExportReferences', () => {
  const origins = {
    gemWebUrl: 'http://localhost:4200',
    gemDocsUrl: 'http://localhost:4201',
  };

  it('uses current catalog labels and the configured frontend routes for all reference types', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>@usuario:user-1 @evento:event-1 [[doc-1|Old title]]</p>';

    renderExportReferences(root, [
      { id: 'user-1', label: '@Ana <Rossi> & Co', kind: 'user' },
      { id: 'event-1', label: '#CUS-12 | Event & detail', kind: 'event' },
      { id: 'doc-1', label: 'Guide <Admin> & notes', kind: 'page' },
    ], origins);

    const links = Array.from(root.querySelectorAll('a'));
    expect(links.map((link) => [link.textContent, link.href])).toEqual([
      ['@Ana <Rossi> & Co', 'http://localhost:4200/usuario/perfil/user-1'],
      ['#CUS-12 | Event & detail', 'http://localhost:4200/evento/evento/event-1'],
      ['Guide <Admin> & notes', 'http://localhost:4201/docs/doc-1'],
    ]);
    expect(root.querySelector('img, script')).toBeNull();
    expect(root.textContent).not.toContain('@usuario:user-1');
    expect(root.textContent).not.toContain('Old title');
  });

  it('renders missing references as readable text without broken links or markup injection', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>@usuario:deleted-user @evento:deleted-event [[deleted-page|Former &amp; safe title]]</p><pre>@usuario:user-1</pre>';

    renderExportReferences(root, [], origins);

    expect(root.querySelector('p')?.textContent).toBe('User (deleted-user) Event (deleted-event) Former & safe title');
    expect(root.querySelector('p a')).toBeNull();
    expect(root.querySelector('pre')?.textContent).toBe('@usuario:user-1');
    expect(root.querySelector('img, script')).toBeNull();
  });

  it('does not create links from an unsafe frontend origin', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>@usuario:user-1</p>';

    renderExportReferences(root, [{ id: 'user-1', label: '@Ana Rossi', kind: 'user' }], {
      gemWebUrl: 'javascript:alert(1)',
      gemDocsUrl: 'javascript:alert(1)',
    });

    expect(root.querySelector('p')?.textContent).toBe('@Ana Rossi');
    expect(root.querySelector('a')).toBeNull();
  });
});

describe('document export image helpers', () => {
  it('creates non-overlapping slices for a tall export canvas', () => {
    const slices = pdfSliceHeights(2500, 1000);
    expect(slices).toEqual([1000, 1000, 500]);
    expect(slices.reduce((sum, height) => sum + height, 0)).toBe(2500);
  });

  it('maps only safe anchor rectangles intersecting the current cropped page', () => {
    const root = document.createElement('div');
    const link = document.createElement('a');
    link.href = 'https://example.com/guide';
    root.append(link);
    const unsafe = document.createElement('a');
    unsafe.setAttribute('href', 'javascript:alert(1)');
    root.append(unsafe);
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 50, width: 200, height: 500 } as DOMRect);
    vi.spyOn(link, 'getClientRects').mockReturnValue([
      { left: 120, right: 180, top: 250, bottom: 300, width: 60, height: 50 },
    ] as unknown as DOMRectList);
    vi.spyOn(unsafe, 'getClientRects').mockReturnValue([
      { left: 120, right: 180, top: 250, bottom: 300, width: 60, height: 50 },
    ] as unknown as DOMRectList);

    expect(pdfLinkAnnotations(root, {
      canvasWidth: 400,
      canvasHeight: 1000,
      margin: 15,
      imgWidth: 180,
      pageSourceHeight: 400,
      sourceY: 300,
      sliceHeight: 400,
    })).toEqual([{ url: 'https://example.com/guide', x: 33, y: 60, width: 54, height: 45 }]);
  });

  it('clips an anchor crossing a PDF crop boundary', () => {
    const root = document.createElement('div');
    const link = document.createElement('a');
    link.href = 'http://example.com';
    root.append(link);
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 1000 } as DOMRect);
    vi.spyOn(link, 'getClientRects').mockReturnValue([
      { left: 10, right: 30, top: 39, bottom: 43, width: 20, height: 4 },
    ] as unknown as DOMRectList);

    expect(pdfLinkAnnotations(root, {
      canvasWidth: 1000, canvasHeight: 1000, margin: 10, imgWidth: 190,
      pageSourceHeight: 400, sourceY: 0, sliceHeight: 400,
    })).toEqual([{ url: 'http://example.com/', x: 29, y: 84.10000000000001, width: 38, height: 1.9000000000000001 }]);
  });

  it('resolves API-relative images and keeps data URIs intact', () => {
    const root = document.createElement('div');
    root.innerHTML = '<img src="/docs/abc/assets/image.png"><img src="data:image/png;base64,AA==">';

    normalizeExportImageSources(root);

    expect(root.querySelectorAll('img')[0].src).toContain('/docs/abc/assets/image.png');
    expect(root.querySelectorAll('img')[1].getAttribute('src')).toBe('data:image/png;base64,AA==');
  });

  it('resolves Milkdown assets using the document identity', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>Keep me</p><img src="assets/photo.png"><img src="https://cdn.example/photo.png">';
    normalizeExportImageSources(root, 'doc/unsafe?');
    expect(root.querySelectorAll('img')[0].src).toContain('/docs/doc%2Funsafe%3F/assets/photo.png');
    expect(root.querySelectorAll('img')[1].src).toBe('https://cdn.example/photo.png');
  });

  it('drops relative assets when no document identity is available', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>Keep me</p><img src="assets/photo.png">';
    normalizeExportImageSources(root);
    expect(root.textContent).toBe('Keep me');
    expect(root.querySelector('img')).toBeNull();
  });

  it('removes malformed image elements', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>Text</p><img src="">';

    normalizeExportImageSources(root);

    expect(root.textContent).toBe('Text');
    expect(root.querySelector('img')).toBeNull();
  });

  it('resolves document assets through the authenticated fetcher and inlines the blob', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>Keep me</p><img src="assets/photo.png"><img src="data:image/png;base64,AA==">';
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
    const fetchBlob = vi.fn().mockResolvedValue(blob);
    await inlineExportImages(root, 'doc-1', fetchBlob);
    expect(fetchBlob).toHaveBeenCalledWith(expect.stringContaining('/docs/doc-1/assets/photo.png'));
    expect(root.querySelector('img')?.src).toMatch(/^data:image\/png;base64,/);
  });

  it('converts blobs to data URIs', async () => {
    await expect(blobToDataUri(new Blob(['x'], { type: 'image/png' }))).resolves.toMatch(/^data:image\/png;base64,/);
  });

  it('renders Mermaid as accessible inline SVG for PDF output', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<pre><code class="language-mermaid">graph TD\n  A --&gt; B</code></pre>';
    const renderSvg = vi.fn().mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M0 0"/></svg>');

    await renderExportMermaidBlocks(root, 'pdf', renderSvg);

    const diagram = root.querySelector('svg');
    expect(renderSvg).toHaveBeenCalledWith(expect.stringMatching(/^gem-export-mermaid-/), 'graph TD\n  A --> B');
    expect(diagram).not.toBeNull();
    expect(diagram?.getAttribute('role')).toBe('img');
    expect(diagram?.querySelector('title')?.textContent).toBe('Mermaid diagram');
    expect(root.querySelector('pre')).toBeNull();
  });

  it('renders Mermaid as an embedded PNG image for DOCX output', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<pre><code class="language-mermaid">graph TD\n  A --&gt; B</code></pre>';
    const renderSvg = vi.fn().mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M0 0"/></svg>');
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const rasterizeSvg = vi.fn().mockResolvedValue({ dataUri: `data:image/png;base64,${pngBase64}`, width: 100, height: 60 });

    await renderExportMermaidBlocks(root, 'docx', renderSvg, rasterizeSvg);

    const image = root.querySelector('img');
    expect(rasterizeSvg).toHaveBeenCalledWith(expect.stringContaining('<title'));
    expect(image?.getAttribute('src')).toBe(`data:image/png;base64,${pngBase64}`);
    expect(image?.getAttribute('alt')).toBe('Mermaid diagram');
    expect(image?.parentElement).toBe(root);
    expect(Array.from(root.children)).toEqual([image]);
    expect(root.querySelector('figure')).toBeNull();
    expect(root.querySelector('pre')).toBeNull();
  });

  it('keeps the Mermaid source readable when DOCX rasterization returns data without a PNG signature', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<pre><code class="language-mermaid">graph TD\n  A --&gt; B</code></pre>';

    await renderExportMermaidBlocks(
      root,
      'docx',
      vi.fn().mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M0 0"/></svg>'),
      vi.fn().mockResolvedValue({ dataUri: 'data:image/png;base64,UE5H', width: 100, height: 60 }),
    );

    expect(root.querySelector('pre code')?.textContent).toBe('graph TD\n  A --> B');
    expect(root.querySelector('figure, img, svg')).toBeNull();
  });

  it('keeps the Mermaid source readable when rendering fails', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<pre><code class="language-mermaid">graph TD\n  A --&gt; B</code></pre>';

    await renderExportMermaidBlocks(root, 'pdf', vi.fn().mockRejectedValue(new Error('parse error')));

    expect(root.querySelector('pre code')?.textContent).toBe('graph TD\n  A --> B');
    expect(root.querySelector('svg, img')).toBeNull();
  });
});

describe('DocExportService.exportDocx', () => {
  let service: DocExportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DocExportService,
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DocExportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('inlines authenticated document images before posting the DOCX while preserving tables and text', async () => {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const pngBytes = Uint8Array.from(atob(pngBase64), (character) => character.charCodeAt(0));
    const markdown = [
      '---',
      'tipo: pagina',
      'estado: DRAFT',
      '---',
      '',
      'Keep this paragraph.',
      '',
      '| Column |',
      '| --- |',
      '| Keep this cell |',
      '',
      '![Screenshot](assets/photo.png)',
    ].join('\n');

    const exportPromise = service.exportDocx(markdown, 'CUS 8465', 'doc-1');
    let assetRequest: ReturnType<HttpTestingController['expectOne']> | undefined;
    await vi.waitFor(() => {
      assetRequest = httpMock.expectOne(`${environment.API_URL}/docs/doc-1/assets/photo.png`);
    });
    expect(assetRequest).toBeDefined();
    if (!assetRequest) throw new Error('Expected authenticated document asset request');
    expect(assetRequest.request.method).toBe('GET');
    expect(assetRequest.request.withCredentials).toBe(true);
    assetRequest.flush(new Blob([pngBytes], { type: 'image/png' }));

    let docxRequest: ReturnType<HttpTestingController['expectOne']> | undefined;
    await vi.waitFor(() => {
      docxRequest = httpMock.expectOne(`${environment.API_URL}/docs/export/docx`);
    });

    expect(docxRequest?.request.method).toBe('POST');
    const postedHtml = String(docxRequest?.request.body.html);
    expect(postedHtml).not.toContain('tipo: pagina');
    expect(postedHtml).not.toContain('estado: DRAFT');
    expect(postedHtml).toContain('<p>Keep this paragraph.</p>');
    expect(postedHtml).toContain('<table>');
    expect(postedHtml).toContain('Keep this cell');
    expect(postedHtml).toContain(`src="data:image/png;base64,${pngBase64}"`);

    docxRequest?.flush(new Blob(['docx'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    await exportPromise;
  });

  it('posts catalog labels as links to the separate gem-web and gem-docs routes', async () => {
    const previousWebUrl = environment.GEM_WEB_URL;
    const previousDocsUrl = environment.GEM_DOCS_URL;
    environment.GEM_WEB_URL = 'http://localhost:4200';
    environment.GEM_DOCS_URL = 'http://localhost:4201';

    try {
      const exportPromise = service.exportDocx(
        '@usuario:user-1 @evento:event-1 [[doc-1|Old title]]',
        'Reference report',
        null,
        [
          { id: 'user-1', label: '@Ana Rossi', kind: 'user' },
          { id: 'event-1', label: '#CUS-12 | Event title', kind: 'event' },
          { id: 'doc-1', label: 'Current page title', kind: 'page' },
        ],
      );
      let request: ReturnType<HttpTestingController['expectOne']> | undefined;
      await vi.waitFor(() => {
        request = httpMock.expectOne(`${environment.API_URL}/docs/export/docx`);
      });

      const postedHtml = String(request?.request.body.html);
      expect(postedHtml).toContain('<a href="http://localhost:4200/usuario/perfil/user-1">@Ana Rossi</a>');
      expect(postedHtml).toContain('<a href="http://localhost:4200/evento/evento/event-1">#CUS-12 | Event title</a>');
      expect(postedHtml).toContain('<a href="http://localhost:4201/docs/doc-1">Current page title</a>');
      expect(postedHtml).not.toContain('@usuario:user-1');
      expect(postedHtml).not.toContain('[[doc-1|Old title]]');

      request?.flush(new Blob(['docx'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      await exportPromise;
    } finally {
      environment.GEM_WEB_URL = previousWebUrl;
      environment.GEM_DOCS_URL = previousDocsUrl;
    }
  });

  it('escapes missing document labels and leaves reference-like code untouched', async () => {
    const markdown = [
      '[[missing-page|Former <img src=x onerror=alert(1)>]]',
      '',
      '`[[code-page|<b>literal</b>]]`',
      '',
      '~~~',
      '[[fenced-page|<img src=x>]]',
      '~~~',
    ].join('\n');
    const exportPromise = service.exportDocx(markdown, 'Missing reference');
    let request: ReturnType<HttpTestingController['expectOne']> | undefined;
    await vi.waitFor(() => {
      request = httpMock.expectOne(`${environment.API_URL}/docs/export/docx`);
    });

    const postedHtml = String(request?.request.body.html);
    expect(postedHtml).toContain('Former &lt;img src=x onerror=alert(1)&gt;');
    expect(postedHtml).toContain('<code>[[code-page|&lt;b&gt;literal&lt;/b&gt;]]</code>');
    expect(postedHtml).toContain('[[fenced-page|&lt;img src=x&gt;]]');
    expect(postedHtml).not.toContain('<img');

    request?.flush(new Blob(['docx'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    await exportPromise;
  });
});
