import React from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Skeleton
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StorageIcon from '@mui/icons-material/Storage';

interface GenomeInfoPanelProps {
  genomeName: string;
  fileCount: number;
}

export const GenomeInfoPanel: React.FC<GenomeInfoPanelProps> = ({ 
  genomeName,
  fileCount
}) => {
  // This would typically be loaded from an API
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalSize: '0 MB',
    fileCount: fileCount,
    annotationFiles: 0,
    genomeFiles: 0,
    indexFiles: 0,
    otherFiles: 0,
    lastUpdated: new Date().toLocaleDateString()
  });

  React.useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setStats({
        totalSize: '256 MB',
        fileCount: fileCount,
        annotationFiles: Math.floor(fileCount * 0.3),
        genomeFiles: Math.floor(fileCount * 0.4),
        indexFiles: Math.floor(fileCount * 0.2),
        otherFiles: Math.floor(fileCount * 0.1),
        lastUpdated: new Date().toLocaleDateString()
      });
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [fileCount]);

  return (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>
        Genome Information
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
        {genomeName}
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <List dense disablePadding>
        <ListItem>
          <ListItemIcon>
            <StorageIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Total Size" 
            secondary={loading ? <Skeleton width={60} /> : stats.totalSize}
          />
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <FolderIcon color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Total Files" 
            secondary={stats.fileCount} 
          />
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <DescriptionIcon color="success" />
          </ListItemIcon>
          <ListItemText 
            primary="Genome Files" 
            secondary={loading ? <Skeleton width={40} /> : stats.genomeFiles} 
          />
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <DataObjectIcon color="warning" />
          </ListItemIcon>
          <ListItemText 
            primary="Annotation Files" 
            secondary={loading ? <Skeleton width={40} /> : stats.annotationFiles} 
          />
        </ListItem>
        
        <ListItem>
          <ListItemIcon>
            <CalendarTodayIcon color="info" />
          </ListItemIcon>
          <ListItemText 
            primary="Last Updated" 
            secondary={loading ? <Skeleton width={100} /> : stats.lastUpdated} 
          />
        </ListItem>
      </List>
    </Paper>
  );
};

export default GenomeInfoPanel;