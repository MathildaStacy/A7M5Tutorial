import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const review = process.argv.includes('--review');
const out = review ? 'build/model-review/camera3d' : 'android/app/src/main/assets/camera3d';
const bundle = await build({
  entryPoints: ['src/camera3d/main.ts'],
  define: {__MODEL_REVIEW__: String(review)},
  bundle: true,
  write: false,
  minify: true,
  target: 'chrome100',
  legalComments: 'inline',
  plugins: [
    {
      name: 'inline-transcoder',
      setup(b) {
        b.onResolve({filter: /\?asset$/}, (args) => ({
          path: require.resolve(args.path.slice(0, -6)),
          namespace: 'binary',
        }));
        b.onLoad({filter: /.*/, namespace: 'binary'}, async (args) => ({
          contents: await fs.readFile(args.path),
          loader: 'dataurl',
        }));
      },
    },
  ],
});
const template = await fs.readFile('src/camera3d/shell.html', 'utf8');
await fs.mkdir(out, {recursive: true});
await fs.writeFile(
  path.join(out, 'index.html'),
  template.replace(
    '<!-- bundle -->',
    () =>
      '<script>' + bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script') + '</script>',
  ),
);
for (const name of ['a7v.glb', 'a7v_lod1.glb', 'env.hdr'])
  await fs.copyFile('assets/camera/' + name, path.join(out, name));
await fs.cp('assets/fonts', path.join(out, '../fonts'), {recursive: true});
