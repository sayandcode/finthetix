const esbuild = require('esbuild');
const path = require('node:path');

main();

async function main() {
  const entryPoint = path.join(__dirname, '../server/index.production.ts');
  const outfile = path.join(__dirname, '../dist/lambda.cjs');

  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    target: 'node20.10',
    outfile: outfile,
  });
}
