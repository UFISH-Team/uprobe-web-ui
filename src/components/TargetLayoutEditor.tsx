import { useState } from 'react';
import { Box, Button, Stack, Switch, FormControlLabel, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { TargetLayout, layoutNames, validateTargetLayout } from '../utils/targetLayout';
import { TargetLength } from '../utils/sampling';

export default function TargetLayoutEditor({ value, length, onChange, onRename }: { value?: TargetLayout; length: TargetLength; onChange: (value?: TargetLayout) => void; onRename?: (value: TargetLayout, before: string, after: string) => void }) {
  const [rename, setRename] = useState<{ before: string; after: string } | null>(null);
  let names: string[] = [];
  try { if (value) names = layoutNames(value); } catch { names = Object.keys(value?.parts || {}); }
  const error = validateTargetLayout(value, length);
  const rebuild = (ordered: string[], parts: TargetLayout['parts']) => onChange({ template: ordered.map(name => `{${name}}`).join(''), parts });
  return <Box sx={{ my: 2 }}>
    <FormControlLabel label="Divide target into named parts" control={<Switch checked={!!value} onChange={(_, enabled) => onChange(enabled ? { template: '{part1}{part2}{part3}', parts: { part1: { length: [12,14] }, part2: { length: [12,14] }, part3: { length: [12,14] } } } : undefined)} />} />
    {value && <Stack spacing={1}>
      <Typography variant="caption">Parts follow 5′ → 3′ order. Use 0 for an optional gap. Probe references: target_parts['name'].</Typography>
      {names.map((name, index) => <Stack key={index} direction="row" spacing={1} alignItems="center">
        <TextField size="small" label="Target part name" value={name} InputProps={{ readOnly: true }} />
        <Button onClick={() => setRename({ before: name, after: name })}>Rename</Button>
        {(['Minimum', 'Maximum'] as const).map((label, bound) => <TextField key={label} size="small" label={label} type="number" inputProps={{ min: 0, step: 1 }} value={(Array.isArray(value.parts[name].length) ? value.parts[name].length[bound] : value.parts[name].length) ?? ''} onChange={event => {
          const current = value.parts[name].length; const bounds: [number,number] = Array.isArray(current) ? [...current] : [current,current]; bounds[bound] = event.target.value === '' ? NaN : Number(event.target.value);
          rebuild(names, { ...value.parts, [name]: { ...value.parts[name], length: bounds } });
        }} />)}
        <Button disabled={index === 0} onClick={() => { const order = [...names]; [order[index - 1], order[index]] = [order[index], order[index - 1]]; rebuild(order,value.parts); }}>↑</Button>
        <Button onClick={() => { const parts = { ...value.parts }; delete parts[name]; rebuild(names.filter(n => n !== name), parts); }}>Remove</Button>
      </Stack>)}
      <Button onClick={() => { let n = 1; while (value.parts[`part${n}`]) n++; const name = `part${n}`; rebuild([...names,name], { ...value.parts, [name]: { length: [19,25] } }); }}>Add target part</Button>
      {error && <Typography color="error" variant="body2">{error}</Typography>}
    </Stack>}
    <Dialog open={!!rename} onClose={() => setRename(null)}>
      <DialogTitle>Rename target part</DialogTitle>
      <DialogContent><TextField autoFocus sx={{ mt: 1 }} label="Part name" value={rename?.after || ''} onChange={e => setRename(prev => prev && ({ ...prev, after: e.target.value }))} helperText="Start with a letter or underscore; names must be unique." /></DialogContent>
      <DialogActions><Button onClick={() => setRename(null)}>Cancel</Button><Button disabled={!rename || !/^[A-Za-z_]\w*$/.test(rename.after) || (rename.after !== rename.before && names.includes(rename.after))} onClick={() => {
        if (!value || !rename) return;
        const parts = Object.fromEntries(Object.entries(value.parts).map(([name, part]) => [name === rename.before ? rename.after : name, part]));
        const next = { ...value, parts, template: names.map(name => `{${name === rename.before ? rename.after : name}}`).join('') };
        if (onRename) onRename(next, rename.before, rename.after); else onChange(next);
        setRename(null);
      }}>Apply</Button></DialogActions>
    </Dialog>
  </Box>;
}
