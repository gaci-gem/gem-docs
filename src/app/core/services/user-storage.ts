import { Injectable } from '@angular/core';

export interface UsuarioLogeado {
  id: string
  nombre: string
  apellido: string
  email: string,
  pagina_inicio?: string
  esCumpleanios?: boolean
  ultimoLogin?: string | null
  diasAusente?: number
}
const STORAGE_KEY = 'usuario'

@Injectable({
  providedIn: 'root'
})
export class UserStorageService {

  setUsuario(usuario: UsuarioLogeado, recordar:boolean=false): void {
    if (recordar) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    }
  }

  getUsuario(): UsuarioLogeado | null {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  clearUsuario(): void {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
