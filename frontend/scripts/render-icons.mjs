import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const svg = readFileSync(join(dir, 'logo.svg'));

function writePng(size, filename) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  writeFileSync(join(dir, filename), resvg.render().asPng());
}

writePng(512, 'logo.png');
writePng(512, 'icon-512.png');
writePng(192, 'icon-192.png');
console.log('Wrote logo.png, icon-512.png, icon-192.png');
