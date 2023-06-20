import type {
	QueryPermit,
	HttpsUrl,
	SecretBech32,
} from '@solar-republic/neutrino';

import {
	ofe,
} from '@blake.regalia/belt';

import {
	SecretContract,
} from '@solar-republic/neutrino';

import {load_script} from './connectivity';
import {P_NS_NFP} from './constants';
import {ls_read_json, ls_read} from './dom';


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

export const nfp_tags = (si_tag: string) => document.getElementsByTagNameNS(P_NS_NFP, si_tag);

export const nfp_attr = (dm_element: Element, si_attr: string) => dm_element.getAttributeNS(P_NS_NFP, si_attr);

const import_query_key_prompt = (): QueryPermit | string | void => {
	// prompt for key
	const sx_import = prompt(`NFP requires either (1) the owner's viewing key or (2) a query permit signed by the token owner; paste one here to unlock\n\nPermits should be JSON in shape of '{"params":..,"signature":..}'`)?.trim();

	// something was entered
	if(sx_import) {
		// attempt to parse as json
		let h_input!: QueryPermit;
		try {
			h_input = JSON.parse(sx_import) as QueryPermit;
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



const hydrate_nfp = async(): Promise<void | 1> => {
	// find scripts
	const a_srcs = Array.from(nfp_tags('script'))
		.map(dm => [dm, nfp_attr(dm, 'src')?.split('?')]) as [Element, [string, string?]][];

	for(const [dm_element, [si_package, sx_params]] of a_srcs) {
		const dm_script = await load_script(
			si_package,
			ofe(new URLSearchParams(sx_params || '').entries()),
			k_contract,
			a_location,
			g_permit || sh_vk
		);

		// permit or vk worked, save it to local storage
		localStorage.setItem(...(g_permit
			? [si_storage_permit, JSON.stringify(g_permit)]
			: [si_storage_vk, sh_vk]) as [string, string]);

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
	si_storage_permit = 'qp:'+s_location;
	si_storage_vk = 'vk:'+s_location;

	// check local storage for permit
	g_permit = ls_read_json(si_storage_permit)!;

	// check local storage for viewing key
	sh_vk = sh_vk || ls_read(si_storage_vk)!;

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
		const a_lcds = nfp_attr(dm_web, 'lcds')?.split(',') as HttpsUrl[];
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
