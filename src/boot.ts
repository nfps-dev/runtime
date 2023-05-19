import type {PackageVersionInfo} from './nfp-types';
import type {
	AuthSecret,
	QueryPermit,
	HttpsUrl,
	SecretBech32,
} from '@solar-republic/neutrino';

import {
	base64_to_buffer,
	buffer_to_text,
	concat,
	ofe,
} from '@blake.regalia/belt';

import {
	SecretContract,
	query_contract_infer,
} from '@solar-republic/neutrino';



import {P_NS_NFP, P_NS_SVG, S_CONTENT_TYPE_SCRIPT} from './constants';


export type SlimTokenLocation = [
	si_chain: string,
	sa_contract: SecretBech32,
	si_token: string,
];

export type BootInfo = [
	a_location: SlimTokenLocation,
	p_lcd: HttpsUrl,
	g_permit: QueryPermit,
	s_vk: string,
	k_contract: SecretContract,
];

let k_contract: SecretContract;
let a_location: SlimTokenLocation;
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


export const inject_script = async(si_package: string, h_query: {
	[si_key: string]: string;
	tag?: string;
}): Promise<SVGScriptElement | void> => {
	// submit query
	const [g_version, xc_code, s_error, h_response] = await query_contract_infer<PackageVersionInfo>(k_contract, 'package_version', {
		package_id: si_package,
		token_id: a_location[2],
		...h_query,
	}, g_permit || sh_vk);

	// query error
	if(!g_version) return alert(s_error || JSON.stringify(h_response));

	// package is present
	const g_package = g_version.package;
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

		// return script
		return dm_script;
	}
};

const hydrate_nfp = async(): Promise<void | 1> => {
	// find scripts
	const a_srcs = Array.from(nfp_tags('script'))
		.map(dm => [dm, nfp_attr(dm, 'src')?.split('?')]) as [Element, [string, string?]][];

	for(const [dm_element, [si_package, sx_params]] of a_srcs) {
		const dm_script = await inject_script(si_package, ofe(new URLSearchParams(sx_params || '').entries()));

		// replace script
		if(dm_script) {
			dm_element.replaceWith(dm_script);
		}
		// fail
		else {
			return;
		}
	}

	return 1;
};


const resolve_permit = async(): Promise<void | 1> => {
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
	if(g_permit || sh_vk) {
		return await hydrate_nfp();
	}
};

export const boot = async(): Promise<void | BootInfo> => {
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
			.map(si_attr => nfp_attr(dm_self, si_attr)) as SlimTokenLocation;

		// set busy state
		xc_busy = 1;

		// try each endpoint in order
		for(const p_lcd of a_lcds) {
			try {
				// attempt to instantiate contract
				k_contract = await SecretContract(p_lcd, a_location[1]);

				// free
				xc_busy = 0;

				// done
				if(await resolve_permit()) {
					// return boot info
					return [
						a_location,
						k_contract.lcd,
						g_permit,
						sh_vk,
						k_contract,
					];
				}
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
