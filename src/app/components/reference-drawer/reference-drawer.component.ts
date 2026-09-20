import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { finalize, Observable } from 'rxjs';
import { EventoCompleto } from '@core/interfaces/evento';
import { UsuarioCompleto } from '@core/interfaces/usuario';
import { EventoService } from '@core/services/evento.service';
import { ReferenceDrawerService, ReferenceTarget } from '@core/services/reference-drawer.service';
import { UsuarioService } from '@core/services/usuario';

@Component({
  selector: 'app-reference-drawer',
  imports: [DrawerModule],
  templateUrl: './reference-drawer.component.html',
  styleUrl: './reference-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReferenceDrawerComponent {
  private readonly drawerService = inject(ReferenceDrawerService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly eventoService = inject(EventoService);

  readonly target = this.drawerService.target;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly user = signal<UsuarioCompleto | null>(null);
  readonly event = signal<EventoCompleto | null>(null);

  constructor() {
    effect((onCleanup) => {
      const target = this.target();
      this.loading.set(false);
      this.error.set(null);
      this.user.set(null);
      this.event.set(null);
      if (!target) return;

      this.loading.set(true);
      const request = this.load(target).pipe(finalize(() => this.loading.set(false))).subscribe({
        next: (data) => target.type === 'user' ? this.user.set(data as UsuarioCompleto) : this.event.set(data as EventoCompleto),
        error: () => this.error.set('No se pudo cargar la referencia. Intentá nuevamente.'),
      });
      onCleanup(() => request.unsubscribe());
    });
  }

  close(): void { this.drawerService.close(); }

  displayName(user: { nombre: string; apellido: string }): string {
    return `${user.nombre} ${user.apellido}`.trim();
  }

  displayRoles(roles: Array<{ rolCodigo: string }> | undefined): string {
    return roles?.map(role => role.rolCodigo).join(', ') ?? '';
  }

  eventCode(event: EventoCompleto): string {
    return `${event.tipoCodigo}-${String(event.numero).padStart(3, '0')}`;
  }

  private load(target: Exclude<ReferenceTarget, null>): Observable<UsuarioCompleto | EventoCompleto> {
    return target.type === 'user'
      ? this.usuarioService.getByIdCompleto(target.id)
      : this.eventoService.getByIdCompleto(target.id);
  }
}
