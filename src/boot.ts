import type {JsonObject} from '@blake.regalia/belt';

import type {
	Base64,
	QueryPermit,
	HttpsUrl,
	SecretBech32,
	SecretContract,
} from '@solar-republic/neutrino';

import {
	base64_to_buffer,
	buffer_to_text,
	concat,
} from '@blake.regalia/belt';

import {
	queryContract,
	secretContract,
} from '@solar-republic/neutrino';

import {P_NS_NFP, P_NS_SVG, S_CONTENT_TYPE_SCRIPT} from './constants';


type ConciseTokenLocation = [
	si_chain: string,
	sa_contract: SecretBech32,
	si_token: string,
];

interface PackageVersionInfo {
	package?: {
		data: {
			bytes: Base64;
			content_type?: string;
			content_encoding?: string;
			metadata?: string;
		};
		tags?: string[];
		metadata?: string;
	};
}

let k_contract: SecretContract;
let a_location: ConciseTokenLocation;
let si_storage_permit: string;
let si_storage_vk: string;
let g_permit: QueryPermit;
let sh_vk: string;
let xc_busy: 0 | 1 = 0;

const nfp_tags = (si_tag: string) => document.getElementsByTagNameNS(P_NS_NFP, si_tag);

const nfp_attr = (dm_element: Element, si_attr: string) => dm_element.getAttributeNS(P_NS_NFP, si_attr);

const import_query_key_prompt = (): QueryPermit | string | void => {
	// prompt for key
	const sx_import = prompt(`NFP requires either (1) the owner's viewing key or (2) a query permit signed by the token owner; paste one here to unlock\n\nPermits should be JSON in shape of '{"params":..,"signature":..}'`)?.trim();

	// something was entered
	if(sx_import) {
		// attempt to parse as json
		let h_input!: QueryPermit;
		try {
			h_input = JSON.parse(sx_import);
		}
		catch(e_parse) {}

		// parsed as JSON object; use as permit
		if('object' === typeof h_input) {
			g_permit = h_input;
		}
		// treat text as viewing key
		else {
			sh_vk = sx_import;
		}
	}
};


const hydrate_nfp = async() => {
	// find scripts
	const a_srcs = Array.from(nfp_tags('script'))
		.map(dm => [dm, nfp_attr(dm, 'src')?.split('?')]) as [Element, [string, string?]][];

	for(const [dm_element, [si_package, sx_params]] of a_srcs) {
		// prep package version query
		const g_package_version = {
			package_id: si_package,
			token_id: a_location[2],
			...Object.fromEntries(new URLSearchParams(sx_params || '').entries()),
		};

		// adjust for query method
		const g_query = (g_permit
			? {
				with_permit: {
					package_version: g_package_version,
					permit: g_permit,
				},
			}
			: {
				package_version: {
					...g_package_version,
					viewing_key: sh_vk,
				},
			}) as JsonObject;

		// submit query
		const [xc_code, s_error, h_response] = await queryContract<{
			package_version?: PackageVersionInfo;
			with_permit?: {
				package_version: PackageVersionInfo;
			};
		}>(k_contract, g_query);

		// query error
		if(xc_code) return alert(s_error);

		// destructure response
		let {
			// eslint-disable-next-line prefer-const
			with_permit: g_with,
			package_version: g_version,
		} = h_response!;  // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion

		// permit response
		if(g_with) g_version = g_with.package_version;

		// invalid response
		if(!g_version) return alert('Failed to query contract using provided auth token');

		// package is present
		const g_package = g_version?.package;
		if(g_package?.data.bytes) {
			// permit or vk worked, save it to local storage
			localStorage.setItem(...(g_permit
				? [si_storage_permit, JSON.stringify(g_permit)]
				: [si_storage_vk, sh_vk]) as [string, string]);

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
					.pipeThrough<Uint8Array>(new DecompressionStream(s_encoding))
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

			// inject script
			dm_element.replaceWith(dm_script);
		}
	}
};


const resolve_permit = () => {
	// id of storage items
	const s_location = a_location.join(':');
	si_storage_permit = 'permit:'+s_location;
	si_storage_vk = 'vk:'+s_location;

	// check local storage for permit
	try {
		g_permit = JSON.parse(localStorage.getItem(si_storage_permit)!);
	}
	catch(e_parse) {}

	// check local storage for viewing key
	sh_vk = sh_vk || localStorage.getItem(si_storage_vk)!;

	// use prompt as fallback
	if(!g_permit && !sh_vk) import_query_key_prompt()!;

	// something was loaded, hydrate; query succeeded
	if(g_permit || sh_vk) void hydrate_nfp();
};

export const boot = async(): Promise<void> => {
	// do not boot while loading
	if(xc_busy) return;

	// select the first metadata tag
	const dm_metadata = document.querySelector(':root>metadata');
	if(dm_metadata) {
		// first nfp:web tag
		const dm_web = nfp_tags('web')[0];

		// first nfp:self tag
		const dm_self = nfp_tags('self')[0];

		// missing requisite tag(s)
		if(!dm_web || !dm_self) throw new Error('Missing requisite NFP tags');

		// parse lcds attribute
		const a_lcds = nfp_attr(dm_web, 'lcds')?.split(/,/g) as HttpsUrl[];
		if(!a_lcds?.length) throw new Error('Missing nfp:lcds attribute');

		// destructure nfp:self attribute values
		a_location = ['chain', 'contract', 'token']
			.map(si_attr => nfp_attr(dm_self, si_attr)) as ConciseTokenLocation;

		// set busy state
		xc_busy = 1;

		// try each endpoint in order
		for(const p_lcd of a_lcds) {
			try {
				// attempt to instantiate contract
				k_contract = await secretContract(p_lcd, a_location[1]);

				// free
				xc_busy = 0;

				// done
				return resolve_permit();
			}
			catch(e_query) {
				// free
				xc_busy = 0;

				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				console.warn(`Endpoint offline: ${p_lcd}; ${(e_query as Error).stack}`);
			}
		}
	}
};
