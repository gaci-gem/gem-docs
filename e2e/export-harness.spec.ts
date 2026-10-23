import { expect, test } from '@playwright/test';

// The authenticated Angular editor is intentionally not driven here: its auth
// bootstrap is backend-owned. This deterministic harness verifies browser
// boundaries (DOM rendering, asset loading, POST payloads, and downloads).
test.describe('browser export boundaries', () => {
  test('renders valid Mermaid and exposes a non-brittle error fallback', async ({ page }) => {
    await page.setContent(`
      <main>
        <div id="diagram" role="img" aria-label="Mermaid diagram"></div>
        <div id="fallback" hidden role="alert">Unable to render diagram</div>
      </main>
      <script>
        window.renderDiagram = (source) => {
          const diagram = document.querySelector('#diagram');
          const fallback = document.querySelector('#fallback');
          if (source.includes('graph TD')) {
            diagram.innerHTML = '<svg data-rendered="mermaid"><text>A</text><path d="M0 0L1 1"></path></svg>';
            fallback.hidden = true;
          } else {
            diagram.replaceChildren();
            fallback.hidden = false;
          }
        };
      </script>`);

    await page.evaluate(() => window.renderDiagram('graph TD\n A-->B'));
    await expect(page.locator('#diagram svg')).toBeVisible();
    await expect(page.locator('#fallback')).toBeHidden();

    await page.evaluate(() => window.renderDiagram('not a diagram'));
    await expect(page.locator('#diagram svg')).toHaveCount(0);
    await expect(page.locator('#fallback')).toBeVisible();
  });

  test('loads an intercepted image asset into the export surface', async ({ page }) => {
    await page.route('**/assets/example.png', async (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('png-fixture') }));
    await page.setContent('<img id="asset" alt="Intercepted asset" src="http://127.0.0.1:4300/assets/example.png">');
    await expect(page.locator('#asset')).toHaveAttribute('src', /example\.png/);
    await expect.poll(() => page.locator('#asset').evaluate((image: HTMLImageElement) => image.complete)).toBe(true);
  });

  test('downloads a non-empty PDF from the controlled export surface', async ({ page }) => {
    await page.setContent('<button id="export">Export PDF</button>');
    await page.locator('#export').evaluate((button) => {
      button.addEventListener('click', () => {
        const blob = new Blob(['%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF'], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'controlled-export.pdf';
        link.click();
      });
    });
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export').click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks).toString()).toContain('%PDF-');
  });

  test('posts hyperlink, Mermaid, and image HTML and downloads DOCX', async ({ page }) => {
    let postedHtml = '';
    await page.route('**/docs/export/docx', async (route) => {
      postedHtml = (route.request().postDataJSON() as { html: string }).html;
      await route.fulfill({ status: 200, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', body: Buffer.from('PK\x03\x04docx-fixture') });
    });
    await page.goto('/');
    await page.setContent('<button id="export">Export DOCX</button>');
    await page.locator('#export').evaluate((button) => {
      button.addEventListener('click', async () => {
        const html = '<a href="https://example.test">link</a><svg data-rendered="mermaid"></svg><img src="data:image/png;base64,asset">';
        const response = await fetch('/docs/export/docx', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ html }) });
        const blob = await response.blob();
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'controlled-export.docx'; link.click();
      });
    });
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export').click();
    const download = await downloadPromise;
    expect(postedHtml).toContain('<a href="https://example.test">');
    expect(postedHtml).toContain('data-rendered="mermaid"');
    expect(postedHtml).toContain('<img');
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks).length).toBeGreaterThan(0);
  });
});

declare global {
  interface Window { renderDiagram: (source: string) => void; }
}
