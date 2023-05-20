import type {Base64} from '@blake.regalia/belt';


export interface PackageVersionInfo {
	package?: {
		data: {
			bytes: Base64;
			content_type?: string;
			content_encoding?: string;
			metadata?: string;
		};
		tags?: string[];
		metadata?: string;
	};
}

export interface StorageData {
	data: KeyValue[];
}

export interface KeyValue {
	key: string;
	value: string;
}

export interface NfpQueryRegistry {
	package_version: {
		response: PackageVersionInfo;
	};
	storage_owner_get: {
		response: StorageData;
	};
}

export type NfpQueryResponse<
	si_method extends keyof NfpQueryRegistry,
> = {
	[si_key in si_method]: NfpQueryRegistry[si_method]['response'];
};
