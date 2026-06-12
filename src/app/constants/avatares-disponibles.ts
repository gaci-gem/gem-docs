/**
 * Lista de avatares disponibles para los usuarios.
 * Para agregar un nuevo avatar, simplemente añade el nombre del archivo a este array
 * y coloca la imagen en la carpeta public/assets/images/users/
 */
export const AVATARES_DISPONIBLES: string[] = [
    'User-1.png',
    'User-2.png',
    'User-3.png',
    'User-4.png',
    'User-5.png',
    'User-6.png',
    'User-7.png',
    'User-8.png',
];

/**
 * Avatar por defecto cuando el usuario no tiene uno asignado
 */
export const AVATAR_POR_DEFECTO = 'User-1.png';

/**
 * Obtiene la ruta completa del avatar
 */
export function getAvatarPath(nombreArchivo: string): string {
    return `assets/images/users/${nombreArchivo}`;
}
