import { addContract, batchAllPool, formartCreateContract, formatPool, setToken } from "./handle"
import { distribute } from "./methods"
import { handleParams, sendParams, watchLog, pool, v2Pool, v3Pool, insertItem, checkERC20Item, checkERC20Response, swapEvent } from "../types"
import { batchBlockRequest, getPendingBlock, batchGetTransactionReceipt, getFirstPoolForBlockNumber, getFirstTransactionBlockNumber, batchGetTransferEvent, batchCheckBalance, batchGetCode, batchQueryENSname, batchGetTransactionCount, batchCheckERC20Balance } from "../utils/fetch"
import { ERC20ConventionMethods, Config } from "../config/constrants"
import { getProvider } from "../utils/help"
import BigNumber from "bignumber.js"
import { v4 as uuidv4 } from "uuid";
import _ from "lodash"
export const getBlockEvent = (startNumber: number, endNumber: number, chainID: number, web3: any) => {
    return new Promise(async (resolve) => {
        let transactions = []
        transactions = await batchBlockRequest(startNumber, endNumber, chainID)
        if (transactions.length) {
            try {
                let hashs = transactions.map(item => {
                    return item.hash
                })
                let transactionReceipts = await batchGetTransactionReceipt(hashs, chainID)
                let contracts = await formartCreateContract(transactions, chainID, web3)
                let { sendParams, handleParams, swapEvents } = await handleTransactionEvent(transactions, chainID, transactionReceipts)
                resolve({ contracts, sendParams, handleParams, transactions, swapEvents })
            } catch (error) {
                resolve({ contracts: [], sendParams: [], handleParams: [], transactions: [], swapEvents: [] })
            }
        } else {
            resolve({ contracts: [], sendParams: [], handleParams: [], transactions: [], swapEvents: [] })
        }
    })
}
export const getRoutes = (chainId: number) => {
    let config = Config[chainId]
    switch (chainId) {
        case 1:
            return [config.v2Router, config.v3Router, config.UniversalRouter, "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD"]
        case 42161:
            return [config.v2Router, config.v3Router, config.camelotV2Router, config.UniversalRouter]
        case 5:
            return [config.v2Router, config.v3Router]
    }
}
export const handleReceiptItem = (res: any, chainId: number) => {
    let web3 = getProvider(chainId)
    let routers = new Map()
    let transferEvents = []
    for (let i = 0; i < res.logs.length; i++) {
        let item = res.logs[i]
        if (item.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" && item.topics.length == 3) {
            transferEvents.push(item)
        }
    }
    const recursion = (logs: any[], uuid: string) => {
        let router = routers.get(uuid)
        if (logs.length) {
            if (router) {
                let lastRouter = router[router.length - 1]
                let hasLog = null
                let matchLogs = []
                for (let i = 0; i < logs.length; i++) {
                    let item = logs[i]
                    let address = web3.utils.toChecksumAddress(item.address)
                    let outAddress = web3.eth.abi.decodeParameter("address", item.topics[1])
                    let inAddress = web3.eth.abi.decodeParameter("address", item.topics[2])
                    let amount = web3.eth.abi.decodeParameter("uint256", item.data)
                    if (hasLog) {
                        if (lastRouter.inAddress == web3.utils.toChecksumAddress(res.from) || lastRouter.inAddress == web3.utils.toChecksumAddress(res.to)) {
                            if (outAddress == lastRouter.inAddress && lastRouter.address == address && hasLog.address == address) {
                                matchLogs.push({
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                })
                                logs.splice(i, 1)
                                i--
                            }
                        } else {
                            if (outAddress == lastRouter.inAddress && hasLog.address == address) {
                                matchLogs.push({
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                })
                                logs.splice(i, 1)
                                i--
                            }
                        }
                    } else {
                        if (lastRouter.inAddress == web3.utils.toChecksumAddress(res.from) || lastRouter.inAddress == web3.utils.toChecksumAddress(res.to)) {
                            if (outAddress == lastRouter.inAddress && lastRouter.address == address) {
                                matchLogs.push({
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                })
                                logs.splice(i, 1)
                                i--
                                hasLog = {
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                }
                            }
                        } else {
                            if (outAddress == lastRouter.inAddress) {

                                matchLogs.push({
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                })
                                logs.splice(i, 1)
                                i--
                                hasLog = {
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                }
                            }
                        }
                    }
                }
                if (matchLogs.length) {
                    matchLogs = _.sortBy(matchLogs, "amount")
                    if (matchLogs.length > 1) {
                        let bigAmount = 0
                        let smallAmount = 0
                        for (let i = 0; i < matchLogs.length; i++) {
                            if (i == matchLogs.length - 1) {
                                bigAmount = matchLogs[i].amount
                            } else {
                                smallAmount += matchLogs[i].amount
                            }
                        }
                        let insertItem = {
                            ...matchLogs[matchLogs.length - 1],
                            swapFee: Math.floor((smallAmount / (bigAmount + smallAmount)) * 100)
                        }
                        router.push(insertItem)
                    } else {
                        let insertItem = {
                            ...matchLogs[matchLogs.length - 1],
                            swapFee: 0
                        }
                        router.push(insertItem)
                    }
                    routers.set(uuid, router)
                    recursion(logs, uuid)
                } else {
                    recursion(logs, uuidv4())
                }
            } else {
                let hasLog = null
                let firstRouters = []
                for (let i = 0; i < logs.length; i++) {
                    let item = logs[i]
                    let address = web3.utils.toChecksumAddress(item.address)
                    let outAddress = web3.eth.abi.decodeParameter("address", item.topics[1])
                    let inAddress = web3.eth.abi.decodeParameter("address", item.topics[2])
                    let amount = web3.eth.abi.decodeParameter("uint256", item.data)
                    if (hasLog) {
                        if (outAddress == hasLog.outAddress && address == hasLog.address) {
                            firstRouters.push({
                                address,
                                outAddress,
                                inAddress,
                                amount: Number(amount)
                            })
                            logs.splice(i, 1)
                            i--
                        }
                    } else {
                        if (outAddress == web3.utils.toChecksumAddress(res.from) || outAddress == web3.utils.toChecksumAddress(res.to)) {
                            firstRouters.push({
                                address,
                                outAddress,
                                inAddress,
                                amount: Number(amount)
                            })
                            hasLog = {
                                address,
                                outAddress,
                                inAddress,
                                amount: Number(amount)
                            }
                            logs.splice(i, 1)
                            i--
                        }
                    }
                }
                if (firstRouters.length) {
                    if (firstRouters.length > 1) {
                        firstRouters = _.sortBy(firstRouters, "amount")
                        let bigAmount = 0
                        let smallAmount = 0
                        for (let i = 0; i < firstRouters.length; i++) {
                            if (i == firstRouters.length - 1) {
                                bigAmount = firstRouters[i].amount
                            } else {
                                smallAmount += firstRouters[i].amount
                            }
                        }
                        let swapFee = Math.floor((smallAmount / (bigAmount + smallAmount)) * 100)
                        let setItem = {
                            ...firstRouters[firstRouters.length - 1],
                            swapFee: swapFee
                        }
                        routers.set(uuid, [setItem])
                    } else {
                        let setItem = {
                            ...firstRouters[0],
                            swapFee: 0
                        }
                        routers.set(uuid, [setItem])
                    }
                    recursion(logs, uuid)
                }
            }
        }
    }
    recursion(transferEvents, uuidv4())
    let resultEvents = []
    routers.forEach(item => {
        if (item.length > 1) {
            let formatRoutes = []
            item.forEach(items => {
                let last = formatRoutes[formatRoutes.length - 1]
                if (last) {
                    if (last.address != items.address && last.amount != BigNumber(items.amount).toFixed()) {
                        formatRoutes.push({
                            address: items.address,
                            amount: BigNumber(items.amount).toFixed(),
                            swapFee: items.swapFee,
                        })
                    }
                } else {
                    formatRoutes.push({
                        address: items.address,
                        amount: BigNumber(items.amount).toFixed(),
                        swapFee: items.swapFee,
                    })
                }
            })
            let first = item[0]
            let last = item[item.length - 1]
            resultEvents.push({
                chain_id: chainId,
                hash: res.transactionHash,
                from_address: web3.utils.toChecksumAddress(res.from),
                to_address: web3.utils.toChecksumAddress(res.to),
                in_target: web3.utils.toChecksumAddress(first.address),
                in_amount: BigNumber(first.amount).toFixed(),
                in_swap_fee: first.swapFee,
                swap_out_address: web3.utils.toChecksumAddress(first.outAddress),
                out_target: web3.utils.toChecksumAddress(last.address),
                out_amount: BigNumber(last.amount).toFixed(),
                out_swap_fee: last.swapFee,
                swap_in_address: web3.utils.toChecksumAddress(last.inAddress),
                block_number: res.blockNumber,
                effective_gas_price: BigNumber(res.effectiveGasPrice).toFixed(),
                gas_used: BigNumber(res.gasUsed).toFixed(),
                swap_routers: JSON.stringify(formatRoutes),
                create_time: Math.round(new Date().getTime() / 1000),
            })
        }
    })
    return resultEvents
}
//获取区块交易event
export const handleTransactionReceipt = (transactionReceipts: any[], chainId: number) => {
    let events = []
    if (transactionReceipts.length) {
        transactionReceipts.forEach(item => {
            if (item) {
                try {
                    let result = handleReceiptItem(item, chainId)
                    if (result.length) {
                        events = events.concat(result)
                    }
                } catch {

                }
            }
        })
    }
    return events
}
//分析监听交易信息
export const handleWatchTransactions = (watchLogs: watchLog[], wethPrice: number, chainId: number = 1) => {
    return new Promise<watchLog[]>(async (resolve) => {
        let config = Config[chainId]
        if (watchLogs.length) {
            let contracts = []
            let checkERC20Items: checkERC20Item[] = []
            watchLogs.forEach(item => {
                if (config.stableContract.indexOf(item.in_target) == -1) contracts.push(item.in_target)
                if (config.stableContract.indexOf(item.out_target) == -1) contracts.push(item.out_target)
                checkERC20Items.push({
                    contractAddr: item.out_target,
                    owner: item.address
                })
                checkERC20Items.push({
                    contractAddr: item.in_target,
                    owner: item.address
                })
            })
            let allBalance = await batchCheckERC20Balance(checkERC20Items, chainId)
            contracts = [...new Set(contracts)]
            let queryContracts = await addContract(contracts, chainId)
            if (queryContracts.length) {
                let pools: pool[] = []
                queryContracts.forEach(item => {
                    pools = pools.concat(JSON.parse(item.pools))
                })
                let handlePools: (v2Pool | v3Pool)[] = await batchAllPool(pools, chainId)
                let { hasLiquidityPools } = formatPool(queryContracts, handlePools)
                await setToken(queryContracts, hasLiquidityPools, chainId)
                watchLogs = formartWatchLog(watchLogs, queryContracts, allBalance, wethPrice, chainId)
            }
        }
        resolve(watchLogs)
    })
}
export const getWatchToken = (address: string, queryContract: insertItem[], wethPrice: number, chainId: number) => {
    let config = Config[chainId]
    if (address == "0x0000000000000000000000000000000000000000") {
        return {
            pool: "0x0000000000000000000000000000000000000000",
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
            price: wethPrice,
            allReserve: 0,
            version: "uniswapv2",
        }
    } else {
        if (config.stableContract.indexOf(address) != -1) {
            let index = config.stableContract.indexOf(address)
            if (index == 0) {
                return {
                    pool: "0x0000000000000000000000000000000000000000",
                    name: "Ethereum",
                    symbol: "ETH",
                    decimals: 18,
                    price: wethPrice,
                    allReserve: 0,
                    version: "uniswapv2",
                }
            } else {
                return {
                    pool: "0x0000000000000000000000000000000000000000",
                    name: "USD",
                    symbol: "USD",
                    decimals: 6,
                    price: 1,
                    allReserve: 0,
                    version: "uniswapv2",
                }
            }
        } else {
            let find = queryContract.find(contract => {
                return contract.address == address && contract.LiquidityPools && contract.LiquidityPools.length
            })
            if (find) {
                let bigPool
                let reserve = 0
                let allReserve = 0
                find.LiquidityPools.forEach(item => {
                    let reserve0 = item.pool.token0 == config.stableContract[0] ? Number(item.pool.reserve0) : Number(item.pool.reserve1)
                    allReserve += reserve0
                    bigPool = reserve0 > reserve ? item : bigPool
                    reserve = reserve0 > reserve ? reserve0 : reserve
                })
                return {
                    pool: bigPool.pool.pool,
                    name: find.name,
                    symbol: find.symbol,
                    decimals: Number(find.decimals),
                    price: bigPool[find.symbol],
                    allReserve: allReserve,
                    version: bigPool.version,
                }
            } else {
                return null
            }
        }
    }
}
export const formartWatchLog = (watchLogs: watchLog[], queryContracts: insertItem[], allBalance: checkERC20Response[], wethPrice: number, chainId: number) => {
    let newList = []
    if (queryContracts.length) {
        for (let i = 0; i < watchLogs.length; i++) {
            let item = watchLogs[i]
            let inToken = getWatchToken(item.in_target, queryContracts, wethPrice, chainId)
            let outToken = getWatchToken(item.out_target, queryContracts, wethPrice, chainId)
            if (inToken && outToken) {
                let find = allBalance.find(itemBalance => {
                    if (item.type == 1) {
                        return item.out_target == itemBalance.contractAddr && item.address == itemBalance.addr
                    } else if (item.type == 2) {
                        return item.in_target == itemBalance.contractAddr && item.address == itemBalance.addr
                    }
                })
                if (find) {
                    item.left_amount = BigNumber(Number(find.balance) / (10 ** Number(find.decimals))).toFixed()
                }
                item.amount_in = BigNumber(Number(item.amount_in) / (10 ** Number(inToken.decimals))).toFixed()
                item.amount_out = BigNumber(Number(item.amount_out) / (10 ** Number(outToken.decimals))).toFixed()
                item.in_price = inToken.pool == "0x0000000000000000000000000000000000000000" ? inToken.price : BigNumber(Number(inToken.price) * wethPrice).toFixed()
                item.in_symbol = inToken.symbol
                item.in_decimals = inToken.decimals
                item.in_name = inToken.name
                item.in_pool = inToken.pool
                item.in_version = inToken.version
                item.out_price = outToken.pool == "0x0000000000000000000000000000000000000000" ? outToken.price : BigNumber(Number(outToken.price) * wethPrice).toFixed()
                item.out_symbol = outToken.symbol
                item.out_decimals = outToken.decimals
                item.out_name = outToken.name
                item.in_all_reserve = BigNumber(Number((inToken.allReserve / (10 ** 18)).toFixed(2))).toFixed()
                item.out_all_reserve = BigNumber(Number((outToken.allReserve / (10 ** 18)).toFixed(2))).toFixed()
                item.out_pool = outToken.pool
                item.out_version = outToken.version
                let cost = BigNumber(item.cost / (10 ** 18) * wethPrice).toFixed()
                item.cost = item.type == 1 ? Number(Number(Number(item.amount_in) * Number(item.in_price) + Number(cost)).toFixed(2)) : Number(Number(Number(item.amount_out) * Number(item.out_price) - Number(cost)).toFixed(2))
                item.price = item.type == 1 ? BigNumber(Number((item.cost / Number(item.amount_out)).toFixed(16))).toFixed() : BigNumber(Number((item.cost / Number(item.amount_in)).toFixed(16))).toFixed()
                newList.push(item)
            } else {
                watchLogs.splice(i, 1)
                i--
            }
        }
        return newList
    } else {
        return []
    }
}
export const getBatchFuckBlockPendingEvent = async (targets: string[], chainId: number) => {
    return new Promise<{ transactionDetails: any[], transactions: any[], handleParams: any[] }>(async (resolve) => {
        if (chainId == 5 || chainId == 1) {
            try {
                let block = await getPendingBlock(chainId)
                let transactionDetails = []
                if (block?.transactions?.length) {
                    let transactions = block.transactions
                    let { handleParams } = await handleTransactionEvent(transactions, chainId)
                    let _filters = handleParams.filter(item => {
                        return targets.indexOf(item.target) != -1 && item.type == 3
                    })
                    if (_filters.length) {
                        transactions.forEach(item => {
                            let _find = _filters.find(handleParamsItem => {
                                return item.hash == handleParamsItem.transactionHex
                            })
                            if (_find) {
                                transactionDetails.push({ target: _find.target, transactionIndex: item.transactionIndex, maxPriorityFeePerGas: item.maxPriorityFeePerGas, maxFeePerGas: item.maxFeePerGas, hash: item.hash })
                            }
                        })
                    }
                    for (let item of transactions) {
                        let hexMethod = item.input.slice(0, 10)
                        if ((ERC20ConventionMethods.indexOf(hexMethod) == -1 && targets.indexOf(item.to) != -1)) {
                            transactionDetails.push({
                                target: item.to,
                                transactionIndex: item.transactionIndex,
                                maxPriorityFeePerGas: item.maxPriorityFeePerGas,
                                maxFeePerGas: item.maxFeePerGas,
                                hash: item.hash
                            })
                        }
                    }
                    resolve({ transactionDetails: transactionDetails, transactions: transactions, handleParams: handleParams })
                } else {
                    resolve({ transactionDetails: [], transactions: [], handleParams: [] })
                }
            } catch (error) {
                resolve({ transactionDetails: [], transactions: [], handleParams: [] })
            }
        } else {
            resolve({ transactionDetails: [], transactions: [], handleParams: [] })
        }
    })
}
//0块冲土狗获取
export const getFuckBlockPendingEvent = async (chainId: number, targets: string[]) => {
    return new Promise<{ transactionDetail: any, transactions: any[] }>(async (resolve) => {
        try {
            let block = await getPendingBlock(chainId)
            let transactionDetail
            if (block?.transactions?.length) {
                let transactions = block.transactions
                let { handleParams } = await handleTransactionEvent(transactions, chainId)
                let _find = handleParams.find(item => {
                    return targets.indexOf(item.target) != -1 && item.type == 3
                })
                if (_find) {
                    let _findTransaction = transactions.find(item => {
                        return item.hash == _find.transactionHex
                    })
                    transactionDetail = { transactionIndex: _findTransaction.transactionIndex, maxPriorityFeePerGas: _findTransaction.maxPriorityFeePerGas, maxFeePerGas: _findTransaction.maxFeePerGas, hash: _findTransaction.hash }
                    resolve({ transactionDetail: transactionDetail, transactions: transactions })
                } else {
                    for (let item of transactions) {
                        let hexMethod = item.input.slice(0, 10)
                        if ((ERC20ConventionMethods.indexOf(hexMethod) == -1 && targets.indexOf(item.to) != -1)) {
                            transactionDetail = { transactionIndex: item.transactionIndex, maxPriorityFeePerGas: item.maxPriorityFeePerGas, maxFeePerGas: item.maxFeePerGas, hash: item.hash }
                            resolve({ transactionDetail: transactionDetail, transactions: transactions })
                            return
                        }
                    }
                    resolve({ transactionDetail: null, transactions: transactions })
                }
            } else {
                resolve({ transactionDetail: null, transactions: [] })
            }
        } catch (error) {
            resolve({ transactionDetail: null, transactions: [] })
        }
    })
}
export const getBlockPendingEvent = async (chainId: number) => {
    return new Promise(async (resolve) => {
        let block = await getPendingBlock(chainId)
        if (block?.transactions?.length) {
            let transactions = block.transactions
            let contracts = []
            let { sendParams, handleParams } = await handleTransactionEvent(transactions, chainId)
            resolve({ contracts, sendParams, handleParams, blockNumber: block.number, transactions })
        } else {
            resolve({ contracts: [], sendParams: [], handleParams: [], transactions: [] })
        }
    })
}
export const handleTransactionEvent = async (transactions: any, chainId: number, transactionReceipts?: any[]) => {
    return new Promise<{ sendParams: sendParams[], handleParams: handleParams[], swapEvents: swapEvent[] }>(async (resolve) => {
        let logs = {
            sendParams: [],
            handleParams: [],
            swapEvents: []
        }
        let hashs: string[] = []
        for (let item of transactions) {
            hashs.push(item.hash)
            try {
                let event = distribute(item.input, chainId)
                if (event) {
                    event.handleParams.forEach(items => {
                        items.from = item.from
                        let executeNames = ["v3SwapExactIn", "v3SwapExactOut", "v2SwapExactIn", "v2SwapExactOut"]
                        if (executeNames.indexOf(items.methodName) != -1) {
                            items.to = item.from
                        }
                        if (!items.amountIn && items.type == 1) {
                            item.amountIn = item.value
                        }
                    })
                    logs.sendParams = logs.sendParams ? logs.sendParams.concat(event.sendParams) : logs.sendParams
                    logs.sendParams
                    logs.handleParams = event.handleParams ? logs.handleParams.concat(event.handleParams.map(items => {
                        items.transactionHex = item.hash
                        return items
                    })) : logs.handleParams
                }
            } catch (err) {
            }
        }
        if (transactionReceipts) {
            logs.swapEvents = handleTransactionReceipt(transactionReceipts, chainId)
        }
        resolve(logs)
    })
}
export const getSmartMoney = async (addresses: string[], chainId: number) => {
    return new Promise<any[]>(async (resolve) => {
        let conctracts = await addContract(addresses, chainId)
        let allUser = []
        for (let item of conctracts) {
            let result = await getFirstPoolForBlockNumber(item)
            let firstBlockNumber = await getFirstTransactionBlockNumber(item.address, result.blockNumber, chainId)
            if (firstBlockNumber) {
                let transferEvents = await batchGetTransferEvent(item.address, chainId, firstBlockNumber, 200)
                let users = decodeTransferTopics(transferEvents, chainId)
                let pushItem = []
                users.forEach(user => {
                    pushItem.push({
                        address: user
                    })
                })
                allUser = allUser.concat(pushItem)
            }
        }
        let list = arrSet(allUser)
        let result = await filterBalance(list, chainId)
        let resutlFormat = await batchGetTransactionCount(result, 1)
        resolve(resutlFormat)
    })
}
export const filterBalance = async (users: any, chainId: number) => {
    let addresses = users.map(item => {
        return item.address
    })
    let newAddresses = []
    let result = await batchCheckBalance(addresses, chainId)
    result.forEach(item => {
        if (Number(item.balance) / (10 ** 18) > 1) {
            newAddresses.push(item.addr)
        }
    })
    newAddresses = await batchGetCode(newAddresses, chainId)
    let ensNames = await batchQueryENSname(newAddresses)
    let newResult = newAddresses.map((item, index) => {
        if (ensNames[index] != 'undefinded') {
            return {
                address: item,
                name: ensNames[index]
            }
        } else {
            return {
                address: item,
                name: ""
            }
        }
    })
    return newResult
}
export const arrSet = (users: any[]) => {
    let mapUser = new Map()
    users.forEach(item => {
        if (mapUser.get(item.address)) {
            let userItem = mapUser.get(item.address)
            userItem.count += 1
            mapUser.set(userItem.address, userItem)
        } else {
            item.count = 1
            mapUser.set(item.address, item)
        }
    })
    let list = [...mapUser.values()]
    let newList = []
    list.forEach(item => {
        newList.push(item)
    })
    return newList
}
export const decodeTransferTopics = (transferEvents: any[], chainId: number) => {
    const web3 = getProvider(chainId)
    let addresses = []
    transferEvents.forEach(item => {
        addresses.push(web3.eth.abi.decodeParameter("address", item.topics[2]))
    })
    return [... new Set(addresses)]
}
