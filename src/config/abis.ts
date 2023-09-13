export const v2Router: any = [{
	"inputs": [{
		"internalType": "address",
		"name": "_factory",
		"type": "address"
	}, {
		"internalType": "address",
		"name": "_WETH",
		"type": "address"
	}],
	"stateMutability": "nonpayable",
	"type": "constructor"
}, {
	"inputs": [],
	"name": "WETH",
	"outputs": [{
		"internalType": "address",
		"name": "",
		"type": "address"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "tokenA",
		"type": "address"
	}, {
		"internalType": "address",
		"name": "tokenB",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "amountADesired",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountBDesired",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountAMin",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountBMin",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "addLiquidity",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountA",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountB",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "liquidity",
		"type": "uint256"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "amountTokenDesired",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountTokenMin",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountETHMin",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "addLiquidityETH",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountToken",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountETH",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "liquidity",
		"type": "uint256"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [],
	"name": "factory",
	"outputs": [{
		"internalType": "address",
		"name": "",
		"type": "address"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "reserveIn",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "reserveOut",
		"type": "uint256"
	}],
	"name": "getAmountIn",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}],
	"stateMutability": "pure",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "reserveIn",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "reserveOut",
		"type": "uint256"
	}],
	"name": "getAmountOut",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}],
	"stateMutability": "pure",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}],
	"name": "getAmountsIn",
	"outputs": [{
		"internalType": "uint256[]",
		"name": "amounts",
		"type": "uint256[]"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}],
	"name": "getAmountsOut",
	"outputs": [{
		"internalType": "uint256[]",
		"name": "amounts",
		"type": "uint256[]"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountA",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "reserveA",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "reserveB",
		"type": "uint256"
	}],
	"name": "quote",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountB",
		"type": "uint256"
	}],
	"stateMutability": "pure",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "tokenA",
		"type": "address"
	}, {
		"internalType": "address",
		"name": "tokenB",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "liquidity",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountAMin",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountBMin",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "removeLiquidity",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountA",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountB",
		"type": "uint256"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "liquidity",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountTokenMin",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountETHMin",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "removeLiquidityETH",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountToken",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountETH",
		"type": "uint256"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "liquidity",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountTokenMin",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountETHMin",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "removeLiquidityETHSupportingFeeOnTransferTokens",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountETH",
		"type": "uint256"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "liquidity",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountTokenMin",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountETHMin",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}, {
		"internalType": "bool",
		"name": "approveMax",
		"type": "bool"
	}, {
		"internalType": "uint8",
		"name": "v",
		"type": "uint8"
	}, {
		"internalType": "bytes32",
		"name": "r",
		"type": "bytes32"
	}, {
		"internalType": "bytes32",
		"name": "s",
		"type": "bytes32"
	}],
	"name": "removeLiquidityETHWithPermit",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountToken",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountETH",
		"type": "uint256"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "liquidity",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountTokenMin",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountETHMin",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}, {
		"internalType": "bool",
		"name": "approveMax",
		"type": "bool"
	}, {
		"internalType": "uint8",
		"name": "v",
		"type": "uint8"
	}, {
		"internalType": "bytes32",
		"name": "r",
		"type": "bytes32"
	}, {
		"internalType": "bytes32",
		"name": "s",
		"type": "bytes32"
	}],
	"name": "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountETH",
		"type": "uint256"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "tokenA",
		"type": "address"
	}, {
		"internalType": "address",
		"name": "tokenB",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "liquidity",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountAMin",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountBMin",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}, {
		"internalType": "bool",
		"name": "approveMax",
		"type": "bool"
	}, {
		"internalType": "uint8",
		"name": "v",
		"type": "uint8"
	}, {
		"internalType": "bytes32",
		"name": "r",
		"type": "bytes32"
	}, {
		"internalType": "bytes32",
		"name": "s",
		"type": "bytes32"
	}],
	"name": "removeLiquidityWithPermit",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountA",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountB",
		"type": "uint256"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "swapETHForExactTokens",
	"outputs": [{
		"internalType": "uint256[]",
		"name": "amounts",
		"type": "uint256[]"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountOutMin",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "swapExactETHForTokens",
	"outputs": [{
		"internalType": "uint256[]",
		"name": "amounts",
		"type": "uint256[]"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountOutMin",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "swapExactETHForTokensSupportingFeeOnTransferTokens",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountOutMin",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "swapExactTokensForETH",
	"outputs": [{
		"internalType": "uint256[]",
		"name": "amounts",
		"type": "uint256[]"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountOutMin",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "swapExactTokensForETHSupportingFeeOnTransferTokens",
	"outputs": [],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountOutMin",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "swapExactTokensForTokens",
	"outputs": [{
		"internalType": "uint256[]",
		"name": "amounts",
		"type": "uint256[]"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountOutMin",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "swapExactTokensForTokensSupportingFeeOnTransferTokens",
	"outputs": [],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountInMax",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "swapTokensForExactETH",
	"outputs": [{
		"internalType": "uint256[]",
		"name": "amounts",
		"type": "uint256[]"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountInMax",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}],
	"name": "swapTokensForExactTokens",
	"outputs": [{
		"internalType": "uint256[]",
		"name": "amounts",
		"type": "uint256[]"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"stateMutability": "payable",
	"type": "receive"
}]

export const DanDaoERC20Abi: any = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "contractAddr",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "owner",
						"type": "address"
					}
				],
				"internalType": "struct checkERC20Item[]",
				"name": "_list",
				"type": "tuple[]"
			}
		],
		"name": "batchCheckERC20Balance",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "contractAddr",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "addr",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "decimals",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "balance",
						"type": "uint256"
					}
				],
				"internalType": "struct balanceERC20ResponseItem[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "_admin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "_fee",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "addr",
				"type": "address[]"
			}
		],
		"name": "batchBaseData",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "symbol",
						"type": "string"
					},
					{
						"internalType": "uint8",
						"name": "decimals",
						"type": "uint8"
					},
					{
						"internalType": "uint256",
						"name": "totalSupply",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "owner",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "contractAddr",
						"type": "address"
					}
				],
				"internalType": "struct ContractBaseData[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "addr",
				"type": "address[]"
			}
		],
		"name": "batchGetPair",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint112",
						"name": "reserve0",
						"type": "uint112"
					},
					{
						"internalType": "uint112",
						"name": "reserve1",
						"type": "uint112"
					},
					{
						"internalType": "address",
						"name": "token0",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "token1",
						"type": "address"
					},
					{
						"internalType": "uint32",
						"name": "blockTimestampLast",
						"type": "uint32"
					},
					{
						"internalType": "uint256",
						"name": "totalSupply",
						"type": "uint256"
					}
				],
				"internalType": "struct PairData[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "pools",
				"type": "address[]"
			}
		],
		"name": "batchPoolData",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint128",
						"name": "maxLiquidityPerTick",
						"type": "uint128"
					},
					{
						"internalType": "int24",
						"name": "tickSpacing",
						"type": "int24"
					},
					{
						"internalType": "uint128",
						"name": "liquidity",
						"type": "uint128"
					},
					{
						"internalType": "uint24",
						"name": "fee",
						"type": "uint24"
					},
					{
						"internalType": "address",
						"name": "token0",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "token1",
						"type": "address"
					},
					{
						"components": [
							{
								"internalType": "uint160",
								"name": "sqrtPriceX96",
								"type": "uint160"
							},
							{
								"internalType": "int24",
								"name": "tick",
								"type": "int24"
							},
							{
								"internalType": "uint16",
								"name": "observationIndex",
								"type": "uint16"
							},
							{
								"internalType": "uint16",
								"name": "observationCardinality",
								"type": "uint16"
							},
							{
								"internalType": "uint16",
								"name": "observationCardinalityNext",
								"type": "uint16"
							},
							{
								"internalType": "uint8",
								"name": "feeProtocol",
								"type": "uint8"
							},
							{
								"internalType": "bool",
								"name": "unlocked",
								"type": "bool"
							}
						],
						"internalType": "struct Slot0",
						"name": "slot0",
						"type": "tuple"
					}
				],
				"internalType": "struct PoolData[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256[]",
				"name": "tokens",
				"type": "uint256[]"
			},
			{
				"internalType": "address",
				"name": "positionContract",
				"type": "address"
			}
		],
		"name": "batchPositions",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint96",
						"name": "nonce",
						"type": "uint96"
					},
					{
						"internalType": "address",
						"name": "operator",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "token0",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "token1",
						"type": "address"
					},
					{
						"internalType": "uint24",
						"name": "fee",
						"type": "uint24"
					},
					{
						"internalType": "int24",
						"name": "tickLower",
						"type": "int24"
					},
					{
						"internalType": "int24",
						"name": "tickUpper",
						"type": "int24"
					},
					{
						"internalType": "uint128",
						"name": "liquidity",
						"type": "uint128"
					},
					{
						"internalType": "uint256",
						"name": "feeGrowthInside0LastX128",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "feeGrowthInside1LastX128",
						"type": "uint256"
					},
					{
						"internalType": "uint128",
						"name": "tokensOwed0",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "tokensOwed1",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "owner",
						"type": "address"
					}
				],
				"internalType": "struct PositionResponse[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "contra",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "swapamount",
				"type": "uint256"
			}
		],
		"name": "callUniswap",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "addr",
				"type": "address"
			}
		],
		"name": "getBaseData",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "name",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "symbol",
						"type": "string"
					},
					{
						"internalType": "uint8",
						"name": "decimals",
						"type": "uint8"
					},
					{
						"internalType": "uint256",
						"name": "totalSupply",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "owner",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "contractAddr",
						"type": "address"
					}
				],
				"internalType": "struct ContractBaseData",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "addr",
				"type": "address"
			}
		],
		"name": "getPair",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint112",
						"name": "reserve0",
						"type": "uint112"
					},
					{
						"internalType": "uint112",
						"name": "reserve1",
						"type": "uint112"
					},
					{
						"internalType": "address",
						"name": "token0",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "token1",
						"type": "address"
					},
					{
						"internalType": "uint32",
						"name": "blockTimestampLast",
						"type": "uint32"
					},
					{
						"internalType": "uint256",
						"name": "totalSupply",
						"type": "uint256"
					}
				],
				"internalType": "struct PairData",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "addr",
				"type": "address"
			}
		],
		"name": "getPoolData",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint128",
						"name": "maxLiquidityPerTick",
						"type": "uint128"
					},
					{
						"internalType": "int24",
						"name": "tickSpacing",
						"type": "int24"
					},
					{
						"internalType": "uint128",
						"name": "liquidity",
						"type": "uint128"
					},
					{
						"internalType": "uint24",
						"name": "fee",
						"type": "uint24"
					},
					{
						"internalType": "address",
						"name": "token0",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "token1",
						"type": "address"
					},
					{
						"components": [
							{
								"internalType": "uint160",
								"name": "sqrtPriceX96",
								"type": "uint160"
							},
							{
								"internalType": "int24",
								"name": "tick",
								"type": "int24"
							},
							{
								"internalType": "uint16",
								"name": "observationIndex",
								"type": "uint16"
							},
							{
								"internalType": "uint16",
								"name": "observationCardinality",
								"type": "uint16"
							},
							{
								"internalType": "uint16",
								"name": "observationCardinalityNext",
								"type": "uint16"
							},
							{
								"internalType": "uint8",
								"name": "feeProtocol",
								"type": "uint8"
							},
							{
								"internalType": "bool",
								"name": "unlocked",
								"type": "bool"
							}
						],
						"internalType": "struct Slot0",
						"name": "slot0",
						"type": "tuple"
					}
				],
				"internalType": "struct PoolData",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "token",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "positionContract",
				"type": "address"
			}
		],
		"name": "getPosition",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint96",
						"name": "nonce",
						"type": "uint96"
					},
					{
						"internalType": "address",
						"name": "operator",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "token0",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "token1",
						"type": "address"
					},
					{
						"internalType": "uint24",
						"name": "fee",
						"type": "uint24"
					},
					{
						"internalType": "int24",
						"name": "tickLower",
						"type": "int24"
					},
					{
						"internalType": "int24",
						"name": "tickUpper",
						"type": "int24"
					},
					{
						"internalType": "uint128",
						"name": "liquidity",
						"type": "uint128"
					},
					{
						"internalType": "uint256",
						"name": "feeGrowthInside0LastX128",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "feeGrowthInside1LastX128",
						"type": "uint256"
					},
					{
						"internalType": "uint128",
						"name": "tokensOwed0",
						"type": "uint128"
					},
					{
						"internalType": "uint128",
						"name": "tokensOwed1",
						"type": "uint128"
					},
					{
						"internalType": "address",
						"name": "owner",
						"type": "address"
					}
				],
				"internalType": "struct PositionResponse",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "fee",
				"type": "uint256"
			}
		],
		"name": "setFee",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "erc20address",
				"type": "address"
			}
		],
		"name": "withdrawERC20",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_recipient",
				"type": "address"
			}
		],
		"name": "withdrawETH",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

export const v3Router: any = [{
	"inputs": [{
		"internalType": "address",
		"name": "_factory",
		"type": "address"
	}, {
		"internalType": "address",
		"name": "_WETH9",
		"type": "address"
	}],
	"stateMutability": "nonpayable",
	"type": "constructor"
}, {
	"inputs": [],
	"name": "WETH9",
	"outputs": [{
		"internalType": "address",
		"name": "",
		"type": "address"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"components": [{
			"internalType": "bytes",
			"name": "path",
			"type": "bytes"
		}, {
			"internalType": "address",
			"name": "recipient",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountIn",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountOutMinimum",
			"type": "uint256"
		}],
		"internalType": "struct ISwapRouter.ExactInputParams",
		"name": "params",
		"type": "tuple"
	}],
	"name": "exactInput",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"components": [{
			"internalType": "address",
			"name": "tokenIn",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "tokenOut",
			"type": "address"
		}, {
			"internalType": "uint24",
			"name": "fee",
			"type": "uint24"
		}, {
			"internalType": "address",
			"name": "recipient",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountIn",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountOutMinimum",
			"type": "uint256"
		}, {
			"internalType": "uint160",
			"name": "sqrtPriceLimitX96",
			"type": "uint160"
		}],
		"internalType": "struct ISwapRouter.ExactInputSingleParams",
		"name": "params",
		"type": "tuple"
	}],
	"name": "exactInputSingle",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"components": [{
			"internalType": "bytes",
			"name": "path",
			"type": "bytes"
		}, {
			"internalType": "address",
			"name": "recipient",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountOut",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountInMaximum",
			"type": "uint256"
		}],
		"internalType": "struct ISwapRouter.ExactOutputParams",
		"name": "params",
		"type": "tuple"
	}],
	"name": "exactOutput",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"components": [{
			"internalType": "address",
			"name": "tokenIn",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "tokenOut",
			"type": "address"
		}, {
			"internalType": "uint24",
			"name": "fee",
			"type": "uint24"
		}, {
			"internalType": "address",
			"name": "recipient",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountOut",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountInMaximum",
			"type": "uint256"
		}, {
			"internalType": "uint160",
			"name": "sqrtPriceLimitX96",
			"type": "uint160"
		}],
		"internalType": "struct ISwapRouter.ExactOutputSingleParams",
		"name": "params",
		"type": "tuple"
	}],
	"name": "exactOutputSingle",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [],
	"name": "factory",
	"outputs": [{
		"internalType": "address",
		"name": "",
		"type": "address"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "bytes[]",
		"name": "data",
		"type": "bytes[]"
	}],
	"name": "multicall",
	"outputs": [{
		"internalType": "bytes[]",
		"name": "results",
		"type": "bytes[]"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [],
	"name": "refundETH",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "value",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}, {
		"internalType": "uint8",
		"name": "v",
		"type": "uint8"
	}, {
		"internalType": "bytes32",
		"name": "r",
		"type": "bytes32"
	}, {
		"internalType": "bytes32",
		"name": "s",
		"type": "bytes32"
	}],
	"name": "selfPermit",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "nonce",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "expiry",
		"type": "uint256"
	}, {
		"internalType": "uint8",
		"name": "v",
		"type": "uint8"
	}, {
		"internalType": "bytes32",
		"name": "r",
		"type": "bytes32"
	}, {
		"internalType": "bytes32",
		"name": "s",
		"type": "bytes32"
	}],
	"name": "selfPermitAllowed",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "nonce",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "expiry",
		"type": "uint256"
	}, {
		"internalType": "uint8",
		"name": "v",
		"type": "uint8"
	}, {
		"internalType": "bytes32",
		"name": "r",
		"type": "bytes32"
	}, {
		"internalType": "bytes32",
		"name": "s",
		"type": "bytes32"
	}],
	"name": "selfPermitAllowedIfNecessary",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "value",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}, {
		"internalType": "uint8",
		"name": "v",
		"type": "uint8"
	}, {
		"internalType": "bytes32",
		"name": "r",
		"type": "bytes32"
	}, {
		"internalType": "bytes32",
		"name": "s",
		"type": "bytes32"
	}],
	"name": "selfPermitIfNecessary",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "recipient",
		"type": "address"
	}],
	"name": "sweepToken",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "recipient",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "feeBips",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "feeRecipient",
		"type": "address"
	}],
	"name": "sweepTokenWithFee",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "int256",
		"name": "amount0Delta",
		"type": "int256"
	}, {
		"internalType": "int256",
		"name": "amount1Delta",
		"type": "int256"
	}, {
		"internalType": "bytes",
		"name": "_data",
		"type": "bytes"
	}],
	"name": "uniswapV3SwapCallback",
	"outputs": [],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "recipient",
		"type": "address"
	}],
	"name": "unwrapWETH9",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "recipient",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "feeBips",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "feeRecipient",
		"type": "address"
	}],
	"name": "unwrapWETH9WithFee",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"stateMutability": "payable",
	"type": "receive"
}]

export const DanDaoNFTAbi: any = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "_partner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "_type",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "_dueTime",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_amount",
				"type": "uint256"
			}
		],
		"name": "buyPartnerEvent",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "_partner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "_member",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "bool",
				"name": "_status",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "count",
				"type": "uint256"
			}
		],
		"name": "setWhiteEvent",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "_owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "addresses",
				"type": "address[]"
			}
		],
		"name": "batchCheckBalance",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "addr",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "balance",
						"type": "uint256"
					}
				],
				"internalType": "struct balanceResponseItem[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "contractAddr",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "owner",
						"type": "address"
					}
				],
				"internalType": "struct checkERC20Item[]",
				"name": "_list",
				"type": "tuple[]"
			}
		],
		"name": "batchCheckERC20Balance",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "contractAddr",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "addr",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "decimals",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "balance",
						"type": "uint256"
					}
				],
				"internalType": "struct balanceERC20ResponseItem[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "contractAddr",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "owner",
						"type": "address"
					}
				],
				"internalType": "struct checkApproveItem[]",
				"name": "parameters",
				"type": "tuple[]"
			}
		],
		"name": "batchCheckIsApprove",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "contractAddr",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "owner",
						"type": "address"
					},
					{
						"internalType": "bool",
						"name": "isApprove",
						"type": "bool"
					}
				],
				"internalType": "struct approveResponseItem[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "address[]",
				"name": "addrs",
				"type": "address[]"
			}
		],
		"name": "batchEthTransfrom",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "contractAddr",
								"type": "address"
							},
							{
								"internalType": "address",
								"name": "owner",
								"type": "address"
							},
							{
								"internalType": "uint256",
								"name": "tokenId",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "schema",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "amount",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "timestamp",
								"type": "uint256"
							},
							{
								"internalType": "bytes",
								"name": "sign",
								"type": "bytes"
							}
						],
						"internalType": "struct NftTransferItem[]",
						"name": "items",
						"type": "tuple[]"
					}
				],
				"internalType": "struct NftTransferParameters",
				"name": "parameters",
				"type": "tuple"
			}
		],
		"name": "batchNftTransfrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_contract",
				"type": "address"
			},
			{
				"internalType": "bytes[]",
				"name": "_notes",
				"type": "bytes[]"
			}
		],
		"name": "batchQueryDNSName",
		"outputs": [
			{
				"internalType": "string[]",
				"name": "",
				"type": "string[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "user",
				"type": "address[]"
			},
			{
				"internalType": "bool",
				"name": "valid",
				"type": "bool"
			}
		],
		"name": "batchRegistWhitelist",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "erc20address",
				"type": "address"
			},
			{
				"internalType": "address[]",
				"name": "addrs",
				"type": "address[]"
			}
		],
		"name": "batchTokenTransfrom",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_type",
				"type": "uint256"
			}
		],
		"name": "buyPartner",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_signer",
				"type": "address"
			}
		],
		"name": "checkIdentity",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "contra",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "times",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "startId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "limit",
				"type": "uint256"
			}
		],
		"name": "dataCallSelf",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes",
				"name": "sign",
				"type": "bytes"
			}
		],
		"name": "getIdentityBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "tokenAddr",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "startToken",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "endToken",
				"type": "uint256"
			}
		],
		"name": "getNftAllAddress",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_partner",
				"type": "address"
			}
		],
		"name": "getPartnerMemberCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "isWhitelist",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes",
				"name": "sign",
				"type": "bytes"
			}
		],
		"name": "login",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "valid",
				"type": "bool"
			}
		],
		"name": "registWhitelist",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_type",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_price",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_timestamp",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_limit",
				"type": "uint256"
			}
		],
		"name": "setBusiness",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "addr",
				"type": "address"
			}
		],
		"name": "setContractAddr",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_msg",
				"type": "string"
			}
		],
		"name": "setLoginMsg",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_partner",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_timestamp",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "limit",
				"type": "uint256"
			}
		],
		"name": "setPartner",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "erc20address",
				"type": "address"
			}
		],
		"name": "withdrawERC20",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_recipient",
				"type": "address"
			}
		],
		"name": "withdrawETH",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

export const permit2Permit: any = [
	{
		"components": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "token",
						"type": "address"
					}, {
						"internalType": "uint160",
						"name": "amount",
						"type": "uint160"
					},
					{
						"internalType": "uint48",
						"name": "expiration",
						"type": "uint48"
					},
					{
						"internalType": "uint48",
						"name": "nonce",
						"type": "uint48"
					}
				],
				"name": "details",
				"type": "tuple"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "sigDeadline",
				"type": "uint256"
			}
		],
		"name": "detail",
		"type": "tuple"
	},
	{
		"internalType": "bytes",
		"name": "byte",
		"type": "bytes"
	}
]

export const ERC20: any = [{
	"inputs": [{
		"internalType": "address",
		"name": "_owner",
		"type": "address"
	}, {
		"internalType": "address",
		"name": "_spender",
		"type": "address"
	}],
	"name": "allowance",
	"outputs": [{
		"internalType": "uint256",
		"name": "",
		"type": "uint256"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "spender",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "amount",
		"type": "uint256"
	}],
	"name": "approve",
	"outputs": [{
		"internalType": "bool",
		"name": "",
		"type": "bool"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "account",
		"type": "address"
	}],
	"name": "balanceOf",
	"outputs": [{
		"internalType": "uint256",
		"name": "",
		"type": "uint256"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [],
	"name": "decimals",
	"outputs": [{
		"internalType": "uint8",
		"name": "",
		"type": "uint8"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [],
	"name": "totalSupply",
	"outputs": [{
		"internalType": "uint256",
		"name": "",
		"type": "uint256"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "_recipient",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "_amount",
		"type": "uint256"
	}],
	"name": "transfer",
	"outputs": [{
		"internalType": "bool",
		"name": "",
		"type": "bool"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "_sender",
		"type": "address"
	}, {
		"internalType": "address",
		"name": "_recipient",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "_amount",
		"type": "uint256"
	}],
	"name": "transferFrom",
	"outputs": [{
		"internalType": "bool",
		"name": "",
		"type": "bool"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
},]

export const Camelot: any =
	[{
		"inputs": [{
			"internalType": "address",
			"name": "_factory",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "_WETH",
			"type": "address"
		}],
		"stateMutability": "nonpayable",
		"type": "constructor"
	}, {
		"inputs": [],
		"name": "WETH",
		"outputs": [{
			"internalType": "address",
			"name": "",
			"type": "address"
		}],
		"stateMutability": "view",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "address",
			"name": "tokenA",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "tokenB",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "amountADesired",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountBDesired",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountAMin",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountBMin",
			"type": "uint256"
		}, {
			"internalType": "address",
			"name": "to",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}],
		"name": "addLiquidity",
		"outputs": [{
			"internalType": "uint256",
			"name": "amountA",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountB",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "liquidity",
			"type": "uint256"
		}],
		"stateMutability": "nonpayable",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "address",
			"name": "token",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "amountTokenDesired",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountTokenMin",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountETHMin",
			"type": "uint256"
		}, {
			"internalType": "address",
			"name": "to",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}],
		"name": "addLiquidityETH",
		"outputs": [{
			"internalType": "uint256",
			"name": "amountToken",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountETH",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "liquidity",
			"type": "uint256"
		}],
		"stateMutability": "payable",
		"type": "function"
	}, {
		"inputs": [],
		"name": "factory",
		"outputs": [{
			"internalType": "address",
			"name": "",
			"type": "address"
		}],
		"stateMutability": "view",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "uint256",
			"name": "amountIn",
			"type": "uint256"
		}, {
			"internalType": "address[]",
			"name": "path",
			"type": "address[]"
		}],
		"name": "getAmountsOut",
		"outputs": [{
			"internalType": "uint256[]",
			"name": "amounts",
			"type": "uint256[]"
		}],
		"stateMutability": "view",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "address",
			"name": "token1",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "token2",
			"type": "address"
		}],
		"name": "getPair",
		"outputs": [{
			"internalType": "address",
			"name": "",
			"type": "address"
		}],
		"stateMutability": "view",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "uint256",
			"name": "amountA",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "reserveA",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "reserveB",
			"type": "uint256"
		}],
		"name": "quote",
		"outputs": [{
			"internalType": "uint256",
			"name": "amountB",
			"type": "uint256"
		}],
		"stateMutability": "pure",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "address",
			"name": "tokenA",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "tokenB",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "liquidity",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountAMin",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountBMin",
			"type": "uint256"
		}, {
			"internalType": "address",
			"name": "to",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}],
		"name": "removeLiquidity",
		"outputs": [{
			"internalType": "uint256",
			"name": "amountA",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountB",
			"type": "uint256"
		}],
		"stateMutability": "nonpayable",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "address",
			"name": "token",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "liquidity",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountTokenMin",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountETHMin",
			"type": "uint256"
		}, {
			"internalType": "address",
			"name": "to",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}],
		"name": "removeLiquidityETH",
		"outputs": [{
			"internalType": "uint256",
			"name": "amountToken",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountETH",
			"type": "uint256"
		}],
		"stateMutability": "nonpayable",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "address",
			"name": "token",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "liquidity",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountTokenMin",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountETHMin",
			"type": "uint256"
		}, {
			"internalType": "address",
			"name": "to",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}],
		"name": "removeLiquidityETHSupportingFeeOnTransferTokens",
		"outputs": [{
			"internalType": "uint256",
			"name": "amountETH",
			"type": "uint256"
		}],
		"stateMutability": "nonpayable",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "address",
			"name": "token",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "liquidity",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountTokenMin",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountETHMin",
			"type": "uint256"
		}, {
			"internalType": "address",
			"name": "to",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}, {
			"internalType": "bool",
			"name": "approveMax",
			"type": "bool"
		}, {
			"internalType": "uint8",
			"name": "v",
			"type": "uint8"
		}, {
			"internalType": "bytes32",
			"name": "r",
			"type": "bytes32"
		}, {
			"internalType": "bytes32",
			"name": "s",
			"type": "bytes32"
		}],
		"name": "removeLiquidityETHWithPermit",
		"outputs": [{
			"internalType": "uint256",
			"name": "amountToken",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountETH",
			"type": "uint256"
		}],
		"stateMutability": "nonpayable",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "address",
			"name": "token",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "liquidity",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountTokenMin",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountETHMin",
			"type": "uint256"
		}, {
			"internalType": "address",
			"name": "to",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}, {
			"internalType": "bool",
			"name": "approveMax",
			"type": "bool"
		}, {
			"internalType": "uint8",
			"name": "v",
			"type": "uint8"
		}, {
			"internalType": "bytes32",
			"name": "r",
			"type": "bytes32"
		}, {
			"internalType": "bytes32",
			"name": "s",
			"type": "bytes32"
		}],
		"name": "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens",
		"outputs": [{
			"internalType": "uint256",
			"name": "amountETH",
			"type": "uint256"
		}],
		"stateMutability": "nonpayable",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "address",
			"name": "tokenA",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "tokenB",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "liquidity",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountAMin",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountBMin",
			"type": "uint256"
		}, {
			"internalType": "address",
			"name": "to",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}, {
			"internalType": "bool",
			"name": "approveMax",
			"type": "bool"
		}, {
			"internalType": "uint8",
			"name": "v",
			"type": "uint8"
		}, {
			"internalType": "bytes32",
			"name": "r",
			"type": "bytes32"
		}, {
			"internalType": "bytes32",
			"name": "s",
			"type": "bytes32"
		}],
		"name": "removeLiquidityWithPermit",
		"outputs": [{
			"internalType": "uint256",
			"name": "amountA",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountB",
			"type": "uint256"
		}],
		"stateMutability": "nonpayable",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "uint256",
			"name": "amountOutMin",
			"type": "uint256"
		}, {
			"internalType": "address[]",
			"name": "path",
			"type": "address[]"
		}, {
			"internalType": "address",
			"name": "to",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "referrer",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}],
		"name": "swapExactETHForTokensSupportingFeeOnTransferTokens",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "uint256",
			"name": "amountIn",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountOutMin",
			"type": "uint256"
		}, {
			"internalType": "address[]",
			"name": "path",
			"type": "address[]"
		}, {
			"internalType": "address",
			"name": "to",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "referrer",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}],
		"name": "swapExactTokensForETHSupportingFeeOnTransferTokens",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}, {
		"inputs": [{
			"internalType": "uint256",
			"name": "amountIn",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountOutMin",
			"type": "uint256"
		}, {
			"internalType": "address[]",
			"name": "path",
			"type": "address[]"
		}, {
			"internalType": "address",
			"name": "to",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "referrer",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "deadline",
			"type": "uint256"
		}],
		"name": "swapExactTokensForTokensSupportingFeeOnTransferTokens",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}, {
		"stateMutability": "payable",
		"type": "receive"
	}]
export const Trade: any = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_ETH",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "ETH",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "target",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amountMinOut",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "percent",
				"type": "uint256"
			},
			{
				"components": [
					{
						"internalType": "address",
						"name": "_pool",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "_router",
						"type": "address"
					},
					{
						"internalType": "bytes",
						"name": "_bytes",
						"type": "bytes"
					}
				],
				"internalType": "struct ParamsCall[]",
				"name": "params",
				"type": "tuple[]"
			}
		],
		"name": "FuckTuGouBuy",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "target",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "router",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amountIn",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountMinOut",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "_bytes",
				"type": "bytes"
			}
		],
		"name": "FuckTuGouSell",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "user",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "times",
						"type": "uint256"
					}
				],
				"internalType": "struct memberStruct[]",
				"name": "users",
				"type": "tuple[]"
			}
		],
		"name": "batchSetMember",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_sender",
				"type": "address"
			}
		],
		"name": "checkETHBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "preETHBalance",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "preWETHBalance",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "price",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAddress",
				"type": "address"
			}
		],
		"name": "setAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_price",
				"type": "uint256"
			}
		],
		"name": "setBaseData",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAddress",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_recipient",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "erc20address",
				"type": "address"
			}
		],
		"name": "withdrawERC20",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_recipient",
				"type": "address"
			}
		],
		"name": "withdrawETH",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]
export const v3Router2: any = [{
	"inputs": [{
		"internalType": "address",
		"name": "_factoryV2",
		"type": "address"
	}, {
		"internalType": "address",
		"name": "factoryV3",
		"type": "address"
	}, {
		"internalType": "address",
		"name": "_positionManager",
		"type": "address"
	}, {
		"internalType": "address",
		"name": "_WETH9",
		"type": "address"
	}],
	"stateMutability": "nonpayable",
	"type": "constructor"
}, {
	"inputs": [],
	"name": "WETH9",
	"outputs": [{
		"internalType": "address",
		"name": "",
		"type": "address"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}],
	"name": "approveMax",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}],
	"name": "approveMaxMinusOne",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}],
	"name": "approveZeroThenMax",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}],
	"name": "approveZeroThenMaxMinusOne",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "bytes",
		"name": "data",
		"type": "bytes"
	}],
	"name": "callPositionManager",
	"outputs": [{
		"internalType": "bytes",
		"name": "result",
		"type": "bytes"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "bytes[]",
		"name": "paths",
		"type": "bytes[]"
	}, {
		"internalType": "uint128[]",
		"name": "amounts",
		"type": "uint128[]"
	}, {
		"internalType": "uint24",
		"name": "maximumTickDivergence",
		"type": "uint24"
	}, {
		"internalType": "uint32",
		"name": "secondsAgo",
		"type": "uint32"
	}],
	"name": "checkOracleSlippage",
	"outputs": [],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "bytes",
		"name": "path",
		"type": "bytes"
	}, {
		"internalType": "uint24",
		"name": "maximumTickDivergence",
		"type": "uint24"
	}, {
		"internalType": "uint32",
		"name": "secondsAgo",
		"type": "uint32"
	}],
	"name": "checkOracleSlippage",
	"outputs": [],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"components": [{
			"internalType": "bytes",
			"name": "path",
			"type": "bytes"
		}, {
			"internalType": "address",
			"name": "recipient",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "amountIn",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountOutMinimum",
			"type": "uint256"
		}],
		"internalType": "struct IV3SwapRouter.ExactInputParams",
		"name": "params",
		"type": "tuple"
	}],
	"name": "exactInput",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"components": [{
			"internalType": "address",
			"name": "tokenIn",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "tokenOut",
			"type": "address"
		}, {
			"internalType": "uint24",
			"name": "fee",
			"type": "uint24"
		}, {
			"internalType": "address",
			"name": "recipient",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "amountIn",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountOutMinimum",
			"type": "uint256"
		}, {
			"internalType": "uint160",
			"name": "sqrtPriceLimitX96",
			"type": "uint160"
		}],
		"internalType": "struct IV3SwapRouter.ExactInputSingleParams",
		"name": "params",
		"type": "tuple"
	}],
	"name": "exactInputSingle",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"components": [{
			"internalType": "bytes",
			"name": "path",
			"type": "bytes"
		}, {
			"internalType": "address",
			"name": "recipient",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "amountOut",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountInMaximum",
			"type": "uint256"
		}],
		"internalType": "struct IV3SwapRouter.ExactOutputParams",
		"name": "params",
		"type": "tuple"
	}],
	"name": "exactOutput",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"components": [{
			"internalType": "address",
			"name": "tokenIn",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "tokenOut",
			"type": "address"
		}, {
			"internalType": "uint24",
			"name": "fee",
			"type": "uint24"
		}, {
			"internalType": "address",
			"name": "recipient",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "amountOut",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amountInMaximum",
			"type": "uint256"
		}, {
			"internalType": "uint160",
			"name": "sqrtPriceLimitX96",
			"type": "uint160"
		}],
		"internalType": "struct IV3SwapRouter.ExactOutputSingleParams",
		"name": "params",
		"type": "tuple"
	}],
	"name": "exactOutputSingle",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [],
	"name": "factory",
	"outputs": [{
		"internalType": "address",
		"name": "",
		"type": "address"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [],
	"name": "factoryV2",
	"outputs": [{
		"internalType": "address",
		"name": "",
		"type": "address"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "amount",
		"type": "uint256"
	}],
	"name": "getApprovalType",
	"outputs": [{
		"internalType": "enum IApproveAndCall.ApprovalType",
		"name": "",
		"type": "uint8"
	}],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"components": [{
			"internalType": "address",
			"name": "token0",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "token1",
			"type": "address"
		}, {
			"internalType": "uint256",
			"name": "tokenId",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amount0Min",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amount1Min",
			"type": "uint256"
		}],
		"internalType": "struct IApproveAndCall.IncreaseLiquidityParams",
		"name": "params",
		"type": "tuple"
	}],
	"name": "increaseLiquidity",
	"outputs": [{
		"internalType": "bytes",
		"name": "result",
		"type": "bytes"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"components": [{
			"internalType": "address",
			"name": "token0",
			"type": "address"
		}, {
			"internalType": "address",
			"name": "token1",
			"type": "address"
		}, {
			"internalType": "uint24",
			"name": "fee",
			"type": "uint24"
		}, {
			"internalType": "int24",
			"name": "tickLower",
			"type": "int24"
		}, {
			"internalType": "int24",
			"name": "tickUpper",
			"type": "int24"
		}, {
			"internalType": "uint256",
			"name": "amount0Min",
			"type": "uint256"
		}, {
			"internalType": "uint256",
			"name": "amount1Min",
			"type": "uint256"
		}, {
			"internalType": "address",
			"name": "recipient",
			"type": "address"
		}],
		"internalType": "struct IApproveAndCall.MintParams",
		"name": "params",
		"type": "tuple"
	}],
	"name": "mint",
	"outputs": [{
		"internalType": "bytes",
		"name": "result",
		"type": "bytes"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "bytes32",
		"name": "previousBlockhash",
		"type": "bytes32"
	}, {
		"internalType": "bytes[]",
		"name": "data",
		"type": "bytes[]"
	}],
	"name": "multicall",
	"outputs": [{
		"internalType": "bytes[]",
		"name": "",
		"type": "bytes[]"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}, {
		"internalType": "bytes[]",
		"name": "data",
		"type": "bytes[]"
	}],
	"name": "multicall",
	"outputs": [{
		"internalType": "bytes[]",
		"name": "",
		"type": "bytes[]"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "bytes[]",
		"name": "data",
		"type": "bytes[]"
	}],
	"name": "multicall",
	"outputs": [{
		"internalType": "bytes[]",
		"name": "results",
		"type": "bytes[]"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [],
	"name": "positionManager",
	"outputs": [{
		"internalType": "address",
		"name": "",
		"type": "address"
	}],
	"stateMutability": "view",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "value",
		"type": "uint256"
	}],
	"name": "pull",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [],
	"name": "refundETH",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "value",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}, {
		"internalType": "uint8",
		"name": "v",
		"type": "uint8"
	}, {
		"internalType": "bytes32",
		"name": "r",
		"type": "bytes32"
	}, {
		"internalType": "bytes32",
		"name": "s",
		"type": "bytes32"
	}],
	"name": "selfPermit",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "nonce",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "expiry",
		"type": "uint256"
	}, {
		"internalType": "uint8",
		"name": "v",
		"type": "uint8"
	}, {
		"internalType": "bytes32",
		"name": "r",
		"type": "bytes32"
	}, {
		"internalType": "bytes32",
		"name": "s",
		"type": "bytes32"
	}],
	"name": "selfPermitAllowed",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "nonce",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "expiry",
		"type": "uint256"
	}, {
		"internalType": "uint8",
		"name": "v",
		"type": "uint8"
	}, {
		"internalType": "bytes32",
		"name": "r",
		"type": "bytes32"
	}, {
		"internalType": "bytes32",
		"name": "s",
		"type": "bytes32"
	}],
	"name": "selfPermitAllowedIfNecessary",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "value",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "deadline",
		"type": "uint256"
	}, {
		"internalType": "uint8",
		"name": "v",
		"type": "uint8"
	}, {
		"internalType": "bytes32",
		"name": "r",
		"type": "bytes32"
	}, {
		"internalType": "bytes32",
		"name": "s",
		"type": "bytes32"
	}],
	"name": "selfPermitIfNecessary",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountOutMin",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}],
	"name": "swapExactTokensForTokens",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountOut",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "amountInMax",
		"type": "uint256"
	}, {
		"internalType": "address[]",
		"name": "path",
		"type": "address[]"
	}, {
		"internalType": "address",
		"name": "to",
		"type": "address"
	}],
	"name": "swapTokensForExactTokens",
	"outputs": [{
		"internalType": "uint256",
		"name": "amountIn",
		"type": "uint256"
	}],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "recipient",
		"type": "address"
	}],
	"name": "sweepToken",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}],
	"name": "sweepToken",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "feeBips",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "feeRecipient",
		"type": "address"
	}],
	"name": "sweepTokenWithFee",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "address",
		"name": "token",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "recipient",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "feeBips",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "feeRecipient",
		"type": "address"
	}],
	"name": "sweepTokenWithFee",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "int256",
		"name": "amount0Delta",
		"type": "int256"
	}, {
		"internalType": "int256",
		"name": "amount1Delta",
		"type": "int256"
	}, {
		"internalType": "bytes",
		"name": "_data",
		"type": "bytes"
	}],
	"name": "uniswapV3SwapCallback",
	"outputs": [],
	"stateMutability": "nonpayable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "recipient",
		"type": "address"
	}],
	"name": "unwrapWETH9",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}],
	"name": "unwrapWETH9",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "recipient",
		"type": "address"
	}, {
		"internalType": "uint256",
		"name": "feeBips",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "feeRecipient",
		"type": "address"
	}],
	"name": "unwrapWETH9WithFee",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "amountMinimum",
		"type": "uint256"
	}, {
		"internalType": "uint256",
		"name": "feeBips",
		"type": "uint256"
	}, {
		"internalType": "address",
		"name": "feeRecipient",
		"type": "address"
	}],
	"name": "unwrapWETH9WithFee",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"inputs": [{
		"internalType": "uint256",
		"name": "value",
		"type": "uint256"
	}],
	"name": "wrapETH",
	"outputs": [],
	"stateMutability": "payable",
	"type": "function"
}, {
	"stateMutability": "payable",
	"type": "receive"
}]

