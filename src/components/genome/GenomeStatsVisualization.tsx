import React from 'react';
import { Box, Paper, Typography, Divider, useTheme } from '@mui/material';

interface GenomeStatsProps {
  genomeName: string;
  stats: {
    label: string;
    value: number;
    color: string;
  }[];
  totalFiles: number;
}

const GenomeStatsVisualization: React.FC<GenomeStatsProps> = ({ 
  genomeName, 
  stats, 
  totalFiles 
}) => {
  const theme = useTheme();

  return (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 1, 
        boxShadow: 1, 
        display: { xs: 'none', lg: 'block' } 
      }}
    >
      <Typography variant="h6" gutterBottom>
        File Distribution
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Visualization of file types for {genomeName}
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ height: 200, mt: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', height: '100%', alignItems: 'flex-end' }}>
          {stats.map((stat, index) => {
            // Calculate percentage of total for bar height
            const percentage = totalFiles > 0 ? (stat.value / totalFiles * 100) : 0;
            
            return (
              <Box 
                key={index} 
                sx={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mx: 1
                }}
              >
                <Typography variant="caption" sx={{ mb: 1 }}>
                  {stat.value}
                </Typography>
                <Box 
                  sx={{ 
                    height: `${Math.max(percentage, 5)}%`, 
                    width: '100%', 
                    backgroundColor: stat.color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.5s ease',
                    minHeight: '10px'
                  }} 
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1, 
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" align="center">
          Total Files: {totalFiles}
        </Typography>
      </Box>
    </Paper>
  );
};

// Custom hook to create stats visualization component
export const useGenomeStatsVisualization = (genomeName: string, files: any[]) => {
  const fileTypes = React.useMemo(() => {
    const typeCounts: Record<string, number> = {};
    
    files.forEach(file => {
      typeCounts[file.type] = (typeCounts[file.type] || 0) + 1;
    });
    
    return [
      { 
        label: 'Genome Files', 
        value: typeCounts['Genome File'] || 0, 
        color: '#1976d2' // primary blue
      },
      { 
        label: 'Annotation Files', 
        value: typeCounts['Annotation File'] || 0, 
        color: '#2e7d32' // success green
      },
      { 
        label: 'Index Files', 
        value: typeCounts['Index File'] || 0, 
        color: '#ed6c02' // warning orange
      },
      { 
        label: 'Other', 
        value: typeCounts['Other'] || 0, 
        color: '#9e9e9e' // gray
      }
    ];
  }, [files]);
  
  return (
    <GenomeStatsVisualization 
      genomeName={genomeName} 
      stats={fileTypes} 
      totalFiles={files.length} 
    />
  );
};

export default GenomeStatsVisualization;