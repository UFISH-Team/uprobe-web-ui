export interface AttributeFilter {
  originalName?: string;
  filterEnabled?: boolean;
  filterExpression?: string;
  min?: number;
  max?: number;
  minInclusive?: boolean;
  maxInclusive?: boolean;
}

export function parseAttributeFilter(name: string, type: string, condition?: string): AttributeFilter {
  const result: AttributeFilter = { originalName: name, filterEnabled: condition !== undefined };
  if (condition === undefined) return result;
  result.filterExpression = condition;
  const number = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
  const comparison = new RegExp(`^\\s*([A-Za-z_][\\w.]*)\\s*(>=|<=|>|<)\\s*(${number})\\s*$`);
  const bounds: AttributeFilter = {};
  for (const term of condition.split('&')) {
    const match = term.match(comparison);
    if (!match || match[1] !== name) return result;
    const value = Number(match[3]) * (type === 'gc_content' ? 100 : 1);
    if (!Number.isFinite(value)) return result;
    if (match[2].startsWith('>')) {
      if (bounds.min !== undefined) return result;
      bounds.min = value; bounds.minInclusive = match[2] === '>=';
    } else {
      if (bounds.max !== undefined) return result;
      bounds.max = value; bounds.maxInclusive = match[2] === '<=';
    }
  }
  return { ...result, ...bounds };
}

export function buildAttributeFilter(attr: AttributeFilter, fallbackName: string, gc: boolean): string {
  if (attr.filterEnabled === false) return '';
  if (attr.filterExpression !== undefined) return attr.filterExpression.trim();
  const name = attr.originalName || fallbackName;
  const scale = gc ? 100 : 1;
  const conditions: string[] = [];
  if (attr.min !== undefined) conditions.push(`${name} ${attr.minInclusive === false ? '>' : '>='} ${attr.min / scale}`);
  if (attr.max !== undefined) conditions.push(`${name} ${attr.maxInclusive === false ? '<' : '<='} ${attr.max / scale}`);
  return conditions.join(' & ');
}
