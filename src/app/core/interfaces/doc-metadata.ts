/**
 * Mirrors the backend `DocsMetadata` DTO (`gem-api/src/modules/docs/dto/docs-metadata.dto.ts`).
 *
 * The backend's `buildMetadataFromEvento` populates these nine keys from the
 * linked `evento` (via `gem-docs.listener.onEventoActualizado`). When the
 * evento is NOT linked to this doc, the backend returns `{}` and the modal
 * still renders all 9 rows — null/empty fields display as `—`.
 *
 * gem-docs treats this shape as the read-only contract with the backend;
 * any drift between this interface and the DTO breaks the "Ver metadata" modal.
 */

/**
 * Sub-object for the `usuarioActual` cell. The modal renders `nombre`
 * as plain text and a `<p-tag>` badge with `@<usuario>` painted with
 * `color` as background. `null` (not an empty object) is the canonical
 * "missing" state — see `displayValue` / `usuarioActualSafe` in the dialog.
 */
export interface UsuarioActualMeta {
  /** Full name (e.g. "Juan Pérez"). Backend joins nombre + apellido. */
  nombre: string;
  /** Username/login without the leading `@` (the modal adds it). */
  usuario: string;
  /** Hex color (`#RRGGBB`) used as badge background. */
  color: string;
}

export interface DocMetadata {
  cliente: string | null;
  producto: string | null;
  modulo: string | null;
  proyecto: string | null;
  etapaActual: string | null;
  /**
   * Current user assigned to the evento. `null` when the evento has no
   * user with a non-empty name (consistent with other nullable fields).
   * The dialog additionally handles legacy strings as `null` (graceful
   * fallback for docs created before the object-shape migration).
   */
  usuarioActual: UsuarioActualMeta | null;
  eventoCode: string | null;
  titulo: string | null;
  eventoId: string | null;
}

/**
 * Field descriptors used by `MetadataDialogComponent` to render the grid.
 * The order here is the order shown in the modal. Labels are Spanish to
 * match the rest of the editor UI. Keeping the array declarative lets us
 * add/rename fields in one place — no scattered `<div>` rows.
 *
 * Every key MUST match `DocMetadata`. The `as const` assertion keeps the
 * literal types so the component template can rely on `field.key` being
 * a valid `keyof DocMetadata`.
 */
export const DOC_METADATA_FIELDS: ReadonlyArray<{ key: keyof DocMetadata; label: string }> = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'producto', label: 'Producto' },
  { key: 'modulo', label: 'Módulo' },
  { key: 'proyecto', label: 'Proyecto' },
  { key: 'etapaActual', label: 'Etapa actual' },
  { key: 'usuarioActual', label: 'Usuario actual' },
  { key: 'eventoCode', label: 'Código de evento' },
  { key: 'titulo', label: 'Título del evento' },
  { key: 'eventoId', label: 'ID del evento' },
] as const;
