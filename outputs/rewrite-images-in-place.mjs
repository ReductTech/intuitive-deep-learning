import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const skill = path.join(root, '../creator-skill');
const {planReferences, loadTypeScript} = await import(pathToFileURL(path.join(skill, 'scripts/media/rewrite_asset_paths.mjs')));
const ts = loadTypeScript(root);
const conversion = JSON.parse(fs.readFileSync(path.join(root, 'outputs/images-in-place.json'), 'utf8'));
if (!conversion.complete) throw Error('Image conversion is still running');
const courses = new Map();
for (const row of conversion.images.filter(row => row.status === 'converted' && row.source !== row.target)) {
  const parts = row.source.split('/');
  if (parts[0] !== 'modules') throw Error('Unexpected image scope');
  if (parts[2] !== 'assets') continue;
  const changes = courses.get(parts[1]) ?? new Map();
  changes.set(parts.slice(3).join('/'), row.target.split('/').slice(3).join('/'));
  courses.set(parts[1], changes);
}
const reports = [], plans = [];
for (const [module, changes] of courses) {
  const course = path.join(root, 'modules', module);
  const plan = planReferences({course, changes, ts});
  reports.push({module, mappings: changes.size, updatedFiles: plan.updates.map(row => path.relative(root, row.file)),
    references: plan.matches.length, unresolved: plan.unresolved, unverified: plan.unverified});
  plans.push(plan);
}
const blocked = reports.some(report => report.unresolved.length);
const apply = process.argv.includes('--apply');
if (apply && !blocked) {
  for (const plan of plans) for (const row of plan.updates) {
    if (fs.readFileSync(row.file, 'utf8') !== row.before) throw Error('Source changed while planning: ' + row.file);
  }
  for (const plan of plans) for (const row of plan.updates) fs.writeFileSync(row.file, row.after);
}
const result = {applied: apply && !blocked, blocked, courses: reports};
fs.writeFileSync(path.join(root, 'outputs/image-reference-checks.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
process.exitCode = blocked ? 1 : 0;
