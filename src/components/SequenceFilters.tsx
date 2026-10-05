import { useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { WorkflowFilter } from '../types';

interface Props {
  targets: string[];
  filters: Record<string, WorkflowFilter>;
  onChange: (filters: Record<string, WorkflowFilter>) => void;
}

export default function SequenceFilters({ targets, filters, onChange }: Props) {
  const [presetAnchor, setPresetAnchor] = useState<HTMLElement | null>(null);
  const rules = Object.entries(filters).filter(([, rule]) => rule.type === 'sequence_pattern');
  const update = (name: string, rule: WorkflowFilter) => onChange({ ...filters, [name]: rule });
  const addRule = (pattern?: string) => {
    let index = 1;
    while (`sequence_exclusion_${index}` in filters) index++;
    update(`sequence_exclusion_${index}`, { type: 'sequence_pattern', target: targets[0], exclude_patterns: pattern ? [pattern] : [] });
    setPresetAnchor(null);
  };
  return <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: { xs: 2, sm: 3 } }}>
    <Typography variant="subtitle1" fontWeight={600}>Basic filtering</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Attribute conditions are configured in probe parameters above.</Typography>
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mt: 2.5, mb: 1.5 }}>
      <Typography variant="subtitle2">Sequence exclusions</Typography>
      <Button size="small" disabled={!targets.length} onClick={event => setPresetAnchor(event.currentTarget)}>Add preset</Button>
    </Stack>
    <Typography variant="caption" color="text.secondary">Exclude sequences matching any expression. Case insensitive.</Typography>
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      {rules.map(([name, rule]) => {
        const patterns = rule.exclude_patterns?.length ? rule.exclude_patterns : [''];
        const removePattern = (index: number) => {
          const remaining = patterns.filter((_, i) => i !== index);
          if (remaining.length) update(name, { ...rule, exclude_patterns: remaining });
          else { const next = { ...filters }; delete next[name]; onChange(next); }
        };
        return <Box key={name}>
          <Stack spacing={1}>
            {patterns.map((pattern, index) => {
              let error = '';
              try { if (pattern) new RegExp(pattern, 'i'); } catch { error = 'Invalid regular expression'; }
              return <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
                <TextField select size="small" label="Sequence" value={rule.target || ''} sx={{ width: { xs: '100%', sm: 220 }, flexShrink: 0 }} onChange={event => update(name, { ...rule, target: event.target.value })}>
                  {[...new Set([...targets, ...(rule.target ? [rule.target] : [])])].map(target => <MenuItem key={target} value={target}>{target}</MenuItem>)}
                </TextField>
                <TextField fullWidth size="small" label="Exclude pattern" placeholder="e.g. N or A{4,}" value={pattern} error={!!error} helperText={error || (!pattern ? 'Enter a regular expression' : undefined)} inputProps={{ style: { fontFamily: 'monospace' } }} onChange={event => {
                  const next = [...patterns]; next[index] = event.target.value;
                  update(name, { ...rule, exclude_patterns: next });
                }} />
                <IconButton size="small" aria-label="Remove sequence pattern" onClick={() => removePattern(index)} sx={{ mt: '4px !important', color: 'text.secondary' }}><DeleteOutlineIcon fontSize="small" /></IconButton>
              </Stack>;
            })}
          </Stack>
        </Box>;
      })}
      {!rules.length && <Typography variant="body2" color="text.secondary">No sequence exclusions. Add a pattern when needed.</Typography>}
      <Button size="small" startIcon={<AddIcon />} disabled={!targets.length} onClick={() => addRule()} sx={{ alignSelf: 'flex-start' }}>Add pattern</Button>
    </Stack>
    <Menu anchorEl={presetAnchor} open={!!presetAnchor} onClose={() => setPresetAnchor(null)}>
      <MenuItem onClick={() => addRule('^[GC]{2}')}>Two G/C bases at the 5′ end</MenuItem>
      <MenuItem onClick={() => addRule('[GC]{2}$')}>Two G/C bases at the 3′ end</MenuItem>
      <MenuItem onClick={() => addRule('N')}>Contains N</MenuItem>
      <MenuItem onClick={() => addRule('([ACGT])\\1{3,}')}>Four or more identical bases</MenuItem>
    </Menu>
  </Box>;
}
