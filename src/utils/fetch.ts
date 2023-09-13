import { DanDaoERC20Abi, DanDaoNFTAbi, ERC20 } from "../config/abis";
import { checkERC20Item, insertItem, v2Pool, v3Pool, checkERC20Response, baseData, telegramTask } from "../types"
import { computedV2Price, getConfig, getToken, sliceAddresses, hexENSAddress, getProvider } from "./help";
import axios from "axios"
import { v4 as uuidv4 } from "uuid";
import _ from "lodash"
import BigNumber from "bignumber.js";
import { Config } from "../config/constrants";
import { BigNumber as ethBigNumber } from "ethers"
import Web3 from "web3";
export const getDanDaoContract = (chainId: number) => {
    const config = getConfig(chainId)
    const web3 = getProvider(chainId)
    return new web3.eth.Contract(DanDaoERC20Abi, config.DANDAOFactory)
}
//批量获取transfer event
export const batchGetTransferEvent = (address: string, chainId: number, startBlock: number, blockCount: number = 200) => {
    return new Promise<any[]>(async (resolve) => {
        const web3: Web3 = getProvider(chainId)
        web3.eth.getPastLogs({
            fromBlock: startBlock + 1,
            toBlock: startBlock + blockCount,
            address: address,
            topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]
        }).then(res => {
            resolve(res)
        }).catch(err => {
            resolve([])
        })
    })
}
//获取第一个注入的池子
export const getFirstPoolForBlockNumber = (contract: insertItem) => {
    return new Promise<{ blockNumber: number, version: string, pool: string, token0: string, token1: string, fee?: number }>(async (resolve) => {
        const config = getConfig(contract.chain_id)
        const web3: any = getProvider(contract.chain_id)
        let toBlock = await web3.eth.getBlockNumber()
        let events = []
        let tokenA = getToken({
            chain_id: contract.chain_id,
            address: contract.address,
            decimals: Number(contract.decimals),
            symbol: contract.symbol,
            name: contract.name,
        })
        let tokenB = getToken(config.stableToken[0])
        let tokenList = [tokenA, tokenB]
        let [token0, token1] = tokenList[0].sortsBefore(tokenList[1]) ? [tokenList[0], tokenList[1]] : [tokenList[1], tokenList[0]]
        try {
            if (contract.chain_id == 42161) {
                let camelot = await web3.eth.getPastLogs({
                    fromBlock: contract.block_number,
                    toBlock: toBlock,
                    address: config.camelotFactory,
                    topics: ["0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9", web3.eth.abi.encodeParameter("address", token0.address), web3.eth.abi.encodeParameter("address", token1.address)]
                })
                let uniswapv2 = await web3.eth.getPastLogs({
                    fromBlock: contract.block_number,
                    toBlock: toBlock,
                    address: config.v2FactoryAddress,
                    topics: ["0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9", web3.eth.abi.encodeParameter("address", token0.address), web3.eth.abi.encodeParameter("address", token1.address)]
                })
                let uniswapv3 = await web3.eth.getPastLogs({
                    fromBlock: contract.block_number,
                    toBlock: toBlock,
                    address: config.v3FactoryAddress,
                    topics: ["0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118", web3.eth.abi.encodeParameter("address", token0.address), web3.eth.abi.encodeParameter("address", token1.address)]
                })
                events = camelot.concat(uniswapv2).concat(uniswapv3)
            } else {
                let uniswapv2 = await web3.eth.getPastLogs({
                    fromBlock: contract.block_number,
                    toBlock: toBlock,
                    address: config.v2FactoryAddress,
                    topics: ["0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9", web3.eth.abi.encodeParameter("address", token0.address), web3.eth.abi.encodeParameter("address", token1.address)]
                })
                let uniswapv3 = await web3.eth.getPastLogs({
                    fromBlock: contract.block_number,
                    toBlock: toBlock,
                    address: config.v3FactoryAddress,
                    topics: ["0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118", web3.eth.abi.encodeParameter("address", token0.address), web3.eth.abi.encodeParameter("address", token1.address)]
                })
                events = uniswapv2.concat(uniswapv3)
            }
        } catch (error) {
        }
        if (events.length) {
            events = _.orderBy(events, ["blockNumber"], ["asc"]);
            let firstPool = events[0]
            if (firstPool.address == config.camelotFactory) {
                let decode = web3.eth.abi.decodeParameters(["address", "uint256"], firstPool.data)
                resolve({
                    blockNumber: firstPool.blockNumber,
                    version: "camelotv2",
                    pool: decode[0],
                    token0: web3.eth.abi.decodeParameter("address", firstPool.topics[1]),
                    token1: web3.eth.abi.decodeParameter("address", firstPool.topics[2])
                })
            } else if (firstPool.address == config.v2FactoryAddress) {
                let decode = web3.eth.abi.decodeParameters(["address", "uint256"], firstPool.data)
                resolve({
                    blockNumber: firstPool.blockNumber,
                    version: "uniswapv2",
                    pool: decode[0],
                    token0: web3.eth.abi.decodeParameter("address", firstPool.topics[1]),
                    token1: web3.eth.abi.decodeParameter("address", firstPool.topics[2])
                })
            } else if (firstPool.address == config.v3FactoryAddress) {
                let decode = web3.eth.abi.decodeParameters(["uint256", "address"], firstPool.data)
                resolve({
                    blockNumber: firstPool.blockNumber,
                    version: "uniswapv3",
                    pool: decode[1],
                    token0: web3.eth.abi.decodeParameter("address", firstPool.topics[1]),
                    token1: web3.eth.abi.decodeParameter("address", firstPool.topics[2]),
                    fee: web3.eth.abi.decodeParameter("uint256", firstPool.topics[3]),
                })
            }
        } else {
            resolve(null)
        }
    })
}
//获取第一笔交易的blockNumber
export const getFirstTransactionBlockNumber = (address: string, startNumber: number, chainId: number, count: number = 2000) => {
    return new Promise<number>(async (resolve) => {
        const web3: Web3 = getProvider(chainId)
        web3.eth.getPastLogs({
            fromBlock: startNumber + 1,
            toBlock: startNumber + count,
            address: address,
            topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]
        }).then(async res => {
            if (res.length > 1) {
                _.sortBy(res, "blockNumber")
                resolve(res[1].blockNumber)
            } else {
                let blockNumber = await getFirstTransactionBlockNumber(address, startNumber, chainId, count + 2000)
                resolve(blockNumber)
            }
        }).catch(err => {
            resolve(null)
        })
    })
}
//处理获取第一个注入池子的价格
export const getFirstPrice = (contract: insertItem) => {
    return new Promise<{ price: string, poolBalance: string, firstBlockNumber: number }>(async (resolve) => {
        const web3: any = getProvider(contract.chain_id)
        let firstBlockNumber = 0
        let firstPool = await getFirstPoolForBlockNumber(contract)
        let currentBlockNumber = await getBlockNumber(contract.chain_id)
        let events = []
        if (firstPool) {
            firstBlockNumber = firstPool.blockNumber
            try {
                if (firstPool.version == "camelotv2") {
                    let list = await web3.eth.getPastLogs({
                        fromBlock: firstPool.blockNumber,
                        toBlock: currentBlockNumber - firstPool.blockNumber > 10000 ? firstPool.blockNumber + 10000 : currentBlockNumber,
                        address: firstPool.pool,
                        topics: ["0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f"]
                    })
                    if (list.length) {
                        list = _.orderBy(list, ["blockNumber"], ["asc"]);
                        list.forEach(item => {
                            item.decode = web3.eth.abi.decodeParameters(["uint256", "uint256"], item.data)
                        })
                        for (let event of list) {
                            let amount0 = 0
                            let amount1 = 0
                            //检测是否是单边池子如果是那么累计到下一个池子
                            if (Number(event.decode[0]) > 0 && Number(event.decode[1]) > 0) {
                                let params = {
                                    amount0: Number(event.decode[0]) + amount0,
                                    amount1: Number(event.decode[1]) + amount1,
                                    token0: firstPool.token0,
                                    token1: firstPool.token1,
                                    blockNumber: event.blockNumber,
                                    pool: firstPool.pool,
                                    version: "camelotv2"
                                }
                                events.push(params)
                                break;
                            } else {
                                amount0 = Number(event.decode[0])
                                amount1 = Number(event.decode[1])
                            }
                        }
                    }
                } else if (firstPool.version == "uniswapv2") {
                    let list = await web3.eth.getPastLogs({
                        fromBlock: firstPool.blockNumber,
                        toBlock: currentBlockNumber - firstPool.blockNumber > 10000 ? firstPool.blockNumber + 10000 : currentBlockNumber,
                        address: firstPool.pool,
                        topics: ["0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f"]
                    })
                    if (list.length) {
                        list = _.orderBy(list, ["blockNumber"], ["asc"]);
                        list.forEach(item => {
                            item.decode = web3.eth.abi.decodeParameters(["uint256", "uint256"], item.data)
                        })
                        for (let event of list) {
                            let amount0 = 0
                            let amount1 = 0
                            //检测是否是单边池子如果是那么累计到下一个池子
                            if (Number(event.decode[0]) > 0 && Number(event.decode[1]) > 0) {
                                let params = {
                                    amount0: Number(event.decode[0]) + amount0,
                                    amount1: Number(event.decode[1]) + amount1,
                                    token0: firstPool.token0,
                                    token1: firstPool.token1,
                                    blockNumber: event.blockNumber,
                                    pool: firstPool.pool,
                                    version: "uniswapv2"
                                }
                                events.push(params)
                                break;
                            } else {
                                amount0 = Number(event.decode[0])
                                amount1 = Number(event.decode[1])
                            }
                        }
                    }
                } else if (firstPool.version == "uniswapv3") {
                    let list = await web3.eth.getPastLogs({
                        fromBlock: firstPool.blockNumber,
                        toBlock: currentBlockNumber - firstPool.blockNumber > 10000 ? firstPool.blockNumber + 10000 : currentBlockNumber,
                        address: firstPool.pool,
                        topics: ["0x7a53080ba414158be7ec69b987b5fb7d07dee101fe85488f0853ae16239d0bde"]
                    })
                    if (list.length) {
                        list = _.orderBy(list, ["blockNumber"], ["asc"]);
                        list.forEach(item => {
                            item.decode = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "uint256"], item.data)
                        })
                        let amount0 = 0
                        let amount1 = 0
                        for (let event of list) {
                            //检测是否是单边池子如果是那么累计到下一个池子
                            if (Number(event.decode[2]) > 0 && Number(event.decode[3]) > 0) {
                                let params = {
                                    amount0: BigNumber(Number(event.decode[2]) + amount0).toFixed(),
                                    amount1: BigNumber(Number(event.decode[3]) + amount1).toFixed(),
                                    token0: firstPool.token0,
                                    token1: firstPool.token1,
                                    blockNumber: event.blockNumber,
                                    pool: firstPool.pool,
                                    version: "uniswapv3"
                                }
                                events.push(params)
                                break;
                            } else {
                                amount0 = Number(event.decode[2])
                                amount1 = Number(event.decode[3])
                            }
                        }
                    }
                }
            } catch (error) {
            }
        }
        let firstPrice = 0
        let poolBalance = '0'
        if (events.length) {
            events = _.orderBy(events, ["blockNumber"], ["asc"]);
            for (let item of events) {
                //判断是否是单边池，如果是单边池子那么就下一个
                if (Number(item.amount0) > 0 && Number(item.amount1) > 0) {
                    //如果是神剑、sushi、v2 全部用v2获取
                    let firstPool: v2Pool = {
                        pool: item.pool,
                        reserve0: item.amount0,
                        reserve1: item.amount1,
                        token0: item.token0,
                        token1: item.token1,
                        totalSupply: "0",
                        blockTimestampLast: 0
                    }
                    poolBalance = firstPool.token0 == Config[contract.chain_id].stableContract[0] ? firstPool.reserve0 : firstPool.reserve1
                    let price = await computedV2Price(item.token0, item.token1, firstPool, contract.chain_id)
                    firstPrice = price ? price[contract.symbol] : 0.00000000001
                    break
                }
            }

        }
        resolve({ price: BigNumber(firstPrice).toFixed(), poolBalance: BigNumber((Number(poolBalance) / (10 ** 18)).toFixed(5)).toFixed(), firstBlockNumber })
    })
}
//批量获取区块信息
export const batchBlockRequest = (startNumber: number, endNumber: number, chainId: number) => {
    return new Promise<any[]>(async (resolve) => {
        try {
            const web3 = getProvider(chainId)
            let params = []
            let transactions = []
            for (let i = startNumber; i <= endNumber; i++) {
                params.push({
                    jsonrpc: '2.0',
                    id: uuidv4(),
                    method: 'eth_getBlockByNumber',
                    params: [web3.utils.numberToHex(i), true],
                })
            }
            let res = await axios({
                url: Config[chainId].prc,
                method: "post",
                data: params
            })
            if (res.data) {
                res.data.forEach(item => {
                    if (item.result && item.result.transactions.length) {
                        item.result.transactions.forEach(transaction => {
                            transaction.blockNumber = BigNumber(Number(ethBigNumber.from(transaction.blockNumber).toBigInt())).toFixed()
                            transaction.gas = BigNumber(Number(ethBigNumber.from(transaction.gas).toBigInt())).toFixed()
                            transaction.gasPrice = BigNumber(Number(ethBigNumber.from(transaction.gasPrice).toBigInt())).toFixed()
                            transaction.value = BigNumber(Number(ethBigNumber.from(transaction.value).toBigInt())).toFixed()
                            transaction.transactionIndex = BigNumber(Number(ethBigNumber.from(transaction.transactionIndex).toBigInt())).toFixed()
                            transaction.nonce = BigNumber(Number(ethBigNumber.from(transaction.nonce).toBigInt())).toFixed()
                        })
                        transactions = transactions.concat(item.result.transactions)
                    }
                });
            }
            resolve(transactions)
        } catch (error) {
            resolve([])
        }
    })
}
//批量获取交易详情
export const batchGetTransaction = (hashs: string[], chainId: number) => {
    return new Promise<any[]>((resolve) => {
        if (hashs.length) {
            const web3: any = getProvider(chainId)
            let batch = new web3.eth.BatchRequest();
            let transactions = []
            let success = 0
            hashs.forEach(item => {
                batch.add(web3.eth.getTransaction.request(item, (err, res) => {
                    success++
                    if (res) {
                        transactions.push(res)
                    }
                    if (success == hashs.length) {
                        resolve(transactions)
                    }
                }))
            })
            batch.execute()
        } else {
            resolve([])
        }
    })
}
//批量获取交易详情
export const batchGetTransactionReceipt = (hashs: string[], chainId: number) => {
    return new Promise<any[]>((resolve) => {
        if (hashs.length) {
            const web3: any = getProvider(chainId)
            let batch = new web3.eth.BatchRequest();
            let transactions = []
            let success = 0
            hashs.forEach(item => {
                batch.add(web3.eth.getTransactionReceipt.request(item, (err, res) => {
                    success++
                    if (res) {
                        transactions.push(res)
                    }
                    if (success == hashs.length) {
                        resolve(transactions)
                    }
                }))
            })
            batch.execute()
        } else {
            resolve([])
        }
    })
}
//获取eth余额
export const getBalance = (chainId: number, address: string) => {
    return new Promise<string>((resolve) => {
        const web3: Web3 = getProvider(chainId)
        web3.eth.getBalance(address).then(res => {
            resolve(res)
        }).catch(err => {
            resolve(null)
        })
    })
}
//获取dandao合约
export const getDanDaoNFTContract = (chainId: number) => {
    const config = getConfig(chainId)
    const web3: Web3 = getProvider(chainId)
    return new web3.eth.Contract(DanDaoNFTAbi, config.DANDAONFTFactory)
}
//批量获取地址交易数量
export const batchGetTransactionCount = (addresses: any[], chainId: number) => {
    return new Promise<baseData[]>((resolve) => {
        const web3: any = getProvider(chainId)
        let batch = new web3.eth.BatchRequest();
        let result = []
        let success = 0
        addresses.forEach(item => {
            batch.add(web3.eth.getTransactionCount.request(item.address, (err, res) => {
                success++
                if (res) {
                    if (res < 3000) {
                        result.push({
                            address: item.address,
                            count: res,
                            name: item.name
                        })
                    }
                }
                if (success == addresses.length) {
                    resolve(result)
                }
            }))
        })
        batch.execute()
    })
}
//批量获取erc20基本资料
export const batchGetBaseData = (addresses: string[], chainId: number) => {
    return new Promise<baseData[]>(async (resolve) => {
        try {
            let config = Config[chainId]
            for (let i = 0; i < addresses.length; i++) {
                if (config.ignoreToken.indexOf(addresses[i]) != -1) {
                    addresses.splice(i, 1)
                    i--
                }
            }
            let chunkAddresses = _.chunk(addresses, 500);
            let result = []
            let contract = Config[chainId].DANDAOFactoryContract
            for (let item of chunkAddresses) {
                let contractResult = await contract.methods.batchBaseData(item).call()
                result = result.concat(contractResult)
            }
            resolve(result)
        } catch (error) {
            resolve([])
        }
    })
}
//获取单个基本资料
export const getBaseData = (address: string, chainId: number) => {
    return new Promise((resolve) => {
        const contract = Config[chainId].DANDAOFactoryContract
        contract.methods.getBaseData(address).call().then(baseData => {
            resolve(baseData)
        }).catch(err => {
            resolve(false)
        })
    })
}
//获取交易noce
export const getTransactionCount = (address: string, web3: any) => {
    return new Promise<number>(async (resolve) => {
        try {
            let count = await web3.eth.getTransactionCount(address);
            resolve(count)
        } catch (error) {
            resolve(Math.round(new Date().getTime() / 1000))
        }
    })
}
//获取当前gasprice
export const getGasPrice = (web3: any) => {
    return new Promise<number>(async (resolve) => {
        try {
            let gasPrice = await web3.eth.getGasPrice()
            resolve(gasPrice)
        } catch (error) {
            resolve(100)
        }
    })
}
//获取v2 pair
export const batchGetPair = (addresses: string[], chainId: number) => {
    return new Promise<v2Pool[]>(async (resolve) => {
        try {
            let chunkAddresses = _.chunk(addresses, 500);
            let result = []
            let contract = Config[chainId].DANDAOFactoryContract ? Config[chainId].DANDAOFactoryContract : getDanDaoContract(chainId)
            for (let item of chunkAddresses) {
                let contractResult = await contract.methods.batchGetPair(item).call()
                result = result.concat(contractResult)
            }
            resolve(result)
        } catch (error) {
            resolve([])
        }
    })
}
//获取v3 pool
export const batchGETV3Pool = (addresses: string[], chainId: number) => {
    return new Promise<v3Pool[]>(async (resolve) => {
        try {
            let chunkAddresses = _.chunk(addresses, 500);
            let result = []
            let contract = Config[chainId].DANDAOFactoryContract ? Config[chainId].DANDAOFactoryContract : getDanDaoContract(chainId)
            for (let item of chunkAddresses) {
                let contractResult = await contract.methods.batchPoolData(item).call()
                result = result.concat(contractResult)
            }
            resolve(result)
        } catch (error) {
            resolve([])
        }
    })
}
//批量获取erc20的余额
export const batchCheckERC20Balance = (checkERC20Items: checkERC20Item[], chainId: number) => {
    return new Promise<checkERC20Response[]>(async (resolve) => {
        try {
            let chunkCheckERC20Items = _.chunk(checkERC20Items, 500);
            let result = []
            let contract
            if (chainId == 1) {
                contract = Config[chainId].DANDAONFTFactoryContract ? Config[chainId].DANDAONFTFactoryContract : getDanDaoNFTContract(chainId)
            } else {
                contract = Config[chainId].DANDAOFactoryContract ? Config[chainId].DANDAOFactoryContract : getDanDaoNFTContract(chainId)
            }
            for (let item of chunkCheckERC20Items) {
                let contractResult = await contract.methods.batchCheckERC20Balance(item).call()
                result = result.concat(contractResult)
            }
            resolve(result)
        } catch (error) {
            console.log(error)
            resolve([])
        }
    })
}
//批量获取地址eth余额
export const batchCheckBalance = (addresses: string[], chainId: number) => {
    return new Promise<checkERC20Response[]>(async (resolve) => {
        try {
            let chunkAddresses = _.chunk(addresses, 500);
            let result = []
            let contract
            if (chainId == 1) {
                contract = Config[chainId].DANDAONFTFactoryContract ? Config[chainId].DANDAONFTFactoryContract : getDanDaoNFTContract(chainId)
            } else {
                contract = Config[chainId].DANDAOFactoryContract ? Config[chainId].DANDAOFactoryContract : getDanDaoNFTContract(chainId)
            }
            for (let item of chunkAddresses) {
                let contractResult = await contract.methods.batchCheckBalance(item).call()
                result = result.concat(contractResult)
            }
            resolve(result)
        } catch (error) {
            console.log(error)
            resolve([])
        }
    })
}
//批量预执行获取gas
export const telegramBatchEstimateGas = (tasks: telegramTask[], chainId: number) => {
    return new Promise<any[]>((resolve) => {
        const web3: any = getProvider(chainId)
        let config = Config[chainId]
        let batch = new web3.eth.BatchRequest();
        let success = 0
        let eigibleList = []
        tasks.forEach(task => {
            let account = web3.eth.accounts.privateKeyToAccount(task.private_key)
            batch.add(web3.eth.estimateGas.request({
                from: account.address,
                to: config.DANDAOTrade,
                data: task.encode_data,
                value: BigNumber(Number(Number(task.amount) * 10 ** 18) + config.DANDAOFee).toFixed()
            }, (err, res) => {
                success++
                if (res) {
                    eigibleList.push({ ...task, gas: res })
                }
                if (success == tasks.length) {
                    resolve(eigibleList)
                }
            }))
        })
        batch.execute()
    })
}
//预执行获取gas
export const estimateGas = (params: any, web3: Web3) => {
    return new Promise<{ success: boolean, gas: number, msg: string }>((resolve) => {
        web3.eth.estimateGas(params).then(gas => {
            resolve({
                success: true,
                gas: gas,
                msg: "预请求成功"
            })
        }).catch(err => {
            resolve({
                success: false,
                gas: 0,
                msg: err.message
            })
        })
    })
}
//获取decimls
export const getDecimals = (address: string, chainId: number) => {
    return new Promise<number>((resolve) => {
        const config = getConfig(chainId)
        const web3: Web3 = getProvider(chainId)
        const contract = new web3.eth.Contract(ERC20, address)
        contract.methods.decimals().call().then(decimals => {
            resolve(decimals)
        }).then(err => {
            resolve(0)
        })
    })
}
//请求dextool基本资料
export const getDEXInfo = (address: string, chainId: number) => {
    return new Promise((resolve) => {
        axios({
            url: `https://www.dextools.io/shared/data/pair?address=${address.toLocaleLowerCase()}&chain=${Config[chainId].name}&audit=true&locks=true`,
            method: "get"
        }).then(res => {
            if (res.data.data[0]) {
                resolve(res.data.data[0].token)
            } else {
                resolve(false)
            }
        }).catch(err => {
            resolve(false)
        })
    })
}
//获取pending event
export const getPendingEvent = (chainId: number, blockNumber) => {
    return new Promise<any>((resolve) => {
        const web3: Web3 = getProvider(chainId)
        web3.eth.getPastLogs({ fromBlock: blockNumber, toBlock: blockNumber }).then(events => {
            resolve(events)
        }).catch(err => {
            resolve(null)
        })
    })
}

export const getBlockNumber = (chainId: number) => {
    return new Promise<number>((resolve) => {
        const web3: Web3 = getProvider(chainId)
        web3.eth.getBlockNumber().then(blockNumber => {
            resolve(blockNumber)
        }).catch(err => {
            resolve(null)
        })
    })
}
//获取pendingblock信息
export const getPendingBlock = (chainId: number) => {
    return new Promise<any>((resolve) => {
        const web3: Web3 = getProvider(chainId)
        web3.eth.getBlock("pending", true).then(block => {
            resolve(block)
        }).catch(err => {
            resolve(null)
        })
    })
}
//查看授权
export const checkApproveBalance = (user: string, target: string, spender: string, chainId: number) => {
    return new Promise(async (resolve) => {
        try {
            let web3 = getProvider(chainId)
            let contract = new web3.eth.Contract(ERC20, target)
            let approveBalance = await contract.methods.allowance(user, spender).call()
            resolve(approveBalance)
        } catch (error) {
            resolve(0)
        }
    })
}
//批量检测地址是否是合约
export const batchGetCode = (addresses: string[], chainId: number) => {
    return new Promise<any[]>((resolve) => {
        try {
            const web3: any = getProvider(chainId)
            let batch = new web3.eth.BatchRequest();
            let success = 0
            let result = []
            addresses.forEach(item => {
                batch.add(web3.eth.getCode.request(item, (err, res) => {
                    success++
                    if (res == "0x") {
                        result.push(item)
                    }
                    if (success == addresses.length) {
                        resolve(result)
                    }
                }))
            })
            batch.execute()
        } catch (error) {
            resolve([])
        }
    })
}
//批量获取nft所有持有人地址
export const getNFTAllAddress = (address: string, startToken: number, endToken: number) => {
    return new Promise((resolve) => {
        let conctract = getDanDaoNFTContract(1)
        conctract.methods.getNftAllAddress(address, startToken, endToken).call().then(result => {
            resolve(result)
        }).catch(err => {
            resolve(null)
        })
    })
}
export const batchQueryENSname = (addresses: string[]) => {
    return new Promise((resolve) => {
        const config = Config[1]
        const web3 = new Web3(config.prc)
        let factoryContract = new web3.eth.Contract(DanDaoNFTAbi, config.DANDAONFTFactory)
        let newList = sliceAddresses(addresses)
        let resultList = []
        for (let item of newList) {
            let notes: string[] = []
            for (let items of item) {
                notes.push(hexENSAddress(items))
            }
            factoryContract.methods.batchQueryDNSName("0x74e20bd2a1fe0cdbe45b9a1d89cb7e0a45b36376", notes).call().then(result => {
                resultList.concat(result)
            }).catch(err => {
            })
        }
        resolve(resultList)
    })
}
//获取合约所有的转账记录
export const getContractAllTransferEvent = (address: string, startBlock: number, chainId: number) => {
    return new Promise<any[]>((resolve) => {
        const web3: Web3 = getProvider(chainId)
        web3.eth.getPastLogs({
            fromBlock: startBlock,
            toBlock: "latest",
            address: address,
            topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]
        }).then(result => {
            resolve(result)
        }).catch(err => {
            resolve([])
        })
    })
}
//获取合约创建者
export const batchGetCreator = (addresses: string[]) => {
    return new Promise<any[]>(async (resolve) => {
        let sliceAddresses = _.chunk(addresses, 5);
        let all = []
        for (let item of sliceAddresses) {
            try {
                let result = await axios({
                    url: `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${item.join(",")}&apikey=XJZ14US5XTCG3JR1V716UBJP7XQ2IVNZ3S`,
                    method: "get"
                })
                if (result.data.status == 1) {
                    all = all.concat(result.data.result)
                }
            } catch (error) {
                try {
                    let result = await axios({
                        url: `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${item.join(",")}&apikey=XJZ14US5XTCG3JR1V716UBJP7XQ2IVNZ3S`,
                        method: "get"
                    })
                    if (result.data.status == 1) {
                        all = all.concat(result.data.result)
                    }
                } catch {

                }
            }
        }
        let hashs = all.map(item => {
            return item.txHash
        })
        let transactions = await batchGetTransaction(hashs, 1)
        all.forEach(item => {
            let find = transactions.find(transaction => {
                return transaction.hash == item.txHash
            })
            if (find) {
                item.blockNumber = find.blockNumber
            }
        })
        resolve(all)
    })
}
