import type {SlimTokenLocation} from './boot';
import type {PackageVersionInfo} from './nfp-types';
import type {
	AuthSecret,
	SecretContract,
} from '@solar-republic/neutrino';

import {
	base64_to_buffer,
	buffer_to_text,
	concat,
	type JsonObject,
} from '@blake.regalia/belt';

import {
	query_contract_infer,
} from '@solar-republic/neutrino';

import {P_NS_SVG, S_CONTENT_TYPE_SCRIPT} from './constants';

export const load_script = async(
	si_package: string,
	h_query: {
		[si_key: string]: string;
		tag?: string;
	},
	k_contract: SecretContract,
	a_location: SlimTokenLocation,
	z_auth: AuthSecret
): Promise<SVGScriptElement | void> => {
	// submit query
	const [g_version, xc_code, s_error, h_response] = await query_contract_infer(k_contract, 'package_version', {
		package_id: si_package,
		token_id: a_location[2],
		...h_query,
	}, z_auth) as unknown as [PackageVersionInfo, number, string, JsonObject];

	// query error
	if(!g_version) return alert(s_error || JSON.stringify(h_response));

	// package is present
	const g_package = g_version.package;
	if(g_package?.data.bytes) {
		// create script
		const dm_script = document.createElementNS(P_NS_SVG, 'script');
		dm_script.setAttribute('type', S_CONTENT_TYPE_SCRIPT);

		// eslint-disable-next-line prefer-const
		let g_data = g_package.data;

		let atu8_bytes = base64_to_buffer(g_data.bytes);

		// eslint-disable-next-line prefer-const
		let s_encoding = g_data.content_encoding!;
		if(s_encoding) {
			const d_reader = new Blob([atu8_bytes]).stream()
				.pipeThrough<Uint8Array>(new DecompressionStream(s_encoding as CompressionFormat))
				.getReader();

			const a_chunks: Uint8Array[] = [];
			for(;;) {
				const {
					done: b_done,
					value: atu8_chunk,
				} = await d_reader.read();

				if(b_done) break;

				a_chunks.push(atu8_chunk);
			}

			atu8_bytes = concat(a_chunks);
		}

		dm_script.textContent = buffer_to_text(atu8_bytes);

		// return script
		return dm_script;
	}
};
