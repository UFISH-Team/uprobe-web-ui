import { YAMLParameters } from '../types';

/**
 * Parse YAML content into a JavaScript object
 * @param yamlContent The YAML content to parse
 * @returns The parsed YAML content or null if parsing fails
 */
export const parseYamlContent = (yamlContent: string) => {
  try {
    const yaml = require('js-yaml');
    const parsed = yaml.load(yamlContent);
    return parsed;
  } catch (e) {
    console.error('Error parsing YAML:', e);
    return null;
  }
};

/**
 * Extract parameters from YAML content
 * @param yamlContent The YAML content to extract parameters from
 * @returns The extracted parameters or null if extraction fails
 */
export const extractParametersFromYaml = (yamlContent: string): YAMLParameters | null => {
  const parsed = parseYamlContent(yamlContent);
  if (!parsed) return null;

  const parameters: YAMLParameters = {};
  
  // Extract target length from YAML
  if (parsed.target_sequence_length) {
    parameters.targetLength = parsed.target_sequence_length;
  }

  // Extract barcode count from probes
  if (parsed.probes) {
    const barcodeSet = new Set<string>();
    Object.values(parsed.probes).forEach((probe: any) => {
      if (probe.parts) {
        Object.values(probe.parts).forEach((part: any) => {
          if (part.expr && part.expr.includes('encoding')) {
            const barcodeMatch = part.expr.match(/'([^']+)'/);
            if (barcodeMatch) {
              barcodeSet.add(barcodeMatch[1]);
            }
          }
        });
      }
    });
    parameters.barcodeCount = barcodeSet.size;
  }

  return parameters;
}; 