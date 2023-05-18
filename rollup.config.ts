import {microWeb} from '@nfps.dev/rollup-plugin-microweb';

import {defineConfig} from 'rollup';

export default defineConfig({
	input: 'src/main.ts',
	output: {
		dir: 'dist/min',
		format: 'esm',
		sourcemap: false,
	},
	external: [
		'@blake.regalia/belt',
		'@solar-republic/neutrino',
	],
	plugins: [
		microWeb({
			compilerOptions: {
				outDir: 'dist/min',
				declarationDir: 'dist/min',
			},
		}),
	],
});
