
export enum EstadosEvento {
    En_Curso='CR',
    Rechazado='RE',
    Completado='CO',
    Archivado='AR',
    Cancelado='CA'
}



export function getEstadoDescCorto(estado: EstadosEvento): string {
    switch (estado) {
        case EstadosEvento.En_Curso:
            return `En curso.`;
        case EstadosEvento.Rechazado:
            return `Rechazado.`;
        case EstadosEvento.Completado:
            return `Completado.`;
        case EstadosEvento.Archivado:
            return `Archivado.`;
        case EstadosEvento.Cancelado:
            return `Cancelado.`;
    }
}