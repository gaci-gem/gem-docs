export enum UsuarioPreferencias {
    MANTENER_OBSERVADOR = 'mantener_obs', // mantiene al usuario como observador
    NOTIFICAR_CAMBIOS = 'notificar_cambios', // notifica al usuario sobre cambios en eventos // AVANZO, RETOCEDIO, REASIGNO
    NOTIFICAR_ADICION_COMENTARIO = 'notificar_adicion_comentario', // notifica al usuario sobre nuevas adiciones // COMENTARIO, ADJUNTO
    NOTIFICAR_ADICION_ADJUNTO = 'notificar_adicion_adjunto', // notifica al usuario sobre nuevas adiciones // COMENTARIO, ADJUNTO
    NOTIFICAR_ELIMINACION = 'notificar_eliminacion', // notifica al usuario sobre eliminaciones
    RECORDATORIO_HORAS = 'recordatorio_horas', // envía recordatorios sobre la carga de horas
    RECORDATORIO_EVENTOS = 'recordatorio_eventos', // envía recordatorios sobre eventos pendientes
    PAGINA_INICIO = 'pagina_inicio', // preferencia para seleccionar la página de inicio
    NOTIFICAR_VIA_EMAIL = 'notificar_via_email', // preferencia para seleccionar notificación vía email
}

export const USUARIO_PREFERENCIAS_CLAVES = Object.values(UsuarioPreferencias);

export const getDescripcionUsuarioPref = (pref:UsuarioPreferencias) => {
    switch (pref) {
        case UsuarioPreferencias.MANTENER_OBSERVADOR:
            return 'Al avanzar un evento, se mantiene al usuario como observador';
        case UsuarioPreferencias.NOTIFICAR_CAMBIOS:
            return 'Cambios en eventos (Avanzo, Retrocedio, Reasigno)';
        case UsuarioPreferencias.NOTIFICAR_ADICION_COMENTARIO:
            return 'Nuevo comentario';
        case UsuarioPreferencias.NOTIFICAR_ADICION_ADJUNTO:
            return 'Nuevo archivo adjunto';
        case UsuarioPreferencias.NOTIFICAR_ELIMINACION:
            return 'Eliminación de adicional';
        case UsuarioPreferencias.RECORDATORIO_HORAS:
            return 'Carga de horas no realizada en los últimos 2 días';
        case UsuarioPreferencias.RECORDATORIO_EVENTOS:
            return 'Eventos pendientes cerca de su fecha límite';
        case UsuarioPreferencias.PAGINA_INICIO:
            return 'Selecciona la página que se mostrará al iniciar sesión (Dashboard, Lista de eventos, Calendario)';
        default:
            return '';
    }
}

// Tipos e interfaces para tipado fuerte de las preferencias
export type PreferenceType = 'toggle' | 'select' | 'radio';

export interface PreferenceOption {
    valor: string;
    label: string;
}

export interface PreferenceItem {
    clave: UsuarioPreferencias;
    label: string;
    tipo: PreferenceType;
    descripcion?: string;
    opciones?: PreferenceOption[];
}

export interface NotificationGroup {
    agrupacion: string;
    items: PreferenceItem[];
}

export interface PreferenciasGrupoLegacy {
    titulo: string;
    icono: string;
    // `pref` puede ser un array de agrupaciones (notificaciones) o un array de items (general/otros)
    pref: NotificationGroup[] | PreferenceItem[];
}

// Estructura enriquecida de grupos y preferencias.
// Se añaden labels cortos, tipo (toggle/select/radio) y opciones cuando corresponda.
// Constante: Notificaciones como agrupaciones (cada agrupación puede contener varios items)
export const PREFERENCIAS_NOTIFICACIONES: NotificationGroup[] = [
    {
        agrupacion: 'Cambios',
        items: [
            {
                clave: UsuarioPreferencias.NOTIFICAR_CAMBIOS,
                label: 'Notificar cambios de evento',
                tipo: 'toggle',
                descripcion: getDescripcionUsuarioPref(UsuarioPreferencias.NOTIFICAR_CAMBIOS)
            }
        ]
    },
    {
        agrupacion: 'Nuevas adiciones',
        items: [
            {
                clave: UsuarioPreferencias.NOTIFICAR_ADICION_COMENTARIO,
                label: 'Notificar nuevas adiciones',
                tipo: 'toggle',
                descripcion: getDescripcionUsuarioPref(UsuarioPreferencias.NOTIFICAR_ADICION_COMENTARIO)
            },
            {
                clave: UsuarioPreferencias.NOTIFICAR_ADICION_ADJUNTO,
                label: 'Notificar nuevas adiciones',
                tipo: 'toggle',
                descripcion: getDescripcionUsuarioPref(UsuarioPreferencias.NOTIFICAR_ADICION_ADJUNTO)
            }
        ]
    },
    {
        agrupacion: 'Eliminaciones',
        items: [
            {
                clave: UsuarioPreferencias.NOTIFICAR_ELIMINACION,
                label: 'Notificar eliminaciones',
                tipo: 'toggle',
                descripcion: getDescripcionUsuarioPref(UsuarioPreferencias.NOTIFICAR_ELIMINACION)
            }
        ]
    }
];

// Constante: Preferencias generales
export const PREFERENCIAS_GENERALES: PreferenceItem[] = [
    {
        clave: UsuarioPreferencias.PAGINA_INICIO,
        label: 'Página de inicio',
        tipo: 'select',
        opciones: [
            { valor: '/', label: 'Dashboard' },
            { valor: '/evento/eventos/usuario', label: 'Eventos del usuario' }
        ],
        descripcion: getDescripcionUsuarioPref(UsuarioPreferencias.PAGINA_INICIO)
    },
    {
        clave: UsuarioPreferencias.NOTIFICAR_VIA_EMAIL,
        label: 'Notificar también vía email',
        tipo: 'toggle',
        descripcion: getDescripcionUsuarioPref(UsuarioPreferencias.NOTIFICAR_VIA_EMAIL)
    },
];

// Constante: Recordatorios
export const PREFERENCIAS_RECORDATORIOS: PreferenceItem[] = [
    {
        clave: UsuarioPreferencias.RECORDATORIO_HORAS,
        label: 'Recordatorio de horas',
        tipo: 'toggle',
        descripcion: getDescripcionUsuarioPref(UsuarioPreferencias.RECORDATORIO_HORAS)
    },
    {
        clave: UsuarioPreferencias.RECORDATORIO_EVENTOS,
        label: 'Recordatorio de eventos',
        tipo: 'toggle',
        descripcion: getDescripcionUsuarioPref(UsuarioPreferencias.RECORDATORIO_EVENTOS)
    }
];

// Constante: Otros
export const PREFERENCIAS_OTROS: PreferenceItem[] = [
    {
        clave: UsuarioPreferencias.MANTENER_OBSERVADOR,
        label: 'Mantener como observador',
        tipo: 'toggle',
        descripcion: getDescripcionUsuarioPref(UsuarioPreferencias.MANTENER_OBSERVADOR)
    }
];

// Ensamblado legacy para compatibilidad con quien use `USUARIO_PREFERENCIAS_GRUPOS`
export const USUARIO_PREFERENCIAS_GRUPOS: PreferenciasGrupoLegacy[] = [
    { titulo: 'Notificaciones', icono: 'lucideBell', pref: PREFERENCIAS_NOTIFICACIONES },
    { titulo: 'General', icono: 'lucideSettings', pref: PREFERENCIAS_GENERALES },
    { titulo: 'Recordatorios', icono: 'lucideMessageCircleWarning', pref: PREFERENCIAS_RECORDATORIOS },
    { titulo: 'Otros', icono: 'lucideShell', pref: PREFERENCIAS_OTROS }
];