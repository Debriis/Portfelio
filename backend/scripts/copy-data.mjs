import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist/backend/src/data', { recursive: true });
await copyFile('src/data/portfolio.json', 'dist/backend/src/data/portfolio.json');
