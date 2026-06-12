import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AvatarSyncService {
  private avatarCambiadoSubject = new BehaviorSubject<string | null>(null);
  
  avatarCambiado$: Observable<string | null> = this.avatarCambiadoSubject.asObservable();

  notificarCambioAvatar(nombreImagen: string): void {
    this.avatarCambiadoSubject.next(nombreImagen);
  }
}
