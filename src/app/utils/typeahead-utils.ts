import { Observable, OperatorFunction } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

/**
 * Genera una función de búsqueda para usar con ngbTypeahead.
 * @param data Lista de elementos a filtrar.
 * @param displayFn Función que recibe un elemento y devuelve el texto con el que buscar y mostrar.
 * @param limit Máximo de resultados a mostrar (default: 10).
 */
export function createTypeaheadSearch<T>(
  data: T[],
  displayFn: (item: T) => string,
  limit: number = 10
): OperatorFunction<string, readonly T[]> {
  return (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => {
        if (term.trim().length === 0) {
          return [];
        }
        return data
          .filter(item =>
            displayFn(item).toLowerCase().includes(term.toLowerCase())
          )
          .slice(0, limit);
      })
    );
}

/**
 * Formatea un elemento para mostrar en el input y lista del typeahead.
 * @param displayFn Función que recibe un elemento y devuelve el texto.
 */
export function createTypeaheadFormatter<T>(displayFn: (item: T) => string) {
  return (item: T) => (item ? displayFn(item) : '');
}
