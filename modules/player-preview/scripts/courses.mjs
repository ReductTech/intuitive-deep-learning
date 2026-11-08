import fs from 'node:fs';
import path from 'node:path';

export function readCourses(root) {
  return fs.readdirSync(root, {withFileTypes: true}).flatMap(item => {
    if (!item.isDirectory() || !/^[a-f0-9-]{36}$/.test(item.name)) return [];
    const directory = path.join(root, item.name);
    const file = path.join(directory, 'outlines.json');
    if (!fs.existsSync(file)) return [];
    const outline = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
    for (const entry of [outline.entry, outline.ppt?.entry].filter(Boolean)) {
      const resolved = path.resolve(directory, entry);
      if (!resolved.startsWith(directory + path.sep)) throw Error('课程入口越界：' + entry);
    }
    return [{...outline, id: item.name, directory, assetId: outline.moduleIdentity?.id || item.name}];
  }).sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
}

// Follow the platform builder's named-export convention, with default exports supported too.
export function entryExport(course, entry) {
  const name = path.basename(entry, path.extname(entry));
  const source = fs.readFileSync(path.join(course.directory, entry), 'utf8');
  if (/export\s+default\b/.test(source)) return 'default';
  return new RegExp(`(?:function|const|class)\\s+${name}\\b`).test(source)
    ? name : name.charAt(0).toUpperCase() + name.slice(1);
}
