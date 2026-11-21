import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const packageLock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));

if (packageJson.dependencies?.firebase || packageJson.devDependencies?.firebase) {
  throw new Error('Firebase must not be a direct dependency.');
}
if (packageLock.packages?.['']?.dependencies?.firebase || packageLock.packages?.['']?.devDependencies?.firebase) {
  throw new Error('Firebase must not remain in the npm lockfile root package.');
}
if (Object.keys(packageLock.packages || {}).some((name) => name.startsWith('node_modules/firebase') || name.startsWith('node_modules/@firebase/'))) {
  throw new Error('Firebase packages remain in the npm lockfile.');
}
if (fs.existsSync(path.join(root, 'src/firebase.ts')) || fs.existsSync(path.join(root, 'firebase-blueprint.json'))) {
  throw new Error('Legacy Firebase source/config files remain.');
}

const sourceRoots = ['src', 'server.ts'];
const excludedFiles = new Set(['scripts/check-firebase-free.mjs']);
const firebaseReference = /(?:from\s*['"]firebase\/|require\(['"]firebase\/|FIREBASE_[A-Z0-9_]+|VITE_FIREBASE_[A-Z0-9_]+)/u;

function walk(entry) {
  const absolute = path.join(root, entry);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [entry];
  return fs.readdirSync(absolute, { withFileTypes: true })
    .filter((item) => !item.isDirectory() || !['node_modules', 'dist', '.git'].includes(item.name))
    .flatMap((item) => walk(path.join(entry, item.name)));
}

for (const entry of sourceRoots.flatMap(walk)) {
  if (excludedFiles.has(entry)) continue;
  const content = fs.readFileSync(path.join(root, entry), 'utf8');
  if (firebaseReference.test(content)) {
    throw new Error('Firebase runtime reference remains in ' + entry);
  }
}

console.log('Firebase decommission check passed');
