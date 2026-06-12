import { EventoCompleto } from "./evento";
import { Rol } from "./rol";

export interface Usuario {
  id?: string;
  nombre: string;
  apellido: string;
  email: string;
  usuario: string;
  password?: string;
  activo?: boolean;
  ultimo_login?: Date;
  color: string;
  fechaNacimiento?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  preferencias?: Preferencia[];
  roles?: UsuarioRol[];
  // notificaciones?: Notificacion[];
  // eventosCreados?: Evento[];
  // registrosHora?: RegistroHora[];
  // auditorias?: VidaEvento[];
  adicionales?: Adicional[];
}

export interface Adicional {
  id?: number;
  usuarioId?: string;
  clave: string;
  valor: string;
  creadoEn?: Date;
  actualizadoEn?: Date;
}

interface UsuarioRol {
  usuarioId: string;
  rolCodigo: string;
}

export interface Preferencia {
  usuarioId: string
  clave: string;
  descripcion: string;
}

export interface UsuarioCompleto extends Usuario {
  eventosActuales?: EventoCompleto[];
}

