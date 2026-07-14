import { DocMetadata } from './doc-metadata';

export enum ContentSource {
  DB = 'DB',
  FILE = 'FILE',
}

export interface Doc {
  id: string;
  titulo: string;
  espacioId: string;
  autorId: string;
  contentSource: ContentSource;
  contentUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  /**
   * Evento-linked metadata. The backend ALWAYS returns `metadata` on the doc
   * payload — populated from the linked `evento` via `buildMetadataFromEvento`
   * when an `evento_documentacion` link exists, or `{}` when no evento is
   * linked yet. The schema column is `metadata Json @default("{}")`, so this
   * is required (not optional) per spec R15.
   */
  metadata: DocMetadata;
}

export type DocCreate = Pick<Doc, 'titulo' | 'espacioId'> & {
  content: string;
};

export type DocUpdate = Partial<Pick<Doc, 'titulo'>> & {
  content?: string;
};

export interface DocWithContent extends Doc {
  content: string;
}