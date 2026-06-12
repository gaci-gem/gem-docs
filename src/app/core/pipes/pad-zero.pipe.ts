import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'padZero'
})
export class PadZeroPipe implements PipeTransform {
  transform(value: number | string, length: number = 4): string {
    const str = String(value);
    return str.padStart(length, '0');
  }
}
