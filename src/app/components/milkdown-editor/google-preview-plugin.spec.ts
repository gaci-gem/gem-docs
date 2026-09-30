import { classifyGoogleUrl, isDirectGoogleLink } from './google-preview-plugin';
import { describe, expect, it } from 'vitest';

describe('classifyGoogleUrl', () => {
  it('recognizes Docs, Sheets, and Drive URLs', () => {
    expect(classifyGoogleUrl('https://docs.google.com/document/d/abc/edit')?.type).toBe('Docs');
    expect(classifyGoogleUrl('https://docs.google.com/spreadsheets/d/abc/edit')?.type).toBe('Sheets');
    expect(classifyGoogleUrl('https://drive.google.com/drive/u/0/folders/abc')?.type).toBe('Drive');
  });

  it('ignores non-Google and unsupported URLs', () => {
    expect(classifyGoogleUrl('https://example.com/document/d/abc')).toBeNull();
    expect(classifyGoogleUrl('https://docs.google.com/presentation/d/abc')).toBeNull();
    expect(classifyGoogleUrl('not a URL')).toBeNull();
  });

  it('only accepts a direct URL as the complete link label', () => {
    const url = 'https://docs.google.com/document/d/abc/edit';
    expect(isDirectGoogleLink(url, url)?.type).toBe('Docs');
    expect(isDirectGoogleLink(`Abrir ${url}`, url)).toBeNull();
    expect(isDirectGoogleLink('Documento', url)).toBeNull();
    expect(isDirectGoogleLink(url, 'https://example.com/document')).toBeNull();
  });

  it('classifies multiple standalone blocks independently', () => {
    const urls = [
      'https://docs.google.com/document/d/one/edit',
      'https://docs.google.com/spreadsheets/d/two/edit',
      'https://drive.google.com/drive/u/0/folders/three',
    ];
    expect(urls.map((url) => isDirectGoogleLink(url, url)?.type)).toEqual(['Docs', 'Sheets', 'Drive']);
  });
});
