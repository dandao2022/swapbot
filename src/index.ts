import schedule from "node-schedule"
import Web3 from "web3";
import { getBlockEvent, getBlockPendingEvent } from "./erc20/event"
import { config, callbackEvent, v3Pool } from "./types"
import { Config } from "./config/constrants"
import { formatOwnerBurn, addContract } from "./erc20/handle"
import { batchGetBaseData } from "./utils/fetch"
import { getToken, computedV3PairAddress, computedV3Price, batchV3Pool, configInitialization } from "./utils/help"
import { getDanDaoContract, getDanDaoNFTContract } from "./utils/fetch"
import EventEmiter from "./utils/eventEmiter";
export * from "./bot"
export * from "./erc20/handle"
export * from "./config/constrants"
export * from "./erc20/event"
export * from "./config/abis"
export * from "./utils/fetch"
export * from "./utils/path"
export * from "./utils/help"
export * from "./erc20/methods"
export * from "./erc20/swap"
export * from "./types"
class DANDAO {
    web3: any
    isNode: boolean
    currentBlockNumber = 0
    isGetting = false
    isGettingPending = false
    config: config
    eventInterVal: any
    pendingInterVal: any
    priceInterVal: any
    chainID: number
    wethPrice: string
    tokens = {}
    taskTokens = {}
    eventEmiter: EventEmiter
    constructor(chainID: number, isNode?: boolean) {
        this.isNode = isNode
        this.chainID = chainID
        this.eventEmiter = new EventEmiter()
        this.web3 = new Web3(Config[chainID].prc)
        configInitialization([chainID])
        this.config = Config[chainID]
        this.getEthPrice()
        if (chainID == 5) {
            configInitialization([1])
        }
    }
    setPrc(prc: string) {
        Config[this.chainID].prc = prc
        this.web3 = new Web3(new Web3.providers.HttpProvider(prc, { timeout: 60000 }))
        Config[this.chainID].provider = this.web3
        if (this.chainID == 1) {
            Config[this.chainID].DANDAOFactoryContract = getDanDaoContract(this.chainID)
            Config[this.chainID].DANDAONFTFactoryContract = getDanDaoNFTContract(this.chainID)
        } else {
            Config[this.chainID].DANDAOFactoryContract = getDanDaoContract(this.chainID)
        }
    }
    async startBlockEvent(blockNumber: number = 0, callback: (res: any) => void) {
        this.eventEmiter.subscribe("eventCallback", callback)
        this.currentBlockNumber = blockNumber
        if (this.isNode) {
            schedule.scheduleJob("*/10 * * * * *", async () => {
                this.getBlockEvent()
            })
        } else {
            this.eventInterVal = setInterval(() => {
                this.getBlockEvent()
            }, 10000)
        }
    }
    async getEthPrice() {
        let chainID = this.chainID == 5 ? 1 : this.chainID
        let config = Config[chainID]
        let tokens = await batchGetBaseData([config.stableContract[0], config.stableContract[1]], chainID)
        if (tokens.length == 2) {
            let formartTokens = tokens.map(item => {
                return {
                    name: item.name,
                    chain_id: this.chainID,
                    address: item.contractAddr,
                    decimals: item.decimals,
                    symbol: item.symbol,
                }
            })
            let weth = getToken(formartTokens[0])
            let usdc = getToken(formartTokens[1])
            let computedPools = await computedV3PairAddress(weth, usdc, chainID)
            let pools = computedPools.map(item => {
                return item.pool
            })
            let v3Pools: v3Pool[] = await batchV3Pool(pools, chainID, "uniswapv3")
            if (v3Pools.length) {
                let price = await computedV3Price(weth, usdc, v3Pools[0], chainID)
                this.wethPrice = price["WETH"]
            }
            if (this.isNode) {
                schedule.scheduleJob("*/10 * * * * *", async () => {
                    try {
                        let v3Pools: v3Pool[] = await batchV3Pool(pools, chainID, "uniswapv3")
                        if (v3Pools.length) {
                            let price = await computedV3Price(weth, usdc, v3Pools[0], chainID)
                            this.wethPrice = price["WETH"]
                        }
                    } catch (error) {

                    }
                })
            } else {
                this.priceInterVal = setTimeout(async () => {
                    try {
                        let v3Pools: v3Pool[] = await batchV3Pool(pools, chainID, "uniswapv3")
                        if (v3Pools.length) {
                            let price = await computedV3Price(weth, usdc, v3Pools[0], chainID)
                            this.wethPrice = price["WETH"]
                        }
                    } catch (error) {

                    }
                    this.getEthPrice()
                }, 10000)
            }
        } else {
            this.getEthPrice()
        }
    }
    async startBlockPendingEvent(callback: (res: any) => void) {
        this.eventEmiter.subscribe("pendingEventCallback", callback)
        if (this.isNode) {
            schedule.scheduleJob("*/2 * * * * *", async () => {
                let startTime = new Date().getTime()
                let result = await getBlockPendingEvent(this.chainID)
                this.pendingHanlder(result, new Date().getTime() - startTime)
            })
        } else {
            this.pendingInterVal = setInterval(async () => {
                let startTime = new Date().getTime()
                let result = await getBlockPendingEvent(this.chainID)
                this.pendingHanlder(result, new Date().getTime() - startTime)
            }, 2000)
        }
    }
    async stopBlockEvent() {
        clearInterval(this.eventInterVal)
        clearInterval(this.pendingInterVal)
        clearTimeout(this.priceInterVal)
    }
    pendingHanlder(res: any, ms: number) {
        let result: callbackEvent = {
            model: "uniswap",
            chainId: this.config.chainID,
            createEvents: res.contracts,
            handleParams: res.handleParams,
            sendParams: res.sendParams,
            swapEvents: res.swapEvents,
            transactions: res.transactions,
            blockNumber: "pending",
            ms: ms
        }
        this.eventEmiter.emit("pendingEventCallback", { ...result })
    }
    async validateBlock(blockNumber: number) {
        try {
            let startTime = new Date().getTime()
            let events: any = await getBlockEvent(blockNumber - 3, blockNumber, this.config.chainID, this.web3)
            let result: callbackEvent = {
                model: "uniswap",
                chainId: this.config.chainID,
                createEvents: events.contracts,
                handleParams: events.handleParams,
                sendParams: events.sendParams,
                transactions: events.transactions,
                swapEvents: events.swapEvents,
                blockNumber: blockNumber,
                ms: new Date().getTime() - startTime
            }
            this.eventEmiter.emit("eventCallback", { ...result })
        } catch (error) {
            console.log("失败了", error)
        }
    }
    async getBlockEvent() {
        let blockNumber: number
        try {
            blockNumber = await this.web3.eth.getBlockNumber()
        } catch {
            return
        }
        if (this.currentBlockNumber > blockNumber) {
            return
        }
        let currentBlockNumber: number
        currentBlockNumber = this.currentBlockNumber == 0 ? blockNumber : this.currentBlockNumber
        try {
            let startTime = new Date().getTime()
            let events: any = await getBlockEvent(currentBlockNumber, blockNumber, this.config.chainID, this.web3)
            let result: callbackEvent = {
                model: "uniswap",
                chainId: this.config.chainID,
                createEvents: events.contracts,
                handleParams: events.handleParams,
                sendParams: events.sendParams,
                transactions: events.transactions,
                swapEvents: events.swapEvents,
                blockNumber: blockNumber,
                ms: new Date().getTime() - startTime
            }
            this.eventEmiter.emit("eventCallback", { ...result })
            this.currentBlockNumber = blockNumber + 1
        } catch (error) {
            console.log("失败了", error)
        }
    }
    async addContract(addresses: string[], callback: any) {
        let constracts = await addContract(addresses, this.chainID)
        callback(constracts)
    }
    async checkOwnerBurn(tokens: any[]) {
        tokens = tokens.filter(item => {
            return item.chain_id == this.chainID
        })
        let addresses = tokens.map(item => {
            return item.address
        })
        return await formatOwnerBurn(addresses, this.chainID)
    }
}
export default DANDAO