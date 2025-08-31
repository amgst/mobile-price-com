import { copyFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const source = '_redirects';
const destination = 'dist/public/_redirects';

// Ensure the destination directory exists
mkdirSync(dirname(destination), { recursive: true });

// Copy the file
copyFileSync(source, destination);

console.log('_redirects file copied successfully');