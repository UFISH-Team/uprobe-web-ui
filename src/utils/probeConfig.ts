import { samplingStep } from './sampling';
import { parseAttributeFilter } from './attributeFilters';
export const attributeType = (name: string) => ({gcContent:'gc_content',foldScore:'fold_score',tm:'annealing_temperature',selfMatch:'self_match',mappedGenes:'mapped_genes',kmerCount:'kmer_count',mappedSites:'mapped_sites'} as Record<string,string>)[name] || (name === 'tm' ? 'annealing_temperature' : name);
export function restoreTemplate(config: any) {
  const probes = JSON.parse(JSON.stringify(config.probes || {}));
  const region = config.target_sequence || config.extracts?.target_region || {};
  const targetConfig = { ...region, source: region.source || 'exon', sequence: region.sequence || '', attributes: { ...(region.attributes || {}) } };
  if (region.length !== undefined) { targetConfig.step = samplingStep(region); delete targetConfig.overlap; }
  const filters = config.post_process?.filters || {};
  const used = new Set<string>();
  const aliases: Record<string,{category:string;field:string}> = {n_trans:{category:'Sequence Metadata',field:'n_trans'}};
  const hydrate = (attrs: any, target: string) => Object.fromEntries(Object.entries(attrs || {}).map(([name, data]) => {
    const attr = data as any;
    const originalName = attr.originalName || (target === 'target_region' ? 'target' : target.replace(/\./g, '_')) + '_' + (name === 'tm' ? 'tm' : attributeType(name));
    const rule = filters[originalName];
    if (rule) used.add(originalName);
    aliases[originalName] = {category: target === 'target_region' ? 'Target Sequence' : target.includes('.') ? 'Part Attributes' : 'Probe Attributes', field:originalName};
    return [name,{...attr,enabled:attr.enabled !== false, ...(rule?.condition !== undefined ? parseAttributeFilter(originalName, attributeType(name), rule.condition) : {}), originalName}];
  }));
  targetConfig.attributes = hydrate(targetConfig.attributes, 'target_region');
  for (const [name, data] of Object.entries(probes)) {
    const probe = data as any;
    probe.attributes = hydrate(probe.attributes, name);
    for (const [part, value] of Object.entries(probe.parts || {})) (value as any).attributes = hydrate((value as any).attributes, `${name}.${part}`);
  }
  for (const [name, data] of Object.entries(config.attributes || {})) {
    const attr = data as any;
    const target = attr.target?.replace(/:/g,'.');
    if (!target) continue;
    if (target.startsWith('target_parts.')) {
      if (!targetConfig.layout?.parts?.[target.slice('target_parts.'.length)]) throw new Error(`Attribute ${name} references missing target part ${target}`);
      continue;
    }
    const value = {...attr,...parseAttributeFilter(name,attr.type,filters[name]?.condition),enabled:true,originalType:attr.type};
    const scope = target === 'target_region' ? targetConfig : target.includes('.') ? probes[target.split('.')[0]]?.parts?.[target.split('.')[1]] : probes[target];
    if (!scope) throw new Error(`Attribute ${name} references missing sequence ${target}`);
    scope.attributes ||= {};
    const uiName = Object.entries({gcContent:'gc_content',foldScore:'fold_score',tm:'annealing_temperature',selfMatch:'self_match',mappedGenes:'mapped_genes',kmerCount:'kmer_count',mappedSites:'mapped_sites'}).find(([,type]) => type===attr.type)?.[0] || attr.type;
    scope.attributes[scope.attributes[uiName] ? name : uiName] = value;
    used.add(name); aliases[name]={category:target==='target_region'?'Target Sequence':target.includes('.')?'Part Attributes':'Probe Attributes',field:name};
  }
  const sortDefaults:any[]=[];
  for (const [key,order] of [['is_ascending','asc'],['is_descending','desc']]) {
    const fields=config.post_process?.sorts?.[key];
    for (const field of typeof fields==='string'?[fields]:fields || []) if (!sortDefaults.some(x=>x.field===field)) sortDefaults.push({...aliases[field] || {category:'Sequence Metadata',field},order});
  }
  return {probes,targetConfig,sortDefaults,extraFilters:Object.fromEntries(Object.entries(filters).filter(([key])=>!used.has(key))) as Record<string, any>};
}
export function validateProbeDependencies(probes: any[]) {
  const names=probes.map((p,i)=>p.name || `probe_${i+1}`);
  if(names.some(name=>!/^[_a-zA-Z]\w*$/.test(name))) return 'Probe names must be identifiers: letters, digits and underscores, starting with a letter or underscore.';
  if(new Set(names).size!==names.length) return 'Probe names must be unique.';
  const ids=new Set(probes.map(p=>p.id));
  const visiting=new Set<string>(),done=new Set<string>();
  const visit=(id:string):boolean=> {
    if(visiting.has(id)) return false;
    if(done.has(id)) return true;
    visiting.add(id);
    const probe=probes.find(p=>p.id===id);
    for(const part of probe?.parts || []) if(part.source==='probe' && (!ids.has(part.sourceProbeId) || !visit(part.sourceProbeId)))return false;
    visiting.delete(id);done.add(id);return true;
  };
  return probes.every(p=>visit(p.id)) ? '' : 'Probe references must exist and must not form a cycle.';
}

export function exportAttribute(value: any, name: string, target: string) {
  const type = value.originalType || attributeType(name);
  const result: any = { target, type };
  for (const key of ['min_mapq','kmer_len','threads','size','temperature','sodium','magnesium','dntp','dna_conc']) {
    if (value[key] !== undefined) result[key] = value[key];
  }
  if (value.aligner) result.aligner = value.aligner.toLowerCase();
  if (type === 'mapped_genes' && result.min_mapq === undefined && value.aligner) result.min_mapq = 30;
  if (type === 'kmer_count') { result.threads ??= 10; result.size ??= '1G'; }
  return result;
}
