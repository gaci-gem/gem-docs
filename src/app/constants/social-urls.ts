/**
 * URLs base para redes sociales y plataformas
 */
export const SOCIAL_URLS = {
    DISCORD_USER: 'https://discordapp.com/users/',
    DISCORD_INVITE: 'https://discord.gg/',
} as const;

/**
 * Construye la URL completa de Discord para un usuario
 */
export function getDiscordUserUrl(userId: string): string {
    return `${SOCIAL_URLS.DISCORD_USER}${userId}`;
}
