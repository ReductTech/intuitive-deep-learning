import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const config=await fs.readFile('deploy/5175/nginx.conf','utf8'),doc=await fs.readFile('deploy/5175/README.md','utf8'),service=await fs.readFile('deploy/5175/shuku-idl.service','utf8');
assert.match(config,/listen 5175 ssl;/);assert.match(config,/listen \[::\]:5175 ssl;/);assert(!/listen[^;]*5173/.test(config));assert(!/listen[^;]*443/.test(config));assert.match(config,/proxy_pass http:\/\/127\.0\.0\.1:8010;/);assert.match(config,/root \/var\/www\/shuku-idl\/current;/);assert.match(config,/proxy_set_header Host \$http_host;/);assert.match(config,/client_max_body_size 101m;/);assert.match(config,/try_files \$uri \$uri\/ \/index\.html;/);
assert(doc.includes('https://39.105.207.234:5175'));assert(doc.includes('SHUKU_PUBLIC_ORIGIN'));assert(doc.includes('443'));assert.match(service,/EnvironmentFile=\/etc\/shuku-idl\/runtime.env/);assert.match(service,/ExecStart=.*shuku_backend serve/);
assert.equal(await fs.access('deploy/5173/nginx.conf').then(()=>true,()=>false),false);
console.log('PASS HTTPS 5175 deployment: single public port, unchanged static release/backend, forwarded port, upload limit, SPA routing, origin and rollback guidance');
