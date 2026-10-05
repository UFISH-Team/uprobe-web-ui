import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
export default function Design() {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname !== '/design' && location.pathname !== '/design/') return <Outlet />;
  return <Box sx={{ maxWidth: 1000, mx: 'auto', py: 3, px: 2 }}>
    <Typography variant="h5" fontWeight={700}>Probe design</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>Run a design with an existing template, or create a reusable probe template.</Typography>
    <Grid container spacing={2}>
      {[
        {title:'Run probe design',description:'Choose a template, configure targets and filters, then submit your task.',path:'/design/designworkflow',action:'Start design',primary:true},
        {title:'Manage probe templates',description:'Build probe structures, configure attributes and save templates for reuse.',path:'/design/customprobe',action:'Open templates',primary:false}
      ].map(item=><Grid item xs={12} md={6} key={item.path}><Card variant="outlined" sx={{ height:'100%',borderRadius:2,boxShadow:'none' }}><CardContent sx={{ p:3 }}>
        <Stack direction="row" spacing={1} alignItems="center"><Typography variant="subtitle1" fontWeight={600}>{item.title}</Typography>{item.primary && <Chip size="small" label="Recommended" />}</Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt:1,mb:3,minHeight:48 }}>{item.description}</Typography>
        <Button variant={item.primary?'contained':'outlined'} disableElevation sx={{ textTransform:'none' }} onClick={()=>navigate(item.path)}>{item.action}</Button>
      </CardContent></Card></Grid>)}
    </Grid>
  </Box>;
}
