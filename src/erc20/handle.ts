import { batchGetBaseData, getBaseData, getFirstPrice, getDecimals, getContractAllTransferEvent, batchCheckERC20Balance, batchGetCreator } from "../utils/fetch"
import { v2Pool, v3Pool, pool, insertItem, swapEvent } from "../types"
import BigNumber from "bignumber.js"
import { generatePool, computedV2Price, computedV3Price, getToken, batchV2Pool, batchV3Pool, getProvider } from "../utils/help"
import { Token } from '@uniswap/sdk-core'
import { Config } from "../config/constrants"
import _ from "lodash"
// 获取买入数量
export const computedMevPrice = async (pool: (v2Pool | v3Pool), contract: insertItem, currentPrice: string, selfAmount: number, targetAmount: number) => {
    return new Promise(async (resolve) => {
        let tokenA = Config[contract.chain_id].stableToken[0]
        let tokenB = {
            chain_id: contract.chain_id,
            address: contract.address,
            decimals: Number(contract.decimals),
            symbol: contract.symbol,
            name: contract.name,
        }
        let output = selfAmount / Number(currentPrice)
        output = Math.floor(output * 10 ** Number(contract.decimals))
        pool.reserve0 = pool.token0 == Config[contract.chain_id].stableContract[0] ? BigNumber(Number(pool.reserve0) + selfAmount * 10 ** 18).toFixed() : BigNumber(Number(pool.reserve0) - output).toFixed()
        pool.reserve1 = pool.token1 == Config[contract.chain_id].stableContract[0] ? BigNumber(Number(pool.reserve1) + selfAmount * 10 ** 18).toFixed() : BigNumber(Number(pool.reserve1) - output).toFixed()
        let selfInPrice = await handleHasLiquidityPools(pool, getToken(tokenA), getToken(tokenB), contract.chain_id)
        let targetOutput = targetAmount / Number(selfInPrice[contract.symbol])
        targetOutput = Math.floor(targetOutput * 10 ** Number(contract.decimals))
        pool.reserve0 = pool.token0 == Config[contract.chain_id].stableContract[0] ? BigNumber(Number(pool.reserve0) + targetAmount * 10 ** 18).toFixed() : BigNumber(Number(pool.reserve0) - targetOutput).toFixed()
        pool.reserve1 = pool.token1 == Config[contract.chain_id].stableContract[0] ? BigNumber(Number(pool.reserve1) + targetAmount * 10 ** 18).toFixed() : BigNumber(Number(pool.reserve1) - targetOutput).toFixed()
        let nextPrice = await handleHasLiquidityPools(pool, getToken(tokenA), getToken(tokenB), contract.chain_id)
        let nextAmount = (output / (10 ** Number(contract.decimals))) * Number(nextPrice[contract.symbol])
        resolve({
            output,
            nextAmount,
            currentPrice,
            nextPrice: nextPrice[contract.symbol]
        })
    })
}
export const fastGetCommandAmountOut = (address: string, amountOut: string, chainId: number) => {
    return new Promise<{ amount: string, pool: pool }>(async (resolve) => {
        let tokenA = Config[chainId].stableToken[0]
        let decimals = await getDecimals(address, chainId)
        if (decimals) {
            let tokenB = {
                chain_id: chainId,
                address: address,
                decimals: decimals,
                symbol: "tokenb",
                name: "tokenb"
            }
            let pools: string = await generatePool(tokenB, chainId)
            if (pools) {
                let arrPools: pool[] = JSON.parse(pools)
                let formatPools: (v2Pool | v3Pool)[] = await batchAllPool(arrPools, chainId)
                let pool
                formatPools.forEach(item => {
                    if (pool) {
                        let oldReserve = pool.token0 == Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1
                        let newReserve = item.token0 == Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1
                        pool = Number(oldReserve) > Number(newReserve) ? pool : item
                    } else {
                        pool = item
                    }
                })
                let price
                if (pool) {
                    price = await handleHasLiquidityPools(pool, getToken(tokenA), getToken(tokenB), chainId)
                }
                if (price) {
                    resolve({ amount: BigNumber(((Number(amountOut) / (10 ** decimals) * Number(price.tokenb)) * 10 ** 18).toFixed(0)).toFixed(), pool: pool })
                } else {
                    resolve(null)
                }
            } else {
                resolve(null)
            }
        } else {
            resolve(null)
        }
    })
}
export const fastGetCommandAmountIn = (address: string, amountIn: string, chainId: number) => {
    return new Promise<{ amount: string, pool: pool, decimals: number }>(async (resolve) => {
        let tokenA = Config[chainId].stableToken[0]
        let decimals = await getDecimals(address, chainId)
        if (decimals) {
            let tokenB = {
                chain_id: chainId,
                address: address,
                decimals: decimals,
                symbol: "tokenb",
                name: "tokenb"
            }
            let pools: string = await generatePool(tokenB, chainId)
            if (pools) {
                let arrPools: pool[] = JSON.parse(pools)
                let formatPools: (v2Pool | v3Pool)[] = await batchAllPool(arrPools, chainId)
                let pool
                formatPools.forEach(item => {
                    if (pool) {
                        let oldReserve = pool.token0 == Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1
                        let newReserve = item.token0 == Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1
                        pool = Number(oldReserve) > Number(newReserve) ? pool : item
                    } else {
                        pool = item
                    }
                })
                let price
                if (pool) {
                    price = await handleHasLiquidityPools(pool, getToken(tokenA), getToken(tokenB), chainId)
                }
                if (price) {
                    resolve({ amount: BigNumber(((Number(amountIn) / (10 ** 18) / Number(price.tokenb)) * 10 ** decimals).toFixed(0)).toFixed(), pool: pool, decimals: decimals })
                } else {
                    resolve(null)
                }
            } else {
                resolve(null)
            }
        } else {
            resolve(null)
        }
    })
}
export const fastGetAmountIn = (address: string, amountIn: string, chainId: number) => {
    return new Promise<string>(async (resolve) => {
        let tokenA = Config[chainId].stableToken[0]
        let decimals = await getDecimals(address, chainId)
        if (decimals) {
            let tokenB = {
                chain_id: chainId,
                address: address,
                decimals: decimals,
                symbol: "tokenb",
                name: "tokenb"
            }
            let pools: string = await generatePool(tokenB, chainId)
            if (pools) {
                let arrPools: pool[] = JSON.parse(pools)
                let formatPools: (v2Pool | v3Pool)[] = await batchAllPool(arrPools, chainId)
                let pool
                formatPools.forEach(item => {
                    if (pool) {
                        let oldReserve = pool.token0 == Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1
                        let newReserve = item.token0 == Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1
                        pool = Number(oldReserve) > Number(newReserve) ? pool : item
                    } else {
                        pool = item
                    }
                })
                let price
                if (pool) {
                    price = await handleHasLiquidityPools(pool, getToken(tokenA), getToken(tokenB), chainId)
                }
                if (price) {
                    resolve(BigNumber(((Number(amountIn) / (10 ** 18) / Number(price.tokenb)) * 10 ** decimals).toFixed(0)).toFixed())
                } else {
                    resolve("")
                }
            } else {
                resolve("")
            }
        } else {
            resolve("")
        }
    })
}
export const fastGetContractPrice = (contract: insertItem, chainId: number) => {
    return new Promise(async (resolve) => {
        let tokenA = Config[chainId].stableToken[0]
        let tokenB = {
            chain_id: chainId,
            address: contract.address,
            decimals: Number(contract.decimals),
            symbol: contract.symbol,
            name: contract.name,
        }
        let arrPools: pool[] = JSON.parse(contract.pools)
        let formatPools: (v2Pool | v3Pool)[] = await batchAllPool(arrPools, chainId)
        let pool = null
        let allReserve = 0
        let price = null
        let allReserve0 = 0
        let allReserve1 = 0
        formatPools.forEach(item => {
            allReserve += Number(item.token0 == Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1)
            allReserve0 += Number(item.reserve0)
            allReserve1 += Number(item.reserve1)
            if (pool) {
                let oldReserve = pool.token0 == Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1
                let newReserve = item.token0 == Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1
                pool = Number(oldReserve) > Number(newReserve) ? pool : item
            } else {
                pool = item
            }
        })
        if (pool) {
            pool.reserve0 = BigNumber(allReserve0).toFixed()
            pool.reserve1 = BigNumber(allReserve1).toFixed()
            price = await handleHasLiquidityPools(pool, getToken(tokenA), getToken(tokenB), chainId)
        }
        resolve({
            address: contract.address,
            pool,
            allReserve: allReserve / (10 ** 18),
            symbol: contract.symbol,
            name: contract.name,
            price: price ? price[contract.symbol] : 0
        })
    })
}
export const fastGetPrice = (address: string, chainId: number) => {
    return new Promise<any>(async (resolve) => {
        let tokenA = Config[chainId].stableToken[0]
        let decimals = await getDecimals(address, chainId)
        if (decimals) {
            let tokenB = {
                chain_id: chainId,
                address: address,
                decimals: decimals,
                symbol: "tokenb",
                name: "tokenb"
            }
            let pools: string = await generatePool(tokenB, chainId)
            if (pools) {
                let arrPools: pool[] = JSON.parse(pools)
                let formatPools: (v2Pool | v3Pool)[] = await batchAllPool(arrPools, chainId)
                let pool
                formatPools.forEach(item => {
                    if (pool) {
                        let oldReserve = pool.token0 == Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1
                        let newReserve = item.token0 == Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1
                        pool = Number(oldReserve) > Number(newReserve) ? pool : item
                    } else {
                        pool = item
                    }
                })
                let price
                if (pool) {
                    price = await handleHasLiquidityPools(pool, getToken(tokenA), getToken(tokenB), chainId)
                }
                if (price) {
                    resolve({ price, decimals })
                } else {
                    resolve(null)
                }
            } else {
                resolve(null)
            }
        } else {
            resolve(null)
        }
    })
}
//获取卖出数量
export const fastGetAmountOut = (address: string, amountOut: string, chainId: number) => {
    return new Promise(async (resolve) => {
        let tokenA = Config[chainId].stableToken[0]
        let decimals = await getDecimals(address, chainId)
        if (decimals) {
            let tokenB = {
                chain_id: chainId,
                address: address,
                decimals: decimals,
                symbol: "tokenb",
                name: "tokenb"
            }
            let pools: string = await generatePool(tokenB, chainId)
            if (pools) {
                let arrPools: pool[] = JSON.parse(pools)
                let formatPools: (v2Pool | v3Pool)[] = await batchAllPool(arrPools, chainId)
                let pool
                formatPools.forEach(item => {
                    if (pool) {
                        let oldReserve = pool.token0 == Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1
                        let newReserve = item.token0 == Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1
                        pool = Number(oldReserve) > Number(newReserve) ? pool : item
                    } else {
                        pool = item
                    }
                })
                let price
                if (pool) {
                    price = await handleHasLiquidityPools(pool, getToken(tokenA), getToken(tokenB), chainId)
                }
                if (price) {
                    resolve(BigNumber(((Number(amountOut) / (10 ** decimals) * Number(price.tokenb)) * 10 ** 18).toFixed(0)).toFixed())
                } else {
                    resolve("")
                }
            } else {
                resolve("")
            }
        } else {
            resolve("")
        }
    })
}
//批量所有类型的池子
export const batchAllPool = async (pools: pool[], chainId: number) => {
    let uniswapv2 = []
    let uniswapv3 = []
    //处理池子归类
    for (let item of pools) {
        if (item.version == "uniswapv2" || item.version == "camelotv2") {
            uniswapv2.push(item.pool)
        } else if (item.version == "uniswapv3") {
            uniswapv3.push(item.pool)
        }
    }
    let uniswapv2Pools: (v2Pool | v3Pool)[] = await batchV2Pool(uniswapv2, chainId, "uniswapv2")
    let uniswapv3Pools: (v2Pool | v3Pool)[] = await batchV3Pool(uniswapv3, chainId, "uniswapv3")
    return uniswapv2Pools.concat(uniswapv3Pools)
}
//处理是否销毁合约所有权
export const formatOwnerBurn = async (addresses: string[], chainID: number) => {
    let upDateList = []
    let result = await batchGetBaseData(addresses, chainID)
    result.forEach(item => {
        if (item.owner == "0x0000000000000000000000000000000000000000") {
            upDateList.push({
                address: item.contractAddr,
                is_owner_burn: 1,
                owner: "0x0000000000000000000000000000000000000000"
            })
        }
    })
    return upDateList
}
//处理池子 pools (v2Pool | v3Pool)
export const formatPool = (tokens: any[], pools: (v2Pool | v3Pool)[]) => {
    let updateList = []
    let hasLiquidityPools = []
    tokens.forEach(item => {
        let filterList = pools.filter(pool => {
            return item.address == pool.token0 || item.address == pool.token1
        })
        if (filterList.length) {
            let updateItem = {
                address: item.address,
                is_add_liquidity: 1,
                is_remove_liquidity: item.is_remove_liquidity,
                liquidity_total: 0,
                reserve0: 0
            }
            filterList.forEach(pool => {
                if (pool.version == "uniswapv2" || pool.version == "camelotv2") {
                    let currentPool = pool as v2Pool
                    updateItem.liquidity_total += Number(currentPool.totalSupply)
                    updateItem.reserve0 += item.address == currentPool.token0 ? Number(currentPool.reserve0) : Number(currentPool.reserve1)
                    currentPool.contract = item.address
                    hasLiquidityPools.push(currentPool)
                } else if (pool.version == "uniswapv3") {
                    let currentPool = pool as v3Pool
                    updateItem.liquidity_total += Number(currentPool.liquidity)
                    updateItem.reserve0 += item.address == currentPool.token0 ? Number(currentPool.reserve0) : Number(currentPool.reserve1)
                    currentPool.contract = item.address
                    hasLiquidityPools.push(currentPool)
                }
            })
            updateList.push(updateItem)
        }
    })
    updateList.forEach(item => {
        item.liquidity_total = BigNumber(item.liquidity_total).toFixed()
        item.reserve0 = BigNumber(item.reserve0).toFixed()
        if ((item.is_add_liquidity == 1) && Number(item.liquidity_total) <= 1000) {
            item.is_remove_liquidity = 1
        }
    })
    return { updateList, hasLiquidityPools }
}
//处理合约基本信息
export const formatBaseData = async (list: any, chainID: number) => {
    let _list = []
    for (let item of list) {
        if (item.name != "undefined" && item.symbol != "undefined" && Number(item.totalSupply)) {
            let items = {
                chain_id: chainID,
                name: item.name,
                symbol: item.symbol,
                decimals: item.decimals,
                total_supply: item.totalSupply,
                owner: item.owner,
                address: item.contractAddr,
                is_add_liquidity: 0,
                is_get_swap_fee: 0,
                is_remove_liquidity: 0,
                is_check_price: 0,
                pools: null,
                liquidity_pools: '',
                reserve0: 0,
                liquidity_total: '',
                first_price: '',
                creator: '',
                update_time: Date.parse(new Date() + '') / 1000,
                create_time: Date.parse(new Date() + '') / 1000
            }
            //批量生成pools
            let pools = await generatePool(items, chainID)
            if (pools) {
                items.pools = pools
                _list.push(items)
            }
        }
    }
    return _list
}
//处理已添加流动性的币价
export const handleHasLiquidityPools = async (pool: (v2Pool | v3Pool), tokenA: Token, tokenB: Token, chainID: number) => {
    let price: any
    if (pool.version == 'uniswapv2') {
        price = await computedV2Price(tokenA, tokenB, pool as v2Pool, chainID)
    } else if (pool.version == 'uniswapv3') {
        price = await computedV3Price(tokenA, tokenB, pool as v3Pool, chainID)
    } else if (pool.version == 'camelotv2') {
        price = await computedV2Price(tokenA, tokenB, pool as v2Pool, chainID)
    }
    return price
}
//处理创建合约event
export const formartCreateContract = (transactions: any, chainID: number, web3: any) => {
    return new Promise(async (resolve) => {
        let contracts = []
        let creators = []
        for (let item of transactions) {
            let method = item.input.slice(0, 4)
            if (method === "0x60" && item.input.length > 2000 && item.to == null) {
                try {
                    let result = await web3.eth.getTransactionReceipt(item.hash)
                    if (result.contractAddress) {
                        contracts.push(result.contractAddress)
                        creators.push({ creator: result.from, address: result.contractAddress })
                    }
                } catch (error) {
                }
            }
        }
        if (contracts.length) {
            contracts = await batchGetBaseData(contracts, chainID)
            contracts = await formatBaseData(contracts, chainID)
            contracts.forEach(item => {
                let _find = creators.find(items => {
                    return items.address == item.address
                })
                if (_find) {
                    item.creator = _find.creator
                }
            })
        }
        resolve(contracts)
    })
}
export const formatUTCDate = () => {
    let date = new Date()
    let y = date.getUTCFullYear();
    let m = date.getUTCMonth();
    let d = date.getUTCDate();
    let h = date.getUTCHours();
    let M = date.getUTCMinutes();
    let s = date.getUTCSeconds();
    return `${y}-${(m + '').length == 2 ? m : '0' + m}-${(d + '').length == 2 ? d : '0' + d} ${(h + '').length == 2 ? h : '0' + h}:${(M + '').length == 2 ? M : '0' + M}:${(s + '').length == 2 ? s : '0' + s}`
}
export const formatFuckPools = (pools: pool[], chainId: number, swaps?: number[]) => {
    let newPools: pool[] = []
    pools.forEach(item => {
        if (swaps) {
            if (swaps.indexOf(2) != -1 && item.version == "uniswapv2") {
                if (item.token0 == Config[chainId].stableContract[0] || item.token1 == Config[chainId].stableContract[0]) {
                    Object.assign(item, { tag: item.version })
                    newPools.push(item)
                }
            }
            if (swaps.indexOf(1) != -1 && item.version == "uniswapv3") {
                if (item.token0 == Config[chainId].stableContract[0] || item.token1 == Config[chainId].stableContract[0]) {
                    Object.assign(item, { tag: item.version })
                    newPools.push(item)
                }
            }
            if (swaps.indexOf(3) != -1 && item.version == "camelotv2") {
                if (item.token0 == Config[chainId].stableContract[0] || item.token1 == Config[chainId].stableContract[0]) {
                    Object.assign(item, { tag: item.version })
                    newPools.push(item)
                }
            }
        } else {
            Object.assign(item, { tag: item.version })
            newPools.push(item)
        }
    })
    return newPools;
}
//搜索合约
export const queryContract = async (address: string, chainID: number) => {
    //获取合约基本资料
    let contracts: any = await batchGetBaseData([address], chainID)
    if (contracts[0]) {
        //整理合约基本资料
        contracts = await formatBaseData(contracts, chainID)
        let contract = contracts[0]
        contract.creator = "0x0000000000000000000000000000000000000000"
        //获取初始价格
        let result = await getFirstPrice(contract)
        contract.first_price = result ? result.price : 0
        contract.is_check_price = result ? 1 : 0
        contract.block_number = result ? result.firstBlockNumber : 0
        //获取有流动性的池子
        let pools = JSON.parse(contract.pools)
        pools = await batchAllPool(pools, chainID)
        let { hasLiquidityPools } = formatPool([contract], pools)
        await setToken([contract], hasLiquidityPools, contract.chain_id)
        return contract
    } else {
        return ""
    }
}
export const checkPool = (contract: insertItem, chainId: number) => {
    return new Promise<(v2Pool | v3Pool)[]>(async (resolve) => {
        let pools = contract.pools ? JSON.parse(contract.pools) : []
        pools = await batchAllPool(pools, chainId)
        if (pools.length) {
            let { hasLiquidityPools } = formatPool([contract], pools)
            resolve(hasLiquidityPools)
        } else {
            resolve([])
        }
    })
}
export const setToken = async (tokens: any[], hasLiquidityPools: (v2Pool | v3Pool)[], chainID: number) => {
    let config = Config[chainID]
    tokens = tokens.filter(item => {
        return item.chain_id == chainID
    })
    let newTokens = {}
    let returnTokens = {}
    tokens = tokens.concat(config.stableToken)
    for (let item of tokens) {
        item.Token = getToken(item)
        newTokens[item.address] = item
    }
    for (let item of hasLiquidityPools) {
        let token0 = newTokens[item.token0]
        let token1 = newTokens[item.token1]
        if (token0 && token1) {
            let price = await handleHasLiquidityPools(item, token0.Token, token1.Token, chainID)
            let token = token0.address == item.contract ? token0 : token1
            if (token.LiquidityPools) {
                token.LiquidityPools.push({
                    pool: item,
                    name: `${newTokens[item.token0].symbol}-${newTokens[item.token1].symbol}`,
                    version: item.version,
                    ...price
                })
            } else {
                token.LiquidityPools = [{
                    pool: item,
                    name: `${newTokens[item.token0].symbol}-${newTokens[item.token1].symbol}`,
                    version: item.version,
                    ...price
                }]
            }
            newTokens[token.address] = token
            returnTokens[token.address] = token.LiquidityPools
        }
    }
    return returnTokens
}
//添加多个合约
export const addContract = async (addresses: string[], chainID: number) => {
    const web3 = getProvider(chainID)
    let contracts = []
    try {
        contracts = await batchGetBaseData(addresses, chainID)
        contracts = await formatBaseData(contracts, chainID)
        if (chainID == 1) {
            let result = await batchGetCreator(addresses)
            contracts.forEach(item => {
                let find = result.find(items => {
                    return web3.utils.toChecksumAddress(items.contractAddress) == item.address
                })
                if (find) {
                    item.block_number = find.blockNumber
                    item.creator = find.contractCreator
                }
            })
        } else {
            contracts.forEach(item => {
                item.creator = "0x0000000000000000000000000000000000000000"
            })
        }
    } catch (error) {
        let newList = []
        for (let item of addresses) {
            try {
                let detail: any = await getBaseData(item, chainID)
                detail = await formatBaseData([detail], chainID)
                if (chainID == 1) {
                    let result = await batchGetCreator([item])
                    if (result.length) {
                        detail.block_number = result[0].blockNumber
                        detail.creator = result[0].contractCreator
                    }
                } else {
                    detail.creator = "0x0000000000000000000000000000000000000000"
                }
                newList.push(detail)
            } catch (error) {
                console.log(error)
            }
        }
        contracts = newList
    }
    return contracts
}
export const getOtherToken = (addresses: string[], swapEvents: swapEvent[], chainId: number) => {
    addresses = addresses.concat(Config[chainId].stableContract)
    let effectiveAddresses = []
    swapEvents.forEach(item => {
        if (addresses.indexOf(item.in_target) == -1) {
            effectiveAddresses.push(item.in_target)
        }
        if (addresses.indexOf(item.out_target) == -1) {
            effectiveAddresses.push(item.out_target)
        }
    })
    return new Set(effectiveAddresses)
}
//处理swapevent的所有地址
export const handleSwapEventAddress = (swapEvents: swapEvent[]) => {
    let addresses = new Map()
    swapEvents.forEach(item => {
        if (Config[item.chain_id].stableContract.indexOf(item.in_target) == -1) {
            if (addresses.get(item.in_target)) {
                let update = addresses.get(item.in_target)
                update.count += 1
                addresses.set(item.in_target, update)
            } else {
                addresses.set(item.in_target, {
                    address: item.in_target,
                    count: 1
                })
            }
        }
        if (Config[item.chain_id].stableContract.indexOf(item.out_target) == -1) {
            if (addresses.get(item.out_target)) {
                let update = addresses.get(item.out_target)
                update.count += 1
                addresses.set(item.out_target, update)
            } else {
                addresses.set(item.out_target, {
                    address: item.out_target,
                    count: 1
                })
            }
        }
    })
    let setAddresses = [...addresses.values()]
    return _.orderBy(setAddresses, "count", "desc")
}
//获取合约所有持有人
export const getAllHolder = async (contract: insertItem, chainId: number) => {
    return new Promise<any[]>(async (resolve) => {
        const web3 = getProvider(chainId)
        let allTransferEvents = await getContractAllTransferEvent(contract.address, contract.block_number, chainId)
        if (allTransferEvents) {
            let allTransferAddresses = []
            allTransferEvents.forEach(item => {
                allTransferAddresses.push(web3.eth.abi.decodeParameter("address", item.topics[1]))
                allTransferAddresses.push(web3.eth.abi.decodeParameter("address", item.topics[2]))
            })
            let setAllAddresses = new Set(allTransferAddresses)
            let checkERC20Items = []
            setAllAddresses.forEach(item => {
                checkERC20Items.push({
                    contractAddr: contract.address,
                    owner: item
                })
            })
            let allAddressBalance = await batchCheckERC20Balance(checkERC20Items, chainId)
            let formatBalance = []
            allAddressBalance.forEach(item => {
                if (Number(item.balance) > 0) {
                    let percent = Number((Number(item.balance) / Number(contract.total_supply) * 100).toFixed(5))
                    formatBalance.push({
                        address: item.addr,
                        balance: BigNumber(Number((Number(item.balance) / (10 ** Number(contract.decimals))).toFixed(5))).toFixed(),
                        percent
                    })
                }
            })
            resolve(_.orderBy(formatBalance, "balance", "desc"))
        } else {
            resolve([])
        }
    })
}