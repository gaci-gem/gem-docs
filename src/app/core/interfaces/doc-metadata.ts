/**
 * Mirrors the backend `DocsMetadata` DTO (`gem-api/src/modules/docs/dto/docs-metadata.dto.ts`).
 * All fields are nullable strings — when an evento is NOT linked to this doc, the
 * backend returns an empty metadata object (`{}`) and `null` for any missing fields.
 *
 * The backend builds this object from `evento` + `evento_documentacion` whenever an
 * `EventoEvents.ACTUALIZADO` is emitted. gem-docs displays it read-only.
 */
export interface DocMetadata {
  eventoTipo: string | null;
  eventoFechaInicio: string | null;
  eventoFechaFin: string | null;
  eventoEstado: string | null;
  eventoUsuarioActual: string | null;
  eventoUsuarioAsignado: string | null;
  eventoEtapa: string | null;
  eventoDescripcion: string | null;
  eventoComentarios: string | null;
}

/**
 * Field labels (Spanish) used by `MetadataDialogComponent` to render each row.
 * Keeping them here lets the dialog stay declarative and lets i18n swap them out
 * later without touching the component template.
 */
export const DOC_METADATA_FIELDS: ReadonlyArray<{ key: keyof DocMetadata; label: string }> = [
  { key: 'eventoTipo', label: 'Tipo de evento' },
  { key: 'eventoFechaInicio', label: 'Fecha de inicio' },
  { key: 'eventoFechaFin', label: 'Fecha de fin' },
  { key: 'eventoEstado', label: 'Estado' },
  { key: 'eventoUsuarioActual', label: 'Usuario actual' },
  { key: 'eventoUsuarioAsignado', label: 'Usuario asignado' },
  { key: 'eventoEtapa', label: 'Etapa' },
  { key: 'eventoDescripcion', label: 'Descripción' },
  { key: 'eventoComentarios', label: 'Comentarios' },
] as const;
