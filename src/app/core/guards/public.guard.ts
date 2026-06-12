import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class PublicGuard implements CanActivate {
  canActivate(): boolean {
    // Siempre permite el acceso para rutas públicas
    return true;
  }
}
