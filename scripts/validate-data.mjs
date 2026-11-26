// Validates the research JSON files in public/data so that content edits cannot silently break the site.
// Run: npm run validate:data
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../public/data/', import.meta.url).pathname;
const errors = [];
const load = (f) => {
  try { return JSON.parse(readFileSync(join(dir, f), 'utf8')); }
  catch (e) { errors.push(`${f}: invalid JSON — ${e.message}`); return null; }
};
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) load(f);

const STATUSES = ['completed', 'preliminary', 'in-progress', 'planned', 'requires-validation'];

const exp = load('experiments.json');
exp?.experiments.forEach((e) => {
  if (!e.id || !e.title) errors.push(`experiments.json: experiment missing id/title`);
  if (!STATUSES.includes(e.validationStatus)) errors.push(`experiments.json: ${e.id} has invalid validationStatus "${e.validationStatus}"`);
  if (!e.provenance?.source) errors.push(`experiments.json: ${e.id} missing provenance.source`);
  e.tables?.forEach((t) => t.rows.forEach((r, i) => t.columns.forEach((c) => {
    if (c.numeric && typeof r[c.key] !== 'number') errors.push(`experiments.json: ${e.id}/${t.id} row ${i} column "${c.key}" should be a number`);
  })));
});

const tl = load('timeline.json');
tl?.milestones.forEach((m) => { if (!STATUSES.includes(m.status)) errors.push(`timeline.json: ${m.id} has invalid status "${m.status}"`); });

const mod = load('modalities.json');
mod?.modalities.forEach((m) => { if (m.integrated) errors.push(`modalities.json: ${m.id} marked integrated — only set this when a physical integrated instrument exists`); });

const rt = load('radiative-transfer.json');
if (rt) {
  const n = rt.parameters.reduce((a, p) => a * p.values.length, 1);
  if (n !== rt.expectedConfigurations) errors.push(`radiative-transfer.json: parameter grid has ${n} configurations, expected ${rt.expectedConfigurations}`);
  if (rt.lutFile && !existsSync(join(dir, '..', rt.lutFile))) errors.push(`radiative-transfer.json: lutFile "${rt.lutFile}" does not exist in public/`);
}

const ms = load('manuscript.json');
ms?.files.forEach((f) => { if (f.path && !existsSync(join(dir, '..', f.path))) errors.push(`manuscript.json: file "${f.path}" listed but not present in public/`); });

const arch = load('architecture.json');
if (arch && arch.nodes.length !== 10) errors.push(`architecture.json: expected 10 nodes, found ${arch.nodes.length}`);

if (errors.length) { console.error('Data validation failed:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log('Research data OK.');
