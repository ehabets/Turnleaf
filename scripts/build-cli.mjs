import { build } from 'esbuild';
import { chmod, mkdir } from 'node:fs/promises';
// The command line is not part of the extension package: .vscodeignore leaves dist/cli.js out.
await mkdir('dist', { recursive: true });
const result = await build({ entryPoints: ['src/cli/turnleaf.ts'], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: 'dist/cli.js', external: ['vscode'], metafile: true, sourcemap: false,
  banner: { js: '#!/usr/bin/env node\n/* Turnleaf command line. Includes MIT-licensed adaptations from olcli; see THIRD_PARTY_NOTICES.md. */' } });
const inputs = Object.keys(result.metafile.inputs);
if (inputs.some(path => path.startsWith('src/extension/') || path.includes('node_modules/vscode'))) throw new Error('Editor code entered the command-line bundle.');
if (inputs.some(path => path.includes('test/reference/'))) throw new Error('Test-only reference code entered the command-line bundle.');
if (inputs.some(path => /(?:^|\/)conf\//.test(path) || path.endsWith('/config.js'))) throw new Error('A credential configuration store entered the command-line bundle.');
if (['src/core/git.ts', 'src/core/sync.ts', 'src/core/workflow.ts'].some(path => result.metafile.outputs['dist/cli.js']?.inputs[path]?.bytesInOutput)) throw new Error('Legacy Git sync code entered the command-line bundle.');
await chmod('dist/cli.js', 0o755);
console.log('Built dist/cli.js.');
