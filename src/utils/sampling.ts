export type TargetLength = number | [number, number];

export function parseTargetLength(input: unknown): TargetLength {
  let value: unknown = input;
  if (typeof input === 'string') {
    const text = input.trim();
    if (/^\d+$/.test(text)) value = Number(text);
    else {
      try { value = JSON.parse(text); } catch { throw new Error('Use a length such as 40 or a range such as [40, 46].'); }
    }
  }
  const bounds = Array.isArray(value) ? value : [value, value];
  if (bounds.length !== 2 || !bounds.every(v => typeof v === 'number' && Number.isSafeInteger(v) && v > 0) || bounds[0] > bounds[1]) {
    throw new Error('Length must be a positive integer or [minimum, maximum], with minimum ≤ maximum.');
  }
  return Array.isArray(value) ? [bounds[0], bounds[1]] : bounds[0];
}

export const formatTargetLength = (length: TargetLength) => Array.isArray(length) ? `[${length.join(', ')}]` : String(length);
export function samplingStep(region: any): number {
  const length = parseTargetLength(region.length);
  let step = region.step;
  if (step === undefined && region.overlap !== undefined) {
    if (Array.isArray(length)) throw new Error('Range length requires step.');
    if (!Number.isInteger(region.overlap) || region.overlap < 0 || region.overlap >= length) throw new Error('Invalid legacy overlap.');
    step = length - region.overlap;
  }
  step ??= 1;
  if (!Number.isSafeInteger(step) || step <= 0) throw new Error('Step must be a positive integer.');
  return step;
}
