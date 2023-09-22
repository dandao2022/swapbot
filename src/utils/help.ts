import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'
import { token, v2Pool, v3Pool, checkERC20Item } from "../types"
import { Token } from '@uniswap/sdk-core'
import { Config, FeeAmount } from "../config/constrants"
import { batchGetBaseData, batchGetPair, batchGETV3Pool, batchCheckERC20Balance, getDanDaoContract, getDanDaoNFTContract } from "./fetch"
import { Pair, TokenAmount } from "@uniswap/sdk"
import { computePoolAddress, Pool } from '@uniswap/v3-sdk/'
import BigNumber from 'bignumber.js'
import packet from 'dns-packet'
import Web3 from 'web3'
export const recoverAccount = (signature: string) => {
    let web3 = new Web3()
    let r = signature.slice(0, 66);
    let s = "0x" + signature.slice(66, 130);
    let v = "0x" + signature.slice(130, 132);
    let account = web3.eth.accounts.recover("DAN DAO login", v, r, s)
    return account
}
export const sliceAddresses = (addresses: string[]) => {
    let length = Math.ceil(addresses.length / 50)
    let newList: Array<string[]> = []
    for (let i = 0; i < length; i++) {
        newList.push(addresses.slice(i * 50, (i + 1) * 50))
    }
    return newList
}
//hex地址
export const hexENSAddress = (address: string) => {
    let name = `${address.toLowerCase().substring(2)}.addr.reverse`
    return `0x${packet.name.encode(name).toString('hex')}`
}

//计算uniswapv3地址
export const computedV3PairAddress = (tokenA: string | Token, tokenB: string | Token, chainID: number) => {
    return new Promise<{ token0: string, token1: string, pool: string, name: string, fee: number, version: string }[]>(async (resolve) => {
        const config = getConfig(chainID)
        let list = []
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await batchGetBaseData([tokenA, tokenB], chainID)
            let newList = []
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    }
                    newList.push(getToken(items))
                }
            }
            list = newList
        } else {
            list = [tokenA, tokenB]
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]]
            let pools = []
            for (let item of FeeAmount) {
                const pool = computePoolAddress({
                    factoryAddress: config.v3FactoryAddress,
                    fee: item,
                    tokenA: token0,
                    tokenB: token1
                })

                pools.push({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, fee: item, version: "uniswapv3" })
            }
            resolve(pools)
        } else {
            resolve([])
        }
    })
}
//计算sushiv2地址
export const computedSuShiPairAddress = (tokenA: string | Token, tokenB: string | Token, chainID: number) => {
    return new Promise<{ token0: string, token1: string, pool: string, name: string, version: string }>(async (resolve) => {
        const config = getConfig(chainID)
        let list = []
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await batchGetBaseData([tokenA, tokenB], chainID)
            let newList = []
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    }
                    newList.push(getToken(items))
                }
            }
            list = newList
        } else {
            list = [tokenA, tokenB]
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]]
            let pool = getCreate2Address(
                config.v2FactoryAddress,
                keccak256(['bytes'], [pack(['address', 'address'], [token0.address, token1.address])]),
                "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303"
            )
            resolve({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, version: "uniswapv2" })
        } else {
            resolve(null)
        }
    })
}
//计算神剑v2地址
export const computedCamelotPairAddress = (tokenA: string | Token, tokenB: string | Token, chainID: number) => {
    return new Promise<{ token0: string, token1: string, pool: string, name: string, version: string }>(async (resolve) => {
        const config = getConfig(chainID)
        let list = []
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await batchGetBaseData([tokenA, tokenB], chainID)
            let newList = []
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    }
                    newList.push(getToken(items))
                }
            }
            list = newList
        } else {
            list = [tokenA, tokenB]
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]]
            let pool = getCreate2Address(
                config.camelotFactory,
                keccak256(['bytes'], [pack(['address', 'address'], [token0.address, token1.address])]),
                "0xa856464ae65f7619087bc369daaf7e387dae1e5af69cfa7935850ebf754b04c1"
            )
            resolve({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, version: "camelotv2" })
        } else {
            resolve(null)
        }
    })
}
//计算uniswapv2地址
export const computedV2PairAddress = (tokenA: string | Token, tokenB: string | Token, chainID: number) => {
    return new Promise<{ token0: string, token1: string, pool: string, name: string, version: string }>(async (resolve) => {
        const config = getConfig(chainID)
        let list = []
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await batchGetBaseData([tokenA, tokenB], chainID)
            let newList = []
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    }
                    newList.push(getToken(items))
                }
            }
            list = newList
        } else {
            list = [tokenA, tokenB]
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]]
            let pool = getCreate2Address(
                config.v2FactoryAddress,
                keccak256(['bytes'], [pack(['address', 'address'], [token0.address, token1.address])]),
                "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f"
            )
            resolve({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, version: "uniswapv2" })
        } else {
            resolve(null)
        }
    })
}

//计算pancake v2 地址
export const computedPancakeV2PairAddress = (tokenA: string | Token, tokenB: string | Token, chainID: number) => {
    return new Promise<{ token0: string, token1: string, pool: string, name: string, version: string }>(async (resolve) => {
        const config = getConfig(chainID)
        let list = []
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await batchGetBaseData([tokenA, tokenB], chainID)
            let newList = []
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    }
                    newList.push(getToken(items))
                }
            }
            list = newList
        } else {
            list = [tokenA, tokenB]
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]]
            let pool = getCreate2Address(
                config.v2FactoryAddress,
                keccak256(['bytes'], [pack(['address', 'address'], [token0.address, token1.address])]),
                "0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5"
            )
            resolve({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, version: "uniswapv2" })
        } else {
            resolve(null)
        }
    })
}
//计算pancake v2 地址
export const computedPancakeV3PairAddress = (tokenA: string | Token, tokenB: string | Token, chainID: number) => {
    return new Promise<{ token0: string, token1: string, pool: string, name: string, fee: number, version: string }[]>(async (resolve) => {
        const config = getConfig(chainID)
        let list = []
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await batchGetBaseData([tokenA, tokenB], chainID)
            let newList = []
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    }
                    newList.push(getToken(items))
                }
            }
            list = newList
        } else {
            list = [tokenA, tokenB]
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]]
            let pools = []
            for (let item of FeeAmount) {
                let pool = getCreate2Address(
                    config.v3FactoryAddress,
                    keccak256(['bytes'], [pack(['address', 'address', "uint"], [token0.address, token1.address, item])]),
                    "0x6ce8eb472fa82df5469c6ab6d485f17c3ad13c8cd7af59b3d4a8026c5ce0f7e2"
                )
                pools.push({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, fee: item, version: "uniswapv3" })
            }
            resolve(pools)
        } else {
            resolve(null)
        }
    })
}
//获取web3
export const getProvider = (chainID: number) => {
    if(!Config[chainID].provider){
        configInitialization([chainID])
    }
    return Config[chainID].provider
}
//获取全局配置
export const getConfig = (chainID: number) => {
    return Config[chainID];
}
export const configInitialization = (chainIds: number[]) => {
    chainIds.forEach(item => {
        const web3 = new Web3(new Web3.providers.HttpProvider(Config[item].prc, { timeout: 60000 }))
        Config[item].provider = web3
        if (item == 1) {
            Config[item].DANDAOFactoryContract = getDanDaoContract(item)
            Config[item].DANDAONFTFactoryContract = getDanDaoNFTContract(item)
        } else {
            Config[item].DANDAOFactoryContract = getDanDaoContract(item)
        }
    })
}
//获取v2pool
export const getV2Pair = (pairAddress: string, chainID: number) => {
    return new Promise<v2Pool>(async (resolve) => {
        try {
            let list = await batchGetPair([pairAddress], chainID)
            resolve(list[0])
        } catch (error) {
            resolve(null)
        }
    })
}
//批量获取v2pool
export const batchGETPair = (pairAddresses: string[], chainID: number) => {
    return new Promise<v2Pool[]>(async (resolve) => {
        try {
            let list = await batchGetPair(pairAddresses, chainID)
            resolve(list)
        } catch (error) {
            resolve([])
        }
    })
}
//计算v2价格
export const computedV2Price = (tokenA: string | Token, tokenB: string | Token, v2Pool: v2Pool, chainID: number) => {
    return new Promise<any>(async (resolve) => {
        let list = []
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await batchGetBaseData([tokenA, tokenB], chainID)
            let newList = []
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    }
                    newList.push(getToken(items))
                }
            }
            list = newList
        } else {
            list = [tokenA, tokenB]
        }
        if (list.length == 2) {
            try {
                let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]] // does safety checks
                let _reserve0 = BigNumber(v2Pool.reserve0)
                let _reserve1 = BigNumber(v2Pool.reserve1)
                let pair = new Pair(new TokenAmount(token0, _reserve0.toFixed()), new TokenAmount(token1, _reserve1.toFixed()))
                const token0Price = pair.token0Price
                const token1Price = pair.token1Price
                const res: any = {}
                res[token0Price.baseCurrency.symbol] = token0Price.toSignificant(token0Price.baseCurrency.decimals);
                res[token1Price.baseCurrency.symbol] = token1Price.toSignificant(token1Price.baseCurrency.decimals);
                resolve(res)
            } catch (error) {
                let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]] // does safety checks
                const res: any = {}
                res[token0.symbol] = 0;
                res[token1.symbol] = 0;
                resolve(res)
            }
        } else {
            resolve(null)
        }
    })
}
//计算v3价格
export const computedV3Price = (tokenA: string | Token, tokenB: string | Token, v3Pool: v3Pool, chainID: number) => {
    return new Promise(async (resolve) => {
        let list = []
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await batchGetBaseData([tokenA, tokenB], chainID)
            let newList = []
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    }
                    newList.push(getToken(items))
                }
            }
            list = newList
        } else {
            list = [tokenA, tokenB]
        }
        if (list.length == 2) {
            try {
                let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]] // does safety checks
                let target1_target2_POOL = new Pool(
                    token0,
                    token1,
                    Number(v3Pool.fee),
                    v3Pool.slot0[0],
                    v3Pool.liquidity.toString(),
                    Number(v3Pool.slot0[1]),
                )
                const token0Price = target1_target2_POOL.token0Price
                const token1Price = target1_target2_POOL.token1Price
                const res = {}
                res[token0Price.baseCurrency.symbol] = token0Price.toSignificant(token0Price.baseCurrency.decimals);
                res[token1Price.baseCurrency.symbol] = token1Price.toSignificant(token1Price.baseCurrency.decimals);
                resolve(res)
            } catch (error) {
                let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]] // does safety checks
                const res = {}
                res[token0.symbol] = 0;
                res[token1.symbol] = 0;
                resolve(null)
            }
        } else {
            resolve(null)
        }
    })
}
//获取token
export const getToken = (token: token) => {
    return new Token(Number(token.chain_id), token.address, Number(token.decimals), token.symbol, token.name)
}
//生成池子地址
export const generatePool = async (token: token, chainID: number) => {
    return new Promise<string>(async (resolve) => {
        const stableToken = Config[chainID].stableToken;
        let pools = []
        if (chainID == 1) {
            for (let item of stableToken) {
                let tokenA = getToken(item)
                let tokenB = getToken(token)
                let result = await computedV2PairAddress(tokenA, tokenB, chainID)
                pools.push(result)
            }
            for (let item of stableToken) {
                let tokenA = getToken(item)
                let tokenB = getToken(token)
                let result = await computedV3PairAddress(tokenA, tokenB, chainID)
                pools = pools.concat(result)
            }
            if (pools.length == 4) {
                resolve(JSON.stringify(pools))
            } else {
                resolve(null)
            }
        } else if (chainID == 5) {
            for (let item of stableToken) {
                let tokenA = getToken(item)
                let tokenB = getToken(token)
                let result = await computedV2PairAddress(tokenA, tokenB, chainID)
                pools.push(result)
            }
            for (let item of stableToken) {
                let tokenA = getToken(item)
                let tokenB = getToken(token)
                let result = await computedV3PairAddress(tokenA, tokenB, chainID)
                pools = pools.concat(result)
            }
            if (pools.length == 4) {
                resolve(JSON.stringify(pools))
            } else {
                resolve(null)
            }
        } else if (chainID == 42161) {
            for (let item of stableToken) {
                let tokenA = getToken(item)
                let tokenB = getToken(token)
                let result = await computedSuShiPairAddress(tokenA, tokenB, chainID)
                pools.push(result)
            }
            for (let item of stableToken) {
                let tokenA = getToken(item)
                let tokenB = getToken(token)
                let result = await computedCamelotPairAddress(tokenA, tokenB, chainID)
                pools.push(result)
            }
            for (let item of stableToken) {
                let tokenA = getToken(item)
                let tokenB = getToken(token)
                let result = await computedV3PairAddress(tokenA, tokenB, chainID)
                pools = pools.concat(result)
            }
            if (pools.length == 5) {
                resolve(JSON.stringify(pools))
            } else {
                resolve(null)
            }
        }
    })
}
export const getTransactionErrorTransactionReceipt = (err: any) => {
    let transactionReceipt = {}
    try {
        let result = JSON.parse(err.message.replace("Transaction has been reverted by the EVM:", ""))
        transactionReceipt = result
    } catch (error) {
    }
    return transactionReceipt
}
//处理错误信息
export const getTransactionErrorHash = (err: any) => {
    let hash = ""
    try {
        let result = JSON.parse(err.message.replace("Transaction has been reverted by the EVM:", ""))
        hash = result.transactionHash
    } catch (error) {
    }
    return hash
}
//批量获取v2池子信息
export const batchV2Pool = (addresses: string[], chainID: number, version: string) => {
    return new Promise<v2Pool[]>(async (resolve) => {
        let result = await batchGetPair(addresses, chainID)
        let newList = []
        result.forEach((item, index) => {
            if (Number(item.totalSupply) > 0) {
                let pool: v2Pool = {
                    pool: addresses[index],
                    reserve0: item.reserve0,
                    reserve1: item.reserve1,
                    token0: item.token0,
                    token1: item.token1,
                    blockTimestampLast: item.blockTimestampLast,
                    totalSupply: item.totalSupply,
                    version: version,
                }
                newList.push(pool)
            }
        })
        resolve(newList)
    })
}
//批量获取v3池子信息
export const batchV3Pool = async (addresses: string[], chainID: number, version: string) => {
    return new Promise<v3Pool[]>(async (resolve) => {
        let result = await batchGETV3Pool(addresses, chainID)
        let newList: v3Pool[] = []
        result.forEach((item, index) => {
            if (Number(item.liquidity) > 0) {
                let pool: v3Pool = {
                    pool: addresses[index],
                    maxLiquidityPerTick: item.maxLiquidityPerTick,
                    tickSpacing: item.tickSpacing,
                    liquidity: item.liquidity,
                    reserve0: '0',
                    reserve1: '0',
                    fee: item.fee,
                    token0: item.token0,
                    token1: item.token1,
                    slot0: item.slot0,
                    version: version,
                }
                newList.push(pool)
            }
        })
        if (newList.length) {
            newList = await queryReserves(newList, chainID)
        }
        resolve(newList)
    })
}
//获取v3池子余额
export const queryReserves = async (pools: v3Pool[], chainID: number) => {
    return new Promise<v3Pool[]>(async (resolve) => {
        let checkERC20s: checkERC20Item[] = []
        pools.forEach(item => {
            checkERC20s.push({
                contractAddr: item.token0,
                owner: item.pool
            })
            checkERC20s.push({
                contractAddr: item.token1,
                owner: item.pool
            })
        })
        let result = await batchCheckERC20Balance(checkERC20s, chainID)
        pools.forEach(item => {
            let _findToken0 = result.find(token => {
                return token.contractAddr == item.token0 && token.addr == item.pool
            })
            let _findToken1 = result.find(token => {
                return token.contractAddr == item.token1 && token.addr == item.pool
            })
            if (_findToken0) {
                item.reserve0 = _findToken0.balance
            }
            if (_findToken1) {
                item.reserve1 = _findToken1.balance
            }
        })
        resolve(pools)
    })
}

export const formatAmount = (amount: string | number, decimals: number) => {
    let newAmount = BigNumber(Number(amount) / (10 ** decimals)).toFixed();
    let amountArr = newAmount.split(".")
    return Number(`${amountArr[0]}.${amountArr[1].substring(0, 3)}`)
}
