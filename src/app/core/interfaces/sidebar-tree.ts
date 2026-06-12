export interface SidebarDocItem {
  id: string;
  titulo: string;
  espacioId: string;
}

export interface SidebarSpace {
  id: string;
  nombre: string;
  expanded: boolean;
  docs: SidebarDocItem[];
}