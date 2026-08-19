import { ChangeDetectorRef, Component, inject, OnInit, AfterViewInit } from '@angular/core'
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap'
import { userDropdownItems, UserDropdownItemType } from '@layouts/components/data'
import { Router, RouterLink } from '@angular/router'
import { NgIcon } from '@ng-icons/core'
import { AuthService } from '@core/services/auth'
import { toTitleCase } from '@/app/utils/string-utils'
import { UsuarioAdicionalClave } from '@/app/constants/adicionales_usuario'
import { AVATAR_POR_DEFECTO, getAvatarPath } from '@/app/constants/avatares-disponibles';
import { UsuarioService } from '@core/services/usuario'
import { UserStorageService } from '@core/services/user-storage'
import { AvatarSyncService } from '@core/services/avatar-sync.service'
import { Adicional } from '@core/interfaces/usuario'

@Component({
  selector: 'app-user-profile-topbar',
  imports: [
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    RouterLink,
    NgIcon,
  ],
  templateUrl: './user-profile.html',
})
export class UserProfile implements OnInit, AfterViewInit {
  private router = inject(Router)
  private authService = inject(AuthService)
  private usuarioService = inject(UsuarioService);
  private userStorageService = inject(UserStorageService);
  private cdr = inject(ChangeDetectorRef);
  private avatarSyncService = inject(AvatarSyncService);

  menuItems: UserDropdownItemType[] = []
  imagenPerfil: Adicional | null = null;
  fotoPerfil: string = getAvatarPath(AVATAR_POR_DEFECTO);
  private usuarioId: string | null = null;

  ngOnInit() {
    const usuario = this.userStorageService.getUsuario();
    
    if (usuario) {
      this.usuarioId = usuario.id;
      this.menuItems = [
        {
          label: `${toTitleCase(usuario.nombre)} ${toTitleCase(usuario.apellido)}`,
          isHeader: true,
        },
        ...userDropdownItems.map(item =>
          item.label === 'Perfil'
            ? { ...item, url: `/usuario/perfil/${usuario.id}` }
            : item
        )
      ];

      // Escuchar cambios de avatar
      this.avatarSyncService.avatarCambiado$.subscribe(nombreImagen => {
        if (nombreImagen) {
          this.fotoPerfil = getAvatarPath(nombreImagen);
          this.cdr.detectChanges();
        }
      });
    }
  }

  ngAfterViewInit() {
    if (this.usuarioId) {
      this.cargarFotoPerfil(this.usuarioId);
    }
  }

  private cargarFotoPerfil(usuarioId: string): void {
    // this.usuarioService.getAdicional(usuarioId, UsuarioAdicionalClave.FOTO_PERFIL).subscribe({
    //   next: (adicional: Adicional) => {
    //     this.imagenPerfil = adicional;
    //     this.fotoPerfil = adicional 
    //       ? getAvatarPath(adicional.valor)
    //       : getAvatarPath(AVATAR_POR_DEFECTO);
    //     this.cdr.detectChanges();
    //   },
    //   error: () => {
    //     this.fotoPerfil = getAvatarPath(AVATAR_POR_DEFECTO);
    //     this.cdr.detectChanges();
    //   }
    // });
  }

  handleEvent(event: string | undefined) {
    if (!event) return;

    switch (event) {
      case 'logout':
        this.logout();
        break;
      default:
        console.warn('Evento no manejado:', event);
    }
  }

  logout() {
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'))
  }

  getFotoPerfil(): string {
    return this.fotoPerfil;
  }
}
