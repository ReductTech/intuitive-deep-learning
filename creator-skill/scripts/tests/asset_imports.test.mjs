import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {checkAssetImports} from '../checks/asset_imports.mjs';

test('reject runtime assets across import forms without flagging URL helpers or comments',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'asset-imports-'));
  try {
    fs.mkdirSync(path.join(root,'modules/A'),{recursive:true});
    fs.writeFileSync(path.join(root,'modules/A/assets.ts'),'export const url = () => "";');
    fs.writeFileSync(path.join(root,'modules/A/page.tsx'),`import {url} from './assets';
      // import ignored from './assets/not-real.json';
      const example = "import text from './assets/example.json'";
      import small from './assets/config.json';
      export {default} from './assets/picture.png?url';
      const data = import('./assets/big.json');
      const text = require('./assets/document.txt');
      const image = new URL('./assets/photo.jpg', import.meta.url);
      const files = import.meta.glob('./assets/*.json');`);
    fs.writeFileSync(path.join(root,'modules/A/style.css'),`.page{background:url('./assets/image.png')}\n/* ordinary styling */`);
    const errors=checkAssetImports(root);
    assert.equal(errors.length,7);
    assert.ok(errors.every(error=>error.specifier.includes('/assets/')));
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
