import { loadConfigFromFile, mergeConfig } from 'vite';
import path from 'path';

const configFile = path.resolve('/home/ubuntu/renta-facil-tpymes/vite.config.ts');
const result = await loadConfigFromFile({ command: 'serve', mode: 'development' }, configFile);
const merged = mergeConfig(result?.config || {}, { server: { middlewareMode: true }, appType: 'spa' });

console.log('Has plugins:', !!merged.plugins?.length);
console.log('Has alias:', !!merged.resolve?.alias);
console.log('Root:', merged.root);
console.log('Alias @:', merged.resolve?.alias?.['@']);
