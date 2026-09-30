import { parseSimpleFrontmatter, parseStringList } from '../../../../core/markdown/frontmatter';
import type { PropertyValueCatalogEntry } from '../../../../core/services/property-value-catalog.service';

export interface PropertyDocument { content: string; }

export function shouldOpenSuggestions(query: string): boolean {
  return query.trim().length >= 3;
}

export function filterCatalogSuggestions(entries: PropertyValueCatalogEntry[], propertyKey: string, query: string): string[] {
  return filterSelectSuggestions(entries.filter((entry) => entry.propertyKey === propertyKey).flatMap((entry) => expandSuggestionValue(entry.value)), query);
}

export function filterSelectSuggestions(values: string[], query: string): string[] {
  const normalized = query.trim().toLocaleLowerCase();
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
    .filter((value) => !normalized || value.toLocaleLowerCase().includes(normalized)).slice(0, 8);
}

export function selectSuggestions(key: string, documents: PropertyDocument[], currentValue: string, currentDocumentContent = ''): string[] {
  const values = documents.flatMap((document) => parseSimpleFrontmatter(document.content)
    .filter((property) => property.key === key)
    .flatMap((property) => expandSuggestionValue(property.value)))
    .concat(parseSimpleFrontmatter(currentDocumentContent)
      .flatMap((property) => expandSuggestionValue(property.value)))
    .map((value) => value.trim()).filter(Boolean);
  return [...new Set([...values, ...expandSuggestionValue(currentValue)].map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function expandSuggestionValue(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value.trim());
    if (Array.isArray(parsed)) return parsed.flatMap((item) => typeof item === 'string' ? expandSuggestionValue(item) : []);
    if (typeof parsed === 'string') return [parsed];
  } catch {
    // Keep ordinary scalar values unchanged.
  }
  return [value];
}
