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
   * Optional evento-linked metadata. The backend populates this when the doc
   * is associated with an `evento_documentacion` and emits `ACTUALIZADO`
   * whenever the linked evento changes. Optional because newly-created docs
   * may not yet have any evento link.
   */
  metadata?: DocMetadata | null;
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