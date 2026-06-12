import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@/environments/environment';

export interface FolderEntry {
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileEntry {
  name: string;
  createdAt: string;
  updatedAt: string;
  size?: number;
}

export interface TreeResponse {
  tipo: string;
  path: string;
  folders: FolderEntry[];
  files: FileEntry[];
}

@Injectable({ providedIn: 'root' })
export class ArchivosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/archivos`;

  getTree(tipo: string, path = '') {
    return this.http.get<TreeResponse>(`${this.apiUrl}/tree?tipo=${tipo}&path=${path}`);
  }

  descargarArchivo(tipo: string, path: string) {
    return this.http.get(`${this.apiUrl}/file?tipo=${tipo}&path=${path}`, {
      responseType: 'blob',
    });
  }

  descargarZip(tipo: string, path: string) {
    return this.http.get(`${this.apiUrl}/zip`, {
      params: { tipo, path },
      responseType: 'blob',
    });
  }
}