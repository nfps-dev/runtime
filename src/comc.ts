import type {F} from 'ts-toolbelt';

import type {HexMixed, JsonObject, Promisable} from '@blake.regalia/belt';
import type {Key as KeplrKey, StdSignDoc} from '@keplr-wallet/types';
import type {HttpsUrl, TypedStdSignDoc} from '@solar-republic/neutrino';

import {create_html} from './dom';

export interface ArgsConfigOpen {
	href: string;
	ref: string;
}

export type ArgsTupleSignDirect<w_data=any> = [
	atu8_auth: Uint8Array,
	atu8_body: Uint8Array,
	sg_account: `${bigint}`,
	w_data?: w_data,
];

export type ArgsTupleSignAmino<w_data=any> = [
	g_body: StdSignDoc,
	sa_signer: string,
	w_data?: w_data,
];

export type ArgsTupleEncryptMsg<w_data=any> = [
	sb16_code_hash: HexMixed,
	h_msg: JsonObject,
	w_data?: w_data,
];

/**
 * Host handlers
 */
export type ComcHostMessages = {
	/**
	 * Request to open a new connection
	 */
	open: {
		args: [ArgsConfigOpen];
	};

	/**
	 * Request to encrypt a message for secret contract
	 */
	encrypt: {
		args: [ArgsTupleEncryptMsg];
	};

	/**
	 * Request to sign a document in amino format
	 */
	amino: {
		args: [ArgsTupleSignAmino];
	};

	/**
	 * Request to sign a document in proto format (direct)
	 */
	direct: {
		args: [ArgsTupleSignDirect];
	};
};


export type ArgsTupleEncrypted<w_data=any> = [
	aut8_encrypted: Uint8Array,
	w_data: w_data,
];

export type ArgsTupleAminoed<w_data=any> = [
	g_signed_doc: TypedStdSignDoc,
	aut8_signature: Uint8Array,
	w_data: w_data,
];

/**
 * Client handlers
 */
export type ComcClientMessages = {
	/**
	 * Wallet not installed
	 */
	unavailable: {
		args: [];
	};

	/**
	 * Connection rejected
	 */
	rejected: {
		args: [];
	};

	/**
	 * Connection approved
	 */
	approved: {
		args: [g_key: KeplrKey];
	};

	/**
	 * Contract message was encrypted
	 */
	$encrypt: {
		args: [ArgsTupleEncrypted];
	};

	/**
	 * Amino document was signed
	 */
	$amino: {
		args: [ArgsTupleAminoed];
	};

	/**
	 * Proto document was signed
	 */
	$direct: {
		args: [];
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
		ComcHostMessages[si_key]['args'],
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
		ComcClientMessages[si_key]['args'],
		HasKey<h_returns, si_key, h_returns[si_key],
			HasKey<h_returns, '_default', h_returns['_default'], any>>
	>;
};



export interface ComcClient {
	post<si_cmd extends keyof ComcHostMessages>(si_cmd: si_cmd, w_msg: ComcHostMessages[si_cmd]['args']): void;
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
			type: si_type,
			value: w_value,
		} = d_event.data as {
			type: keyof ComcClientHandlers;
			value: any;
		};

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		void h_handlers[si_type]?.(w_value);
	});

	return {
		post: (si_type, w_value) => d_window.postMessage({
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
