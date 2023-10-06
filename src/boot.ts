import type {Nilable} from '@blake.regalia/belt';
import type {QueryPermit, SecretAccAddr} from '@solar-republic/contractor';
import type {AuthSecret_ViewerInfo, HttpsUrl, WeakSecretAccAddr} from '@solar-republic/neutrino';

import {
	ofe,
} from '@blake.regalia/belt';

import {
	SecretContract,
} from '@solar-republic/neutrino';

import {load_script} from './connectivity';
import {P_NS_NFP} from './constants';
import {ls_read_json, ls_write_json} from './dom';


export type SlimTokenLocation = [
	si_chain: string,
	sa_contract: SecretAccAddr,
	si_token: string,
];

export type BootInfo = [
	a_location: SlimTokenLocation,
	p_lcd: HttpsUrl,
	k_contract: SecretContract,
	z_auth: Nilable<AuthSecret_ViewerInfo | QueryPermit>,
];

let k_contract: SecretContract;
let a_location: SlimTokenLocation;
let z_auth!: Nilable<QueryPermit | AuthSecret_ViewerInfo>;
let si_storage_auth: string;
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
			z_auth = h_input;
		}
		// treat text as viewing key
		else {
			z_auth = [sx_import];
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
			z_auth!
		);

		// auth worked, save it to local storage
		ls_write_json(si_storage_auth, z_auth);

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
	// storage item key
	si_storage_auth = a_location.join(':')+':auth';

	// check local storage for auth
	z_auth ||= ls_read_json(si_storage_auth);

	// use prompt as fallback
	if(!z_auth) import_query_key_prompt();

	// something was loaded, hydrate; query succeeded
	if(z_auth) {
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

		// auth is baked into contract
		const dm_auth = nfp_tags('auth')[0];
		if(dm_auth && !z_auth) {
			const sh_vk = nfp_attr(dm_auth, 'vk');

			if(sh_vk) {
				z_auth = [sh_vk, nfp_attr(dm_auth, 'addr') as WeakSecretAccAddr];
			}
		}

		// // secret via localStorage
		// for(const dm_secret of nfp_tags('secret')) {
		// 	const p_comc = nfp_attr(dm_secret, 'comc');
		// 	const sh_key = nfp_attr(dm_secret, 'key');
		// 	if(!p_comc || !sh_key) continue;

		// 	const dm_portal = await comcPortal(p_comc as HttpsUrl, document.documentElement);
		// 	const k_comc = await comcClient(dm_portal);

		// 	await ({
		// 		async auth() {
		// 			z_auth = await k_comc.post(XC_CMD_FETCH_DATA, [sh_key]) as AuthSecret;
		// 		},
		// 	} as Dict<() => Promise<void>>)[nfp_attr(dm_secret, 'context')+'']?.();

		// 	// discard portal
		// 	dm_portal.remove();
		// }

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
						k_contract,
						z_auth,
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
