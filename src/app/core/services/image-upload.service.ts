import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@/environments/environment';

export interface ImageUploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB per image
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

/**
 * Uploads images to the backend for storage as URL-referenced files.
 * Used by DocImportService (on confirm, not on preview) to convert
 * base64-embedded images from .docx imports into proper file references —
 * keeps HTML/markdown payloads small.
 */
@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private http = inject(HttpClient);
  private endpoint = `${environment.API_URL}/docs/upload-image`;

  /**
   * Uploads a single image File. Returns the server response with a public URL.
   * The returned URL is normalized to absolute (prepends API_URL if the
   * backend sent a relative path like `/uploads/images/uuid.png`).
   * Validates type and size before sending; rejects unsupported files locally
   * to avoid round-tripping bad data.
   */
  upload(file: File): Observable<ImageUploadResult> {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw {
        message: `Tipo de imagen no soportado: ${file.type || 'desconocido'}.`,
      };
    }
    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMb = (file.size / 1024 / 1024).toFixed(1);
      throw {
        message: `Imagen demasiado grande (${sizeMb} MB). Máximo: 10 MB.`,
      };
    }

    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<ImageUploadResult>(this.endpoint, formData).pipe(
      map((res) => ({ ...res, url: this.absoluteUrl(res.url) })),
    );
  }

  /**
   * Uploads an image from a base64 data URI (as produced by mammoth's
   * `mammoth.images.dataUri` strategy during .docx parsing). Convenience
   * wrapper around `upload()` — converts the data URI to a File first.
   */
  uploadBase64(dataUri: string, filename = 'image'): Observable<ImageUploadResult> {
    const file = this.dataUriToFile(dataUri, filename);
    if (!file) {
      throw { message: 'data URI de imagen inválido.' };
    }
    return this.upload(file);
  }

  /**
   * Normalize a backend URL to absolute. The backend returns relative paths
   * like `/uploads/images/uuid.png`; we prepend the API base URL so the URL
   * works regardless of where the frontend is hosted.
   */
  private absoluteUrl(url: string): string {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = environment.API_URL.endsWith('/')
      ? environment.API_URL.slice(0, -1)
      : environment.API_URL;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  }

  private dataUriToFile(dataUri: string, filename: string): File | null {
    const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const [, mime, base64] = match;
    try {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const ext = mime.split('/')[1] || 'png';
      return new File([bytes], `${filename}.${ext}`, { type: mime });
    } catch {
      return null;
    }
  }
}
