/**
 * Albumes por defecto cuando no hay backend.
 *
 * Esta vacio a proposito. Las fotos de los albumes del sitio antiguo son
 * privadas de cada cliente y no se migraron (ver la lista B en el README),
 * y todavia no se han generado las imagenes de ejemplo con IA.
 *
 * En cuanto el backend este conectado, estos datos se reemplazan por los
 * albumes reales que el fotografo suba desde el panel. Para llenar el
 * portafolio con imagenes de muestra mientras tanto, el procedimiento
 * completo esta en docs/galeria-de-ejemplo.md.
 */
export const defaultAlbums = [];

export const featuredPhotos = [];

export default defaultAlbums;
