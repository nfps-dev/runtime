import type {A, L, O, S, U} from 'ts-toolbelt';

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

type OmitCaps<s_test extends string> = Uppercase<s_test> extends s_test? never: s_test;

type OmitCapsL<a_test extends readonly string[]> = {
	[i_each in keyof a_test]: OmitCaps<a_test[i_each]>;
};

type OmitCapsU<s_test extends string> = L.UnionOf<OmitCapsL<U.ListOf<s_test>>>;


type SvgElementProperties<d_element extends Element> = {
	[si_key in A.Compute<A.Cast<O.SelectKeys<d_element,
		| string
		| DOMPointReadOnly
		| SVGAnimatedBoolean
		| SVGAnimatedEnumeration
		| SVGAnimatedInteger
		| SVGAnimatedLength
		| SVGAnimatedLengthList
		| SVGAnimatedNumber
		| SVGAnimatedNumberList
		| SVGAnimatedPreserveAspectRatio
		| SVGAnimatedString
		| SVGAnimatedTransformList
		| DOMTokenList
		| SVGElement
	>, string>>]?: string;
} & {
	[si_key in string]?: string;
};

export type SvgNodeCreator = <
	si_tag extends keyof SVGElementTagNameMap,
>(
	si_tag: si_tag,
	h_attrs?: A.Compute<SvgElementProperties<SVGElementTagNameMap[si_tag]>>,
	a_children?: (Node | string)[]
) => SVGElementTagNameMap[si_tag];


export type CompulsorySvgNodeCreator = <
	si_tag extends keyof SVGElementTagNameMap,
>(
	si_tag: keyof SVGElementTagNameMap,
	h_attrs: A.Compute<SvgElementProperties<SVGElementTagNameMap[si_tag]>>,
	a_children?: (Node | string)[]
) => SVGElementTagNameMap[si_tag];


type HtmlElementProperties<d_element extends Element, w_extra=never> = {
	[si_key in OmitCapsU<O.SelectKeys<d_element, string>>]: string;
};

export type HtmlNodeCreator = <
	si_tag extends keyof HTMLElementTagNameMap,
>(
	si_tag: si_tag,
	h_attrs?: HtmlElementProperties<HTMLElementTagNameMap[si_tag]>,
	a_children?: (Node | string)[]
) => HTMLElementTagNameMap[si_tag];
