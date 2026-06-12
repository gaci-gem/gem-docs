export enum LinkType {
  EVENTO = 'EVENTO',
  USUARIO = 'USUARIO',
}

export interface DocLink {
  id: string;
  docId: string;
  linkType: LinkType;
  targetId: string;
  createdAt: Date;
}