import type {F} from 'ts-toolbelt';

import type {HexMixed, JsonObject, Promisable} from '@blake.regalia/belt';
import type {Key as KeplrKey, StdSignDoc} from '@keplr-wallet/types';
import type {HttpsUrl, TypedStdSignDoc} from '@solar-republic/neutrino';

import {create_html} from './dom';

export interface ArgsConfigOpen {
	href: string;
	ref: string;
}


export type ArgsTupleEncryptMsg = [
	sb16_code_hash: HexMixed,
	h_msg: JsonObject,
];

export type ArgsTupleDecryptMsg = [
	sb16_code_hash: HexMixed,
	atu8_msg: Uint8Array,
];

export type ArgsTupleSignAmino = [
	g_body: StdSignDoc,
	sa_signer: string,
];

export type ArgsTupleSignDirect = [
	atu8_auth: Uint8Array,
	atu8_body: Uint8Array,
	sg_account: `${bigint}`,
];


/**
 * Host handlers
 */
export type ComcHostMessages = {
	/**
	 * Request to open a new connection
	 */
	open: {
		arg: ArgsConfigOpen;
	};

	/**
	 * Request to encrypt a message for secret contract
	 */
	encrypt: {
		arg: ArgsTupleEncryptMsg;
	};

	/**
	 * Request to decrypt a message for secret contract
	 */
	decrypt: {
		arg: ArgsTupleDecryptMsg;
	};

	/**
	 * Request to sign a document in amino format
	 */
	amino: {
		arg: ArgsTupleSignAmino;
	};

	/**
	 * Request to sign a document in proto format (direct)
	 */
	direct: {
		arg: ArgsTupleSignDirect;
	};
};


export type ReturnTupleEncrypt = [
	aut8_encrypted: Uint8Array,
];

export type ReturnTupleDecrypt = [
	aut8_decrypted: Uint8Array,
];

export type ReturnTupleAmino = [
	g_signed_doc: StdSignDoc,
	aut8_signature: Uint8Array,
];

export type ReturnTupleDirect = [
	atu8_auth: Uint8Array,
	atu8_body: Uint8Array,
	atu8_signature: Uint8Array,
];

/**
 * Client handlers
 */
export type ComcClientMessages = {
	/**
	 * Wallet not installed
	 */
	unavailable: {
		return: string;
	};

	/**
	 * Connection rejected
	 */
	rejected: {
		return: string;
	};

	/**
	 * Unknown error occurred
	 */
	error: {
		return: string;
	};

	/**
	 * Connection approved
	 */
	approved: {
		return: KeplrKey;
	};

	/**
	 * Contract message was encrypted
	 */
	$encrypt: {
		return: ReturnTupleEncrypt;
	};

	/**
	 * Message from contract was decrypted
	 */
	$decrypt: {
		return: ReturnTupleDecrypt;
	};

	/**
	 * Amino document was signed
	 */
	$amino: {
		return: ReturnTupleAmino;
	};

	/**
	 * Proto document was signed
	 */
	$direct: {
		return: ReturnTupleDirect;
	};
};


type HasKey<w_thing, si_key, w_yes=1, w_no=0> = si_key extends Extract<keyof w_thing, si_key>? w_yes: w_no;

export type ComcHostHandlers<
	h_returns extends {
		[si_key in keyof ComcHostMessages]?: any;
	} & {
		_default?: any;
	}={
		_default: Promisable<void>;
	},
> = {
	[si_key in keyof ComcHostMessages]: F.Function<
		[si_req: string, arg: ComcHostMessages[si_key]['arg']],
		HasKey<h_returns, si_key, h_returns[si_key],
			HasKey<h_returns, '_default', h_returns['_default'], any>>
	>;
};

export type ComcClientHandlers<
	h_returns extends {
		[si_key in keyof ComcClientMessages]?: any;
	} & {
		_default?: any;
	}={
		_default: Promisable<void>;
	},
> = {
	[si_key in keyof ComcClientMessages]: F.Function<
		[w_return: ComcClientMessages[si_key]['return'], si_req: string],
		HasKey<h_returns, si_key, h_returns[si_key],
			HasKey<h_returns, '_default', h_returns['_default'], any>>
	>;
};


export interface ComcClient {
	post<si_cmd extends keyof ComcHostMessages>(si_cmd: si_cmd, w_msg: ComcHostMessages[si_cmd]['arg'], si_req: string): void;
}


export const comcPortal = (p_host: HttpsUrl, dm_root: Element): Promise<HTMLIFrameElement> => new Promise((fk_resolve) => {
	const dm_iframe = create_html('iframe', {
		src: p_host,
		style: 'display:none',
	});

	dm_iframe.onload = () => {
		fk_resolve(dm_iframe);
	};

	dm_root.append(dm_iframe);
});

export const comcClient = (
	dm_iframe: HTMLIFrameElement,
	h_handlers: ComcClientHandlers
): ComcClient => {
	const d_window = dm_iframe.contentWindow;
	if(!d_window) throw 'Unable to access iframe content window at '+dm_iframe.src;

	addEventListener('message', (d_event) => {
		const {
			id: si_req,
			type: si_type,
			value: w_value,
		} = d_event.data as {
			id: string;
			type: keyof ComcClientHandlers;
			value: any;
		};

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		void h_handlers[si_type]?.(w_value, si_req);
	});

	return {
		post: (si_type, w_value, si_req='') => d_window.postMessage({
			id: si_req,
			type: si_type,
			value: w_value,
		}, '*'),
	};
};

// 	// eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
// 	const dm_iframe = document.querySelector('#i-s2r') as HTMLIFrameElement;

// 	const f_client = comcClient(dm_iframe.contentWindow!, 'http://localhost:8080');

// 	const f_keplr = (si_method: string, a_args?: any[]) => f_client('keplr', [si_method, a_args]);

// 	const w_res = await f_keplr('enable', [si_reference]);

// 	const [] = f_keplr('getOfflineSignerOnlyAmino', [si_reference]);



// 	console.log(w_res);
// 	debugger;

// };
