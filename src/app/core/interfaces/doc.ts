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