export const Config = {
    1: {
        name: "ether",
        chainID: 1,
        prc: "https://eth.llamarpc.com",
        wssPrc: "wss://mainnet.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8",
        v2FactoryAddress: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
        v2Router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        v3FactoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
        v3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        v3Position: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        DANDAOFactory: "0x4827f81cE1F6344bb44c4278838FF5c04885350c",
        DANDAOTrade: "0x9cc6723F5bA2207fa5263FeEdcc6a6248b7e2212",
        DANDAOTradeV3:"0x916BB2aDd4E883628B92835599D40F3e1D8004F2",
        DANDAONFTFactory: "0xA7b33E8E63AC37608Bb23e64919c07cd6E082FEe",
        UniversalRouter: "0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B",
        DANDAOFee: 3000000000000000,
        stableToken: [
            {
                chain_id: 1,
                address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                decimals: 18,
                symbol: "ETH",
                name: "Canonical Wrapped Ether"
            }
        ],
        ignoreToken:["0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2"],
        stableContract: ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0xdAC17F958D2ee523a2206206994597C13D831ec7"],
        provider: null,
        ordiProvider:null,
        DANDAOFactoryContract: null,
        DANDAONFTFactoryContract: null
    },
    5: {
        name: "geroli",
        chainID: 5,
        prc: "https://goerli.infura.io/v3/b4bdd4f9ff6d4613ab14fe4c7509901c",
        wssPrc: "wss://goerli.infura.io/ws/v3/b4bdd4f9ff6d4613ab14fe4c7509901c",
        v2FactoryAddress: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
        v2Router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        v3FactoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
        v3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        v3Position: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        DANDAOFactory: "0x146a9A8634889E8872f704e8b08e521c9E2494Dd",
        DANDAOTrade: "0x74Ccf8612F6f7860F7e8958524B03223c4d64E3E",
        DANDAOTradeV3:"0x17009db8Fcc50B108F70Cd6C22a8072e4B8a10ef",
        DANDAONFTFactory: "0x0000000000000000000000000000000000000000",
        DANDAOBusiness: "0xCF628a8b590B44A6BE1b22918378d4012AC0E506",
        UniversalRouter: "0x4648a43B2C14Da09FdF82B161150d3F634f40491",
        DANDAOFee: 3000000000000000,
        stableToken: [
            {
                chain_id: 5,
                address: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
                decimals: 18,
                symbol: "ETH",
                name: "Canonical Wrapped Ether"
            }
        ],
        ignoreToken:[],
        stableContract: ["0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", "0xf9Fe684BF908A6934F9fe7646C6A63022C35D575"],
        provider: null,
        ordiProvider:null,
        DANDAOFactoryContract: null,
        DANDAONFTFactoryContract: null
    },
    42161: {
        name: "arbitrum",
        chainID: 42161,
        prc: "https://arb1.arbitrum.io/rpc",
        wssPrc: "wss://arbitrum-mainnet.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8",
        v2FactoryAddress: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
        v2Router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        v3FactoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
        v3Router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        camelotV2Router: "0xc873fEcbd354f5A56E00E710B90EF4201db2448d",
        camelotFactory: "0x6EcCab422D763aC031210895C81787E87B43A652",
        v3Position: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        DANDAOFactory: "0x14c27a3A5e59a46f88aEa900639dc38885AD062B",
        DANDAOTrade: "0x4496d3cB337193765D136e92baa8CE7AE81F4B63",
        DANDAONFTFactory: "0x0000000000000000000000000000000000000000",
        DANDAOBusiness: "0x7b5540Feb26B4f2a3f33208871d72822f89898E1",
        UniversalRouter: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
        DANDAOFee: 3000000000000000,
        stableToken: [
            {
                chain_id: 42161,
                address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
                decimals: 18,
                symbol: "ETH",
                name: "Canonical Wrapped Ether"
            }
        ],
        ignoreToken:[],
        stableContract: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"],
        provider: null,
        ordiProvider:null,
        DANDAOFactoryContract: null,
        DANDAONFTFactoryContract: null
    },
}

export const FeeAmount = [500, 3000, 10000]
export const transactionGas = {
    1: 500000,
    5: 500000,
    56: 500000,
    42161: 5000000,
}
export const ERC20ConventionMethods = ["0x095ea7b3", "0xa9059cbb", "0x23b872dd", "0xf2fde38b"]
