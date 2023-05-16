import {microWeb} from '@nfps.dev/rollup-plugin-microweb';

import {defineConfig} from 'rollup';

export default defineConfig({
	input: 'src/main.ts',
	output: {
		dir: 'dist',
		format: 'esm',
		entryFileNames: `[name]${'development' !== process.env['NODE_ENV']? '.min': ''}.mjs`,
		sourcemap: false,
	},
	external: [
		'@blake.regalia/belt',
		'@solar-republic/neutrino',
	],
	plugins: [
		microWeb(),
	],
});
