import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

// Read the real authoring documents at build time; the slide needs no filesystem access.
export function creatorSkillDocuments(): Plugin {
  const moduleId = 'virtual:creator-skill-documents';
  const resolvedId = `\0${moduleId}`;
  let directory: string;
  function markdownFiles(root: string): string[] {
    return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
      const file = path.join(root, entry.name);
      return entry.isDirectory() ? markdownFiles(file) : entry.name.endsWith('.md') ? [file] : [];
    });
  }
  return {
    name: 'creator-skill-documents',
    configResolved(config) { directory = path.resolve(config.root, 'creator-skill'); },
    resolveId(id) { if (id === moduleId) return resolvedId; },
    load(id) {
      if (id !== resolvedId) return;
      const documents = markdownFiles(directory).map(file => {
        this.addWatchFile(file);
        return { path: path.relative(directory, file).replaceAll('\\', '/'), content: fs.readFileSync(file, 'utf8') };
      }).sort((a, b) => a.path === 'SKILL.md' ? -1 : b.path === 'SKILL.md' ? 1 : a.path.localeCompare(b.path));
      return `export default ${JSON.stringify(documents)};`;
    },
    configureServer(server) {
      server.watcher.add(directory);
      const refresh = (file: string) => {
        if (!file.startsWith(directory + path.sep) || !file.endsWith('.md')) return;
        const module = server.moduleGraph.getModuleById(resolvedId);
        if (module) {
          server.moduleGraph.invalidateModule(module);
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('add', refresh).on('change', refresh).on('unlink', refresh);
    },
  };
}
