import { MenuItemType } from '@/app/types/layout'
import { PermisoAccion } from '@/app/types/permisos'
import { inject } from '@angular/core'
import { PermisoClave } from '@core/interfaces/rol'
import { AuthService } from '@core/services/auth'

export type UserDropdownItemType = {
  label?: string
  icon?: string
  url?: string
  newTab?: boolean
  isDivider?: boolean
  isHeader?: boolean
  class?: string
  event?: string
}

// const authService = inject(AuthService);
// const usuario:Usuario = authService.getUsuarioLogeado()

export const userDropdownItems: UserDropdownItemType[] = [
  // {
  //   label: 'Bienvenido!',
  //   isHeader: true,
  // },
  {
    label: 'Perfil',
    icon: 'tablerUserCircle',
    url: '/usuario/perfil',
  },
  {
    isDivider: true,
  },
  {
    label: 'Sol. de licencia',
    icon: 'lucideBrush',
    url: 'https://docs.google.com/a/gaci.com.ar/forms/d/e/1FAIpQLSdbSw6Cs9pj3WF1g5ly8xwnM01Ag3_PaWrpMqFUwCMyHh0wMQ/viewform',
    newTab: true,
  },
  {
    label: 'Sugerencias',
    icon: 'lucideTicket',
    url: 'https://discord.com/channels/1366451551064821782/1429920790274637984',
    newTab: true,
  },
  {
    isDivider: true,
  },
  {
    label: 'Cerrar Sesion',
    icon: 'tablerLogout2',
    event: 'logout',
    class: 'fw-semibold',
  },
]


export const menuItems: MenuItemType[] = [
  { label: 'Dashboard', icon: 'lucideCircleGauge', url: '/dashboard' },
  { label: '', isTitle: true },
  {
    label: 'Eventos',
    icon: 'lucideCalendar',
    url: '/evento/eventos/usuario'
  },
  {
    label: 'Horas',
    icon: 'lucideClockPlus',
    url: '/hora/horas/usuario'
  },
  { label: 'Maestros', isTitle: true },
  {
    label: 'Eventos',
    icon: 'lucideCalendarSearch',
    url: '/evento/eventos',
    permisoClave: PermisoClave.EVENTO
  },
  {
    label: 'Horas',
    icon: 'lucideClock',
    url: '/hora/horas',
    permisoClave: PermisoClave.HORAS_GENERALES
  },
  {
    label: 'Clientes',
    icon: 'lucideIdCard',
    url: '/cliente/clientes',
    permisoClave: PermisoClave.CLIENTE
  },
  {
    label: 'Proyectos',
    icon: 'lucideTarget',
    url: '/proyecto/proyectos',
    permisoClave: PermisoClave.PROYECTO
  },
  {
    label: 'Modulos',
    icon: 'lucidePuzzle',
    url: '/modulo/modulos',
    permisoClave: PermisoClave.MODULO
  },
  {
    label: 'Producto',
    icon: 'lucidePackage',
    isCollapsed: true,
    permisoClave: PermisoClave.PRODUCTO,
    // badge: { text: 'Hot', variant: 'primary' },
    children: [
      { label: 'Productos', url: '/producto/productos', permisoClave: PermisoClave.PRODUCTO },
      { label: 'Entornos', url: '/entorno/entornos', permisoClave: PermisoClave.ENTORNO },
    ],
  },
  {
    label: 'Tipo Evento',
    icon: 'lucideTags',
    isCollapsed: true,
    permisoClave: PermisoClave.TIPO_EVENTO,
    children: [
      { label: 'Tipos evento', url: '/tipo-evento/tipos-evento', permisoClave: PermisoClave.TIPO_EVENTO },
      { label: 'Etapas', url: '/etapa/etapas', permisoClave: PermisoClave.ETAPA },
    ],
  },
  {
    label: 'Usuario',
    icon: 'lucideCircleUserRound',
    isCollapsed: true,
    permisoClave: PermisoClave.USUARIO,
    children: [
      { label: 'Usuarios', url: '/usuario/usuarios', permisoClave: PermisoClave.USUARIO },
      { label: 'Roles', url: '/rol/roles', permisoClave: PermisoClave.ROL },
    ],
  },
  {
    label: 'Kbs',
    icon: 'lucideBrainCircuit',
    url: '/kb/kbs',
    permisoClave: PermisoClave.KB
  },
  {
    label: 'Novedades',
    icon: 'lucideMegaphone',
    url: '/novedad/historial',
    permisoClave: PermisoClave.NOV
  },
  { label: '', isTitle: true },
  {
    label: 'Parametros Sistema',
    icon: 'lucideSlidersHorizontal',
    url: '/parametro/parametros',
    permisoClave: PermisoClave.SISTEMA
  },
  {
    label: 'Tipos de Trabajo',
    icon: 'lucideBriefcase',
    url: '/hora/categorias',
    permisoClave: PermisoClave.TIPO_TRABAJO
  },
  {
    label: 'Reportes',
    icon: 'tablerReport',
    url: '/reporte/reportes',
    permisoClave: PermisoClave.REPORTE
  },
  {
    label: 'Archivos',
    icon: 'tablerFile',
    url: '/archivos/',
    permisoClave: PermisoClave.SISTEMA,
    permisoAccion: PermisoAccion.LOG_LEER
  },

]

// export const menuItems: MenuItemType[] = [
//   { label: 'Dashboard', icon: 'lucideCircleGauge', url: '/dashboard' },
//   {
//     label: 'Ton AI',
//     icon: 'lucideSparkles',
//     url: '/ton-ai',
//     badge: { text: 'Hot', variant: 'primary' },
//   },
//   { label: 'Calendar', icon: 'lucideCalendar', url: '/calendar' },
//   { label: 'Directory', icon: 'lucideBookUser', url: '/directory' },

//   { label: 'Custom Pages', isTitle: true },
//   {
//     label: 'Pages',
//     icon: 'lucideNotebookText',
//     isCollapsed: true,
//     children: [
//       { label: 'Pricing', url: '/pages/pricing' },
//       { label: 'Empty Page', url: '/pages/empty' },
//       { label: 'Timeline', url: '/pages/timeline' },
//       { label: 'Terms & Conditions', url: '/pages/terms-conditions' },
//       { label: 'Invoice', url: '/pages/invoice' },
//     ],
//   },
//   {
//     label: 'Authentication',
//     icon: 'lucideFingerprint',
//     isCollapsed: true,
//     children: [
//       { label: 'Sign In', url: '/auth/sign-in' },
//       { label: 'Sign Up', url: '/auth/sign-up' },
//       { label: 'Reset Password', url: '/auth/reset-password' },
//       { label: 'New Password', url: '/auth/new-password' },
//       { label: 'Two Factor', url: '/auth/two-factor' },
//       { label: 'Lock Screen', url: '/auth/lock-screen' },
//       { label: '404 – Not Found', url: '/error/404' },
//     ],
//   },
//   {
//     label: 'UI Components',
//     icon: 'lucidePencilRuler',
//     isCollapsed: true,
//     children: [
//       {
//         label: 'Core Elements',
//         url: '/ui/core-elements',
//       },
//       {
//         label: 'Interactive Features',
//         url: '/ui/interactive-features',
//       },
//       {
//         label: 'Menu & Links',
//         url: '/ui/menu-links',
//       },
//       {
//         label: 'Visual Feedback',
//         url: '/ui/visual-feedback',
//       },
//       {
//         label: 'Utilities',
//         url: '/ui/utilities',
//       },
//     ],
//   },
//   {
//     label: 'Charts',
//     icon: 'lucideChartPie',
//     url: '/charts',
//   },
//   {
//     label: 'Forms',
//     icon: 'lucideSquarePi',
//     isCollapsed: true,
//     children: [
//       {
//         label: 'Basic Elements',
//         url: '/forms/basic',
//       },
//       {
//         label: 'Plugins',
//         url: '/forms/plugins',
//       },
//       {
//         label: 'Validation',
//         url: '/forms/validation',
//       },
//       {
//         label: 'Wizard',
//         url: '/forms/wizard',
//       },
//       {
//         label: 'File Uploads',
//         url: '/forms/file-uploads',
//       },
//       {
//         label: 'Quilljs Editors',
//         url: '/forms/editors',
//       },
//     ],
//   },
//   {
//     label: 'Tables',
//     icon: 'lucideTable2',
//     isCollapsed: true,
//     children: [
//       {
//         label: 'Static Tables',
//         url: '/tables/static',
//       },
//       {
//         label: 'DataTables',
//         badge: { variant: 'success', text: '09' },
//         isCollapsed: true,
//         children: [
//           { label: 'Basic', url: '/tables/data-tables/basic' },
//           { label: 'Export Data', url: '/tables/data-tables/export-data' },
//           { label: 'Select', url: '/tables/data-tables/select' },
//           { label: 'Ajax', url: '/tables/data-tables/ajax' },
//           {
//             label: 'Javascript Source',
//             url: '/tables/data-tables/javascript-source',
//           },
//           {
//             label: 'Data Rendering',
//             url: '/tables/data-tables/data-rendering',
//           },
//           { label: 'Show & Hide Column', url: '/tables/data-tables/columns' },
//           { label: 'Child Rows', url: '/tables/data-tables/child-rows' },

//           {
//             label: 'Fixed Header',
//             url: '/tables/data-tables/fixed-header',
//           },
//         ],
//       },
//     ],
//   },
//   {
//     label: 'Icons',
//     icon: 'lucideLayers2',
//     isCollapsed: true,
//     children: [
//       {
//         label: 'Tabler',
//         url: '/icons/tabler',
//       },
//       {
//         label: 'Lucide',
//         url: '/icons/lucide',
//       },
//       {
//         label: 'Flags',
//         url: '/icons/flags',
//       },
//     ],
//   },
//   {
//     label: 'Maps',
//     icon: 'lucideMapPin',
//     isCollapsed: true,
//     children: [
//       {
//         label: 'Vector Maps',
//         url: '/maps/vector',
//       },
//       {
//         label: 'Leaflet Maps',
//         url: '/maps/leaflet',
//       },
//     ],
//   },
//   { label: 'Menu Items', isTitle: true },
//   {
//     label: 'Menu Levels',
//     icon: 'lucideCommand',
//     isCollapsed: true,
//     children: [
//       {
//         label: 'Second Level',
//         children: [
//           { label: 'Item 2.1', url: 'javascript: void(0);' },
//           { label: 'Item 2.2', url: 'javascript: void(0);' },
//         ],
//       },
//       {
//         label: 'Third Level',
//         isCollapsed: true,
//         children: [
//           { label: 'Item 1', url: 'javascript: void(0);' },
//           {
//             label: 'Item 2',
//             children: [
//               {
//                 label: 'Item 3.1',
//                 url: 'javascript: void(0);',
//               },
//               {
//                 label: 'Item 3.2',
//                 url: '',
//               },
//             ],
//           },
//         ],
//       },
//     ],
//   },
//   {
//     label: 'Disabled Menu',
//     icon: 'lucideShieldBan',
//     url: '/',
//     isDisabled: true,
//   },
// ]
