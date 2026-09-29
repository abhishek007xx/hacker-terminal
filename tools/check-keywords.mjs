import { readFileSync } from 'fs';

const astro = readFileSync('src/pages/index.astro', 'utf8').toLowerCase();
const dist = readFileSync('dist/index.html', 'utf8').toLowerCase();
const llms = readFileSync('public/llms.txt', 'utf8').toLowerCase();

const keywords = [
  'hacker typer',
  'fake hacking',
  'hacking prank',
  'hacker',
  'hacker typing',
  'hacker type',
  'hackertyper',
  'fake hacking screen',
  'hacker prank',
  'fake hacker',
  'hacked screen'
];

function count(haystack, needle) {
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

console.log('=== KEYWORD COVERAGE AUDIT ===');
keywords.forEach(kw => {
  const inAstro = count(astro, kw);
  const inDist = count(dist, kw);
  const inLlms = count(llms, kw);
  console.log(
    kw.padEnd(22),
    '| Astro:', inAstro.toString().padEnd(3),
    '| Live HTML (dist):', inDist.toString().padEnd(3),
    '| llms.txt:', inLlms.toString().padEnd(3)
  );
});
