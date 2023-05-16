
	// // keplr is available
	// const y_keplr = window.keplr;
	// if(y_keplr) {
	// 	const y_signer = y_keplr.getOfflineSignerOnlyAmino(si_caip2);

	// 	const g_account = (await y_signer.getAccounts())[0];

	// 	const sa_owner = g_account.address;

	// 	const g_permit = {
	// 		permit_name: [
	// 			'whip-009',
	// 			si_reference,
	// 			sa_contract,
	// 			sa_owner,
	// 			new Date().toISOString(),
	// 		].join(';'),
	// 		allowed_tokens: [k_contract.bech32],
	// 		permissions: ['owner'],
	// 	};

	// 	// request query permit signature
	// 	const g_response = await y_signer.signAmino(sa_owner, {
	// 		chain_id: si_reference,
	// 		account_number: '0',
	// 		sequence: '0',
	// 		msgs: [
	// 			{
	// 				type: 'query_permit',
	// 				value: g_permit,
	// 			},
	// 		],
	// 		fee: {
	// 			gas: '1',
	// 			amount: [{
	// 				denom: 'uscrt',
	// 				amount: '0',
	// 			}],
	// 		},
	// 		memo: '',
	// 	});

	// 	// make authenticated query
	// 	const g_query = await k_contract.query({
	// 		with_permit: {
	// 			permit: {
	// 				params: {
	// 					...g_response.signed.msgs[0].value,
	// 					chain_id: si_reference,
	// 				},
	// 				signature: g_response.signature as unknown as JsonObject,
	// 			},
	// 			query: {
	// 				private_metadata: {
	// 					token_id: si_token,
	// 				},
	// 			},
	// 		},
	// 	});

	// 	console.log(g_query);
	// }
