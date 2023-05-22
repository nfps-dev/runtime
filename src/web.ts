export type {
	SvgNodeCreator,
	HtmlNodeCreator,
} from '@nfps.dev/sdk';

import type {
	P_NS_SVG,
	P_NS_HTML,
	P_NS_NFP,
} from './constants';

import type {Dict} from '@blake.regalia/belt';

export interface DocumentNamespaceMap {
	[P_NS_SVG]: SVGElementTagNameMap;
	[P_NS_HTML]: HTMLElementTagNameMap;
	[P_NS_NFP]: NfpElementMap;
}

export type DocumentNamespace = keyof DocumentNamespaceMap;

type NfpElement<h_props extends Dict> = Element & h_props;

export interface NfpElementMap {
	web: NfpElement<{
		lcds?: string;
		comcs?: string;
	}>;
	self: NfpElement<{
		chain: string;
		contract: string;
		token: string;
	}>;
	macro: NfpElement<{
		id: string;
	}>;
	script: NfpElement<{
		src: string;
	}>;
	style: NfpElement<{
		src: string;
	}>;
}
