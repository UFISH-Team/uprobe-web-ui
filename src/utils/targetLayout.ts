import { TargetLength, parseTargetLength } from './sampling';
export interface TargetLayout {
  template: string;
  parts: Record<string, { length: TargetLength; attributes?: Record<string, any> }>;
}
export function layoutNames(layout: TargetLayout): string[] {
  if (!layout || typeof layout.template !== 'string' || !layout.parts || typeof layout.parts !== 'object') throw new Error('Layout requires a template and parts.');
  const names = [...layout.template.matchAll(/\{([A-Za-z_]\w*)\}/g)].map(match => match[1]);
  if (!names.length || names.map(name => `{${name}}`).join('') !== layout.template || new Set(names).size !== names.length || names.length !== Object.keys(layout.parts).length || names.some(name => !layout.parts[name])) throw new Error('Layout template must contain each named part exactly once.');
  return names;
}
export function validateTargetLayout(layout: TargetLayout | undefined, length: TargetLength): string {
  if (!layout) return '';
  try {
    const names = layoutNames(layout);
    let minimum = 0, maximum = 0;
    for (const name of names) {
      const value = layout.parts[name].length;
      const bounds = Array.isArray(value) ? value : [value, value];
      if (bounds.length !== 2 || !bounds.every(v => Number.isSafeInteger(v) && v >= 0) || bounds[0] > bounds[1]) throw new Error(`${name}: use a non-negative length or [minimum, maximum].`);
      minimum += bounds[0]; maximum += bounds[1];
    }
    const total = parseTargetLength(length);
    const [lower, upper] = Array.isArray(total) ? total : [total, total];
    if (maximum < lower || minimum > upper) throw new Error('Part lengths cannot satisfy the total target length.');
    return '';
  } catch (error) { return error instanceof Error ? error.message : String(error); }
}
