
import type {A, L, S} from 'ts-toolbelt';

import type {DocumentNamespace, HtmlNodeCreator, SvgNodeCreator} from './web';

import type {Dict, JsonValue} from '@blake.regalia/belt';

import {safe_json} from '@solar-republic/neutrino';

import {P_NS_HTML, P_NS_SVG} from './constants';


type TrimLeft<s_text extends string> = s_text extends ` ${infer s_trimmed}`? TrimLeft<s_trimmed>: s_text;

type TrimRight<s_text extends string> = s_text extends `${infer s_trimmed} `? TrimRight<s_trimmed>: s_text;

type Trim<s_text extends string> = TrimLeft<TrimRight<s_text>>;

type RemoveAfter<
	s_delim extends string,
	s_text extends string,
> = s_text extends `${infer s_prefix}${s_delim}${string}`? s_prefix: s_text;

type RemoveModifiers<s_text extends string> = RemoveAfter<':',
	RemoveAfter<'[',
		RemoveAfter<'#',
			RemoveAfter<'.', s_text>
		>
	>
>;

type TakeLastAfterToken<s_token extends string, s_text extends string> = RemoveModifiers<
	L.Last<
		S.Split<
			Trim<s_text>, s_token
		>
	>
>;

type GetLastElementName<sq_selector extends string> = TakeLastAfterToken<'>',
	TakeLastAfterToken<' ', sq_selector>
>;

type GetEachElementName<z_parts, a_out extends string[]=[]> = z_parts extends []
	? a_out
	: z_parts extends [string]
		? [...a_out, GetLastElementName<z_parts[0]>]
		: z_parts extends [string, ...infer s_part]
			? GetEachElementName<s_part, [...a_out, GetLastElementName<z_parts[0]>]>
			: [];

type GetElementNames<
	sq_selector extends string,
> = GetEachElementName<S.Split<sq_selector, ','>>;

type ElementByName<si_tag extends string> = si_tag extends keyof HTMLElementTagNameMap
	? HTMLElementTagNameMap[si_tag]
	: si_tag extends keyof SVGElementTagNameMap
		? SVGElementTagNameMap[si_tag]
		: HTMLElement | SVGElement;

type MatchEachElement<a_tags, d_coerce extends Element=Element> = a_tags extends []
	? d_coerce
	: a_tags extends [string]
		? ElementByName<a_tags[0]>
		: a_tags extends [string, ...infer a_rest]
			? MatchEachElement<a_rest, d_coerce | ElementByName<a_tags[0]>>
			: d_coerce;

type QueryResult<
	sq_selector extends string,
> = MatchEachElement<GetElementNames<sq_selector>>;


/**
 * Typed querySelector
 * @param dm_node 
 * @param sq_selector 
 * @returns 
 */
export const qs = <
	sq_coerce extends string=string,
	sq_selector extends string=string,
>(
	dm_node: {querySelector: Element['querySelector']},
	sq_selector: sq_selector
): null | QueryResult<
	sq_coerce extends `${infer s_ignore}`  // eslint-disable-line @typescript-eslint/no-unused-vars
		? sq_coerce
		: sq_selector
> => dm_node?.querySelector(sq_selector);


/**
 * Typed querySelectorAll
 * @param dm_node 
 * @param sq_selector 
 * @returns 
 */
export const qsa = <
	sq_coerce extends string=string,
	sq_selector extends string=string,
>(
	dm_node: {querySelectorAll: Element['querySelectorAll']},
	sq_selector: sq_selector
): QueryResult<
	sq_coerce extends `${infer s_ignore}`  // eslint-disable-line @typescript-eslint/no-unused-vars
		? sq_coerce
		: sq_selector
>[] => Array.from(dm_node?.querySelectorAll(sq_selector) || []);

// export const create_element_ns = <
// 	p_ns extends DocumentNamespace=typeof P_NS_SVG,
// 	h_set extends DocumentNamespaceMap[p_ns]=A.Cast<SVGElementTagNameMap, DocumentNamespaceMap[p_ns]>,
// 	si_tag extends Extract<keyof h_set, string>=Extract<keyof h_set, string>,
// >(si_tag: si_tag, p_ns?: p_ns): h_set[si_tag] => document.createElementNS(p_ns || P_NS_SVG, si_tag) as h_set[si_tag];

const creator = (p_ns: DocumentNamespace) => (si_tag: string, h_attrs?: Dict, a_children?: (Node| string)[]) => {
	// const dm_elmt = create_element_ns(si_tag, p_ns);
	const dm_elmt = document.createElementNS(p_ns, si_tag);

	// set attributes
	for(const si_attr in h_attrs || {}) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		dm_elmt.setAttribute(si_attr, h_attrs![si_attr]!);
	}

	// add children
	dm_elmt.append(...a_children || []);

	// return element
	return dm_elmt;
};


export const create_svg = creator(P_NS_SVG) as SvgNodeCreator;
export const create_html = creator(P_NS_HTML) as HtmlNodeCreator;



export const ls_get_str = (si_key: string): string | null => localStorage.getItem(si_key);

export const ls_set_str = (si_key: string, s_value: string): void => localStorage.setItem(si_key, s_value);

export const ls_get_json = <w_out extends JsonValue>(si_key: string): w_out | undefined => safe_json(ls_get_str(si_key) || '');

export const ls_set_json = (si_key: string, w_value: JsonValue): void => ls_set_str(si_key, JSON.stringify(w_value));
