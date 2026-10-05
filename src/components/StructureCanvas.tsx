import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
interface Part { id: string; source: string; sequence: string; label: string; startPos?: number | ''; endPos?: number | ''; isReverseComplement?: boolean; sourceProbeId?: string; }
interface Probe { id: string; name?: string; parts: Part[]; }
interface Props {
  probes: Probe[];
  color: (id:string)=>string;
  selected: string | null;
  onSelect: (probeIndex:number,partId:string)=>void;
  onEdit: (partId:string)=>void;
}
export default function StructureCanvas({probes,color,selected,onSelect,onEdit}:Props) {
  const owner=probes.find(probe=>probe.parts.some(part=>part.id===selected));
  const part=owner?.parts.find(part=>part.id===selected);
  return <Paper variant="outlined" sx={{ mb:3,p:2,borderRadius:2 }}>
    <Typography variant="subtitle1" fontWeight={600}>Structure canvas</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}>Changes appear here immediately. Select a segment to inspect its structure.</Typography>
    <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',lg:'minmax(0,1fr) 250px'},gap:2}}>
      <Box sx={{minWidth:0,overflowX:'auto',p:1,bgcolor:'action.hover',borderRadius:1.5}}>
        <Stack spacing={1.5}>
          {probes.map((probe,index)=><Box key={probe.id} sx={{p:1.5,borderLeft:`3px solid ${color(probe.id)}`,bgcolor:'background.paper',borderRadius:1}}>
            <Typography variant="body2" fontWeight={600} sx={{color:color(probe.id),mb:1}}>{probe.name || `Probe ${index+1}`}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{width:'max-content',minWidth:'100%'}}>
              <Typography variant="caption">5′</Typography>
              {!probe.parts.length && <Typography variant="body2" color="text.secondary">Add a segment to begin</Typography>}
              {probe.parts.map((segment,partIndex)=><Button key={segment.id} variant="outlined" onClick={()=>onSelect(index,segment.id)} aria-pressed={selected===segment.id} sx={{width:Math.max(110,Math.min(230,segment.sequence.length*3)),flexShrink:0,display:'block',textAlign:'left',textTransform:'none',p:1.25,color:'text.primary',bgcolor:alpha(color(probe.id),selected===segment.id?0.22:0.08),borderColor:color(probe.id),borderWidth:selected===segment.id?2:1,'&:hover':{bgcolor:alpha(color(probe.id),0.18)}}}>
                <Typography variant="caption" display="block" fontWeight={600}>Part {partIndex+1} · {segment.source}</Typography>
                <Typography variant="caption" color="text.secondary">{segment.sequence.length} nt{segment.isReverseComplement?' · RC':''}</Typography>
              </Button>)}
              <Typography variant="caption">→ 3′</Typography>
            </Stack>
          </Box>)}
        </Stack>
      </Box>
      <Box sx={{p:1.5,border:'1px solid',borderColor:'divider',borderRadius:1.5,minWidth:0}}>
        <Typography variant="subtitle2" sx={{mb:1}}>Selected segment</Typography>
        {part && owner ? <Stack spacing={1}>
          <Typography variant="body2" fontWeight={600} sx={{color:color(owner.id)}}>{owner.name || `Probe ${probes.indexOf(owner)+1}`} · Part {owner.parts.indexOf(part)+1}</Typography>
          <Typography variant="body2">Source: {part.source}</Typography>
          {part.source==='target' && <Typography variant="body2">Positions: {part.startPos}–{part.endPos}</Typography>}
          {part.source==='probe' && <Typography variant="body2">Reference: {probes.find(probe=>probe.id===part.sourceProbeId)?.name || `Probe ${probes.findIndex(probe=>probe.id===part.sourceProbeId)+1}`}</Typography>}
          <Typography variant="body2">Length: {part.sequence.length} nt · {part.isReverseComplement?'Reverse complement':'Forward'}</Typography>
          {part.source==='fixed' && <Typography variant="caption" sx={{fontFamily:'monospace',overflowWrap:'anywhere'}}>{part.sequence}</Typography>}
          {part.source==='barcode' && <Typography variant="body2">{part.label}</Typography>}
          <Button size="small" variant="outlined" onClick={()=>onEdit(part.id)}>Edit attributes</Button>
        </Stack> : <Typography variant="body2" color="text.secondary">Select a segment on the canvas. Its source, span and attributes can be reviewed here.</Typography>}
      </Box>
    </Box>
  </Paper>;
}

