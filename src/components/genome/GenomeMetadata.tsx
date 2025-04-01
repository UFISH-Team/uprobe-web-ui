import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Skeleton,
  Divider,
  Chip,
  Link,
  Button
} from '@mui/material';
import { API_BASE_URL } from '../config';
import { GenomeMetadataType } from '../types';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';

interface GenomeMetadataProps {
  genomeName: string;
}

const GenomeMetadata: React.FC<GenomeMetadataProps> = ({ genomeName }) => {
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<GenomeMetadataType | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true);
      
      // In a real application, fetch from API
      // For demo purposes, simulate API call
      setTimeout(() => {
        // Mock data for demonstration
        const mockMetadata: GenomeMetadataType = {
          name: genomeName,
          scientificName: genomeName === 'human' ? 'Homo sapiens' : 
                         genomeName === 'mouse' ? 'Mus musculus' : 
                         genomeName === 'zebrafish' ? 'Danio rerio' : 
                         `${genomeName} scientificus`,
          assemblyVersion: 'GRCh38.p14',
          totalSize: '3.2 GB',
          chromosomeCount: 24,
          geneCount: 20453,
          ncbiTaxonId: '9606',
          assemblyDate: '2013-12-17',
          source: 'NCBI RefSeq',
          description: 'Reference genome assembly with annotations for gene regions and transcripts.',
          lastModified: new Date().toLocaleDateString(),
          genomeFiles: [
            { type: 'Genome File', count: 4 },
            { type: 'Annotation File', count: 2 },
            { type: 'Index File', count: 3 },
          ]
        };
        
        setMetadata(mockMetadata);
        setLoading(false);
      }, 1500);
    };

    if (genomeName) {
      fetchMetadata();
    }
  }, [genomeName]);

  if (!genomeName) {
    return (
      <Paper sx={{ p: 3, borderRadius: 1, boxShadow: 1 }}>
        <Typography variant="body1" color="text.secondary" align="center">
          Select a genome to view metadata
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>
        Genome Metadata
      </Typography>
      
      {loading ? (
        <Box sx={{ mt: 2 }}>
          {[...Array(7)].map((_, index) => (
            <Box key={index} sx={{ display: 'flex', py: 1 }}>
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={200} sx={{ ml: 2 }} />
            </Box>
          ))}
        </Box>
      ) : metadata ? (
        <Box>
          <TableContainer>
            <Table size="small" aria-label="genome metadata">
              <TableBody>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold', width: '40%' }}>
                    Scientific Name
                  </TableCell>
                  <TableCell>{metadata.scientificName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                    Assembly Version
                  </TableCell>
                  <TableCell>{metadata.assemblyVersion}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                    Total Size
                  </TableCell>
                  <TableCell>{metadata.totalSize}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                    Chromosomes
                  </TableCell>
                  <TableCell>{metadata.chromosomeCount}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                    Gene Count
                  </TableCell>
                  <TableCell>{metadata.geneCount.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                    NCBI Taxon ID
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${metadata.ncbiTaxonId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      {metadata.ncbiTaxonId}
                      <LinkIcon fontSize="small" />
                    </Link>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                    Assembly Date
                  </TableCell>
                  <TableCell>{metadata.assemblyDate}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                    Source
                  </TableCell>
                  <TableCell>{metadata.source}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Description
          </Typography>
          <Typography variant="body2" paragraph>
            {metadata.description}
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            File Distribution
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {metadata.genomeFiles.map((item, index) => (
              <Chip 
                key={index}
                label={`${item.type} (${item.count})`}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<DownloadIcon />}
            >
              Download Metadata
            </Button>
            <Typography variant="caption" color="text.secondary">
              Last updated: {metadata.lastModified}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Typography variant="body1" color="text.secondary" align="center">
          No metadata available for this genome
        </Typography>
      )}
    </Paper>
  );
};

export default GenomeMetadata;