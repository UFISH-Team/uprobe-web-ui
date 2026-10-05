import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const module = { exports: {} };
vm.runInNewContext(ts.transpile(fs.readFileSync('src/utils/attributeFilters.ts', 'utf8'), { module: ts.ModuleKind.CommonJS }), { exports: module.exports, module });
const {parseAttributeFilter: parse, buildAttributeFilter: build} = module.exports;
const plain = value => JSON.parse(JSON.stringify(value));
assert.equal(build(parse('score','fold_score'), 'score', false), '');
for (const expression of ['score > -1e-3', 'score <= 15', 'score >= 0 & score < 40', '(score > 1 | score < -1)', 'score > 1 & other < 5']) {
 const attr = parse('score','fold_score',expression);
 assert.equal(build(attr,'changed_name',false), expression);
}
const gc=parse('target_GC_content','gc_content','target_GC_content >= 0.4 & target_GC_content < 0.6');
assert.equal(gc.min,40); assert.equal(gc.max,60); assert.equal(gc.maxInclusive,false);
assert.equal(build({...gc,filterExpression:undefined},'wrong_name',true),'target_GC_content >= 0.4 & target_GC_content < 0.6');
assert.equal(build({originalName:'score',min:5},'other',false),'score >= 5');
assert.equal(build({originalName:'score',max:0,maxInclusive:false},'other',false),'score < 0');
assert.equal(build({...gc,filterEnabled:false},'other',true),'');
const fixture = {
 'Test': {
  extracts: {target_region:{source:'exon',length:40,overlap:39}},
  probes: {mRNA:{template:'{part1}',parts:{part1:{expr:'target_region'}}}},
  attributes: {
   target_GC_content:{target:'target_region',type:'gc_content'},
   custom_tm:{target:'mRNA.part1',type:'annealing_temperature'},
   calc_only:{target:'mRNA',type:'fold_score'}
  },
  post_process:{filters:{target_GC_content:{condition:'target_GC_content > 0.4'},custom_tm:{condition:'custom_tm <= 44'},composite:{condition:'target_GC_content > 0.4 | custom_tm < 36'}}}
 }
};
const source=fs.readFileSync('src/pages/DesignWorkflow.tsx','utf8');
const loopStart=source.indexOf('        for (const [name, config] of Object.entries(builtinData))');
const loopEnd=source.indexOf('        setBuiltinProbeTypes(builtinTypes);',loopStart);
const snakeStart=source.indexOf('  const getSnakeCaseAttrName =');
const snakeEnd=source.indexOf('\n  };',snakeStart)+6;
const snake=vm.runInNewContext(ts.transpile(source.slice(snakeStart,snakeEnd)+'\ngetSnakeCaseAttrName'));
const exportStart=source.indexOf('    // 1. Filters',source.indexOf('const generateTaskConfig'));
const exportEnd=source.indexOf('    // 2.',exportStart);
function roundtrip(data) {
 const ctx={builtinData:data,builtinTypes:[],YAML:require('yaml'),getSnakeCaseAttrName:snake,parseAttributeFilter:parse,extractParametersFromYaml:()=>({}),console};
 vm.runInNewContext(ts.transpile(source.slice(loopStart,loopEnd),{target:ts.ScriptTarget.ES2020}),ctx);
 for(const type of ctx.builtinTypes) {
  const output={};
  vm.runInNewContext(ts.transpile(source.slice(exportStart,exportEnd),{target:ts.ScriptTarget.ES2020}),{enableBasicFilter:true,selectedCustomType:type,post_process:output,getSnakeCaseAttrName:snake,buildAttributeFilter:build});
  assert.deepEqual(plain(output.filters||{}),plain(data[type.name].post_process?.filters||{}),type.name+' filter roundtrip');
 }
}
roundtrip(fixture);
if(process.argv[2]) roundtrip(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));
console.log('PASS: strict/one-sided bounds, GC units, expressions, disabled filters, original keys, frontend roundtrip');
