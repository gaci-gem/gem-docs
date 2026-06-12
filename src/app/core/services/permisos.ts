import { Injectable } from '@angular/core';
import { PermisoClave, permisosVacios } from '@core/interfaces/rol';
import { PermisoCompleto } from '@/app/types/permisos';

@Injectable({ providedIn: 'root' })
export class PermisosService {
    private static readonly STORAGE_KEY = 'permisos';

    clearPermisos() {
        sessionStorage.removeItem(PermisosService.STORAGE_KEY);
        localStorage.removeItem(PermisosService.STORAGE_KEY);
    }

    private static loadPermisos(): string[] {
        let raw = sessionStorage.getItem(PermisosService.STORAGE_KEY);
        if (!raw) {
            raw = localStorage.getItem(PermisosService.STORAGE_KEY);
        }
        if (raw) {
            try {
                return JSON.parse(raw);
            } catch {
                // Si hay error, retorna array vacío
            }
        }
        return permisosVacios;
    }

    setPermisos(permisos: string[], recordar: boolean = false) {
        this.clearPermisos();

        if (recordar) {
            localStorage.setItem(PermisosService.STORAGE_KEY, JSON.stringify(permisos));
        } else {
            sessionStorage.setItem(PermisosService.STORAGE_KEY, JSON.stringify(permisos));
        }
    }

    /**
     * Verifica si el usuario tiene un permiso específico
     * @param permiso Permiso en formato "RECURSO.ACCION" (ej: "EVT.LEER")
     * @returns true si el usuario tiene el permiso
     */
    can(permiso: PermisoCompleto): boolean {
        const permisos = PermisosService.loadPermisos();
        // console.log('Verificando permiso:', permiso, 'Permisos del usuario:', permisos);
        
        // Si el usuario tiene el permiso de admin completo, tiene acceso total
        if (permisos.includes('SYS.ADMIN')) {
            return true;
        }

        // Verificar si tiene el permiso exacto
        if (permisos.includes(permiso)) {
            return true;
        }

        // Verificar si tiene todos los permisos del recurso (ej: "EVT.*")
        const [recurso] = permiso.split('.');
        if (permisos.includes(`${recurso}.*`)) {
            return true;
        }

        return false;
    }

    /**
     * Verifica si el usuario tiene alguno de los permisos especificados
     * @param permisos Array de permisos en formato "RECURSO.ACCION"
     * @returns true si el usuario tiene al menos uno de los permisos
     */
    canAny(...permisos: PermisoCompleto[]): boolean {
        return permisos.some(permiso => this.can(permiso));
    }

    /**
     * Verifica si el usuario tiene todos los permisos especificados
     * @param permisos Array de permisos en formato "RECURSO.ACCION"
     * @returns true si el usuario tiene todos los permisos
     */
    canAll(...permisos: PermisoCompleto[]): boolean {
        return permisos.every(permiso => this.can(permiso));
    }

    /**
     * Obtiene todos los permisos del usuario
     * @returns Array de permisos en formato "RECURSO.ACCION"
     */
    getPermisos(): string[] {
        return PermisosService.loadPermisos();
    }
}