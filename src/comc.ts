import type {A, O} from 'ts-toolbelt';

import type {Dict, HexMixed, JsonObject, JsonValue, Promisable, Uint128} from '@blake.regalia/belt';
import type {Key as KeplrKey, StdSignDoc} from '@keplr-wallet/types';
import type {HttpsUrl, SlimAuthInfo} from '@solar-republic/neutrino';

import {uuid_v4} from '@blake.regalia/belt';

import {create_html} from './dom';


export const XC_CMD_CONNECT = 1;
export const XC_CMD_DISCONNECT = 2;
export const XC_CMD_ACCOUNT_CHANGED = 3;
export const XC_CMD_SIGN_AUTO = 4;
export const XC_CMD_EXEC_CONTRACT = 5;
export const XC_CMD_SECRET_ENCRYPT = 6;
export const XC_CMD_SECRET_DECRYPT = 7;

export const XC_CMD_STORE_DATA = 8;
export const XC_CMD_FETCH_DATA = 9;

// export const XC_CMD_ENABLE = 1;
// export const XC_CMD_DISABLE = 5;
// export const XC_CMD_GET_KEY = 6;

// export const XC_CMD_SIGN_AMINO = 10;
// export const XC_CMD_SIGN_DIRECT = 11;
// export const XC_CMD_SIGN_TEXTUAL = 12;

// export const XC_CMD_SIGN_ARBITRARY = 20;
// export const XC_CMD_VERIFY_ARBITRARY = 21;

// export const XC_CMD_SUGGEST_TOKEN = 30;
// export const XC_CMD_SUGGEST_CHAIN = 31;

// export const XC_CMD_SECRET_ENCRYPT = 40;
// export const XC_CMD_SECRET_DECRYPT = 41;
// export const XC_CMD_SECRET_GET_TX_ENCRYPTION_KEY = 42;
// export const XC_CMD_SECRET_GET_VIEWING_KEY = 43;


export type Serializable = JsonValue<
	| ArrayBuffer
	| ArrayBufferView
	| DataView
	| Date
	| Error
	| Map<Serializable, Serializable>
	| RegExp
	| Set<Serializable>
	| String
>;

type CommandDef<h_def extends Record<number, {
	req: any;
	res: any;
}>> = h_def;

export type ComcCommands = CommandDef<{
	[XC_CMD_CONNECT]: {
		req: [
			p_origin: string,
			si_chain: string,
		];

		res: KeplrKey;
	};

	[XC_CMD_DISCONNECT]: {
		req: void;

		res: void;
	};

	[XC_CMD_ACCOUNT_CHANGED]: {
		req: void;

		res: KeplrKey;
	};

	[XC_CMD_SIGN_AUTO]: {
		req: [
			atu8_msg: Uint8Array,
			sg_limit: Uint128,
			a_auth: SlimAuthInfo,
		];

		res: [
			g_signed: StdSignDoc,
			atu8_signature: Uint8Array,
		];
	};

	[XC_CMD_EXEC_CONTRACT]: {
		req: [
			sb16_code_hash: HexMixed,
			h_msg: JsonObject,
		];

		res: Uint8Array;
	};

	[XC_CMD_SECRET_ENCRYPT]: {
		req: [
			sb16_code_hash: HexMixed,
			h_msg: JsonObject,
		];

		res: Uint8Array;
	};

	[XC_CMD_SECRET_DECRYPT]: {
		req: [
			atu8_ciphertext: Uint8Array,
			atu8_nonce: Uint8Array,
		];

		res: Uint8Array;
	};

	[XC_CMD_STORE_DATA]: {
		req: [
			s_data: string,
		];

		res: string;
	};

	[XC_CMD_FETCH_DATA]: {
		req: [
			s_key: string,
		];

		res: string;
	};
}>;

export type ComcCommand = keyof ComcCommands;


export interface ComcClient {
	post<
		xc_cmd extends ComcCommand,
		g_cmd extends ComcCommands[xc_cmd]=ComcCommands[xc_cmd],
	>(xc_cmd: xc_cmd, w_arg: g_cmd['req']): Promise<g_cmd['res']>;
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
	dm_iframe: HTMLIFrameElement
): ComcClient => {
	const d_window = dm_iframe.contentWindow;
	if(!d_window) throw new Error('Unable to access iframe content window at '+dm_iframe.src);

	// requests dict
	const h_requests: Dict<[
		(w_value: any) => any,
		(w_reason: any) => any,
	]> = {};

	// response handler
	addEventListener('message', (d_event) => {
		try {
			// destructure response
			const [
				si_req,
				xc_result,
				w_value,
			] = d_event.data as [
				si_req: string,
				xc_result: 0 | 1,
				w_value: Serializable,
			];

			// route
			h_requests[si_req]![xc_result]!(w_value);

			// clean
			delete h_requests[si_req];
		}
		catch(e_process) {}
	});

	// client instance
	return {
		post: (xc_cmd: ComcCommand, w_arg: Serializable | void, si_req=uuid_v4()) => new Promise((fk_resolve, fe_reject) => {
			// save resolver to request dict
			h_requests[si_req] = [fk_resolve, fe_reject];

			// post message to frame
			d_window.postMessage([
				si_req,
				xc_cmd,
				w_arg,
			], '*');
		}),
	};
};
