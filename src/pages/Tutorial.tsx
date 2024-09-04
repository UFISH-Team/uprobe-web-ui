import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Tutorial: React.FC = () => {
  return (
    <Box sx={{ padding: 4, maxWidth: '900px', margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom>
        U-Probe Tutorial 📚:
      </Typography>

      {/* Section 1: Getting Started */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body1">1. Getting Started 🚀</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Welcome to U-Probe, your universal tool for designing and optimizing probes for various applications, including fluorescence in situ hybridization (FISH). 🎯
          </Typography>
          <ul>
            <li>Navigate to the home page and click on "Start Designing" to begin your probe design process. 🖱️</li>
            <li>Familiarize yourself with the interface, including the Design, Genome, and Task tabs in the top navigation. 🧭</li>
          </ul>
        </AccordionDetails>
      </Accordion>

      {/* Section 2: Designing Your Probe */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body1">2. Designing Your Probe ✏️</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>Follow these steps to create a custom probe:</Typography>
          <ol>
            <li>Select your target organism and genome assembly from the dropdown menus. 🧬</li>
            <li>Input your target sequence or gene of interest. 🔍</li>
            <li>Specify desired probe length and any additional parameters (e.g., GC content, melting temperature). 📏</li>
            <li>Click "Generate Probe" to view potential probe sequences. 🛠️</li>
          </ol>
        </AccordionDetails>
      </Accordion>

      {/* Section 3: Optimizing Your Probe */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body1">3. Optimizing Your Probe 🔧</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>U-Probe offers various tools to optimize your probe design:</Typography>
          <ul>
            <li>Use the "View Examples" feature to see successful probe designs for similar applications. 👀</li>
            <li>Adjust parameters in real-time to see how they affect probe specificity and efficiency. ⚙️</li>
            <li>Utilize our built-in BLAST tool to check for off-target binding. 🧫</li>
          </ul>
        </AccordionDetails>
      </Accordion>

      {/* Section 4: Uploading Custom Data */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body1">4. Uploading Custom Data 📂</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>For advanced users, U-Probe allows you to upload custom genomic data:</Typography>
          <ol>
            <li>Click on the "Upload Data" button on the home page. 📤</li>
            <li>Select your file format (FASTA, GFF, etc.) and upload your data. 📑</li>
            <li>Use your custom data in conjunction with our probe design tools for highly specific results. 🎨</li>
          </ol>
        </AccordionDetails>
      </Accordion>

      {/* Section 5: Analyzing Results */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body1">5. Analyzing Results 🧪</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>After generating your probe:</Typography>
          <ul>
            <li>Review the probe sequence, predicted binding sites, and potential off-target effects. 🔍</li>
            <li>Use our visualization tools to see where your probe binds within the genome. 🗺️</li>
            <li>Export your results for use in your experiments or further analysis. 📊</li>
          </ul>
        </AccordionDetails>
      </Accordion>

      {/* Help Section */}
      <Card sx={{ marginTop: 4 }}>
        <CardContent>
          <Typography variant="body1">Need Help? ❓</Typography>
          <Typography>
            If you have any questions or encounter issues while using U-Probe, please don't hesitate to contact our support team or refer to our detailed documentation. 📞📄
          </Typography>
          <Button variant="contained" sx={{ marginTop: 2 }}>
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Tutorial;
