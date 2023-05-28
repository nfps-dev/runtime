import type {Dict, JsonObject, JsonValue, Promisable} from '@blake.regalia/belt';
import type {Key as KeplrKey} from '@keplr-wallet/types';
import type {HttpsUrl} from '@solar-republic/neutrino';

import {create_html} from './dom';

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

// export type ComcHostHandlers = {

// };

export type ComcClientHandlers = {
	a?(g_key: KeplrKey): Promisable<void>;
	s?(): Promisable<void>;
	r?(s_reason: string): Promisable<void>;
	n?(): Promisable<void>;
};

// type Ex = Exclude<JsonValue, never | void | undefined>;
// type In = U.IntersectOf<Ex>;

export interface ComcClient {
	post(si_type: string, w_msg: any): void;
}

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
		h_handlers[si_type]?.(w_value);
	});

	const post = (si_type: string, w_value: any) => d_window.postMessage({
		type: si_type,
		value: w_value,
	}, '*');

	return {
		post,
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
