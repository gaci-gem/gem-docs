export interface SidebarDocItem {
  id: string;
  titulo: string;
  espacioId: string;
}

export interface SidebarSpace {
  id: string;
  nombre: string;
  parentId?: string | null;  // null/undefined = root level
  expanded: boolean;
  docs: SidebarDocItem[];
  children: SidebarSpace[];  // espacios anidados
}