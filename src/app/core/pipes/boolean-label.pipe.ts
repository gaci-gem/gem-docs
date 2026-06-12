import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'booleanLabel'
})
export class BooleanLabelPipe implements PipeTransform {
  transform(value: boolean | null | undefined, tipo: 'estado' | 'si-no' = 'estado'): string {
    if (tipo === 'si-no') {
      return value ? 'SI' : 'NO';
    }
    return value ? 'ACTIVO' : 'INACTIVO';
  }
}
