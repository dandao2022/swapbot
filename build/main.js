(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["dandao"] = factory();
	else
		root["dandao"] = factory();
})(global, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 3196:
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = 3196;
module.exports = webpackEmptyContext;

/***/ }),

/***/ 12213:
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = 12213;
module.exports = webpackEmptyContext;

/***/ }),

/***/ 91011:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const node_telegram_bot_api_1 = __importDefault(__webpack_require__(41353));
const node_schedule_1 = __importDefault(__webpack_require__(54221));
const dayjs_1 = __importDefault(__webpack_require__(27484));
const web3_1 = __importDefault(__webpack_require__(3283));
const lodash_1 = __importDefault(__webpack_require__(96486));
const index_1 = __importStar(__webpack_require__(63607));
const templates_1 = __webpack_require__(95094);
const db_1 = __importDefault(__webpack_require__(46030));
const bignumber_js_1 = __importDefault(__webpack_require__(44431));
class NewBot {
    bot;
    isCheckingPool = false;
    isCheckingPrice = false;
    chatId;
    topChartId;
    params;
    db;
    chainIds;
    sdks = new Map();
    users = new Map();
    spinner;
    currentGasPrices = new Map();
    rushSending = new Map();
    constructor(params) {
        this.db = new db_1.default(params.dbData);
        this.bot = new node_telegram_bot_api_1.default(params.token, { polling: true });
        this.params = params;
        this.chainIds = params.chainIds;
        this.initialization();
        this.listenCommand();
        this.onMessage();
        this.botQuery();
        this.bot.on('polling_error', (error) => {
            console.log(error); // => 'EFATAL'
        });
        this.analyzeData();
    }
    async initialization() {
        for (let item of this.chainIds) {
            this.sdks.set(item, new index_1.default(item, true));
            let find = await this.db.find("event", [`chain_id=${item}`], ["block_number desc"]);
            let blockNumber = 0;
            if (find) {
                let currentBlockNumber = await (0, index_1.getBlockNumber)(item);
                if (currentBlockNumber - find.block_number < 50) {
                    blockNumber = find.block_number + 1;
                }
            }
            this.sdks.get(item).startBlockEvent(blockNumber, async (res) => {
                let web3 = (0, index_1.getProvider)(item);
                let gasPrice = Number(await (0, index_1.getGasPrice)(web3));
                this.currentGasPrices.set(item, (0, bignumber_js_1.default)(Number(gasPrice / (10 ** 9)).toFixed(2)));
                this.handleWatchAndFollow(res);
                this.handleEventCallBack(res);
                this.checkPool(item);
                this.checkFirstPrice(item);
                this.checkSwapFee(item);
            });
        }
        this.checkRushList();
    }
    async checkRushList() {
        node_schedule_1.default.scheduleJob("*/2 * * * * *", async () => {
            let startTime = Math.round(new Date().getTime() / 1000);
            let entTime = Math.round(new Date().getTime() / 1000) - 1800;
            let rushList = await this.db.select("task", ['type=5', `start_time>=${entTime}`, `start_time<${startTime}`, `private_key is not null`]);
            if (rushList.length) {
                this.getPerRequest(rushList);
            }
        });
    }
    async getPerRequest(taskList) {
        for (let chainId of this.chainIds) {
            let list = [];
            let targets = [];
            taskList.forEach(item => {
                if (item.chain_id == chainId && !this.rushSending.get(item.id)) {
                    list.push(item);
                    targets.push(`'${item.target}'`);
                }
            });
            let contracts = await this.db.batchQuery("contract", "address", targets);
            for (let item of list) {
                let contract = contracts.find(items => {
                    return items.address == item.target;
                });
                if (contract) {
                    item.encode_data = (0, index_1.encodeRsuhData)(JSON.parse(contract.pools), item);
                }
            }
            let { eligibleList } = await (0, index_1.telegramBatchFuckTugou)(list, chainId);
            if (eligibleList.length) {
                this.rushNow(eligibleList, chainId);
            }
        }
    }
    async rushNow(eligibleList, chainId) {
        for (let item of eligibleList) {
            this.sendRushTransaction(item, chainId);
        }
    }
    async sendRushTransaction(item, chainId) {
        if (!this.rushSending.get(item.id)) {
            let web3 = new web3_1.default();
            this.rushSending.set(item.id, true);
            await this.db.delete("task", [`id=${item.id}`]);
            let contract = await this.db.find("contract", [`address='${item.target}'`]);
            let msg = {
                message: {
                    chat: {
                        id: item.telegram_id
                    }
                }
            };
            (0, templates_1.pendingTamplate)(this.bot, msg, contract, item.amount, item.signTx.transactionHash, 5);
            let transaction = await (0, index_1.sendSignedTransaction)(item.target, item.chain_id, item.signTx, 5);
            if (transaction.response_type == 1) {
                let outAmount = 0;
                let receiveAddress = item.address;
                transaction.transactionReceipt.logs.forEach(log => {
                    if (log.topics.length == 3 && web3.utils.toChecksumAddress(log.address) == item.target) {
                        let inAddress = web3.utils.toChecksumAddress(web3.eth.abi.decodeParameter("address", log.topics[2]));
                        if (log.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" && inAddress == receiveAddress) {
                            outAmount += Number(web3.eth.abi.decodeParameter("uint256", log.data));
                        }
                    }
                });
                let gasUsed = transaction.transactionReceipt.gasUsed * transaction.transactionReceipt.effectiveGasPrice / (10 ** 18) * this.sdks.get(chainId).wethPrice;
                let cost = Number(((item.amount * this.sdks.get(chainId).wethPrice) + gasUsed).toFixed(2));
                let transactionLog = {
                    chain_id: chainId,
                    address: item.address,
                    target: item.target,
                    hash: transaction.hash,
                    in_target: "0x0000000000000000000000000000000000000000",
                    in_amount: item.amount,
                    out_target: item.target,
                    price: "",
                    out_amount: (0, bignumber_js_1.default)(outAmount / (10 ** Number(contract.decimals))).toFixed(),
                    telegram_id: item.telegram_id,
                    telegram_name: item.telegram_name,
                    type: 5,
                    transfer_type: 1,
                    is_sell: 0,
                    status: 1,
                    symbol: contract.symbol,
                    cost: cost,
                    remark: "swap成功",
                    create_time: Math.round(new Date().getTime() / 1000),
                };
                let insertResult = await this.db.insert("transferLog", transactionLog);
                transactionLog.id = insertResult;
                contract.fastGetContractPrice = await (0, index_1.fastGetContractPrice)(contract, chainId);
                let user = await this.getUserSetting(item.telegram_id);
                (0, templates_1.buySuccessTemplate)(this.bot, msg, contract, user, this.currentGasPrices.get(contract.chain_id), this.sdks.get(contract.chain_id).wethPrice, transactionLog);
            }
            else {
                let gasUsed = transaction.hash ? Number((transaction.transactionReceipt.gasUsed * transaction.transactionReceipt.effectiveGasPrice / (10 ** 18) * this.sdks.get(chainId).wethPrice).toFixed(2)) : 0;
                let cost = gasUsed;
                let transactionLog = {
                    chain_id: chainId,
                    address: item.address,
                    target: item.target,
                    price: "",
                    hash: transaction.hash ? transaction.hash : '',
                    in_target: "0x0000000000000000000000000000000000000000",
                    in_amount: item.amount,
                    out_target: item.target,
                    out_amount: 0,
                    telegram_id: item.telegram_id,
                    telegram_name: item.telegram_name,
                    type: 5,
                    transfer_type: 1,
                    is_sell: 0,
                    status: 2,
                    symbol: contract.symbol,
                    cost: cost,
                    remark: transaction.msg,
                    create_time: Math.round(new Date().getTime() / 1000),
                };
                await this.db.insert("transferLog", transactionLog);
                (0, templates_1.errorTamplate)(this.bot, msg, contract, item.amount, transaction.hash, 5, transaction.msg);
            }
        }
    }
    async checkSwapFee(chainId) {
        let list = await this.db.select("contract", [`chain_id=${chainId}`, 'is_add_liquidity=1', 'is_get_swap_fee=0']);
        for (let item of list) {
            let buyList = await this.db.select("event", [`out_target='${item.address}'`]);
            let sellList = await this.db.select("event", [`in_target='${item.address}'`]);
            if (buyList.length && sellList.length) {
                buyList = lodash_1.default.orderBy(buyList, "out_swap_fee", "asc");
                sellList = lodash_1.default.orderBy(sellList, "in_swap_fee", "asc");
                item.buy_fee = buyList[0].out_swap_fee;
                item.sell_fee = sellList[0].in_swap_fee;
                item.is_get_swap_fee = 1;
                await this.db.update("contract", item);
            }
        }
    }
    fifteenMinutesData() {
        node_schedule_1.default.scheduleJob("0 */15 * * * *", async () => {
            for (let item of this.chainIds) {
                let currentList = await this.currentData(item);
                let perList = await this.perData(item);
                currentList.forEach(item => {
                    let find = perList.find(items => {
                        return items.address == item.address;
                    });
                    item.countPercent = this.countPercent(item, find, 'count');
                    item.holdersPercent = this.countPercent(item, find, 'currentHolders');
                    item.pricePercent = this.countPercent(item, find, 'currentPrice');
                    if (find) {
                        item.hightPrice = item.hightPrice > find.hightPrice ? item.hightPrice : find.hightPrice;
                        item.hightHolders = item.hightHolders > find.hightHolders ? item.hightHolders : find.hightHolders;
                    }
                    let historyPercent = 0;
                    if (item.firstPrice) {
                        if (item.currentPrice > Number(item.firstPrice)) {
                            historyPercent = Number((((item.currentPrice / Number(item.firstPrice)) - 1) * 100).toFixed(2));
                        }
                        else {
                            historyPercent = -Number(((1 - (Number(item.firstPrice) / item.currentPrice)) * 100).toFixed(2));
                        }
                    }
                    item.historyPercent = historyPercent;
                });
                currentList = lodash_1.default.orderBy(currentList, "count", "desc");
                currentList = currentList.slice(0, 5);
                currentList.forEach(items => {
                    items.currentPrice = (0, bignumber_js_1.default)(Number((items.currentPrice * this.sdks.get(item).wethPrice).toFixed(15))).toFixed();
                    items.hightPrice = (0, bignumber_js_1.default)(Number((items.hightPrice * this.sdks.get(item).wethPrice).toFixed(15))).toFixed();
                    items.firstPrice = (0, bignumber_js_1.default)(Number((items.firstPrice * this.sdks.get(item).wethPrice).toFixed(15))).toFixed();
                    items.allInflow = Number(items.allInflow.toFixed(5));
                    items.allBuy = Number(items.allBuy.toFixed(5));
                    items.allSell = Number(items.allSell.toFixed(5));
                    items.topHolderPercent = Number(items.topHolderPercent.toFixed(2));
                });
                if (this.topChartId && currentList.length) {
                    (0, templates_1.topFifteenMinutesTemplate)(this.bot, this.topChartId, currentList);
                }
            }
        });
    }
    countPercent(current, per, key) {
        if (per) {
            if (per[key] > current[key]) {
                return -Number(((1 - (current[key] / per[key])) * 100).toFixed(2));
            }
            else {
                return Number((((current[key] / per[key]) - 1) * 100).toFixed(2));
            }
        }
        else {
            return 0;
        }
    }
    async fiveMinute(currentList, chainId) {
        let list = await this.alreadyData(currentList, chainId);
        for (let item of list) {
            let find = await this.db.find("analyzedata", [`address='${item.address}'`], ["create_time desc"]);
            if (find) {
                find.currentHolders = find.holders;
                find.currentPrice = Number(find.price);
            }
            item.countPercent = this.countPercent(item, find, 'count');
            item.holdersPercent = this.countPercent(item, find, 'currentHolders');
            item.pricePercent = this.countPercent(item, find, 'currentPrice');
            let historyPercent = 0;
            if (item.firstPrice) {
                if (item.currentPrice > Number(item.firstPrice)) {
                    historyPercent = Number((((item.currentPrice / Number(item.firstPrice)) - 1) * 100).toFixed(2));
                }
                else {
                    historyPercent = -Number(((1 - (Number(item.firstPrice) / item.currentPrice)) * 100).toFixed(2));
                }
            }
            item.historyPercent = historyPercent;
        }
        list.forEach(items => {
            items.currentPrice = (0, bignumber_js_1.default)(Number((items.currentPrice * this.sdks.get(chainId).wethPrice).toFixed(15))).toFixed();
            items.firstPrice = (0, bignumber_js_1.default)(Number((items.firstPrice * this.sdks.get(chainId).wethPrice).toFixed(15))).toFixed();
            items.allInflow = Number(items.allInflow.toFixed(5));
            items.allBuy = Number(items.allBuy.toFixed(5));
            items.allSell = Number(items.allSell.toFixed(5));
            items.topHolderPercent = Number(items.topHolderPercent.toFixed(2));
        });
        if (this.topChartId && currentList.length) {
            (0, templates_1.topFiveMinutesTemplate)(this.bot, this.topChartId, list);
        }
    }
    async perData(chainId) {
        let endTime = Math.round(new Date().getTime() / 1000) - 900;
        let startTime = endTime - 900;
        let list = await this.db.select("analyzeData", [`create_time>=${startTime}`, `create_time<${endTime}`, `chain_id=${chainId}`]);
        let filterList = new Map();
        let addresses = list.map(item => {
            item.price = Number(item.price);
            if (filterList.get(item.address)) {
                let itemList = filterList.get(item.address);
                itemList.push(item);
                filterList.set(item.address, itemList);
            }
            else {
                filterList.set(item.address, [item]);
            }
            return `'${item.address}'`;
        });
        let contracts = await this.db.batchQuery("contract", 'address', addresses);
        let setList = [...filterList.values()];
        let countList = [];
        setList.forEach(data => {
            let find = contracts.find(items => {
                return items.address == data[0].address;
            });
            let sortCreate = lodash_1.default.orderBy(data, "create_time", 'desc');
            let sortHolders = lodash_1.default.orderBy(data, "holders", 'desc');
            let sortPrice = lodash_1.default.orderBy(data, "price", 'desc');
            let pushItem = {
                address: sortCreate[0].address,
                symbol: find.symbol,
                chainId: chainId,
                currentHolders: sortCreate[0].holders,
                currentPrice: sortCreate[0].price,
                hightPrice: sortPrice[0].price,
                hightHolders: sortHolders[0].holders,
                smartMoney: sortCreate[0].smart_money,
                topHolderPercent: 0,
                allBuy: 0,
                allSell: 0,
                allInflow: 0,
                count: 0,
                firstPrice: find ? find.first_price : 0
            };
            let topHolder = JSON.parse(sortCreate[0].top_holder);
            data.forEach(items => {
                pushItem.count += items.count;
                pushItem.allBuy += items.buy_amount;
                pushItem.allSell += items.sell_amount;
                pushItem.allInflow += items.inflow;
            });
            topHolder.forEach(items => {
                if (find) {
                    let pools = JSON.parse(find.pools);
                    let findPool = pools.find(pool => {
                        return pool.pool == items.address;
                    });
                    if (!findPool && items.address != "0x000000000000000000000000000000000000dEaD" && items.address != "0x0000000000000000000000000000000000000000") {
                        pushItem.topHolderPercent += Number(items.percent);
                    }
                }
                else {
                    pushItem.topHolderPercent += Number(items.percent);
                }
            });
            countList.push(pushItem);
        });
        return countList;
    }
    async alreadyData(list, chainId) {
        let handleList = [];
        let addresses = list.map(item => {
            item.price = Number(item.price);
            return `'${item.address}'`;
        });
        let contracts = await this.db.batchQuery("contract", 'address', addresses);
        list.forEach(data => {
            let find = contracts.find(items => {
                return items.address == data.address;
            });
            let pushItem = {
                address: data.address,
                chainId: chainId,
                currentHolders: data.holders,
                symbol: find.symbol,
                currentPrice: data.price,
                smartMoney: data.smart_money,
                topHolderPercent: 0,
                allBuy: data.buy_amount,
                allSell: data.sell_amount,
                allInflow: data.inflow,
                count: data.count,
                firstPrice: find ? find.first_price : 0
            };
            let topHolder = JSON.parse(data.top_holder);
            topHolder.forEach(items => {
                if (find) {
                    let pools = JSON.parse(find.pools);
                    let findPool = pools.find(pool => {
                        return pool.pool == items.address;
                    });
                    if (!findPool && items.address != "0x000000000000000000000000000000000000dEaD" && items.address != "0x0000000000000000000000000000000000000000" && items.address != pushItem.address) {
                        pushItem.topHolderPercent += Number(items.percent);
                    }
                }
                else {
                    pushItem.topHolderPercent += Number(items.percent);
                }
            });
            handleList.push(pushItem);
        });
        return handleList;
    }
    async currentData(chainId, times = 900) {
        let time = Math.round(new Date().getTime() / 1000) - times;
        let list = await this.db.select("analyzeData", [`create_time>=${time}`, `chain_id=${chainId}`]);
        let filterList = new Map();
        let addresses = list.map(item => {
            item.price = Number(item.price);
            if (filterList.get(item.address)) {
                let itemList = filterList.get(item.address);
                itemList.push(item);
                filterList.set(item.address, itemList);
            }
            else {
                filterList.set(item.address, [item]);
            }
            return `'${item.address}'`;
        });
        let contracts = await this.db.batchQuery("contract", 'address', addresses);
        let setList = [...filterList.values()];
        let countList = [];
        setList.forEach(data => {
            let find = contracts.find(items => {
                return items.address == data[0].address;
            });
            let sortCreate = lodash_1.default.orderBy(data, "create_time", 'desc');
            let sortHolders = lodash_1.default.orderBy(data, "holders", 'desc');
            let sortPrice = lodash_1.default.orderBy(data, "price", 'desc');
            let pushItem = {
                address: sortCreate[0].address,
                chainId: chainId,
                currentHolders: sortCreate[0].holders,
                symbol: find.symbol,
                currentPrice: sortCreate[0].price,
                hightPrice: sortPrice[0].price,
                hightHolders: sortHolders[0].holders,
                smartMoney: sortCreate[0].smart_money,
                topHolderPercent: 0,
                allBuy: 0,
                allSell: 0,
                allInflow: 0,
                count: 0,
                firstPrice: find ? find.first_price : 0
            };
            let topHolder = JSON.parse(sortCreate[0].top_holder);
            data.forEach(items => {
                pushItem.count += items.count;
                pushItem.allBuy += items.buy_amount;
                pushItem.allSell += items.sell_amount;
                pushItem.allInflow += items.inflow;
            });
            topHolder.forEach(items => {
                if (find) {
                    let pools = JSON.parse(find.pools);
                    let findPool = pools.find(pool => {
                        return pool.pool == items.address;
                    });
                    if (!findPool && items.address != "0x000000000000000000000000000000000000dEaD" && items.address != "0x0000000000000000000000000000000000000000" && items.address != pushItem.address) {
                        pushItem.topHolderPercent += Number(items.percent);
                    }
                }
                else {
                    pushItem.topHolderPercent += Number(items.percent);
                }
            });
            countList.push(pushItem);
        });
        return countList;
    }
    async analyzeData() {
        let listBlockNumber = 0;
        node_schedule_1.default.scheduleJob("0 */5 * * * *", async () => {
            for (let item of this.chainIds) {
                let blockNumber = await (0, index_1.getBlockNumber)(item);
                let where;
                if (listBlockNumber) {
                    where = [`block_number>${listBlockNumber}`, `chain_id=${item}`, `from_address!='0xae2Fc483527B8EF99EB5D9B44875F005ba1FaE13'`];
                }
                else {
                    let time = Math.round(new Date().getTime() / 1000) - 300;
                    where = [`create_time>=${time}`, `chain_id=${item}`, `from_address!='0xae2Fc483527B8EF99EB5D9B44875F005ba1FaE13'`];
                }
                let list = await this.db.select("event", where, ["block_number desc"]);
                if (list.length) {
                    listBlockNumber = list[0].block_number;
                }
                let formatAddresses = (0, index_1.handleSwapEventAddress)(list);
                formatAddresses = formatAddresses.splice(0, 30);
                let queryAddresses = formatAddresses.map(items => {
                    return `'${items.address}'`;
                });
                let contracts = await this.db.batchQuery("contract", "address", queryAddresses);
                let p = [];
                formatAddresses.forEach(items => {
                    p.push(this.handleAnalyzeData(items, blockNumber, list, contracts, item));
                });
                this.analyzeDataPromiseAll(p, item);
            }
        });
    }
    analyzeDataPromiseAll(p, chainId) {
        Promise.all(p).then(async (res) => {
            let effectiveList = [];
            let events = [];
            let contracts = [];
            res.forEach(item => {
                if (item) {
                    effectiveList.push(item);
                    events = events.concat(item.events);
                    contracts.push(item.contract);
                }
            });
            let addresses = effectiveList.map(item => {
                return item.address;
            });
            let result = (0, index_1.getOtherToken)(addresses, events, chainId);
            for (let item of result) {
                let contract = await this.db.find("contract", [`address='${item}'`]);
                if (!contract || !contract.address) {
                    contract = await this.insertContract(item, chainId);
                    if (contract && contract.address) {
                        contracts.push(contract);
                    }
                }
                else {
                    contracts.push(contract);
                }
            }
            contracts = await this.analyzeDataCheckPool(contracts, chainId);
            contracts.forEach(item => {
                if (item.LiquidityPools && item.LiquidityPools.length) {
                    item.price = item.LiquidityPools[0][item.symbol];
                }
            });
            let analyzeDataList = [];
            effectiveList.forEach(item => {
                let events = item.events;
                let buyList = [];
                let sellList = [];
                let buyAmount = 0;
                let sellAmount = 0;
                events.forEach(event => {
                    if (event.in_target == item.address) {
                        if (index_1.Config[chainId].stableContract.indexOf(event.out_target) == -1) {
                            let find = contracts.find(contract => {
                                return contract.address == event.out_target;
                            });
                            if (find) {
                                let amount = Number((Number(find.price) * (Number(event.out_amount) / (10 ** Number(find.decimals)))).toFixed(5));
                                sellAmount += Number.isNaN(amount) ? 0 : -amount;
                                sellList.push({ hash: event.hash, amount: Number((Number(find.price) * (Number(event.out_amount) / (10 ** Number(find.decimals)))).toFixed(5)) });
                            }
                        }
                        else {
                            if (index_1.Config[chainId].stableContract[0] == event.out_target) {
                                let amount = Number((Number(event.out_amount) / (10 ** 18)).toFixed(5));
                                sellAmount += Number.isNaN(amount) ? 0 : -amount;
                                sellList.push({ hash: event.hash, amount: Number((Number(event.out_amount) / (10 ** 18)).toFixed(5)) });
                            }
                            else {
                                let amount = Number((Number(event.out_amount) / (10 ** 6) / this.sdks.get(chainId).wethPrice).toFixed(5));
                                sellAmount += Number.isNaN(amount) ? 0 : -amount;
                                sellList.push({ hash: event.hash, amount: Number((Number(event.out_amount) / (10 ** 6) / this.sdks.get(chainId).wethPrice).toFixed(5)) });
                            }
                        }
                    }
                    else if (event.out_target == item.address) {
                        if (index_1.Config[chainId].stableContract.indexOf(event.in_target) == -1) {
                            let find = contracts.find(contract => {
                                return contract.address == event.in_target;
                            });
                            if (find) {
                                let amount = Number((Number(find.price) * (Number(event.in_amount) / (10 ** Number(find.decimals)))).toFixed(5));
                                buyAmount += Number.isNaN(amount) ? 0 : amount;
                                buyList.push({ hash: event.hash, amount: Number((Number(find.price) * (Number(event.in_amount) / (10 ** Number(find.decimals)))).toFixed(5)) });
                            }
                        }
                        else {
                            if (index_1.Config[chainId].stableContract[0] == event.in_target) {
                                let amount = Number((Number(event.in_amount) / (10 ** 18)).toFixed(5));
                                buyAmount += Number.isNaN(amount) ? 0 : amount;
                                buyList.push({ hash: event.hash, amount: Number((Number(event.in_amount) / (10 ** 18)).toFixed(5)) });
                            }
                            else {
                                let amount = Number((Number(event.in_amount) / (10 ** 6) / this.sdks.get(chainId).wethPrice).toFixed(5));
                                buyAmount += Number.isNaN(amount) ? 0 : amount;
                                buyList.push({ hash: event.hash, amount: Number((Number(event.in_amount) / (10 ** 6) / this.sdks.get(chainId).wethPrice).toFixed(5)) });
                            }
                        }
                    }
                });
                item.price = item.contract.price;
                item.buy_list = JSON.stringify(buyList);
                item.sell_list = JSON.stringify(sellList);
                item.buy_amount = Math.round(buyAmount * 10000) / 10000;
                item.sell_amount = Math.round(sellAmount * 10000) / 10000;
                item.inflow = Math.round((buyAmount + sellAmount) * 10000) / 10000;
                delete item.contract;
                delete item.events;
                if (item.price) {
                    analyzeDataList.push(item);
                }
            });
            if (analyzeDataList.length) {
                analyzeDataList = lodash_1.default.orderBy(analyzeDataList, "count", "desc");
                let topAnalyzeDataList = analyzeDataList.slice(0, 5);
                await this.fiveMinute(topAnalyzeDataList, chainId);
                this.db.insertList("analyzeData", analyzeDataList);
            }
        });
    }
    async checkSmartMoney(holders, chainId) {
        let allSmartMoney = await this.db.select("smartMoneyAddress", [`chain_id=${chainId}`]);
        let allCount = 0;
        holders.forEach(item => {
            let find = allSmartMoney.find(items => {
                return items.address == item.address;
            });
            if (find) {
                allCount += find.count;
            }
        });
        return allCount;
    }
    async handleAnalyzeData(item, blockNumber, swapEvents, contracts, chainId) {
        return new Promise(async (resolve) => {
            let contract = contracts.find(items => {
                return items.address == item.address;
            });
            if (!contract || !contract.address) {
                contract = await this.insertContract(item.address, chainId);
                if (contract && contract.address && contract.block_number > Number(blockNumber) - 50000) {
                    let holders = await (0, index_1.getAllHolder)(contract, chainId);
                    let events = swapEvents.filter(swapEvent => {
                        return swapEvent.in_target == contract.address || swapEvent.out_target == contract.address;
                    });
                    let insertItem = {
                        address: contract.address,
                        chain_id: chainId,
                        holders: holders.length,
                        top_holder: JSON.stringify(holders.slice(0, 20)),
                        count: item.count,
                        contract: contract,
                        smart_money: await this.checkSmartMoney(holders, chainId),
                        events,
                        create_time: Math.round(new Date().getTime() / 1000)
                    };
                    resolve(insertItem);
                    return;
                }
            }
            else if (contract && contract.address && contract.block_number > Number(blockNumber) - 50000) {
                let holders = await (0, index_1.getAllHolder)(contract, chainId);
                let events = swapEvents.filter(swapEvent => {
                    return swapEvent.in_target == contract.address || swapEvent.out_target == contract.address;
                });
                let insertItem = {
                    address: contract.address,
                    chain_id: chainId,
                    holders: holders.length,
                    top_holder: JSON.stringify(holders.slice(0, 20)),
                    smart_money: await this.checkSmartMoney(holders, chainId),
                    count: item.count,
                    events,
                    contract: contract,
                    create_time: Math.round(new Date().getTime() / 1000)
                };
                resolve(insertItem);
                return;
            }
            resolve(null);
        });
    }
    async checkFirstPrice(chainId) {
        if (!this.isCheckingPrice) {
            this.isCheckingPrice = true;
            let contracts = await this.db.select("contract", [`chain_id=${chainId}`, 'is_add_liquidity=1', 'is_check_price=0']);
            let pools = [];
            contracts.forEach(item => {
                pools = pools.concat(JSON.parse(item.pools));
            });
            let handlePools = await (0, index_1.batchAllPool)(pools, chainId);
            let { hasLiquidityPools } = (0, index_1.formatPool)(contracts, handlePools);
            await (0, index_1.setToken)(contracts, hasLiquidityPools, chainId);
            let updateList = [];
            for (let item of contracts) {
                if (item.LiquidityPools) {
                    let firstPrice = '0';
                    let firstPoolBalance = '0';
                    let blockNumber = 0;
                    try {
                        let result = await (0, index_1.getFirstPrice)(item);
                        firstPrice = result.price;
                        firstPoolBalance = result.poolBalance;
                        blockNumber = result.firstBlockNumber;
                    }
                    catch (error) {
                    }
                    let updateItem = {
                        address: item.address,
                        liquidity_pools: JSON.stringify(item.LiquidityPools),
                        is_add_liquidity: 1,
                        is_check_price: 1,
                        first_price: firstPrice,
                        first_pool_balance: firstPoolBalance,
                        block_number: item.block_number > 0 ? item.block_number : blockNumber
                    };
                    updateList.push(updateItem);
                }
            }
            if (updateList.length) {
                this.db.updateList("contract", updateList);
            }
            this.isCheckingPrice = false;
        }
    }
    async analyzeDataCheckPool(contracts, chainId) {
        return new Promise(async (resolve) => {
            let pools = [];
            contracts.forEach(item => {
                pools = pools.concat(JSON.parse(item.pools));
            });
            let handlePools = await (0, index_1.batchAllPool)(pools, chainId);
            let { hasLiquidityPools } = (0, index_1.formatPool)(contracts, handlePools);
            await (0, index_1.setToken)(contracts, hasLiquidityPools, chainId);
            resolve(contracts);
        });
    }
    //查看是否加入池子
    async checkPool(chainId) {
        if (!this.isCheckingPool) {
            this.isCheckingPool = true;
            let time = Math.round(new Date().getTime() / 1000) - 86400 * 7;
            let contracts = await this.db.select("contract", [`chain_id=${chainId}`, `create_time>=${time}`, 'is_add_liquidity=0']);
            let pools = [];
            contracts.forEach(item => {
                pools = pools.concat(JSON.parse(item.pools));
            });
            let handlePools = await (0, index_1.batchAllPool)(pools, chainId);
            let { hasLiquidityPools } = (0, index_1.formatPool)(contracts, handlePools);
            await (0, index_1.setToken)(contracts, hasLiquidityPools, chainId);
            let updateList = [];
            for (let item of contracts) {
                if (item.LiquidityPools) {
                    let firstPrice = '0';
                    let firstPoolBalance = '0';
                    try {
                        let result = await (0, index_1.getFirstPrice)(item);
                        firstPrice = result.price;
                        firstPoolBalance = result.poolBalance;
                    }
                    catch (error) {
                    }
                    let updateItem = {
                        address: item.address,
                        liquidity_pools: JSON.stringify(item.LiquidityPools),
                        is_add_liquidity: 1,
                        is_check_price: 1,
                        first_price: firstPrice,
                        first_pool_balance: firstPoolBalance
                    };
                    let updatedItem = Object.assign(item, updateItem);
                    if (this.chatId) {
                        (0, templates_1.createContractTemplate)(this.bot, this.currentGasPrices.get(chainId), this.sdks.get(chainId).wethPrice, this.chatId, updatedItem);
                    }
                    updateList.push(updateItem);
                }
            }
            if (updateList.length) {
                this.db.updateList("contract", updateList);
            }
            this.isCheckingPool = false;
        }
    }
    //插入新建erc20合约
    handleEventCallBack(res) {
        if (res.createEvents.length) {
            let createEvents = res.createEvents;
            createEvents.forEach(item => {
                item.block_number = res.blockNumber;
            });
            this.db.insertList("contract", createEvents);
        }
    }
    //监听指令
    listenCommand() {
        this.bot.onText(/\/menu/, async (msg, match) => {
            if (msg.from.id == msg.chat.id) {
                (0, templates_1.homeTemplate)(this.bot, msg);
            }
        });
        this.bot.onText(/\/bindChannel/, async (msg, match) => {
            if (msg.from.username == this.params.adminName) {
                this.chatId = msg.chat.id;
                this.bot.sendMessage(msg.chat.id, `绑定推送频道成功`);
            }
            else {
                this.bot.sendMessage(msg.chat.id, `你不是管理员无法设置`);
            }
        });
        this.bot.onText(/\/bindTopChannel/, async (msg, match) => {
            if (msg.from.username == this.params.adminName) {
                this.topChartId = msg.chat.id;
                this.bot.sendMessage(msg.chat.id, `绑定推送频道成功`);
            }
            else {
                this.bot.sendMessage(msg.chat.id, `你不是管理员无法设置`);
            }
        });
    }
    async formartWatchLog(swapEvent, watchList) {
        const web3 = new web3_1.default();
        let watchLogs = [];
        watchList.forEach(item => {
            let type = index_1.Config[swapEvent.chain_id].stableContract.indexOf(swapEvent.in_target) == -1 ? 2 : 1;
            let watchLog = {
                chain_id: swapEvent.chain_id,
                address: item.address,
                name: item.name,
                in_target: swapEvent.in_target,
                out_target: swapEvent.out_target,
                telegram_id: item.telegram_id,
                telegram_name: item.telegram_name,
                hash: swapEvent.hash,
                price: "",
                type,
                swap_fee: type == 1 ? swapEvent.out_swap_fee : swapEvent.in_swap_fee,
                amount_in: swapEvent.in_amount,
                amount_out: swapEvent.out_amount,
                cost: Number(swapEvent.effective_gas_price) * Number(swapEvent.gas_used),
                create_time: Math.round(new Date().getTime() / 1000),
            };
            watchLogs.push(watchLog);
        });
        let result = await (0, index_1.handleWatchTransactions)(watchLogs, this.sdks.get(swapEvent.chain_id).wethPrice, swapEvent.chain_id);
        for (let item of result) {
            let insertResult = await this.db.insert("watchLog", item);
            item.id = insertResult;
            if (await this.sendWatchLog(item)) {
                for (let watchItem of watchList) {
                    if (item.type == 1 && watchItem.address == item.address && watchItem.follow_private_key && watchItem.follow_buy == 1) {
                        this.handleFollowBuy(item, watchItem);
                    }
                    if (item.type == 2 && watchItem.follow_sell == 1) {
                        let account = web3.eth.accounts.privateKeyToAccount(watchItem.follow_private_key);
                        let find = await this.db.find("transferLog", [`is_sell=0`, `status=1`, `transfer_type=1`, `address='${account.address}'`, `target='${item.in_target}'`]);
                        if (find && watchItem.address == item.address) {
                            this.handleFollowSell(item, watchItem);
                        }
                    }
                }
            }
        }
    }
    //处理跟单
    async handleWatchAndFollow(res) {
        if (res.swapEvents.length) {
            this.db.insertList("event", res.swapEvents);
        }
        let time = (0, dayjs_1.default)(new Date().getTime()).format("MM-DD HH:mm:ss");
        console.log(`归属链：${templates_1.chainEnum[res.chainId]}，区块：${res.blockNumber}，订单：${res.transactions.length} 笔，网速 ${res.ms} ms，${time}`);
        let watchList = await this.db.select("watch", []);
        const web3 = new web3_1.default();
        res.swapEvents.forEach(event => {
            let filter = watchList.filter(item => {
                return web3.utils.toChecksumAddress(event.from_address) == item.address;
            });
            if (filter.length) {
                this.formartWatchLog(event, filter);
            }
        });
    }
    //发送监听指令
    async sendWatchLog(item) {
        let address = item.type == 1 ? item.out_target : item.in_target;
        let contract = await this.db.find("contract", [`address='${address}'`]);
        if (address == index_1.Config[item.chain_id].stableContract[0]) {
            return false;
        }
        if (!contract || !contract.address) {
            contract = await this.insertContract(address, item.chain_id);
        }
        if (contract && contract.address) {
            contract.fastGetContractPrice = await (0, index_1.fastGetContractPrice)(contract, contract.chain_id);
            let user = await this.getUserSetting(item.telegram_id);
            if (item.type == 1) {
                (0, templates_1.watchLogBuyTemplate)(this.bot, contract, item, user, this.currentGasPrices.get(contract.chain_id), this.sdks.get(contract.chain_id).wethPrice);
            }
            else {
                (0, templates_1.watchLogSellTemplate)(this.bot, contract, item, user, this.currentGasPrices.get(contract.chain_id), this.sdks.get(contract.chain_id).wethPrice);
            }
        }
        return true;
    }
    //监听消息
    onMessage() {
        const web3 = new web3_1.default();
        this.bot.on('message', async (msg) => {
            if (msg.from.id == msg.chat.id) {
                let user = await this.getUserSetting(msg.from.id);
                if (msg.reply_to_message && user && user.reaction_id == msg.reply_to_message.message_id) {
                    this.switchReplyMethod(msg, user.reaction_method);
                }
                //监听如果不是引用是否是搜索合约地址
                if (web3.utils.isAddress(msg.text) && !msg.reply_to_message) {
                    //先从库里查找，没有的话再从区块查找
                    this.sendContract(msg.text, msg);
                }
            }
        });
    }
    async sendContract(address, msg) {
        const web3 = new web3_1.default();
        //先从库里查找，没有的话再从区块查找
        let find = await this.db.find("contract", [`address='${web3.utils.toChecksumAddress(address)}'`]);
        if (find) {
            let contractPrice = await (0, index_1.fastGetContractPrice)(find, find.chain_id);
            find.fastGetContractPrice = contractPrice;
            //查找合约模板
            (0, templates_1.contractTemplate)(this.bot, msg, find, await this.getUserSetting(msg.from.id), this.currentGasPrices.get(find.chain_id), this.sdks.get(find.chain_id).wethPrice);
        }
        else {
            for (let item of this.chainIds) {
                let contract = await this.insertContract(address, item);
                if (contract) {
                    let contractPrice = await (0, index_1.fastGetContractPrice)(contract, item);
                    contract.fastGetContractPrice = contractPrice;
                    (0, templates_1.contractTemplate)(this.bot, msg, contract, await this.getUserSetting(msg.from.id), this.currentGasPrices.get(contract.chain_id), this.sdks.get(contract.chain_id).wethPrice);
                    break;
                }
            }
        }
    }
    //执行合约搜索插入
    async insertContract(address, chainId) {
        let contracts = await (0, index_1.addContract)([address], chainId);
        if (contracts[0]) {
            let contract = contracts[0];
            contract.is_add_liquidity = 1;
            contract.update_time = 0;
            contract.create_time = Math.round(new Date().getTime() / 1000);
            this.db.insert("contract", contract);
            return contract;
        }
        else {
            return null;
        }
    }
    //更新用户配置
    updateUserSetting(update) {
        if (update.query) {
            update.query = JSON.stringify(update.query);
        }
        this.db.update("setting", update);
    }
    //获取用户配置
    async getUserSetting(id) {
        let insert;
        let find = await this.db.find("setting", [`telegram_id=${id}`]);
        if (!find) {
            insert = {
                telegram_id: id,
                manual_gas_fee: 10,
                follow_gas_fee: 10,
                rush_gas_fee: 10,
                rush_time: 0,
                sell_percent: 100,
                follow_swap_fee: 5,
                manual_swap_fee: 5,
                reaction_id: 0,
                reaction_method: null,
                default_address: null,
                default_private_key: null,
                set_type: 0,
                log_id: 0,
                chain_id: 1,
                amount: 0.01,
                rush_amount: 0.01,
                follow_amount: 0.01,
                query: "",
                create_time: Math.round(new Date().getTime() / 1000),
            };
            await this.db.insert("setting", insert);
        }
        else {
            if (find.query) {
                find.query = JSON.parse(find.query);
            }
        }
        return find ? find : insert;
    }
    //监听bot按钮
    botQuery() {
        this.bot.on('callback_query', async (query) => {
            await this.getUserSetting(query.from.id);
            this.switchRouter(query);
        });
    }
    //监听引用指令
    switchReplyMethod(msg, method) {
        switch (method) {
            //导入钱包
            case "import_wallet":
                this.addWallet(msg);
                break;
            //删除钱包
            case "delete_wallet":
                this.deleteWallet(msg);
                break;
            //设置手动卖出比例
            case "set_sell_percent":
                this.setUserSetting(msg, "sell_percent");
                break;
            //设置手动买入金额
            case "set_buy_amount":
                this.setUserSetting(msg, "amount");
                break;
            //设置手动买入gas
            case "set_gas_fee":
                this.setUserSetting(msg, "manual_gas_fee");
                break;
            //设置手动滑点
            case "set_swap_fee":
                this.setUserSetting(msg, "manual_swap_fee");
                break;
            //设置跟单滑点
            case "set_follow_swap_fee":
                this.setFollowSetting(msg, "follow_swap_fee");
                break;
            //设置跟单金额
            case "set_follow_amount":
                this.setFollowSetting(msg, "follow_amount");
                break;
            //设置跟单gas
            case "set_follow_gas_fee":
                this.setFollowSetting(msg, "follow_gas_fee");
                break;
            //设置抢开盘gas
            case "set_task_gas_fee":
                this.setTaskSetting(msg, "gas_fee");
                break;
            //设置抢开盘金额
            case "set_task_buy_amount":
                this.setTaskSetting(msg, "amount");
                break;
            //设置抢开盘时间
            case "set_task_start_time":
                this.setTaskSetting(msg, "start_time");
                break;
            //设置prc
            case "change_prc":
                this.changeChainPrc(msg);
                break;
            case "smart_money":
                this.querySmarkMoney(msg);
                break;
            //添加监听
            case "add_watch":
                this.addWatch(msg);
                break;
            //备注监听地址
            case "bind_watch_name":
                this.markWatch(msg);
                break;
            //添加抢开盘
            case "add_rush":
                this.addRush(msg);
                break;
        }
    }
    //设置抢开盘钱包
    async setTaskWallet(msg, walletIndex, taskId) {
        let user = await this.getUserSetting(msg.from.id);
        let wallets = await this.db.select("wallet", [`telegram_id=${msg.from.id}`]);
        let task = await this.db.find("task", [`id=${taskId}`]);
        if (task) {
            task.private_key = wallets[walletIndex].private_key;
            task.address = wallets[walletIndex].address;
            await this.db.update("task", task);
            this.rushDetail(msg, task.id);
        }
        user.query = "";
        this.updateUserSetting(user);
    }
    //设置手动买入默认钱包
    async setDefaultWallet(msg, walletIndex, contractAddress) {
        let user = await this.getUserSetting(msg.from.id);
        let wallets = await this.db.select("wallet", [`telegram_id=${msg.from.id}`]);
        user.default_address = wallets[walletIndex].address;
        user.default_private_key = wallets[walletIndex].private_key;
        user.query = msg;
        let find = await this.db.find("contract", [`address='${contractAddress}'`]);
        if (find) {
            let contractPrice = await (0, index_1.fastGetContractPrice)(find, find.chain_id);
            find.fastGetContractPrice = contractPrice;
            //修改查询合约模板
            (0, templates_1.editorContractTemplate)(this.bot, find, user, this.currentGasPrices.get(find.chain_id), this.sdks.get(find.chain_id).wethPrice);
        }
        else {
            for (let item of this.chainIds) {
                let contract = await this.insertContract(msg.text, item);
                if (contract) {
                    let contractPrice = await (0, index_1.fastGetContractPrice)(contract, item);
                    contract.fastGetContractPrice = contractPrice;
                    (0, templates_1.editorContractTemplate)(this.bot, contract, user, this.currentGasPrices.get(find.chain_id), this.sdks.get(find.chain_id).wethPrice);
                    break;
                }
            }
        }
        let newUser = { ...user };
        newUser.query = "";
        this.updateUserSetting(newUser);
    }
    //设置跟单钱包
    async setFollowWallet(msg, walletIndex, watchId) {
        let wallets = await this.db.select("wallet", [`telegram_id=${msg.from.id}`]);
        let find = await this.db.find("watch", [`id=${watchId}`]);
        if (find && wallets.length) {
            find.follow_private_key = wallets[walletIndex].private_key;
            await this.db.update("watch", find);
            msg.data = `/handle_watch ${find.address}`;
            this.switchRouter(msg);
        }
    }
    //设置prc
    async changeChainPrc(msg) {
        let user = await this.getUserSetting(msg.from.id);
        this.sdks.get(user.chain_id).setPrc(msg.text);
        this.bot.deleteMessage(msg.chat.id, msg.message_id);
        this.bot.deleteMessage(msg.chat.id, user.reaction_id);
        user.query = "";
        user.reaction_id = 0;
        user.reaction_method = "";
        user.set_type = 0;
        user.log_id = 0;
        this.updateUserSetting(user);
        this.bot.sendMessage(msg.chat.id, "设置prc成功");
    }
    //设置跟单配置
    async setFollowSetting(msg, key) {
        let value = msg.text;
        let user = await this.getUserSetting(msg.from.id);
        if (typeof Number(value) != 'number') {
            this.bot.sendMessage(msg.chat.id, '输入错误');
            this.bot.deleteMessage(msg.chat.id, msg.message_id);
            this.bot.deleteMessage(msg.chat.id, user.reaction_id);
            user.query = "";
            user.reaction_id = 0;
            user.reaction_method = "";
            user.set_type = 0;
            user.log_id = 0;
            this.updateUserSetting(user);
            return;
        }
        let find = await this.db.find("watch", [`id=${user.log_id}`, `telegram_id=${msg.from.id}`]);
        if (find) {
            find[key] = value;
            await this.db.update("watch", find);
            user.query.data = `/handle_watch ${find.address}`;
            this.switchRouter(user.query);
        }
        let newUser = { ...user };
        newUser.query = "";
        newUser.reaction_id = 0;
        newUser.reaction_method = "";
        newUser.set_type = 0;
        newUser.log_id = 0;
        this.bot.deleteMessage(msg.chat.id, msg.message_id);
        this.bot.deleteMessage(msg.chat.id, user.reaction_id);
        this.updateUserSetting(newUser);
    }
    //设置跟单配置
    async setTaskSetting(msg, key) {
        let value = msg.text;
        let user = await this.getUserSetting(msg.from.id);
        if (key == "start_time") {
            let date = msg.text.split("T").join(" ");
            value = Math.round(new Date(date).getTime() / 1000) + '';
            if (Number.isNaN(Number(value))) {
                this.bot.sendMessage(msg.chat.id, '输入错误');
                this.bot.deleteMessage(msg.chat.id, msg.message_id);
                this.bot.deleteMessage(msg.chat.id, user.reaction_id);
                user.query = "";
                user.reaction_id = 0;
                user.reaction_method = "";
                user.set_type = 0;
                user.log_id = 0;
                this.updateUserSetting(user);
                return;
            }
        }
        if (typeof Number(value) != 'number') {
            this.bot.sendMessage(msg.chat.id, '输入错误');
            this.bot.deleteMessage(msg.chat.id, msg.message_id);
            this.bot.deleteMessage(msg.chat.id, user.reaction_id);
            user.query = "";
            user.reaction_id = 0;
            user.reaction_method = "";
            user.set_type = 0;
            user.log_id = 0;
            this.updateUserSetting(user);
            return;
        }
        let find = await this.db.find("task", [`id=${user.log_id}`, `telegram_id=${msg.from.id}`]);
        if (find) {
            find[key] = value;
            await this.db.update("task", find);
            this.rushDetail(user.query, find.id);
        }
        let newUser = { ...user };
        newUser.query = "";
        newUser.reaction_id = 0;
        newUser.reaction_method = "";
        newUser.set_type = 0;
        newUser.log_id = 0;
        this.bot.deleteMessage(msg.chat.id, msg.message_id);
        this.bot.deleteMessage(msg.chat.id, user.reaction_id);
        this.updateUserSetting(newUser);
    }
    //设置用户配置
    async setUserSetting(msg, key) {
        const web3 = new web3_1.default();
        let value = msg.text;
        let user = await this.getUserSetting(msg.from.id);
        if (typeof Number(value) != 'number') {
            this.bot.sendMessage(msg.chat.id, '输入错误');
            this.bot.deleteMessage(msg.chat.id, msg.message_id);
            this.bot.deleteMessage(msg.chat.id, user.reaction_id);
            user.query = "";
            user.reaction_id = 0;
            user.reaction_method = "";
            user.set_type = 0;
            user.log_id = 0;
            this.updateUserSetting(user);
            return;
        }
        user[key] = Number(value);
        let contractAddress = user.query.message.text.split("\n")[3];
        if (contractAddress) {
            //type == 1 查询合约模板上修改配置
            if (user.set_type == 1) {
                let find = await this.db.find("contract", [`address='${web3.utils.toChecksumAddress(contractAddress)}'`]);
                if (find) {
                    find.fastGetContractPrice = await (0, index_1.fastGetContractPrice)(find, find.chain_id);
                    await (0, templates_1.editorContractTemplate)(this.bot, find, user, this.currentGasPrices.get(find.chain_id), this.sdks.get(find.chain_id).wethPrice);
                    this.bot.deleteMessage(msg.chat.id, msg.message_id);
                    this.bot.deleteMessage(msg.chat.id, user.reaction_id);
                }
                else {
                    for (let item of this.chainIds) {
                        let contract = await this.insertContract(msg.text, item);
                        if (contract) {
                            contract.fastGetContractPrice = await (0, index_1.fastGetContractPrice)(contract, contract.chain_id);
                            await (0, templates_1.editorContractTemplate)(this.bot, contract, user, this.currentGasPrices.get(find.chain_id), this.sdks.get(find.chain_id).wethPrice);
                            this.bot.deleteMessage(msg.chat.id, msg.message_id);
                            this.bot.deleteMessage(msg.chat.id, user.reaction_id);
                            break;
                        }
                    }
                }
                //type == 2 买入订单模板上修改配置
            }
            else if (user.set_type == 2) {
                let find = await this.db.find("contract", [`address='${web3.utils.toChecksumAddress(contractAddress)}'`]);
                let transferLog = await this.db.find("transferLog", [`id=${user.log_id}`]);
                find.fastGetContractPrice = await (0, index_1.fastGetContractPrice)(find, find.chain_id);
                await (0, templates_1.editorBuySuccessTemplate)(this.bot, find, user, this.currentGasPrices.get(find.chain_id), this.sdks.get(find.chain_id).wethPrice, transferLog);
                this.bot.deleteMessage(msg.chat.id, msg.message_id);
                this.bot.deleteMessage(msg.chat.id, user.reaction_id);
                //type == 3 卖出订单模板上设置配置
            }
            else if (user.set_type == 3) {
                let find = await this.db.find("contract", [`address='${web3.utils.toChecksumAddress(contractAddress)}'`]);
                let transferLog = await this.db.find("transferLog", [`id=${user.log_id}`]);
                find.fastGetContractPrice = await (0, index_1.fastGetContractPrice)(find, find.chain_id);
                await (0, templates_1.editorSellSuccessTemplate)(this.bot, find, user, this.currentGasPrices.get(find.chain_id), this.sdks.get(find.chain_id).wethPrice, transferLog);
                this.bot.deleteMessage(msg.chat.id, msg.message_id);
                this.bot.deleteMessage(msg.chat.id, user.reaction_id);
                //type == 4 监听订单模板上设置配置
            }
            else if (user.set_type == 4) {
                let find = await this.db.find("contract", [`address='${web3.utils.toChecksumAddress(contractAddress)}'`]);
                let watchLog = await this.db.find("watchLog", [`id=${user.log_id}`]);
                find.fastGetContractPrice = await (0, index_1.fastGetContractPrice)(find, find.chain_id);
                if (watchLog.type == 1) {
                    await (0, templates_1.editorWatchLogBuyTemplate)(this.bot, find, watchLog, user, this.currentGasPrices.get(find.chain_id), this.sdks.get(find.chain_id).wethPrice);
                }
                else if (watchLog.type == 2) {
                    await (0, templates_1.editorWatchLogSellTemplate)(this.bot, find, watchLog, user, this.currentGasPrices.get(find.chain_id), this.sdks.get(find.chain_id).wethPrice);
                }
                this.bot.deleteMessage(msg.chat.id, msg.message_id);
                this.bot.deleteMessage(msg.chat.id, user.reaction_id);
            }
        }
        let newUser = { ...user };
        newUser.query = "";
        newUser.reaction_id = 0;
        newUser.reaction_method = "";
        newUser.set_type = 0;
        newUser.log_id = 0;
        this.updateUserSetting(newUser);
    }
    //删除绑定钱包
    async deleteWallet(msg) {
        let address = msg.text;
        const web3 = new web3_1.default();
        if (web3.utils.isAddress(address)) {
            let wallets = await this.db.select('wallet', [`telegram_id=${msg.from.id}`]);
            if (wallets.length) {
                let find = wallets.find(item => {
                    return item.address == web3.utils.toChecksumAddress(address);
                });
                if (find) {
                    let result = await this.db.delete('wallet', [`id=${find.id}`]);
                    if (result) {
                        let user = await this.getUserSetting(msg.from.id);
                        this.bot.deleteMessage(msg.chat.id, msg.message_id);
                        this.bot.deleteMessage(msg.chat.id, user.reaction_id);
                        let query = user.query;
                        query.data = "wallet";
                        this.switchRouter(query);
                        user.query = "";
                        user.reaction_id = 0;
                        user.reaction_method = "";
                        user.set_type = 0;
                        user.log_id = 0;
                        this.updateUserSetting(user);
                        this.bot.sendMessage(msg.chat.id, "删除绑定钱包地址成功");
                    }
                    else {
                        this.bot.sendMessage(msg.chat.id, "删除绑定钱包地址失败");
                    }
                }
                else {
                    this.bot.sendMessage(msg.chat.id, "该钱包地址未绑定");
                }
            }
            else {
                this.bot.sendMessage(msg.chat.id, "还未绑定任何钱包");
            }
        }
        else {
            this.bot.sendMessage(msg.chat.id, "输入钱包地址错误");
        }
    }
    //生成钱包
    async generateWallet(query) {
        const web3 = new web3_1.default();
        let wallet = await this.db.select("wallet", [`telegram_id=${query.from.id}`]);
        let account = web3.eth.accounts.create();
        if (wallet.length + 1 > 5) {
            this.bot.sendMessage(query.message.chat.id, `超过绑定上限`);
        }
        else {
            let insertItem = {
                address: account.address,
                private_key: account.privateKey,
                telegram_id: query.from.id,
                telegram_name: query.from.first_name + query.from.last_name,
                create_time: Math.round(new Date().getTime() / 1000),
            };
            let result = await await this.db.insert("wallet", insertItem);
            if (result) {
                let str = `<b>❗️❗️❗️ 请勿向别人透露您的私钥</b>\n\n<em>地址：${account.address}</em>\n\n<em>私钥：${account.privateKey}</em>`;
                this.bot.sendMessage(query.message.chat.id, str, {
                    "parse_mode": "HTML"
                });
                query.data = "wallet";
                this.switchRouter(query);
            }
            else {
                this.bot.sendMessage(query.message.chat.id, `绑定账号失败`);
            }
        }
    }
    //添加抢开盘
    async addRush(msg) {
        let address = msg.text;
        const web3 = new web3_1.default();
        if (!web3.utils.isAddress(address)) {
            let user = await this.getUserSetting(msg.from.id);
            this.bot.deleteMessage(msg.chat.id, msg.message_id);
            this.bot.deleteMessage(msg.chat.id, user.reaction_id);
            let query = user.query;
            query.data = "rush";
            user.query = "";
            user.reaction_id = 0;
            user.reaction_method = "";
            user.set_type = 0;
            user.log_id = 0;
            this.updateUserSetting(user);
            this.bot.sendMessage(msg.chat.id, `合约地址错误`);
            return;
        }
        //先从库里查找，没有的话再从区块查找
        let find = await this.db.find("contract", [`address='${web3.utils.toChecksumAddress(address)}'`]);
        if (find) {
            let contractPrice = await (0, index_1.fastGetContractPrice)(find, find.chain_id);
            find.fastGetContractPrice = contractPrice;
            let startTime = Math.round(new Date().getTime() / 1000) - 1800;
            let findTask = await this.db.find("task", [`target='${address}'`, 'type=5', `telegram_id=${msg.from.id}`, `start_time>=${startTime}`]);
            if (findTask) {
                let user = await this.getUserSetting(msg.from.id);
                this.bot.deleteMessage(msg.chat.id, msg.message_id);
                this.bot.deleteMessage(msg.chat.id, user.reaction_id);
                let query = user.query;
                query.data = "rush";
                user.query = "";
                user.reaction_id = 0;
                user.reaction_method = "";
                user.set_type = 0;
                user.log_id = 0;
                this.updateUserSetting(user);
                this.bot.sendMessage(msg.chat.id, `已存在该合约的抢开盘任务`);
                return;
            }
            let insert = {
                chain_id: find.chain_id,
                telegram_id: msg.from.id,
                telegram_name: msg.from.first_name + msg.from.last_name,
                target: address,
                amount: 0.01,
                type: 5,
                gas_fee: 10,
                start_time: Math.round(new Date().getTime() / 1000) + 900
            };
            let result = await this.db.insert("task", insert);
            Object.assign(insert, { id: result });
            let user = await this.getUserSetting(msg.from.id);
            this.bot.deleteMessage(msg.chat.id, msg.message_id);
            this.bot.deleteMessage(msg.chat.id, user.reaction_id);
            let query = user.query;
            query.data = "rush";
            user.query = "";
            user.reaction_id = 0;
            user.reaction_method = "";
            user.set_type = 0;
            user.log_id = 0;
            this.updateUserSetting(user);
            //查找合约模板
            (0, templates_1.rushDetailTemplate)(this.bot, msg.from.id, find, insert, this.currentGasPrices.get(find.chain_id), this.sdks.get(find.chain_id).wethPrice);
        }
        else {
            for (let item of this.chainIds) {
                let contract = await this.insertContract(address, item);
                if (contract) {
                    let contractPrice = await (0, index_1.fastGetContractPrice)(contract, item);
                    contract.fastGetContractPrice = contractPrice;
                    (0, templates_1.contractTemplate)(this.bot, msg, contract, await this.getUserSetting(msg.from.id), this.currentGasPrices.get(contract.chain_id), this.sdks.get(contract.chain_id).wethPrice);
                    break;
                }
            }
        }
    }
    //添加钱包
    async addWallet(msg) {
        let privateKey = msg.text;
        const web3 = new web3_1.default();
        try {
            let wallet = await this.db.select("wallet", [`telegram_id=${msg.from.id}`]);
            let account = web3.eth.accounts.privateKeyToAccount(privateKey);
            if (wallet.length + 1 > 5) {
                this.bot.sendMessage(msg.chat.id, `超过绑定上限`);
            }
            else {
                let find = await this.db.find("wallet", [`telegram_id=${msg.from.id}`, `address='${account.address}'`]);
                if (find) {
                    this.bot.sendMessage(msg.chat.id, `重复绑定账号`);
                }
                else {
                    let insertItem = {
                        address: account.address,
                        private_key: privateKey,
                        telegram_id: msg.from.id,
                        telegram_name: msg.from.first_name + msg.from.last_name,
                        create_time: Math.round(new Date().getTime() / 1000),
                    };
                    let result = await await this.db.insert("wallet", insertItem);
                    if (result) {
                        let user = await this.getUserSetting(msg.from.id);
                        this.bot.deleteMessage(msg.chat.id, msg.message_id);
                        this.bot.deleteMessage(msg.chat.id, user.reaction_id);
                        let query = user.query;
                        query.data = "wallet";
                        this.switchRouter(query);
                        user.query = "";
                        user.reaction_id = 0;
                        user.reaction_method = "";
                        user.set_type = 0;
                        user.log_id = 0;
                        this.updateUserSetting(user);
                        this.bot.sendMessage(msg.chat.id, `绑定账号成功`);
                    }
                    else {
                        this.bot.sendMessage(msg.chat.id, `绑定账号失败`);
                    }
                }
            }
        }
        catch (error) {
            this.bot.sendMessage(msg.chat.id, `私钥错误`);
        }
    }
    //添加监听地址
    async addWatch(msg) {
        let user = await this.getUserSetting(msg.from.id);
        let addressArr = msg.text.split(",");
        const web3 = new web3_1.default();
        let hasErrAddress = false;
        addressArr.forEach(item => {
            hasErrAddress = web3.utils.isAddress(item) ? false : true;
        });
        if (hasErrAddress) {
            this.bot.sendMessage(msg.chat.id, "有错误地址");
        }
        else {
            let watchList = await this.db.select("watch", [`telegram_id=${msg.from.id}`]);
            if (watchList.length + addressArr.length > 20) {
                this.bot.sendMessage(msg.chat.id, "超出绑定限制");
            }
            else {
                let insertList = [];
                addressArr.forEach(item => {
                    let find = watchList.find(items => {
                        return items.address == item;
                    });
                    if (!find) {
                        insertList.push({
                            address: web3.utils.toChecksumAddress(item),
                            follow_buy: 0,
                            follow_sell: 0,
                            follow_amount: 0.01,
                            follow_gas_fee: 5,
                            follow_swap_fee: 5,
                            telegram_id: msg.from.id,
                            telegram_name: msg.from.first_name + msg.from.last_name,
                            create_time: Math.round(new Date().getTime() / 1000),
                        });
                    }
                });
                if (insertList.length) {
                    await this.db.insertList("watch", insertList);
                }
                user.query.data = "watch";
                this.switchRouter(user.query);
            }
        }
        this.bot.deleteMessage(msg.chat.id, msg.message_id);
        this.bot.deleteMessage(msg.chat.id, user.reaction_id);
        user.query = "";
        user.reaction_id = 0;
        user.reaction_method = "";
        user.set_type = 0;
        user.log_id = 0;
        this.updateUserSetting(user);
    }
    //备注监听地址
    async markWatch(msg) {
        let user = await this.getUserSetting(msg.from.id);
        const web3 = new web3_1.default();
        let address = msg.reply_to_message.text.split("\n")[1];
        let find = await this.db.find("watch", [`address='${web3.utils.toChecksumAddress(address)}'`, `telegram_id=${msg.from.id}`]);
        if (find) {
            find.name = msg.text;
            await this.db.update("watch", find);
            user.query.data = `/handle_watch ${address}`;
            this.switchRouter(user.query);
        }
        else {
            this.bot.sendMessage(msg.chat.id, "未找到该地址");
        }
        this.bot.deleteMessage(msg.chat.id, msg.message_id);
        this.bot.deleteMessage(msg.chat.id, user.reaction_id);
        user.query = "";
        user.reaction_id = 0;
        user.reaction_method = "";
        user.set_type = 0;
        user.log_id = 0;
        this.updateUserSetting(user);
    }
    async rushDetail(query, id) {
        let task = await this.db.find("task", [`id=${id}`]);
        let contract = await this.db.find("contract", [`address='${task.target}'`]);
        if (contract) {
            let contractPrice = await (0, index_1.fastGetContractPrice)(contract, contract.chain_id);
            contract.fastGetContractPrice = contractPrice;
            (0, templates_1.editorRushDetailTemplate)(this.bot, query, contract, task, this.currentGasPrices.get(contract.chain_id), this.sdks.get(contract.chain_id).wethPrice);
        }
        else {
            this.bot.sendMessage(query.message.chat.id, "未找到合约信息");
        }
    }
    async deleteWatch(query, address) {
        const web3 = new web3_1.default();
        let find = await this.db.find("watch", [`address='${web3.utils.toChecksumAddress(address)}'`, `telegram_id=${query.from.id}`]);
        if (find) {
            await this.db.delete("watch", [`id=${find.id}`]);
            query.data = "watch";
            this.switchRouter(query);
        }
        else {
            this.bot.sendMessage(query.message.chat.id, "未找到该地址");
        }
    }
    //匹配路由
    async switchRouter(query) {
        switch (query.data) {
            //首页路由
            case "home":
                (0, templates_1.goBackHomeTemplate)(this.bot, query.message);
                break;
            case "rush":
                (0, templates_1.rushTemplate)(this.bot, query.message, this.db);
                break;
            //钱包路由
            case "wallet":
                (0, templates_1.walletTemplate)(this.bot, query, this.db);
                break;
            //添加钱包路由
            case "add_wallet":
                (0, templates_1.addWalletTemplate)(this.bot, query);
                break;
            //生成钱包
            case "generate_wallet":
                this.generateWallet(query);
                break;
            //选择钱包
            case "picker_wallet":
                (0, templates_1.pickerWalletTempalte)(this.bot, query, this.db);
                break;
            //监听地址路由
            case "watch":
                (0, templates_1.watchTemplate)(this.bot, query, this.db);
                break;
            //删除钱包
            case "delete_wallet":
                this.bot.sendMessage(query.message.chat.id, `请输入钱包地址删除`, {
                    "reply_markup": {
                        "force_reply": true
                    }
                }).then(async (res) => {
                    let user = await this.getUserSetting(query.from.id);
                    user.reaction_id = res.message_id;
                    user.reaction_method = "delete_wallet";
                    user.query = query;
                    this.updateUserSetting(user);
                });
                break;
            //设置prc
            case "smart_money":
                if (query.from.username == this.params.adminName) {
                    this.bot.sendMessage(query.message.chat.id, `请输入合约地址查找聪明钱`, {
                        "reply_markup": {
                            "force_reply": true
                        }
                    }).then(async (res) => {
                        let user = await this.getUserSetting(query.from.id);
                        user.reaction_id = res.message_id;
                        user.reaction_method = "smart_money";
                        user.query = query;
                        this.updateUserSetting(user);
                    });
                    break;
                }
                else {
                    this.bot.sendMessage(query.message.chat.id, `你不是管理员无法设置`);
                }
                break;
            case "set_prc":
                if (query.from.username == this.params.adminName) {
                    (0, templates_1.networkTemplate)(this.bot, query, this.chainIds);
                }
                else {
                    this.bot.sendMessage(query.message.chat.id, `你不是管理员无法设置`);
                }
                break;
            case "Ethereum":
                this.bot.sendMessage(query.message.chat.id, `请输入Ethereum prc链接更换`, {
                    "reply_markup": {
                        "force_reply": true
                    }
                }).then(async (res) => {
                    let user = await this.getUserSetting(query.from.id);
                    user.reaction_id = res.message_id;
                    user.reaction_method = "change_prc";
                    user.chain_id = 1;
                    user.query = query;
                    this.updateUserSetting(user);
                });
                break;
            case "Arbitrum":
                this.bot.sendMessage(query.message.chat.id, `请输入Arbitrum prc链接更换`, {
                    "reply_markup": {
                        "force_reply": true
                    }
                }).then(async (res) => {
                    let user = await this.getUserSetting(query.from.id);
                    user.reaction_id = res.message_id;
                    user.reaction_method = "change_prc";
                    user.chain_id = 42161;
                    user.query = query;
                    this.updateUserSetting(user);
                });
                break;
            case "Goerli":
                this.bot.sendMessage(query.message.chat.id, `请输入Goerli prc链接更换`, {
                    "reply_markup": {
                        "force_reply": true
                    }
                }).then(async (res) => {
                    let user = await this.getUserSetting(query.from.id);
                    user.reaction_id = res.message_id;
                    user.reaction_method = "change_prc";
                    user.chain_id = 5;
                    user.query = query;
                    this.updateUserSetting(user);
                });
                break;
            //导入钱包
            case "import_wallet":
                this.bot.sendMessage(query.message.chat.id, `请输入私钥绑定`, {
                    "reply_markup": {
                        "force_reply": true
                    }
                }).then(async (res) => {
                    let user = await this.getUserSetting(query.from.id);
                    user.reaction_id = res.message_id;
                    user.reaction_method = "import_wallet";
                    user.query = query;
                    this.updateUserSetting(user);
                });
                break;
            //添加开盘冲
            case "add_rush":
                this.bot.sendMessage(query.message.chat.id, `请输入合约地址`, {
                    "reply_markup": {
                        "force_reply": true
                    }
                }).then(async (res) => {
                    let user = await this.getUserSetting(query.from.id);
                    user.reaction_id = res.message_id;
                    user.reaction_method = "add_rush";
                    user.query = query;
                    this.updateUserSetting(user);
                });
                break;
            //添加地址监听
            case "add_watch":
                this.bot.sendMessage(query.message.chat.id, `请输入需要监听的地址，如多个请用,隔开例如0x,0x`, {
                    "reply_markup": {
                        "force_reply": true
                    }
                }).then(async (res) => {
                    let user = await this.getUserSetting(query.from.id);
                    user.reaction_id = res.message_id;
                    user.reaction_method = "add_watch";
                    user.query = query;
                    this.updateUserSetting(user);
                });
                break;
            //返回首页
            case "go_home":
                this.clearHistory(query);
                break;
        }
        let pickerFollowWallet = query.data.match(new RegExp(/\/picker_follow_wallet (.+)/));
        if (pickerFollowWallet) {
            (0, templates_1.pickerFollowWalletTempalte)(this.bot, query, this.db, Number(pickerFollowWallet[1]));
        }
        let pickerTaskWallet = query.data.match(new RegExp(/\/picker_task_wallet (.+)/));
        if (pickerTaskWallet) {
            let task = await this.db.find("task", [`id=${Number(pickerTaskWallet[1])}`]);
            if (task) {
                (0, templates_1.pickerTaskWalletTempalte)(this.bot, query, task, this.db);
            }
            else {
                this.bot.sendMessage(query.message.chat.id, `查询任务失败`);
                return;
            }
        }
        //设置跟买状态 
        let followBuyMatch = query.data.match(new RegExp(/\/set_follow_buy (.+) (.+)/));
        if (followBuyMatch) {
            let logId = Number(followBuyMatch[2]);
            let find = await this.db.find("watch", [`id=${logId}`, `telegram_id=${query.from.id}`]);
            if (find) {
                if (!find.follow_private_key) {
                    this.bot.sendMessage(query.message.chat.id, `请先选择钱包`);
                    return;
                }
                find.follow_buy = find.follow_buy == 0 ? 1 : 0;
                await this.db.update("watch", find);
                query.data = `/handle_watch ${find.address}`;
                this.switchRouter(query);
            }
            return;
        }
        //设置跟卖状态 
        let followSellMatch = query.data.match(new RegExp(/\/set_follow_sell (.+) (.+)/));
        if (followSellMatch) {
            let logId = Number(followSellMatch[2]);
            let find = await this.db.find("watch", [`id=${logId}`, `telegram_id=${query.from.id}`]);
            if (find) {
                if (!find.follow_private_key) {
                    this.bot.sendMessage(query.message.chat.id, `请先选择钱包`);
                    return;
                }
                find.follow_sell = find.follow_sell == 0 ? 1 : 0;
                await this.db.update("watch", find);
                query.data = `/handle_watch ${find.address}`;
                this.switchRouter(query);
            }
            return;
        }
        //设置跟单gas
        let followGasMatch = query.data.match(new RegExp(/\/set_follow_gas_fee (.+) (.+)/));
        if (followGasMatch) {
            let type = Number(followGasMatch[1]);
            let logId = Number(followGasMatch[2]);
            this.bot.sendMessage(query.message.chat.id, `请输入gas小费`, {
                "reply_markup": {
                    "force_reply": true
                }
            }).then(async (res) => {
                let user = await this.getUserSetting(query.from.id);
                user.set_type = type;
                user.log_id = logId;
                user.reaction_id = res.message_id;
                user.reaction_method = "set_follow_gas_fee";
                user.query = query;
                this.updateUserSetting(user);
            });
            return;
        }
        //设置跟单滑点
        let followSwapFeeMatch = query.data.match(new RegExp(/\/set_follow_swap_fee (.+) (.+)/));
        if (followSwapFeeMatch) {
            let type = Number(followSwapFeeMatch[1]);
            let logId = Number(followSwapFeeMatch[2]);
            this.bot.sendMessage(query.message.chat.id, `请输入滑点`, {
                "reply_markup": {
                    "force_reply": true
                }
            }).then(async (res) => {
                let user = await this.getUserSetting(query.from.id);
                user.set_type = type;
                user.log_id = logId;
                user.reaction_id = res.message_id;
                user.reaction_method = "set_follow_swap_fee";
                user.query = query;
                this.updateUserSetting(user);
            });
            return;
        }
        //设置跟单买入金额
        let followBuyAmountMatch = query.data.match(new RegExp(/\/set_follow_amount (.+) (.+)/));
        if (followBuyAmountMatch) {
            let type = Number(followBuyAmountMatch[1]);
            let logId = Number(followBuyAmountMatch[2]);
            this.bot.sendMessage(query.message.chat.id, `请输入买入金额ETH为单位`, {
                "reply_markup": {
                    "force_reply": true
                }
            }).then(async (res) => {
                let user = await this.getUserSetting(query.from.id);
                user.set_type = type;
                user.log_id = logId;
                user.reaction_id = res.message_id;
                user.reaction_method = "set_follow_amount";
                user.query = query;
                this.updateUserSetting(user);
            });
            return;
        }
        //设置手动买入gas
        let gasMatch = query.data.match(new RegExp(/\/set_gas_fee (.+) (.+)/));
        if (gasMatch) {
            let type = Number(gasMatch[1]);
            let logId = Number(gasMatch[2]);
            this.bot.sendMessage(query.message.chat.id, `请输入gas小费`, {
                "reply_markup": {
                    "force_reply": true
                }
            }).then(async (res) => {
                let user = await this.getUserSetting(query.from.id);
                user.set_type = type;
                user.log_id = logId;
                user.reaction_id = res.message_id;
                user.reaction_method = "set_gas_fee";
                user.query = query;
                this.updateUserSetting(user);
            });
            return;
        }
        //设置手动买入滑点
        let swapFeeMatch = query.data.match(new RegExp(/\/set_swap_fee (.+) (.+)/));
        if (swapFeeMatch) {
            let type = Number(swapFeeMatch[1]);
            let logId = Number(swapFeeMatch[2]);
            this.bot.sendMessage(query.message.chat.id, `请输入滑点`, {
                "reply_markup": {
                    "force_reply": true
                }
            }).then(async (res) => {
                let user = await this.getUserSetting(query.from.id);
                user.set_type = type;
                user.log_id = logId;
                user.reaction_id = res.message_id;
                user.reaction_method = "set_swap_fee";
                user.query = query;
                this.updateUserSetting(user);
            });
            return;
        }
        //设置手动买入金额
        let buyAmountMatch = query.data.match(new RegExp(/\/set_buy_amount (.+) (.+)/));
        if (buyAmountMatch) {
            let type = Number(buyAmountMatch[1]);
            let logId = Number(buyAmountMatch[2]);
            this.bot.sendMessage(query.message.chat.id, `请输入买入金额ETH为单位`, {
                "reply_markup": {
                    "force_reply": true
                }
            }).then(async (res) => {
                let user = await this.getUserSetting(query.from.id);
                user.set_type = type;
                user.log_id = logId;
                user.reaction_id = res.message_id;
                user.reaction_method = "set_buy_amount";
                user.query = query;
                this.updateUserSetting(user);
            });
            return;
        }
        //设置手动卖出比例
        let sell_percentMatch = query.data.match(new RegExp(/\/set_sell_percent (.+) (.+)/));
        if (sell_percentMatch) {
            let type = Number(sell_percentMatch[1]);
            let logId = Number(sell_percentMatch[2]);
            this.bot.sendMessage(query.message.chat.id, `请输入卖出比例`, {
                "reply_markup": {
                    "force_reply": true
                }
            }).then(async (res) => {
                let user = await this.getUserSetting(query.from.id);
                user.set_type = type;
                user.log_id = logId;
                user.reaction_id = res.message_id;
                user.reaction_method = "set_sell_percent";
                user.query = query;
                this.updateUserSetting(user);
            });
            return;
        }
        //设置抢开盘gas
        let taskGasMatch = query.data.match(new RegExp(/\/set_task_gas_fee (.+)/));
        if (taskGasMatch) {
            let logId = Number(taskGasMatch[1]);
            this.bot.sendMessage(query.message.chat.id, `请输入gas`, {
                "reply_markup": {
                    "force_reply": true
                }
            }).then(async (res) => {
                let user = await this.getUserSetting(query.from.id);
                user.log_id = logId;
                user.reaction_id = res.message_id;
                user.reaction_method = "set_task_gas_fee";
                user.query = query;
                this.updateUserSetting(user);
            });
            return;
        }
        let taskAmountMatch = query.data.match(new RegExp(/\/set_task_buy_amount (.+)/));
        if (taskAmountMatch) {
            let logId = Number(taskAmountMatch[1]);
            this.bot.sendMessage(query.message.chat.id, `请输入买入金额ETH为单位`, {
                "reply_markup": {
                    "force_reply": true
                }
            }).then(async (res) => {
                let user = await this.getUserSetting(query.from.id);
                user.log_id = logId;
                user.reaction_id = res.message_id;
                user.reaction_method = "set_task_buy_amount";
                user.query = query;
                this.updateUserSetting(user);
            });
            return;
        }
        let taskStartTimeMatch = query.data.match(new RegExp(/\/set_task_start_time (.+)/));
        if (taskStartTimeMatch) {
            let logId = Number(taskStartTimeMatch[1]);
            this.bot.sendMessage(query.message.chat.id, `请输入开始时间格式 2023/09/13T09:37:00`, {
                "reply_markup": {
                    "force_reply": true
                }
            }).then(async (res) => {
                let user = await this.getUserSetting(query.from.id);
                user.log_id = logId;
                user.reaction_id = res.message_id;
                user.reaction_method = "set_task_start_time";
                user.query = query;
                this.updateUserSetting(user);
            });
            return;
        }
        //删除任务
        let taskDeleteMatch = query.data.match(new RegExp(/\/delete_task (.+)/));
        if (taskDeleteMatch) {
            let logId = Number(taskDeleteMatch[1]);
            await this.db.delete("task", [`id=${logId}`]);
            query.data = 'rush';
            this.switchRouter(query);
            return;
        }
        //设置买入卖出钱包
        let setFollowWalletMatch = query.data.match(new RegExp(/\/set_follow_wallet (.+) (.+)/));
        if (setFollowWalletMatch) {
            this.setFollowWallet(query, Number(setFollowWalletMatch[1]), Number(setFollowWalletMatch[2]));
            return;
        }
        //设置买入卖出钱包
        let setWalletMatch = query.data.match(new RegExp(/\/set_default_wallet (.+) (.+)/));
        if (setWalletMatch) {
            this.setDefaultWallet(query, Number(setWalletMatch[1]), setWalletMatch[2]);
            return;
        }
        let setTaskWalletMatch = query.data.match(new RegExp(/\/set_task_wallet (.+) (.+)/));
        if (setTaskWalletMatch) {
            this.setTaskWallet(query, Number(setTaskWalletMatch[1]), Number(setTaskWalletMatch[2]));
            return;
        }
        //手动买入
        let buyMatch = query.data.match(new RegExp(/\/buy (.+) (.+) (.+) (.+)/));
        if (buyMatch) {
            let user = await this.getUserSetting(query.from.id);
            this.handleManualBuy(query, Number(buyMatch[1]), buyMatch[2], Number(user.amount), Number(user.manual_swap_fee), Number(user.manual_gas_fee), Number(buyMatch[3]), Number(buyMatch[4]));
            return;
        }
        //手动卖出
        let sellMatch = query.data.match(new RegExp(/\/sell (.+) (.+) (.+) (.+)/));
        if (sellMatch) {
            let user = await this.getUserSetting(query.from.id);
            this.handleManualSell(query, Number(sellMatch[1]), sellMatch[2], Number(user.sell_percent), Number(user.manual_swap_fee), Number(user.manual_gas_fee), Number(sellMatch[3]), Number(sellMatch[4]));
            return;
        }
        //删除监听
        let deleteWatchMatch = query.data.match(new RegExp(/\/delete_watch (.+)/));
        if (deleteWatchMatch) {
            this.deleteWatch(query, deleteWatchMatch[1]);
            return;
        }
        //查看抢开盘任务
        let rushDetailMatch = query.data.match(new RegExp(/\/rush_detail (.+)/));
        if (rushDetailMatch) {
            this.rushDetail(query, Number(rushDetailMatch[1]));
            return;
        }
        //备注监听地址
        let bindWatchNameMatch = query.data.match(new RegExp(/\/bind_watch_name (.+)/));
        if (bindWatchNameMatch) {
            this.bot.sendMessage(query.message.chat.id, `👇👇👇为以下地址备注名称，请输入需要备注的名称\n${bindWatchNameMatch[1]}`, {
                "reply_markup": {
                    "force_reply": true
                }
            }).then(async (res) => {
                let user = await this.getUserSetting(query.from.id);
                user.reaction_id = res.message_id;
                user.reaction_method = "bind_watch_name";
                user.query = query;
                this.updateUserSetting(user);
            });
            return;
        }
        //监听地址详情
        let handleWatchMatch = query.data.match(new RegExp(/\/handle_watch (.+)/));
        if (handleWatchMatch) {
            (0, templates_1.handleWatchTemplate)(this.bot, query, handleWatchMatch[1], await this.db);
            return;
        }
        //发送合约到私聊
        let sendContractMatch = query.data.match(new RegExp(/\/send_contract (.+)/));
        if (sendContractMatch) {
            this.sendContract(sendContractMatch[1], query);
            return;
        }
    }
    //卖出
    async handleManualSell(msg, chainId, address, percent, swapFee, gasFee, type, logId) {
        const web3 = new web3_1.default();
        let account = null;
        if (logId) {
            let log = await this.db.find("transferLog", [`id=${logId}`]);
            let wallet = await this.db.find("wallet", [`address='${log.address}'`, `telegram_id=${msg.from.id}`]);
            if (wallet) {
                account = web3.eth.accounts.privateKeyToAccount(wallet.private_key);
            }
            else {
                this.bot.sendMessage(msg.message.chat.id, '该订单的钱包已删除');
                return;
            }
        }
        else {
            let user = await this.getUserSetting(msg.from.id);
            if (!user.default_address) {
                this.bot.sendMessage(msg.message.chat.id, '请选择一个钱包');
                return;
            }
            account = web3.eth.accounts.privateKeyToAccount(user.default_private_key);
        }
        if (this.chainIds.indexOf(chainId) == -1) {
            this.bot.sendMessage(msg.message.chat.id, '链id无效');
            return;
        }
        if (!web3.utils.isAddress(address)) {
            this.bot.sendMessage(msg.message.chat.id, '合约地址错误');
            return;
        }
        if (typeof percent != 'number') {
            this.bot.sendMessage(msg.message.chat.id, '卖出比例错误');
            return;
        }
        let contract = await this.db.find("contract", [`address='${address}'`]);
        if (!contract || !contract.address) {
            contract = await this.insertContract(address, chainId);
            if (!contract.address) {
                return;
            }
        }
        let receiveAddress = account.address;
        let fastPrice = await (0, index_1.fastGetContractPrice)(contract, contract.chain_id);
        let balance = await (0, index_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id);
        let amountIn = percent == 100 ? Math.floor(Number(balance[0].balance) * Number(99.5) / 100) : Math.floor(Number(balance[0].balance) * percent / 100);
        if (fastPrice && fastPrice.price) {
            fastPrice.pool.tag = fastPrice.pool.version;
            let amountOut = amountIn / (10 ** Number(contract.decimals)) * fastPrice.price * 10 ** 18;
            let params = {
                amountIn: (0, bignumber_js_1.default)(amountIn).toFixed(),
                amountOut: (0, bignumber_js_1.default)(Math.floor(amountOut - amountOut * swapFee / 100)).toFixed(),
                chainId: contract.chain_id,
                contract: contract.address,
                swapFee: swapFee,
                gasFee: gasFee,
                pool: fastPrice.pool
            };
            let result;
            result = await (0, index_1.manualSwapSell)(params, account.privateKey);
            if (result.success) {
                (0, templates_1.pendingTamplate)(this.bot, msg, contract, Number((Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(3)), result.signTx.transactionHash, type);
                let transaction = await (0, index_1.sendSignedTransaction)(contract.address, contract.chain_id, result.signTx, type);
                if (transaction.response_type == 1) {
                    let routes = (0, index_1.getRoutes)(contract.chain_id);
                    let outAmount = 0;
                    transaction.transactionReceipt.logs.forEach(log => {
                        if (web3.utils.toChecksumAddress(log.address) == index_1.Config[contract.chain_id].stableContract[0] && log.topics[0] == "0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65" && routes.indexOf(web3.eth.abi.decodeParameter("address", log.topics[1])) != -1) {
                            outAmount += Number(web3.eth.abi.decodeParameter("uint256", log.data));
                        }
                    });
                    let gasUsed = transaction.transactionReceipt.gasUsed * transaction.transactionReceipt.effectiveGasPrice / (10 ** 18) * Number(this.sdks.get(contract.chain_id).wethPrice);
                    let cost = Number((outAmount / (10 ** 18) * Number(this.sdks.get(contract.chain_id).wethPrice) - gasUsed).toFixed(2));
                    let transactionLog = {
                        chain_id: contract.chain_id,
                        address: account.address,
                        target: contract.address,
                        hash: transaction.hash,
                        in_target: contract.address,
                        price: fastPrice.price,
                        in_amount: (0, bignumber_js_1.default)(Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(),
                        out_target: index_1.Config[contract.chain_id].stableContract[0],
                        out_amount: (0, bignumber_js_1.default)(outAmount / (10 ** 18)).toFixed(),
                        telegram_id: msg.from.id,
                        telegram_name: msg.from.first_name + msg.from.last_name,
                        type: type,
                        transfer_type: 2,
                        is_sell: 0,
                        status: 1,
                        symbol: contract.symbol,
                        cost: cost,
                        remark: "swap成功",
                        create_time: Math.round(new Date().getTime() / 1000),
                    };
                    let insertResult = await this.db.insert("transferLog", transactionLog);
                    transactionLog.id = insertResult;
                    contract.fastGetContractPrice = await (0, index_1.fastGetContractPrice)(contract, chainId);
                    let user = await this.getUserSetting(msg.from.id);
                    (0, templates_1.sellSuccessTemplate)(this.bot, msg, contract, user, this.currentGasPrices.get(contract.chain_id), this.sdks.get(contract.chain_id).wethPrice, transactionLog);
                    let find = await this.db.select("transferLog", [`is_sell=0`, `status=1`, `transfer_type=1`, `address='${account.address}'`, `target='${contract.address}'`]);
                    if (find.length) {
                        find.forEach(log => {
                            log.is_sell = 1;
                        });
                        await this.db.updateList("transferLog", find);
                    }
                }
                else {
                    let gasUsed = transaction.hash ? transaction.transactionReceipt.gasUsed * transaction.transactionReceipt.effectiveGasPrice / (10 ** 18) * Number(this.sdks.get(contract.chain_id).wethPrice) : 0;
                    let cost = gasUsed;
                    let transactionLog = {
                        chain_id: contract.chain_id,
                        address: account.address,
                        target: contract.address,
                        hash: transaction.hash ? transaction.hash : "",
                        in_target: contract.address,
                        in_amount: (0, bignumber_js_1.default)(Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(),
                        out_target: index_1.Config[contract.chain_id].stableContract[0],
                        out_amount: 0,
                        price: fastPrice.price,
                        telegram_id: msg.from.id,
                        telegram_name: msg.from.first_name + msg.from.last_name,
                        type: type,
                        transfer_type: 2,
                        is_sell: 0,
                        status: 2,
                        cost: cost,
                        symbol: contract.symbol,
                        remark: transaction.msg,
                        create_time: Math.round(new Date().getTime() / 1000),
                    };
                    await this.db.insert("transferLog", transactionLog);
                    (0, templates_1.errorTamplate)(this.bot, msg, contract, Number((Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(3)), transaction.hash, type, transaction.msg);
                }
            }
            else {
                let transactionLog = {
                    chain_id: contract.chain_id,
                    address: account.address,
                    target: contract.address,
                    hash: "",
                    in_target: contract.address,
                    in_amount: (0, bignumber_js_1.default)(Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(),
                    out_target: index_1.Config[contract.chain_id].stableContract[0],
                    out_amount: 0,
                    price: fastPrice.price,
                    telegram_id: msg.from.id,
                    telegram_name: msg.from.first_name + msg.from.last_name,
                    type: type,
                    transfer_type: 2,
                    is_sell: 0,
                    status: 2,
                    cost: 0,
                    symbol: contract.symbol,
                    remark: result.msg,
                    create_time: Math.round(new Date().getTime() / 1000),
                };
                await this.db.insert("transferLog", transactionLog);
                (0, templates_1.errorTamplate)(this.bot, msg, contract, Number((Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(3)), "", type, result.msg);
            }
        }
        else {
            (0, templates_1.errorTamplate)(this.bot, msg, contract, Number((Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(3)), "", type, "获取币价失败");
        }
    }
    //卖出
    async handleFollowSell(watchItem, watch) {
        const web3 = new web3_1.default();
        let account = null;
        let msg = {
            message: {
                chat: {
                    id: watch.telegram_id
                }
            }
        };
        let address = watchItem.out_target;
        let chainId = watchItem.chain_id;
        let percent = 100;
        let swapFee = watch.follow_swap_fee;
        let gasFee = watch.follow_gas_fee;
        let type = 4;
        let contract = await this.db.find("contract", [`address='${address}'`]);
        if (!contract || !contract.address) {
            contract = await this.insertContract(address, chainId);
            if (!contract.address) {
                return;
            }
        }
        let receiveAddress = account.address;
        let fastPrice = await (0, index_1.fastGetContractPrice)(contract, contract.chain_id);
        let balance = await (0, index_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id);
        let amountIn = percent == 100 ? Math.floor(Number(balance[0].balance) * Number(99.5) / 100) : Math.floor(Number(balance[0].balance) * percent / 100);
        if (fastPrice && fastPrice.price) {
            fastPrice.pool.tag = fastPrice.pool.version;
            let amountOut = amountIn / (10 ** Number(contract.decimals)) * fastPrice.price * 10 ** 18;
            let params = {
                amountIn: (0, bignumber_js_1.default)(amountIn).toFixed(),
                amountOut: (0, bignumber_js_1.default)(Math.floor(amountOut - amountOut * swapFee / 100)).toFixed(),
                chainId: contract.chain_id,
                contract: contract.address,
                swapFee: swapFee,
                gasFee: gasFee,
                pool: fastPrice.pool
            };
            let result = await (0, index_1.manualSwapSell)(params, account.privateKey);
            if (result.success) {
                (0, templates_1.pendingTamplate)(this.bot, msg, contract, Number((Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(3)), result.signTx.transactionHash, type);
                let transaction = await (0, index_1.sendSignedTransaction)(contract.address, contract.chain_id, result.signTx, type);
                if (transaction.response_type == 1) {
                    let routes = (0, index_1.getRoutes)(contract.chain_id);
                    let outAmount = 0;
                    transaction.transactionReceipt.logs.forEach(log => {
                        if (web3.utils.toChecksumAddress(log.address) == index_1.Config[contract.chain_id].stableContract[0] && log.topics[0] == "0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65" && routes.indexOf(web3.eth.abi.decodeParameter("address", log.topics[1])) != -1) {
                            outAmount += Number(web3.eth.abi.decodeParameter("uint256", log.data));
                        }
                    });
                    let gasUsed = transaction.transactionReceipt.gasUsed * transaction.transactionReceipt.effectiveGasPrice / (10 ** 18) * Number(this.sdks.get(contract.chain_id).wethPrice);
                    let cost = Number((outAmount / (10 ** 18) * Number(this.sdks.get(contract.chain_id).wethPrice) - gasUsed).toFixed(2));
                    let transactionLog = {
                        chain_id: contract.chain_id,
                        address: account.address,
                        target: contract.address,
                        hash: transaction.hash,
                        in_target: contract.address,
                        price: fastPrice.price,
                        in_amount: (0, bignumber_js_1.default)(Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(),
                        out_target: index_1.Config[contract.chain_id].stableContract[0],
                        out_amount: (0, bignumber_js_1.default)(outAmount / (10 ** 18)).toFixed(),
                        telegram_id: watch.telegram_id,
                        telegram_name: watch.telegram_name,
                        type: type,
                        transfer_type: 2,
                        is_sell: 0,
                        status: 1,
                        symbol: contract.symbol,
                        cost: cost,
                        remark: "swap成功",
                        create_time: Math.round(new Date().getTime() / 1000),
                    };
                    let insertResult = await this.db.insert("transferLog", transactionLog);
                    transactionLog.id = insertResult;
                    contract.fastGetContractPrice = await (0, index_1.fastGetContractPrice)(contract, chainId);
                    let user = await this.getUserSetting(watch.telegram_id);
                    (0, templates_1.sellSuccessTemplate)(this.bot, msg, contract, user, this.currentGasPrices.get(contract.chain_id), this.sdks.get(contract.chain_id).wethPrice, transactionLog);
                    let find = await this.db.select("transferLog", [`is_sell=0`, `status=1`, `transfer_type=1`, `address='${account.address}'`, `target='${contract.address}'`]);
                    if (find.length) {
                        find.forEach(log => {
                            log.is_sell = 1;
                        });
                        await this.db.updateList("transferLog", find);
                    }
                }
                else {
                    let gasUsed = transaction.hash ? transaction.transactionReceipt.gasUsed * transaction.transactionReceipt.effectiveGasPrice / (10 ** 18) * Number(this.sdks.get(contract.chain_id).wethPrice) : 0;
                    let cost = gasUsed;
                    let transactionLog = {
                        chain_id: contract.chain_id,
                        address: account.address,
                        target: contract.address,
                        hash: transaction.hash ? transaction.hash : "",
                        in_target: contract.address,
                        in_amount: (0, bignumber_js_1.default)(Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(),
                        out_target: index_1.Config[contract.chain_id].stableContract[0],
                        out_amount: 0,
                        price: fastPrice.price,
                        telegram_id: watch.telegram_id,
                        telegram_name: watch.telegram_name,
                        type: type,
                        transfer_type: 2,
                        is_sell: 0,
                        status: 2,
                        cost: cost,
                        symbol: contract.symbol,
                        remark: transaction.msg,
                        create_time: Math.round(new Date().getTime() / 1000),
                    };
                    await this.db.insert("transferLog", transactionLog);
                    (0, templates_1.errorTamplate)(this.bot, msg, contract, Number((Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(3)), transaction.hash, type, transaction.msg);
                }
            }
            else {
                let transactionLog = {
                    chain_id: contract.chain_id,
                    address: account.address,
                    target: contract.address,
                    hash: "",
                    in_target: contract.address,
                    in_amount: (0, bignumber_js_1.default)(Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(),
                    out_target: index_1.Config[contract.chain_id].stableContract[0],
                    out_amount: 0,
                    price: fastPrice.price,
                    telegram_id: watch.telegram_id,
                    telegram_name: watch.telegram_name,
                    type: type,
                    transfer_type: 2,
                    is_sell: 0,
                    status: 2,
                    cost: 0,
                    symbol: contract.symbol,
                    remark: result.msg,
                    create_time: Math.round(new Date().getTime() / 1000),
                };
                await this.db.insert("transferLog", transactionLog);
                (0, templates_1.errorTamplate)(this.bot, msg, contract, Number((Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(3)), "", type, result.msg);
            }
        }
        else {
            (0, templates_1.errorTamplate)(this.bot, msg, contract, Number((Number(amountIn) / (10 ** Number(contract.decimals))).toFixed(3)), "", type, "获取币价失败");
        }
    }
    //买入
    async handleManualBuy(msg, chainId, address, amount, swapFee, gasFee, type, logId) {
        const web3 = new web3_1.default();
        let account = null;
        if (logId) {
            let log = await this.db.find("transferLog", [`id=${logId}`]);
            let wallet = await this.db.find("wallet", [`address='${log.address}'`, `telegram_id=${msg.from.id}`]);
            if (wallet) {
                account = web3.eth.accounts.privateKeyToAccount(wallet.private_key);
            }
            else {
                this.bot.sendMessage(msg.message.chat.id, '该订单的钱包已删除');
                return;
            }
        }
        else {
            let user = await this.getUserSetting(msg.from.id);
            if (!user.default_address) {
                this.bot.sendMessage(msg.message.chat.id, '请选择一个钱包');
                return;
            }
            account = web3.eth.accounts.privateKeyToAccount(user.default_private_key);
        }
        if (this.chainIds.indexOf(chainId) == -1) {
            this.bot.sendMessage(msg.message.chat.id, '链id无效');
            return;
        }
        if (!web3.utils.isAddress(address)) {
            this.bot.sendMessage(msg.message.chat.id, '合约地址错误');
            return;
        }
        if (typeof amount != 'number') {
            this.bot.sendMessage(msg.message.chat.id, '金额错误');
            return;
        }
        let contract = await this.db.find("contract", [`address='${address}'`]);
        if (!contract || !contract.address) {
            contract = await this.insertContract(address, chainId);
            if (!contract.address) {
                return;
            }
        }
        let fastPrice = await (0, index_1.fastGetContractPrice)(contract, chainId);
        if (fastPrice && fastPrice.price) {
            let amountOut = amount / Number(fastPrice.price) * 10 ** Number(contract.decimals);
            fastPrice.pool.tag = fastPrice.pool.version;
            let params = {
                amountIn: (0, bignumber_js_1.default)(amount * 10 ** 18).toFixed(),
                amountOut: (0, bignumber_js_1.default)(Math.floor(amountOut - amountOut * swapFee / 100)).toFixed(),
                chainId: contract.chain_id,
                contract: contract.address,
                swapFee: swapFee,
                gasFee: gasFee,
                pool: fastPrice.pool
            };
            let result = await (0, index_1.manualSwapBuy)(params, account.privateKey);
            if (result.success) {
                (0, templates_1.pendingTamplate)(this.bot, msg, contract, amount, result.signTx.transactionHash, type);
                let transaction = await (0, index_1.sendSignedTransaction)(contract.address, contract.chain_id, result.signTx, type);
                if (transaction.response_type == 1) {
                    let outAmount = 0;
                    let receiveAddress = account.address;
                    transaction.transactionReceipt.logs.forEach(log => {
                        if (log.topics.length == 3 && web3.utils.toChecksumAddress(log.address) == address) {
                            let inAddress = web3.utils.toChecksumAddress(web3.eth.abi.decodeParameter("address", log.topics[2]));
                            if (log.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" && inAddress == receiveAddress) {
                                outAmount += Number(web3.eth.abi.decodeParameter("uint256", log.data));
                            }
                        }
                    });
                    let gasUsed = transaction.transactionReceipt.gasUsed * transaction.transactionReceipt.effectiveGasPrice / (10 ** 18) * this.sdks.get(chainId).wethPrice;
                    let cost = Number(((amount * this.sdks.get(chainId).wethPrice) + gasUsed).toFixed(2));
                    let transactionLog = {
                        chain_id: chainId,
                        address: account.address,
                        target: address,
                        hash: transaction.hash,
                        in_target: "0x0000000000000000000000000000000000000000",
                        in_amount: amount,
                        out_target: address,
                        price: fastPrice.price,
                        out_amount: (0, bignumber_js_1.default)(outAmount / (10 ** Number(contract.decimals))).toFixed(),
                        telegram_id: msg.from.id,
                        telegram_name: msg.from.first_name + msg.from.last_name,
                        type: type,
                        transfer_type: 1,
                        is_sell: 0,
                        status: 1,
                        symbol: contract.symbol,
                        cost: cost,
                        remark: "swap成功",
                        create_time: Math.round(new Date().getTime() / 1000),
                    };
                    let insertResult = await this.db.insert("transferLog", transactionLog);
                    transactionLog.id = insertResult;
                    contract.fastGetContractPrice = await (0, index_1.fastGetContractPrice)(contract, chainId);
                    let user = await this.getUserSetting(msg.from.id);
                    (0, templates_1.buySuccessTemplate)(this.bot, msg, contract, user, this.currentGasPrices.get(contract.chain_id), this.sdks.get(contract.chain_id).wethPrice, transactionLog);
                }
                else {
                    let gasUsed = transaction.hash ? Number((transaction.transactionReceipt.gasUsed * transaction.transactionReceipt.effectiveGasPrice / (10 ** 18) * this.sdks.get(chainId).wethPrice).toFixed(2)) : 0;
                    let cost = gasUsed;
                    let transactionLog = {
                        chain_id: chainId,
                        address: account.address,
                        target: address,
                        price: fastPrice.price,
                        hash: transaction.hash ? transaction.hash : '',
                        in_target: "0x0000000000000000000000000000000000000000",
                        in_amount: amount,
                        out_target: address,
                        out_amount: 0,
                        telegram_id: msg.from.id,
                        telegram_name: msg.from.first_name + msg.from.last_name,
                        type: type,
                        transfer_type: 1,
                        is_sell: 0,
                        status: 2,
                        symbol: contract.symbol,
                        cost: cost,
                        remark: transaction.msg,
                        create_time: Math.round(new Date().getTime() / 1000),
                    };
                    await this.db.insert("transferLog", transactionLog);
                    (0, templates_1.errorTamplate)(this.bot, msg, contract, amount, transaction.hash, type, transaction.msg);
                }
            }
            else {
                let transactionLog = {
                    chain_id: chainId,
                    address: account.address,
                    target: address,
                    hash: '',
                    in_target: "0x0000000000000000000000000000000000000000",
                    in_amount: amount,
                    out_target: address,
                    out_amount: 0,
                    telegram_id: msg.from.id,
                    price: fastPrice.price,
                    telegram_name: msg.from.first_name + msg.from.last_name,
                    type: type,
                    transfer_type: 1,
                    is_sell: 0,
                    status: 2,
                    symbol: contract.symbol,
                    cost: 0,
                    remark: result.msg,
                    create_time: Math.round(new Date().getTime() / 1000),
                };
                await this.db.insert("transferLog", transactionLog);
                (0, templates_1.errorTamplate)(this.bot, msg, contract, amount, "", type, result.msg);
            }
        }
        else {
            (0, templates_1.errorTamplate)(this.bot, msg, contract, amount, "", type, "获取币价失败");
        }
    }
    //跟单买入
    async handleFollowBuy(watchItem, watch) {
        const web3 = new web3_1.default();
        let account = null;
        let msg = {
            message: {
                chat: {
                    id: watch.telegram_id
                }
            }
        };
        let address = watchItem.out_target;
        let chainId = watchItem.chain_id;
        let amount = watch.follow_amount;
        let swapFee = watch.follow_swap_fee;
        let gasFee = watch.follow_gas_fee;
        let type = 3;
        account = web3.eth.accounts.privateKeyToAccount(watch.follow_private_key);
        let contract = await this.db.find("contract", [`address='${address}'`]);
        if (!contract || !contract.address) {
            contract = await this.insertContract(address, chainId);
            if (!contract.address) {
                return;
            }
        }
        let fastPrice = await (0, index_1.fastGetContractPrice)(contract, chainId);
        if (fastPrice && fastPrice.price) {
            let amountOut = amount / Number(fastPrice.price) * 10 ** Number(contract.decimals);
            fastPrice.pool.tag = fastPrice.pool.version;
            let params = {
                amountIn: (0, bignumber_js_1.default)(amount * 10 ** 18).toFixed(),
                amountOut: (0, bignumber_js_1.default)(Math.floor(amountOut - amountOut * swapFee / 100)).toFixed(),
                chainId: contract.chain_id,
                contract: contract.address,
                swapFee: swapFee,
                gasFee: gasFee,
                pool: fastPrice.pool
            };
            let result = await (0, index_1.manualSwapBuy)(params, account.privateKey);
            if (result.success) {
                (0, templates_1.pendingTamplate)(this.bot, msg, contract, amount, result.signTx.transactionHash, type);
                let transaction = await (0, index_1.sendSignedTransaction)(contract.address, contract.chain_id, result.signTx, type);
                if (transaction.response_type == 1) {
                    let outAmount = 0;
                    let receiveAddress = account.address;
                    transaction.transactionReceipt.logs.forEach(log => {
                        if (log.topics.length == 3 && web3.utils.toChecksumAddress(log.address) == address) {
                            let inAddress = web3.utils.toChecksumAddress(web3.eth.abi.decodeParameter("address", log.topics[2]));
                            if (log.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" && inAddress == receiveAddress) {
                                outAmount += Number(web3.eth.abi.decodeParameter("uint256", log.data));
                            }
                        }
                    });
                    let gasUsed = transaction.transactionReceipt.gasUsed * transaction.transactionReceipt.effectiveGasPrice / (10 ** 18) * this.sdks.get(chainId).wethPrice;
                    let cost = Number(((amount * this.sdks.get(chainId).wethPrice) + gasUsed).toFixed(2));
                    let transactionLog = {
                        chain_id: chainId,
                        address: account.address,
                        target: address,
                        hash: transaction.hash,
                        in_target: "0x0000000000000000000000000000000000000000",
                        in_amount: amount,
                        out_target: address,
                        price: fastPrice.price,
                        out_amount: (0, bignumber_js_1.default)(outAmount / (10 ** Number(contract.decimals))).toFixed(),
                        telegram_id: watch.telegram_id,
                        telegram_name: watch.telegram_name,
                        type: type,
                        transfer_type: 1,
                        is_sell: 0,
                        status: 1,
                        symbol: contract.symbol,
                        cost: cost,
                        remark: "swap成功",
                        create_time: Math.round(new Date().getTime() / 1000),
                    };
                    let insertResult = await this.db.insert("transferLog", transactionLog);
                    transactionLog.id = insertResult;
                    contract.fastGetContractPrice = await (0, index_1.fastGetContractPrice)(contract, chainId);
                    let user = await this.getUserSetting(watch.telegram_id);
                    (0, templates_1.buySuccessTemplate)(this.bot, msg, contract, user, this.currentGasPrices.get(contract.chain_id), this.sdks.get(contract.chain_id).wethPrice, transactionLog);
                }
                else {
                    let gasUsed = transaction.hash ? Number((transaction.transactionReceipt.gasUsed * transaction.transactionReceipt.effectiveGasPrice / (10 ** 18) * this.sdks.get(chainId).wethPrice).toFixed(2)) : 0;
                    let cost = gasUsed;
                    let transactionLog = {
                        chain_id: chainId,
                        address: account.address,
                        target: address,
                        price: fastPrice.price,
                        hash: transaction.hash ? transaction.hash : '',
                        in_target: "0x0000000000000000000000000000000000000000",
                        in_amount: amount,
                        out_target: address,
                        out_amount: 0,
                        telegram_id: watch.telegram_id,
                        telegram_name: watch.telegram_name,
                        type: type,
                        transfer_type: 1,
                        is_sell: 0,
                        status: 2,
                        symbol: contract.symbol,
                        cost: cost,
                        remark: transaction.msg,
                        create_time: Math.round(new Date().getTime() / 1000),
                    };
                    await this.db.insert("transferLog", transactionLog);
                    (0, templates_1.errorTamplate)(this.bot, msg, contract, amount, transaction.hash, type, transaction.msg);
                }
            }
            else {
                let transactionLog = {
                    chain_id: chainId,
                    address: account.address,
                    target: address,
                    hash: '',
                    in_target: "0x0000000000000000000000000000000000000000",
                    in_amount: amount,
                    out_target: address,
                    out_amount: 0,
                    telegram_id: watch.telegram_id,
                    telegram_name: watch.telegram_name,
                    price: fastPrice.price,
                    type: type,
                    transfer_type: 1,
                    is_sell: 0,
                    status: 2,
                    symbol: contract.symbol,
                    cost: 0,
                    remark: result.msg,
                    create_time: Math.round(new Date().getTime() / 1000),
                };
                await this.db.insert("transferLog", transactionLog);
                (0, templates_1.errorTamplate)(this.bot, msg, contract, amount, "", type, result.msg);
            }
        }
        else {
            (0, templates_1.errorTamplate)(this.bot, msg, contract, amount, "", type, "获取币价失败");
        }
    }
    // 查找聪明钱
    async querySmarkMoney(msg) {
        const web3 = new web3_1.default();
        let user = await this.getUserSetting(msg.from.id);
        let addresses = msg.text.split(",");
        let hasError = false;
        addresses.forEach(item => {
            hasError = !web3.utils.isAddress(item);
            if (web3.utils.isAddress(item)) {
                item = web3.utils.toChecksumAddress(item);
            }
        });
        this.bot.deleteMessage(msg.chat.id, msg.message_id);
        this.bot.deleteMessage(msg.chat.id, user.reaction_id);
        let newUser = { ...user };
        newUser.query = "";
        newUser.reaction_id = 0;
        newUser.reaction_method = "";
        newUser.set_type = 0;
        newUser.log_id = 0;
        this.updateUserSetting(newUser);
        if (hasError) {
            this.bot.sendMessage(msg.chat.id, "合约地址出错");
        }
        else {
            let values = addresses.map(item => {
                return `'${item}'`;
            });
            let list = await this.db.batchQuery("smartMoney", "address", values);
            if (list.length) {
                this.bot.sendMessage(msg.chat.id, "合约重复录入过");
            }
            else {
                this.bot.sendMessage(msg.chat.id, "开始查找聪明钱");
                for (let address of addresses) {
                    let find = await this.db.find("contract", [`address='${web3.utils.toChecksumAddress(address)}'`]);
                    let allSmartMoney = await this.db.select("smartMoneyAddress", []);
                    if (find) {
                        let result = await (0, index_1.getSmartMoney)([find.address], find.chain_id);
                        let updateList = [];
                        let insertList = [];
                        for (let i = 0; i < result.length; i++) {
                            let userItem = result[i];
                            let findAddress = allSmartMoney.find(items => {
                                return items.address == userItem.address && userItem.chain_id == find.chain_id;
                            });
                            if (findAddress) {
                                findAddress.count += 1;
                                updateList.push(findAddress);
                            }
                            else {
                                insertList.push({
                                    address: userItem.address,
                                    chain_id: find.chain_id,
                                    count: 1,
                                    create_time: Math.round(new Date().getTime() / 1000),
                                });
                            }
                        }
                        if (updateList.length) {
                            await this.db.updateList("smartMoneyAddress", updateList);
                        }
                        if (insertList.length) {
                            await this.db.insertList("smartMoneyAddress", insertList);
                        }
                        await this.db.insert("smartMoney", { address: find.address, chain_id: find.chain_id, create_time: Math.round(new Date().getTime() / 1000) });
                    }
                    else {
                        for (let item of this.chainIds) {
                            let contract = await this.insertContract(address, item);
                            if (contract) {
                                let result = await (0, index_1.getSmartMoney)([contract.address], contract.chain_id);
                                let updateList = [];
                                let insertList = [];
                                for (let i = 0; i < result.length; i++) {
                                    let userItem = result[i];
                                    let findAddress = allSmartMoney.find(items => {
                                        return items.address == userItem.address && userItem.chain_id == contract.chain_id;
                                    });
                                    if (findAddress) {
                                        findAddress.count += 1;
                                        updateList.push(findAddress);
                                    }
                                    else {
                                        insertList.push({
                                            address: userItem.address,
                                            chain_id: contract.chain_id,
                                            count: 1,
                                            create_time: Math.round(new Date().getTime() / 1000),
                                        });
                                    }
                                }
                                if (updateList.length) {
                                    await this.db.updateList("smartMoneyAddress", updateList);
                                }
                                if (insertList.length) {
                                    await this.db.insertList("smartMoneyAddress", insertList);
                                }
                                await this.db.insert("smartMoney", { address: contract.address, chain_id: contract.chain_id, create_time: Math.round(new Date().getTime() / 1000) });
                                break;
                            }
                        }
                    }
                }
                this.bot.sendMessage(msg.chat.id, "聪明钱已录入");
            }
        }
    }
    //返回首页
    clearHistory(query) {
        query.data = 'home';
        this.switchRouter(query);
    }
}
exports["default"] = NewBot;


/***/ }),

/***/ 83086:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.v3Router2 = exports.Trade = exports.Camelot = exports.ERC20 = exports.permit2Permit = exports.DanDaoNFTAbi = exports.v3Router = exports.DanDaoERC20Abi = exports.v2Router = void 0;
exports.v2Router = [{
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
    }];
exports.DanDaoERC20Abi = [
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
];
exports.v3Router = [{
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
    }];
exports.DanDaoNFTAbi = [
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
];
exports.permit2Permit = [
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
];
exports.ERC20 = [{
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
    },];
exports.Camelot = [{
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
    }];
exports.Trade = [
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
];
exports.v3Router2 = [{
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
    }];


/***/ }),

/***/ 42654:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ERC20ConventionMethods = exports.transactionGas = exports.FeeAmount = exports.Config = void 0;
exports.Config = {
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
        DANDAOTradeV3: "0x916BB2aDd4E883628B92835599D40F3e1D8004F2",
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
        ignoreToken: ["0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2"],
        stableContract: ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0xdAC17F958D2ee523a2206206994597C13D831ec7"],
        provider: null,
        ordiProvider: null,
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
        DANDAOTradeV3: "0x17009db8Fcc50B108F70Cd6C22a8072e4B8a10ef",
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
        ignoreToken: [],
        stableContract: ["0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", "0xf9Fe684BF908A6934F9fe7646C6A63022C35D575"],
        provider: null,
        ordiProvider: null,
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
        ignoreToken: [],
        stableContract: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"],
        provider: null,
        ordiProvider: null,
        DANDAOFactoryContract: null,
        DANDAONFTFactoryContract: null
    },
};
exports.FeeAmount = [500, 3000, 10000];
exports.transactionGas = {
    1: 500000,
    5: 500000,
    56: 500000,
    42161: 5000000,
};
exports.ERC20ConventionMethods = ["0x095ea7b3", "0xa9059cbb", "0x23b872dd", "0xf2fde38b"];


/***/ }),

/***/ 46030:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var mysql = __webpack_require__(4426);
const logger_1 = __importDefault(__webpack_require__(97020));
const logger = new logger_1.default();
const mysqlLogger = logger.mysqlLogger();
class Client {
    pool;
    logger = new logger_1.default();
    dbData = {
        host: "127.0.0.1",
        user: "dandao",
        password: "12345678",
        port: 3306,
        database: "dandao"
    };
    constructor(dbData) {
        this.dbData = dbData ? dbData : this.dbData;
        this.pool = this.create();
    }
    create() {
        var pool = mysql.createPool({
            host: this.dbData.host,
            port: this.dbData.port,
            user: this.dbData.user,
            password: this.dbData.password,
            database: this.dbData.database,
            connectionLimit: 100
        });
        return pool;
    }
    //处理单条插入数据
    getInsertData(table, params) {
        let sql = `select column_name from Information_schema.columns  where table_Name = '${table}' and TABLE_SCHEMA='${this.dbData.database}'`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        let insertData = {};
                        for (let item of rows) {
                            if (params[item.COLUMN_NAME]) {
                                if (item.COLUMN_NAME != 'id') {
                                    insertData[item.COLUMN_NAME] = params[item.COLUMN_NAME];
                                }
                            }
                            if (item.COLUMN_NAME == 'create_time') {
                                if (!insertData[item.COLUMN_NAME]) {
                                    insertData[item.COLUMN_NAME] = Math.round(new Date().getTime() / 1000);
                                }
                            }
                        }
                        resolve(insertData);
                    }
                });
            });
        });
    }
    //处理单条更新数据
    getUpdateData(table, params) {
        let sql = `select column_name from Information_schema.columns  where table_Name = '${table}' and TABLE_SCHEMA='${this.dbData.database}'`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        let values = [];
                        let key = [];
                        let updates = [];
                        for (let item of rows) {
                            if (params[item.COLUMN_NAME] != undefined) {
                                if (item.COLUMN_NAME != 'id') {
                                    updates.push(`${item.COLUMN_NAME}=values(${item.COLUMN_NAME})`);
                                }
                                values.push(params[item.COLUMN_NAME]);
                                key.push(item.COLUMN_NAME);
                            }
                        }
                        resolve({ key, values, updates });
                    }
                });
            });
        });
    }
    //处理多条更新数据
    getUpdateListData(table, list) {
        let sql = `select column_name from Information_schema.columns  where table_Name = '${table}' and TABLE_SCHEMA='${this.dbData.database}'`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        let key = [];
                        let values = [];
                        let updates = [];
                        let first = list[0];
                        for (let item of list) {
                            let pushValus = [];
                            for (let items of rows) {
                                if (item[items.COLUMN_NAME] != undefined) {
                                    pushValus.push(item[items.COLUMN_NAME]);
                                }
                            }
                            values.push(pushValus);
                        }
                        for (let item of rows) {
                            if (first[item.COLUMN_NAME] != undefined) {
                                if (item.COLUMN_NAME != 'id') {
                                    updates.push(`${item.COLUMN_NAME}=values(${item.COLUMN_NAME})`);
                                }
                                key.push(item.COLUMN_NAME);
                            }
                        }
                        resolve({ key, values, updates });
                    }
                });
            });
        });
    }
    //处理多条插入数据
    getInsertListData(table, list) {
        let sql = `select column_name from Information_schema.columns  where table_Name = '${table}' and TABLE_SCHEMA='${this.dbData.database}'`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        let key = [];
                        let values = [];
                        for (let item of list) {
                            let pushValus = [];
                            for (let items of rows) {
                                if (items.COLUMN_NAME != 'id') {
                                    pushValus.push(item[items.COLUMN_NAME]);
                                }
                            }
                            values.push(pushValus);
                        }
                        for (let item of rows) {
                            if (item.COLUMN_NAME != 'id') {
                                key.push(item.COLUMN_NAME);
                            }
                        }
                        resolve({ key, values });
                    }
                });
            });
        });
    }
    //插入单条数据 table：表名 params：接收的参数
    async insert(table, params) {
        let insertData = await this.getInsertData(table, params);
        let sql = `insert into ${table} set ?`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, insertData, function (err, rows) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        resolve(rows.insertId);
                    }
                });
            });
        });
    }
    //插入单条数据 table：表名 params：接收的参数
    async insertList(table, params) {
        let insertData = await this.getInsertListData(table, params);
        let sql = `insert into ${table} (${insertData.key.join(',')}) values ?`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.release();
                connection.query(sql, [insertData.values], function (err, rows) {
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        resolve(rows);
                    }
                });
            });
        });
    }
    //插入单条数据(插入更新模式) table：表名 params：接收的参数
    async update(table, params) {
        let updateData = await this.getUpdateData(table, params);
        let sql = `insert into ${table} (${updateData.key.join(',')}) values(?) on duplicate key update ${updateData.updates.join(',')}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.release();
                connection.query(sql, [updateData.values], function (err, rows) {
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        resolve(rows.insertId);
                    }
                });
            });
        });
    }
    //插入多条数据(插入更新模式) table：表名 params：接收的参数
    async updateList(table, params) {
        let updateData = await this.getUpdateListData(table, params);
        let sql = `insert into ${table} (${updateData.key.join(',')}) values ? on duplicate key update ${updateData.updates.join(',')}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                connection.query(sql, [updateData.values], function (err, rows) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        resolve(rows);
                    }
                });
            });
        });
    }
    //查询列表分页 tabel:表名  where：查询条件数组形式   order：排序数组形式  paging：分页
    pagingSelect(table, where = [], order = [], paging = { page: 1, pageSize: 15 }) {
        let whereStr = where.length ? where.join(' and ') : ' 1=1 ';
        let orderStr = order.length ? `order by ` + order.join(',') : '';
        let sql = `select * from ${table} where ${whereStr} ${orderStr} limit ${(paging.page - 1) * paging.pageSize}, ${paging.pageSize}`;
        let returnData = {
            page: paging.page,
            pageSize: paging.pageSize,
            list: [],
            total: 0,
        };
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        returnData.list = rows;
                        returnData.total = 0;
                        resolve(returnData);
                    }
                    else {
                        resolve(returnData);
                    }
                });
            });
        });
    }
    // 查询列表 tabel:表名  where：查询条件数组形式   order：排序数组形式 
    find(table, where = [], order = []) {
        let whereStr = where.length ? where.join(' and ') : ' 1=1 ';
        let orderStr = order.length ? `order by ` + order.join(',') : '';
        let sql = `select * from ${table} where ${whereStr} ${orderStr}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    connection.release();
                    //释放链接
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        resolve(rows[0]);
                    }
                    else {
                        resolve(null);
                    }
                });
            });
        });
    }
    // 查询列表 tabel:表名  where：查询条件数组形式   order：排序数组形式 
    select(table, where = [], order = [], limit = 50000, field = []) {
        let whereStr = where.length ? where.join(' and ') : ' 1=1 ';
        let orderStr = order.length ? `order by ` + order.join(',') : '';
        let sql = `select ${field.length ? field.join(",") : '*'} from ${table} where ${whereStr} ${orderStr} limit 0, ${limit}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    //释放链接
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        resolve(rows);
                    }
                    else {
                        resolve([]);
                    }
                });
            });
        });
    }
    // 删除数据 tabel:表名  where：查询条件数组形式 
    delete(table, where = []) {
        let whereStr = where.length ? where.join(' and ') : ' 1=1 ';
        let sql = `delete from ${table} where ${whereStr}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    //释放链接
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        resolve(rows);
                    }
                });
            });
        });
    }
    //批量获取
    batchQuery(table, key, list, field = []) {
        let sql = `select ${field.length ? field.join(",") : '*'} from ${table} where ${key} in (${list.join(",")})`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    //释放链接
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        resolve(rows);
                    }
                    else {
                        resolve([]);
                    }
                });
            });
        });
    }
    //获取总和
    sum(table, sumKey, where = []) {
        let whereStr = where.length ? where.join(' and ') : ' 1=1 ';
        let sql = `select sum(${sumKey}) as allSum from ${table} where ${whereStr}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    connection.release();
                    //释放链接
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        resolve(rows[0].allSum);
                    }
                });
            });
        });
    }
    // 查询表数据条数 table：表名
    count(table, where = []) {
        let whereStr = where.length ? where.join(' and ') : ' 1=1 ';
        let sql = `select count(*) as count from ${table} where ${whereStr}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    connection.release();
                    //释放链接
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        resolve(rows[0].count);
                    }
                });
            });
        });
    }
    //左关联 select * from trade_log as s left join minting as t on s.address = t.address where id > 0
    leftJoin(table1, table2, where = [], order = [], table1Key, table2Key, paging = { page: 1, pageSize: 15 }) {
        let whereStr = where.length ? where.join(' and ') : ' 1=1 ';
        let orderStr = order.length ? `order by ` + order.join(',') : '';
        let sql = `select * from ${table1} as s left join ${table2} as t on s.${table1Key} = t.${table2Key} where ${whereStr} ${orderStr} limit ${(paging.page - 1) * paging.pageSize}, ${paging.pageSize}`;
        let returnData = {
            page: paging.page,
            pageSize: paging.pageSize,
            list: [],
            total: 0,
        };
        return new Promise((resolve) => {
            this.pool.getConnection(function (err, connection) {
                if (err) {
                    mysqlLogger.info(err);
                }
                connection.query(sql, function (err, rows) {
                    connection.release();
                    //释放链接
                    if (err) {
                        mysqlLogger.info(err);
                    }
                    if (rows) {
                        returnData.list = rows;
                        returnData.total = 0;
                        resolve(returnData);
                    }
                    else {
                        resolve(returnData);
                    }
                });
            });
        });
    }
}
exports["default"] = Client;


/***/ }),

/***/ 87375:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.decodeTransferTopics = exports.arrSet = exports.filterBalance = exports.getSmartMoney = exports.handleTransactionEvent = exports.getBlockPendingEvent = exports.getFuckBlockPendingEvent = exports.getBatchFuckBlockPendingEvent = exports.formartWatchLog = exports.getWatchToken = exports.handleWatchTransactions = exports.handleTransactionReceipt = exports.handleReceiptItem = exports.getRoutes = exports.getBlockEvent = void 0;
const handle_1 = __webpack_require__(19586);
const methods_1 = __webpack_require__(24593);
const fetch_1 = __webpack_require__(96294);
const constrants_1 = __webpack_require__(42654);
const help_1 = __webpack_require__(53872);
const bignumber_js_1 = __importDefault(__webpack_require__(44431));
const uuid_1 = __webpack_require__(42600);
const lodash_1 = __importDefault(__webpack_require__(96486));
const getBlockEvent = (startNumber, endNumber, chainID, web3) => {
    return new Promise(async (resolve) => {
        let transactions = [];
        transactions = await (0, fetch_1.batchBlockRequest)(startNumber, endNumber, chainID);
        if (transactions.length) {
            try {
                let hashs = transactions.map(item => {
                    return item.hash;
                });
                let transactionReceipts = await (0, fetch_1.batchGetTransactionReceipt)(hashs, chainID);
                let contracts = await (0, handle_1.formartCreateContract)(transactions, chainID, web3);
                let { sendParams, handleParams, swapEvents } = await (0, exports.handleTransactionEvent)(transactions, chainID, transactionReceipts);
                resolve({ contracts, sendParams, handleParams, transactions, swapEvents });
            }
            catch (error) {
                resolve({ contracts: [], sendParams: [], handleParams: [], transactions: [], swapEvents: [] });
            }
        }
        else {
            resolve({ contracts: [], sendParams: [], handleParams: [], transactions: [], swapEvents: [] });
        }
    });
};
exports.getBlockEvent = getBlockEvent;
const getRoutes = (chainId) => {
    let config = constrants_1.Config[chainId];
    switch (chainId) {
        case 1:
            return [config.v2Router, config.v3Router, config.UniversalRouter, "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD"];
        case 42161:
            return [config.v2Router, config.v3Router, config.camelotV2Router, config.UniversalRouter];
        case 5:
            return [config.v2Router, config.v3Router];
    }
};
exports.getRoutes = getRoutes;
const handleReceiptItem = (res, chainId) => {
    let web3 = (0, help_1.getProvider)(chainId);
    let routers = new Map();
    let transferEvents = [];
    for (let i = 0; i < res.logs.length; i++) {
        let item = res.logs[i];
        if (item.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" && item.topics.length == 3) {
            transferEvents.push(item);
        }
    }
    const recursion = (logs, uuid) => {
        let router = routers.get(uuid);
        if (logs.length) {
            if (router) {
                let lastRouter = router[router.length - 1];
                let hasLog = null;
                let matchLogs = [];
                for (let i = 0; i < logs.length; i++) {
                    let item = logs[i];
                    let address = web3.utils.toChecksumAddress(item.address);
                    let outAddress = web3.eth.abi.decodeParameter("address", item.topics[1]);
                    let inAddress = web3.eth.abi.decodeParameter("address", item.topics[2]);
                    let amount = web3.eth.abi.decodeParameter("uint256", item.data);
                    if (hasLog) {
                        if (lastRouter.inAddress == web3.utils.toChecksumAddress(res.from) || lastRouter.inAddress == web3.utils.toChecksumAddress(res.to)) {
                            if (outAddress == lastRouter.inAddress && lastRouter.address == address && hasLog.address == address) {
                                matchLogs.push({
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                });
                                logs.splice(i, 1);
                                i--;
                            }
                        }
                        else {
                            if (outAddress == lastRouter.inAddress && hasLog.address == address) {
                                matchLogs.push({
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                });
                                logs.splice(i, 1);
                                i--;
                            }
                        }
                    }
                    else {
                        if (lastRouter.inAddress == web3.utils.toChecksumAddress(res.from) || lastRouter.inAddress == web3.utils.toChecksumAddress(res.to)) {
                            if (outAddress == lastRouter.inAddress && lastRouter.address == address) {
                                matchLogs.push({
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                });
                                logs.splice(i, 1);
                                i--;
                                hasLog = {
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                };
                            }
                        }
                        else {
                            if (outAddress == lastRouter.inAddress) {
                                matchLogs.push({
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                });
                                logs.splice(i, 1);
                                i--;
                                hasLog = {
                                    address,
                                    outAddress,
                                    inAddress,
                                    amount: Number(amount)
                                };
                            }
                        }
                    }
                }
                if (matchLogs.length) {
                    matchLogs = lodash_1.default.sortBy(matchLogs, "amount");
                    if (matchLogs.length > 1) {
                        let bigAmount = 0;
                        let smallAmount = 0;
                        for (let i = 0; i < matchLogs.length; i++) {
                            if (i == matchLogs.length - 1) {
                                bigAmount = matchLogs[i].amount;
                            }
                            else {
                                smallAmount += matchLogs[i].amount;
                            }
                        }
                        let insertItem = {
                            ...matchLogs[matchLogs.length - 1],
                            swapFee: Math.floor((smallAmount / (bigAmount + smallAmount)) * 100)
                        };
                        router.push(insertItem);
                    }
                    else {
                        let insertItem = {
                            ...matchLogs[matchLogs.length - 1],
                            swapFee: 0
                        };
                        router.push(insertItem);
                    }
                    routers.set(uuid, router);
                    recursion(logs, uuid);
                }
                else {
                    recursion(logs, (0, uuid_1.v4)());
                }
            }
            else {
                let hasLog = null;
                let firstRouters = [];
                for (let i = 0; i < logs.length; i++) {
                    let item = logs[i];
                    let address = web3.utils.toChecksumAddress(item.address);
                    let outAddress = web3.eth.abi.decodeParameter("address", item.topics[1]);
                    let inAddress = web3.eth.abi.decodeParameter("address", item.topics[2]);
                    let amount = web3.eth.abi.decodeParameter("uint256", item.data);
                    if (hasLog) {
                        if (outAddress == hasLog.outAddress && address == hasLog.address) {
                            firstRouters.push({
                                address,
                                outAddress,
                                inAddress,
                                amount: Number(amount)
                            });
                            logs.splice(i, 1);
                            i--;
                        }
                    }
                    else {
                        if (outAddress == web3.utils.toChecksumAddress(res.from) || outAddress == web3.utils.toChecksumAddress(res.to)) {
                            firstRouters.push({
                                address,
                                outAddress,
                                inAddress,
                                amount: Number(amount)
                            });
                            hasLog = {
                                address,
                                outAddress,
                                inAddress,
                                amount: Number(amount)
                            };
                            logs.splice(i, 1);
                            i--;
                        }
                    }
                }
                if (firstRouters.length) {
                    if (firstRouters.length > 1) {
                        firstRouters = lodash_1.default.sortBy(firstRouters, "amount");
                        let bigAmount = 0;
                        let smallAmount = 0;
                        for (let i = 0; i < firstRouters.length; i++) {
                            if (i == firstRouters.length - 1) {
                                bigAmount = firstRouters[i].amount;
                            }
                            else {
                                smallAmount += firstRouters[i].amount;
                            }
                        }
                        let swapFee = Math.floor((smallAmount / (bigAmount + smallAmount)) * 100);
                        let setItem = {
                            ...firstRouters[firstRouters.length - 1],
                            swapFee: swapFee
                        };
                        routers.set(uuid, [setItem]);
                    }
                    else {
                        let setItem = {
                            ...firstRouters[0],
                            swapFee: 0
                        };
                        routers.set(uuid, [setItem]);
                    }
                    recursion(logs, uuid);
                }
            }
        }
    };
    recursion(transferEvents, (0, uuid_1.v4)());
    let resultEvents = [];
    routers.forEach(item => {
        if (item.length > 1) {
            let formatRoutes = [];
            item.forEach(items => {
                let last = formatRoutes[formatRoutes.length - 1];
                if (last) {
                    if (last.address != items.address && last.amount != (0, bignumber_js_1.default)(items.amount).toFixed()) {
                        formatRoutes.push({
                            address: items.address,
                            amount: (0, bignumber_js_1.default)(items.amount).toFixed(),
                            swapFee: items.swapFee,
                        });
                    }
                }
                else {
                    formatRoutes.push({
                        address: items.address,
                        amount: (0, bignumber_js_1.default)(items.amount).toFixed(),
                        swapFee: items.swapFee,
                    });
                }
            });
            let first = item[0];
            let last = item[item.length - 1];
            resultEvents.push({
                chain_id: chainId,
                hash: res.transactionHash,
                from_address: web3.utils.toChecksumAddress(res.from),
                to_address: web3.utils.toChecksumAddress(res.to),
                in_target: web3.utils.toChecksumAddress(first.address),
                in_amount: (0, bignumber_js_1.default)(first.amount).toFixed(),
                in_swap_fee: first.swapFee,
                swap_out_address: web3.utils.toChecksumAddress(first.outAddress),
                out_target: web3.utils.toChecksumAddress(last.address),
                out_amount: (0, bignumber_js_1.default)(last.amount).toFixed(),
                out_swap_fee: last.swapFee,
                swap_in_address: web3.utils.toChecksumAddress(last.inAddress),
                block_number: res.blockNumber,
                effective_gas_price: (0, bignumber_js_1.default)(res.effectiveGasPrice).toFixed(),
                gas_used: (0, bignumber_js_1.default)(res.gasUsed).toFixed(),
                swap_routers: JSON.stringify(formatRoutes),
                create_time: Math.round(new Date().getTime() / 1000),
            });
        }
    });
    return resultEvents;
};
exports.handleReceiptItem = handleReceiptItem;
//获取区块交易event
const handleTransactionReceipt = (transactionReceipts, chainId) => {
    let events = [];
    if (transactionReceipts.length) {
        transactionReceipts.forEach(item => {
            if (item) {
                try {
                    let result = (0, exports.handleReceiptItem)(item, chainId);
                    if (result.length) {
                        events = events.concat(result);
                    }
                }
                catch {
                }
            }
        });
    }
    return events;
};
exports.handleTransactionReceipt = handleTransactionReceipt;
//分析监听交易信息
const handleWatchTransactions = (watchLogs, wethPrice, chainId = 1) => {
    return new Promise(async (resolve) => {
        let config = constrants_1.Config[chainId];
        if (watchLogs.length) {
            let contracts = [];
            let checkERC20Items = [];
            watchLogs.forEach(item => {
                if (config.stableContract.indexOf(item.in_target) == -1)
                    contracts.push(item.in_target);
                if (config.stableContract.indexOf(item.out_target) == -1)
                    contracts.push(item.out_target);
                checkERC20Items.push({
                    contractAddr: item.out_target,
                    owner: item.address
                });
                checkERC20Items.push({
                    contractAddr: item.in_target,
                    owner: item.address
                });
            });
            let allBalance = await (0, fetch_1.batchCheckERC20Balance)(checkERC20Items, chainId);
            contracts = [...new Set(contracts)];
            let queryContracts = await (0, handle_1.addContract)(contracts, chainId);
            if (queryContracts.length) {
                let pools = [];
                queryContracts.forEach(item => {
                    pools = pools.concat(JSON.parse(item.pools));
                });
                let handlePools = await (0, handle_1.batchAllPool)(pools, chainId);
                let { hasLiquidityPools } = (0, handle_1.formatPool)(queryContracts, handlePools);
                await (0, handle_1.setToken)(queryContracts, hasLiquidityPools, chainId);
                watchLogs = (0, exports.formartWatchLog)(watchLogs, queryContracts, allBalance, wethPrice, chainId);
            }
        }
        resolve(watchLogs);
    });
};
exports.handleWatchTransactions = handleWatchTransactions;
const getWatchToken = (address, queryContract, wethPrice, chainId) => {
    let config = constrants_1.Config[chainId];
    if (address == "0x0000000000000000000000000000000000000000") {
        return {
            pool: "0x0000000000000000000000000000000000000000",
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
            price: wethPrice,
            allReserve: 0,
            version: "uniswapv2",
        };
    }
    else {
        if (config.stableContract.indexOf(address) != -1) {
            let index = config.stableContract.indexOf(address);
            if (index == 0) {
                return {
                    pool: "0x0000000000000000000000000000000000000000",
                    name: "Ethereum",
                    symbol: "ETH",
                    decimals: 18,
                    price: wethPrice,
                    allReserve: 0,
                    version: "uniswapv2",
                };
            }
            else {
                return {
                    pool: "0x0000000000000000000000000000000000000000",
                    name: "USD",
                    symbol: "USD",
                    decimals: 6,
                    price: 1,
                    allReserve: 0,
                    version: "uniswapv2",
                };
            }
        }
        else {
            let find = queryContract.find(contract => {
                return contract.address == address && contract.LiquidityPools && contract.LiquidityPools.length;
            });
            if (find) {
                let bigPool;
                let reserve = 0;
                let allReserve = 0;
                find.LiquidityPools.forEach(item => {
                    let reserve0 = item.pool.token0 == config.stableContract[0] ? Number(item.pool.reserve0) : Number(item.pool.reserve1);
                    allReserve += reserve0;
                    bigPool = reserve0 > reserve ? item : bigPool;
                    reserve = reserve0 > reserve ? reserve0 : reserve;
                });
                return {
                    pool: bigPool.pool.pool,
                    name: find.name,
                    symbol: find.symbol,
                    decimals: Number(find.decimals),
                    price: bigPool[find.symbol],
                    allReserve: allReserve,
                    version: bigPool.version,
                };
            }
            else {
                return null;
            }
        }
    }
};
exports.getWatchToken = getWatchToken;
const formartWatchLog = (watchLogs, queryContracts, allBalance, wethPrice, chainId) => {
    let newList = [];
    if (queryContracts.length) {
        for (let i = 0; i < watchLogs.length; i++) {
            let item = watchLogs[i];
            let inToken = (0, exports.getWatchToken)(item.in_target, queryContracts, wethPrice, chainId);
            let outToken = (0, exports.getWatchToken)(item.out_target, queryContracts, wethPrice, chainId);
            if (inToken && outToken) {
                let find = allBalance.find(itemBalance => {
                    if (item.type == 1) {
                        return item.out_target == itemBalance.contractAddr && item.address == itemBalance.addr;
                    }
                    else if (item.type == 2) {
                        return item.in_target == itemBalance.contractAddr && item.address == itemBalance.addr;
                    }
                });
                if (find) {
                    item.left_amount = (0, bignumber_js_1.default)(Number(find.balance) / (10 ** Number(find.decimals))).toFixed();
                }
                item.amount_in = (0, bignumber_js_1.default)(Number(item.amount_in) / (10 ** Number(inToken.decimals))).toFixed();
                item.amount_out = (0, bignumber_js_1.default)(Number(item.amount_out) / (10 ** Number(outToken.decimals))).toFixed();
                item.in_price = inToken.pool == "0x0000000000000000000000000000000000000000" ? inToken.price : (0, bignumber_js_1.default)(Number(inToken.price) * wethPrice).toFixed();
                item.in_symbol = inToken.symbol;
                item.in_decimals = inToken.decimals;
                item.in_name = inToken.name;
                item.in_pool = inToken.pool;
                item.in_version = inToken.version;
                item.out_price = outToken.pool == "0x0000000000000000000000000000000000000000" ? outToken.price : (0, bignumber_js_1.default)(Number(outToken.price) * wethPrice).toFixed();
                item.out_symbol = outToken.symbol;
                item.out_decimals = outToken.decimals;
                item.out_name = outToken.name;
                item.in_all_reserve = (0, bignumber_js_1.default)(Number((inToken.allReserve / (10 ** 18)).toFixed(2))).toFixed();
                item.out_all_reserve = (0, bignumber_js_1.default)(Number((outToken.allReserve / (10 ** 18)).toFixed(2))).toFixed();
                item.out_pool = outToken.pool;
                item.out_version = outToken.version;
                let cost = (0, bignumber_js_1.default)(item.cost / (10 ** 18) * wethPrice).toFixed();
                item.cost = item.type == 1 ? Number(Number(Number(item.amount_in) * Number(item.in_price) + Number(cost)).toFixed(2)) : Number(Number(Number(item.amount_out) * Number(item.out_price) - Number(cost)).toFixed(2));
                item.price = item.type == 1 ? (0, bignumber_js_1.default)(Number((item.cost / Number(item.amount_out)).toFixed(16))).toFixed() : (0, bignumber_js_1.default)(Number((item.cost / Number(item.amount_in)).toFixed(16))).toFixed();
                newList.push(item);
            }
            else {
                watchLogs.splice(i, 1);
                i--;
            }
        }
        return newList;
    }
    else {
        return [];
    }
};
exports.formartWatchLog = formartWatchLog;
const getBatchFuckBlockPendingEvent = async (targets, chainId) => {
    return new Promise(async (resolve) => {
        if (chainId == 5 || chainId == 1) {
            try {
                let block = await (0, fetch_1.getPendingBlock)(chainId);
                let transactionDetails = [];
                if (block?.transactions?.length) {
                    let transactions = block.transactions;
                    let { handleParams } = await (0, exports.handleTransactionEvent)(transactions, chainId);
                    let _filters = handleParams.filter(item => {
                        return targets.indexOf(item.target) != -1 && item.type == 3;
                    });
                    if (_filters.length) {
                        transactions.forEach(item => {
                            let _find = _filters.find(handleParamsItem => {
                                return item.hash == handleParamsItem.transactionHex;
                            });
                            if (_find) {
                                transactionDetails.push({ target: _find.target, transactionIndex: item.transactionIndex, maxPriorityFeePerGas: item.maxPriorityFeePerGas, maxFeePerGas: item.maxFeePerGas, hash: item.hash });
                            }
                        });
                    }
                    for (let item of transactions) {
                        let hexMethod = item.input.slice(0, 10);
                        if ((constrants_1.ERC20ConventionMethods.indexOf(hexMethod) == -1 && targets.indexOf(item.to) != -1)) {
                            transactionDetails.push({
                                target: item.to,
                                transactionIndex: item.transactionIndex,
                                maxPriorityFeePerGas: item.maxPriorityFeePerGas,
                                maxFeePerGas: item.maxFeePerGas,
                                hash: item.hash
                            });
                        }
                    }
                    resolve({ transactionDetails: transactionDetails, transactions: transactions, handleParams: handleParams });
                }
                else {
                    resolve({ transactionDetails: [], transactions: [], handleParams: [] });
                }
            }
            catch (error) {
                resolve({ transactionDetails: [], transactions: [], handleParams: [] });
            }
        }
        else {
            resolve({ transactionDetails: [], transactions: [], handleParams: [] });
        }
    });
};
exports.getBatchFuckBlockPendingEvent = getBatchFuckBlockPendingEvent;
//0块冲土狗获取
const getFuckBlockPendingEvent = async (chainId, targets) => {
    return new Promise(async (resolve) => {
        try {
            let block = await (0, fetch_1.getPendingBlock)(chainId);
            let transactionDetail;
            if (block?.transactions?.length) {
                let transactions = block.transactions;
                let { handleParams } = await (0, exports.handleTransactionEvent)(transactions, chainId);
                let _find = handleParams.find(item => {
                    return targets.indexOf(item.target) != -1 && item.type == 3;
                });
                if (_find) {
                    let _findTransaction = transactions.find(item => {
                        return item.hash == _find.transactionHex;
                    });
                    transactionDetail = { transactionIndex: _findTransaction.transactionIndex, maxPriorityFeePerGas: _findTransaction.maxPriorityFeePerGas, maxFeePerGas: _findTransaction.maxFeePerGas, hash: _findTransaction.hash };
                    resolve({ transactionDetail: transactionDetail, transactions: transactions });
                }
                else {
                    for (let item of transactions) {
                        let hexMethod = item.input.slice(0, 10);
                        if ((constrants_1.ERC20ConventionMethods.indexOf(hexMethod) == -1 && targets.indexOf(item.to) != -1)) {
                            transactionDetail = { transactionIndex: item.transactionIndex, maxPriorityFeePerGas: item.maxPriorityFeePerGas, maxFeePerGas: item.maxFeePerGas, hash: item.hash };
                            resolve({ transactionDetail: transactionDetail, transactions: transactions });
                            return;
                        }
                    }
                    resolve({ transactionDetail: null, transactions: transactions });
                }
            }
            else {
                resolve({ transactionDetail: null, transactions: [] });
            }
        }
        catch (error) {
            resolve({ transactionDetail: null, transactions: [] });
        }
    });
};
exports.getFuckBlockPendingEvent = getFuckBlockPendingEvent;
const getBlockPendingEvent = async (chainId) => {
    return new Promise(async (resolve) => {
        let block = await (0, fetch_1.getPendingBlock)(chainId);
        if (block?.transactions?.length) {
            let transactions = block.transactions;
            let contracts = [];
            let { sendParams, handleParams } = await (0, exports.handleTransactionEvent)(transactions, chainId);
            resolve({ contracts, sendParams, handleParams, blockNumber: block.number, transactions });
        }
        else {
            resolve({ contracts: [], sendParams: [], handleParams: [], transactions: [] });
        }
    });
};
exports.getBlockPendingEvent = getBlockPendingEvent;
const handleTransactionEvent = async (transactions, chainId, transactionReceipts) => {
    return new Promise(async (resolve) => {
        let logs = {
            sendParams: [],
            handleParams: [],
            swapEvents: []
        };
        let hashs = [];
        for (let item of transactions) {
            hashs.push(item.hash);
            try {
                let event = (0, methods_1.distribute)(item.input, chainId);
                if (event) {
                    event.handleParams.forEach(items => {
                        items.from = item.from;
                        let executeNames = ["v3SwapExactIn", "v3SwapExactOut", "v2SwapExactIn", "v2SwapExactOut"];
                        if (executeNames.indexOf(items.methodName) != -1) {
                            items.to = item.from;
                        }
                        if (!items.amountIn && items.type == 1) {
                            item.amountIn = item.value;
                        }
                    });
                    logs.sendParams = logs.sendParams ? logs.sendParams.concat(event.sendParams) : logs.sendParams;
                    logs.sendParams;
                    logs.handleParams = event.handleParams ? logs.handleParams.concat(event.handleParams.map(items => {
                        items.transactionHex = item.hash;
                        return items;
                    })) : logs.handleParams;
                }
            }
            catch (err) {
            }
        }
        if (transactionReceipts) {
            logs.swapEvents = (0, exports.handleTransactionReceipt)(transactionReceipts, chainId);
        }
        resolve(logs);
    });
};
exports.handleTransactionEvent = handleTransactionEvent;
const getSmartMoney = async (addresses, chainId) => {
    return new Promise(async (resolve) => {
        let conctracts = await (0, handle_1.addContract)(addresses, chainId);
        let allUser = [];
        for (let item of conctracts) {
            let result = await (0, fetch_1.getFirstPoolForBlockNumber)(item);
            let firstBlockNumber = await (0, fetch_1.getFirstTransactionBlockNumber)(item.address, result.blockNumber, chainId);
            if (firstBlockNumber) {
                let transferEvents = await (0, fetch_1.batchGetTransferEvent)(item.address, chainId, firstBlockNumber, 200);
                let users = (0, exports.decodeTransferTopics)(transferEvents, chainId);
                let pushItem = [];
                users.forEach(user => {
                    pushItem.push({
                        address: user
                    });
                });
                allUser = allUser.concat(pushItem);
            }
        }
        let list = (0, exports.arrSet)(allUser);
        let result = await (0, exports.filterBalance)(list, chainId);
        let resutlFormat = await (0, fetch_1.batchGetTransactionCount)(result, 1);
        resolve(resutlFormat);
    });
};
exports.getSmartMoney = getSmartMoney;
const filterBalance = async (users, chainId) => {
    let addresses = users.map(item => {
        return item.address;
    });
    let newAddresses = [];
    let result = await (0, fetch_1.batchCheckBalance)(addresses, chainId);
    result.forEach(item => {
        if (Number(item.balance) / (10 ** 18) > 1) {
            newAddresses.push(item.addr);
        }
    });
    newAddresses = await (0, fetch_1.batchGetCode)(newAddresses, chainId);
    let ensNames = await (0, fetch_1.batchQueryENSname)(newAddresses);
    let newResult = newAddresses.map((item, index) => {
        if (ensNames[index] != 'undefinded') {
            return {
                address: item,
                name: ensNames[index]
            };
        }
        else {
            return {
                address: item,
                name: ""
            };
        }
    });
    return newResult;
};
exports.filterBalance = filterBalance;
const arrSet = (users) => {
    let mapUser = new Map();
    users.forEach(item => {
        if (mapUser.get(item.address)) {
            let userItem = mapUser.get(item.address);
            userItem.count += 1;
            mapUser.set(userItem.address, userItem);
        }
        else {
            item.count = 1;
            mapUser.set(item.address, item);
        }
    });
    let list = [...mapUser.values()];
    let newList = [];
    list.forEach(item => {
        newList.push(item);
    });
    return newList;
};
exports.arrSet = arrSet;
const decodeTransferTopics = (transferEvents, chainId) => {
    const web3 = (0, help_1.getProvider)(chainId);
    let addresses = [];
    transferEvents.forEach(item => {
        addresses.push(web3.eth.abi.decodeParameter("address", item.topics[2]));
    });
    return [...new Set(addresses)];
};
exports.decodeTransferTopics = decodeTransferTopics;


/***/ }),

/***/ 19586:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getAllHolder = exports.handleSwapEventAddress = exports.getOtherToken = exports.addContract = exports.setToken = exports.checkPool = exports.queryContract = exports.formatFuckPools = exports.formatUTCDate = exports.formartCreateContract = exports.handleHasLiquidityPools = exports.formatBaseData = exports.formatPool = exports.formatOwnerBurn = exports.batchAllPool = exports.fastGetAmountOut = exports.fastGetPrice = exports.fastGetContractPrice = exports.fastGetAmountIn = exports.fastGetCommandAmountIn = exports.fastGetCommandAmountOut = exports.computedMevPrice = void 0;
const fetch_1 = __webpack_require__(96294);
const bignumber_js_1 = __importDefault(__webpack_require__(44431));
const help_1 = __webpack_require__(53872);
const constrants_1 = __webpack_require__(42654);
const lodash_1 = __importDefault(__webpack_require__(96486));
// 获取买入数量
const computedMevPrice = async (pool, contract, currentPrice, selfAmount, targetAmount) => {
    return new Promise(async (resolve) => {
        let tokenA = constrants_1.Config[contract.chain_id].stableToken[0];
        let tokenB = {
            chain_id: contract.chain_id,
            address: contract.address,
            decimals: Number(contract.decimals),
            symbol: contract.symbol,
            name: contract.name,
        };
        let output = selfAmount / Number(currentPrice);
        output = Math.floor(output * 10 ** Number(contract.decimals));
        pool.reserve0 = pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? (0, bignumber_js_1.default)(Number(pool.reserve0) + selfAmount * 10 ** 18).toFixed() : (0, bignumber_js_1.default)(Number(pool.reserve0) - output).toFixed();
        pool.reserve1 = pool.token1 == constrants_1.Config[contract.chain_id].stableContract[0] ? (0, bignumber_js_1.default)(Number(pool.reserve1) + selfAmount * 10 ** 18).toFixed() : (0, bignumber_js_1.default)(Number(pool.reserve1) - output).toFixed();
        let selfInPrice = await (0, exports.handleHasLiquidityPools)(pool, (0, help_1.getToken)(tokenA), (0, help_1.getToken)(tokenB), contract.chain_id);
        let targetOutput = targetAmount / Number(selfInPrice[contract.symbol]);
        targetOutput = Math.floor(targetOutput * 10 ** Number(contract.decimals));
        pool.reserve0 = pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? (0, bignumber_js_1.default)(Number(pool.reserve0) + targetAmount * 10 ** 18).toFixed() : (0, bignumber_js_1.default)(Number(pool.reserve0) - targetOutput).toFixed();
        pool.reserve1 = pool.token1 == constrants_1.Config[contract.chain_id].stableContract[0] ? (0, bignumber_js_1.default)(Number(pool.reserve1) + targetAmount * 10 ** 18).toFixed() : (0, bignumber_js_1.default)(Number(pool.reserve1) - targetOutput).toFixed();
        let nextPrice = await (0, exports.handleHasLiquidityPools)(pool, (0, help_1.getToken)(tokenA), (0, help_1.getToken)(tokenB), contract.chain_id);
        let nextAmount = (output / (10 ** Number(contract.decimals))) * Number(nextPrice[contract.symbol]);
        resolve({
            output,
            nextAmount,
            currentPrice,
            nextPrice: nextPrice[contract.symbol]
        });
    });
};
exports.computedMevPrice = computedMevPrice;
const fastGetCommandAmountOut = (address, amountOut, chainId) => {
    return new Promise(async (resolve) => {
        let tokenA = constrants_1.Config[chainId].stableToken[0];
        let decimals = await (0, fetch_1.getDecimals)(address, chainId);
        if (decimals) {
            let tokenB = {
                chain_id: chainId,
                address: address,
                decimals: decimals,
                symbol: "tokenb",
                name: "tokenb"
            };
            let pools = await (0, help_1.generatePool)(tokenB, chainId);
            if (pools) {
                let arrPools = JSON.parse(pools);
                let formatPools = await (0, exports.batchAllPool)(arrPools, chainId);
                let pool;
                formatPools.forEach(item => {
                    if (pool) {
                        let oldReserve = pool.token0 == constrants_1.Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1;
                        let newReserve = item.token0 == constrants_1.Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1;
                        pool = Number(oldReserve) > Number(newReserve) ? pool : item;
                    }
                    else {
                        pool = item;
                    }
                });
                let price;
                if (pool) {
                    price = await (0, exports.handleHasLiquidityPools)(pool, (0, help_1.getToken)(tokenA), (0, help_1.getToken)(tokenB), chainId);
                }
                if (price) {
                    resolve({ amount: (0, bignumber_js_1.default)(((Number(amountOut) / (10 ** decimals) * Number(price.tokenb)) * 10 ** 18).toFixed(0)).toFixed(), pool: pool });
                }
                else {
                    resolve(null);
                }
            }
            else {
                resolve(null);
            }
        }
        else {
            resolve(null);
        }
    });
};
exports.fastGetCommandAmountOut = fastGetCommandAmountOut;
const fastGetCommandAmountIn = (address, amountIn, chainId) => {
    return new Promise(async (resolve) => {
        let tokenA = constrants_1.Config[chainId].stableToken[0];
        let decimals = await (0, fetch_1.getDecimals)(address, chainId);
        if (decimals) {
            let tokenB = {
                chain_id: chainId,
                address: address,
                decimals: decimals,
                symbol: "tokenb",
                name: "tokenb"
            };
            let pools = await (0, help_1.generatePool)(tokenB, chainId);
            if (pools) {
                let arrPools = JSON.parse(pools);
                let formatPools = await (0, exports.batchAllPool)(arrPools, chainId);
                let pool;
                formatPools.forEach(item => {
                    if (pool) {
                        let oldReserve = pool.token0 == constrants_1.Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1;
                        let newReserve = item.token0 == constrants_1.Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1;
                        pool = Number(oldReserve) > Number(newReserve) ? pool : item;
                    }
                    else {
                        pool = item;
                    }
                });
                let price;
                if (pool) {
                    price = await (0, exports.handleHasLiquidityPools)(pool, (0, help_1.getToken)(tokenA), (0, help_1.getToken)(tokenB), chainId);
                }
                if (price) {
                    resolve({ amount: (0, bignumber_js_1.default)(((Number(amountIn) / (10 ** 18) / Number(price.tokenb)) * 10 ** decimals).toFixed(0)).toFixed(), pool: pool, decimals: decimals });
                }
                else {
                    resolve(null);
                }
            }
            else {
                resolve(null);
            }
        }
        else {
            resolve(null);
        }
    });
};
exports.fastGetCommandAmountIn = fastGetCommandAmountIn;
const fastGetAmountIn = (address, amountIn, chainId) => {
    return new Promise(async (resolve) => {
        let tokenA = constrants_1.Config[chainId].stableToken[0];
        let decimals = await (0, fetch_1.getDecimals)(address, chainId);
        if (decimals) {
            let tokenB = {
                chain_id: chainId,
                address: address,
                decimals: decimals,
                symbol: "tokenb",
                name: "tokenb"
            };
            let pools = await (0, help_1.generatePool)(tokenB, chainId);
            if (pools) {
                let arrPools = JSON.parse(pools);
                let formatPools = await (0, exports.batchAllPool)(arrPools, chainId);
                let pool;
                formatPools.forEach(item => {
                    if (pool) {
                        let oldReserve = pool.token0 == constrants_1.Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1;
                        let newReserve = item.token0 == constrants_1.Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1;
                        pool = Number(oldReserve) > Number(newReserve) ? pool : item;
                    }
                    else {
                        pool = item;
                    }
                });
                let price;
                if (pool) {
                    price = await (0, exports.handleHasLiquidityPools)(pool, (0, help_1.getToken)(tokenA), (0, help_1.getToken)(tokenB), chainId);
                }
                if (price) {
                    resolve((0, bignumber_js_1.default)(((Number(amountIn) / (10 ** 18) / Number(price.tokenb)) * 10 ** decimals).toFixed(0)).toFixed());
                }
                else {
                    resolve("");
                }
            }
            else {
                resolve("");
            }
        }
        else {
            resolve("");
        }
    });
};
exports.fastGetAmountIn = fastGetAmountIn;
const fastGetContractPrice = (contract, chainId) => {
    return new Promise(async (resolve) => {
        let tokenA = constrants_1.Config[chainId].stableToken[0];
        let tokenB = {
            chain_id: chainId,
            address: contract.address,
            decimals: Number(contract.decimals),
            symbol: contract.symbol,
            name: contract.name,
        };
        let arrPools = JSON.parse(contract.pools);
        let formatPools = await (0, exports.batchAllPool)(arrPools, chainId);
        let pool = null;
        let allReserve = 0;
        let price = null;
        let allReserve0 = 0;
        let allReserve1 = 0;
        formatPools.forEach(item => {
            allReserve += Number(item.token0 == constrants_1.Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1);
            allReserve0 += Number(item.reserve0);
            allReserve1 += Number(item.reserve1);
            if (pool) {
                let oldReserve = pool.token0 == constrants_1.Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1;
                let newReserve = item.token0 == constrants_1.Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1;
                pool = Number(oldReserve) > Number(newReserve) ? pool : item;
            }
            else {
                pool = item;
            }
        });
        if (pool) {
            pool.reserve0 = (0, bignumber_js_1.default)(allReserve0).toFixed();
            pool.reserve1 = (0, bignumber_js_1.default)(allReserve1).toFixed();
            price = await (0, exports.handleHasLiquidityPools)(pool, (0, help_1.getToken)(tokenA), (0, help_1.getToken)(tokenB), chainId);
        }
        resolve({
            address: contract.address,
            pool,
            allReserve: allReserve / (10 ** 18),
            symbol: contract.symbol,
            name: contract.name,
            price: price ? price[contract.symbol] : 0
        });
    });
};
exports.fastGetContractPrice = fastGetContractPrice;
const fastGetPrice = (address, chainId) => {
    return new Promise(async (resolve) => {
        let tokenA = constrants_1.Config[chainId].stableToken[0];
        let decimals = await (0, fetch_1.getDecimals)(address, chainId);
        if (decimals) {
            let tokenB = {
                chain_id: chainId,
                address: address,
                decimals: decimals,
                symbol: "tokenb",
                name: "tokenb"
            };
            let pools = await (0, help_1.generatePool)(tokenB, chainId);
            if (pools) {
                let arrPools = JSON.parse(pools);
                let formatPools = await (0, exports.batchAllPool)(arrPools, chainId);
                let pool;
                formatPools.forEach(item => {
                    if (pool) {
                        let oldReserve = pool.token0 == constrants_1.Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1;
                        let newReserve = item.token0 == constrants_1.Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1;
                        pool = Number(oldReserve) > Number(newReserve) ? pool : item;
                    }
                    else {
                        pool = item;
                    }
                });
                let price;
                if (pool) {
                    price = await (0, exports.handleHasLiquidityPools)(pool, (0, help_1.getToken)(tokenA), (0, help_1.getToken)(tokenB), chainId);
                }
                if (price) {
                    resolve({ price, decimals });
                }
                else {
                    resolve(null);
                }
            }
            else {
                resolve(null);
            }
        }
        else {
            resolve(null);
        }
    });
};
exports.fastGetPrice = fastGetPrice;
//获取卖出数量
const fastGetAmountOut = (address, amountOut, chainId) => {
    return new Promise(async (resolve) => {
        let tokenA = constrants_1.Config[chainId].stableToken[0];
        let decimals = await (0, fetch_1.getDecimals)(address, chainId);
        if (decimals) {
            let tokenB = {
                chain_id: chainId,
                address: address,
                decimals: decimals,
                symbol: "tokenb",
                name: "tokenb"
            };
            let pools = await (0, help_1.generatePool)(tokenB, chainId);
            if (pools) {
                let arrPools = JSON.parse(pools);
                let formatPools = await (0, exports.batchAllPool)(arrPools, chainId);
                let pool;
                formatPools.forEach(item => {
                    if (pool) {
                        let oldReserve = pool.token0 == constrants_1.Config[chainId].stableContract[0] ? pool.reserve0 : pool.reserve1;
                        let newReserve = item.token0 == constrants_1.Config[chainId].stableContract[0] ? item.reserve0 : item.reserve1;
                        pool = Number(oldReserve) > Number(newReserve) ? pool : item;
                    }
                    else {
                        pool = item;
                    }
                });
                let price;
                if (pool) {
                    price = await (0, exports.handleHasLiquidityPools)(pool, (0, help_1.getToken)(tokenA), (0, help_1.getToken)(tokenB), chainId);
                }
                if (price) {
                    resolve((0, bignumber_js_1.default)(((Number(amountOut) / (10 ** decimals) * Number(price.tokenb)) * 10 ** 18).toFixed(0)).toFixed());
                }
                else {
                    resolve("");
                }
            }
            else {
                resolve("");
            }
        }
        else {
            resolve("");
        }
    });
};
exports.fastGetAmountOut = fastGetAmountOut;
//批量所有类型的池子
const batchAllPool = async (pools, chainId) => {
    let uniswapv2 = [];
    let uniswapv3 = [];
    //处理池子归类
    for (let item of pools) {
        if (item.version == "uniswapv2" || item.version == "camelotv2") {
            uniswapv2.push(item.pool);
        }
        else if (item.version == "uniswapv3") {
            uniswapv3.push(item.pool);
        }
    }
    let uniswapv2Pools = await (0, help_1.batchV2Pool)(uniswapv2, chainId, "uniswapv2");
    let uniswapv3Pools = await (0, help_1.batchV3Pool)(uniswapv3, chainId, "uniswapv3");
    return uniswapv2Pools.concat(uniswapv3Pools);
};
exports.batchAllPool = batchAllPool;
//处理是否销毁合约所有权
const formatOwnerBurn = async (addresses, chainID) => {
    let upDateList = [];
    let result = await (0, fetch_1.batchGetBaseData)(addresses, chainID);
    result.forEach(item => {
        if (item.owner == "0x0000000000000000000000000000000000000000") {
            upDateList.push({
                address: item.contractAddr,
                is_owner_burn: 1,
                owner: "0x0000000000000000000000000000000000000000"
            });
        }
    });
    return upDateList;
};
exports.formatOwnerBurn = formatOwnerBurn;
//处理池子 pools (v2Pool | v3Pool)
const formatPool = (tokens, pools) => {
    let updateList = [];
    let hasLiquidityPools = [];
    tokens.forEach(item => {
        let filterList = pools.filter(pool => {
            return item.address == pool.token0 || item.address == pool.token1;
        });
        if (filterList.length) {
            let updateItem = {
                address: item.address,
                is_add_liquidity: 1,
                is_remove_liquidity: item.is_remove_liquidity,
                liquidity_total: 0,
                reserve0: 0
            };
            filterList.forEach(pool => {
                if (pool.version == "uniswapv2" || pool.version == "camelotv2") {
                    let currentPool = pool;
                    updateItem.liquidity_total += Number(currentPool.totalSupply);
                    updateItem.reserve0 += item.address == currentPool.token0 ? Number(currentPool.reserve0) : Number(currentPool.reserve1);
                    currentPool.contract = item.address;
                    hasLiquidityPools.push(currentPool);
                }
                else if (pool.version == "uniswapv3") {
                    let currentPool = pool;
                    updateItem.liquidity_total += Number(currentPool.liquidity);
                    updateItem.reserve0 += item.address == currentPool.token0 ? Number(currentPool.reserve0) : Number(currentPool.reserve1);
                    currentPool.contract = item.address;
                    hasLiquidityPools.push(currentPool);
                }
            });
            updateList.push(updateItem);
        }
    });
    updateList.forEach(item => {
        item.liquidity_total = (0, bignumber_js_1.default)(item.liquidity_total).toFixed();
        item.reserve0 = (0, bignumber_js_1.default)(item.reserve0).toFixed();
        if ((item.is_add_liquidity == 1) && Number(item.liquidity_total) <= 1000) {
            item.is_remove_liquidity = 1;
        }
    });
    return { updateList, hasLiquidityPools };
};
exports.formatPool = formatPool;
//处理合约基本信息
const formatBaseData = async (list, chainID) => {
    let _list = [];
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
            };
            //批量生成pools
            let pools = await (0, help_1.generatePool)(items, chainID);
            if (pools) {
                items.pools = pools;
                _list.push(items);
            }
        }
    }
    return _list;
};
exports.formatBaseData = formatBaseData;
//处理已添加流动性的币价
const handleHasLiquidityPools = async (pool, tokenA, tokenB, chainID) => {
    let price;
    if (pool.version == 'uniswapv2') {
        price = await (0, help_1.computedV2Price)(tokenA, tokenB, pool, chainID);
    }
    else if (pool.version == 'uniswapv3') {
        price = await (0, help_1.computedV3Price)(tokenA, tokenB, pool, chainID);
    }
    else if (pool.version == 'camelotv2') {
        price = await (0, help_1.computedV2Price)(tokenA, tokenB, pool, chainID);
    }
    return price;
};
exports.handleHasLiquidityPools = handleHasLiquidityPools;
//处理创建合约event
const formartCreateContract = (transactions, chainID, web3) => {
    return new Promise(async (resolve) => {
        let contracts = [];
        let creators = [];
        for (let item of transactions) {
            let method = item.input.slice(0, 4);
            if (method === "0x60" && item.input.length > 2000 && item.to == null) {
                try {
                    let result = await web3.eth.getTransactionReceipt(item.hash);
                    if (result.contractAddress) {
                        contracts.push(result.contractAddress);
                        creators.push({ creator: result.from, address: result.contractAddress });
                    }
                }
                catch (error) {
                }
            }
        }
        if (contracts.length) {
            contracts = await (0, fetch_1.batchGetBaseData)(contracts, chainID);
            contracts = await (0, exports.formatBaseData)(contracts, chainID);
            contracts.forEach(item => {
                let _find = creators.find(items => {
                    return items.address == item.address;
                });
                if (_find) {
                    item.creator = _find.creator;
                }
            });
        }
        resolve(contracts);
    });
};
exports.formartCreateContract = formartCreateContract;
const formatUTCDate = () => {
    let date = new Date();
    let y = date.getUTCFullYear();
    let m = date.getUTCMonth();
    let d = date.getUTCDate();
    let h = date.getUTCHours();
    let M = date.getUTCMinutes();
    let s = date.getUTCSeconds();
    return `${y}-${(m + '').length == 2 ? m : '0' + m}-${(d + '').length == 2 ? d : '0' + d} ${(h + '').length == 2 ? h : '0' + h}:${(M + '').length == 2 ? M : '0' + M}:${(s + '').length == 2 ? s : '0' + s}`;
};
exports.formatUTCDate = formatUTCDate;
const formatFuckPools = (pools, chainId, swaps) => {
    let newPools = [];
    pools.forEach(item => {
        if (swaps) {
            if (swaps.indexOf(2) != -1 && item.version == "uniswapv2") {
                if (item.token0 == constrants_1.Config[chainId].stableContract[0] || item.token1 == constrants_1.Config[chainId].stableContract[0]) {
                    Object.assign(item, { tag: item.version });
                    newPools.push(item);
                }
            }
            if (swaps.indexOf(1) != -1 && item.version == "uniswapv3") {
                if (item.token0 == constrants_1.Config[chainId].stableContract[0] || item.token1 == constrants_1.Config[chainId].stableContract[0]) {
                    Object.assign(item, { tag: item.version });
                    newPools.push(item);
                }
            }
            if (swaps.indexOf(3) != -1 && item.version == "camelotv2") {
                if (item.token0 == constrants_1.Config[chainId].stableContract[0] || item.token1 == constrants_1.Config[chainId].stableContract[0]) {
                    Object.assign(item, { tag: item.version });
                    newPools.push(item);
                }
            }
        }
        else {
            Object.assign(item, { tag: item.version });
            newPools.push(item);
        }
    });
    return newPools;
};
exports.formatFuckPools = formatFuckPools;
//搜索合约
const queryContract = async (address, chainID) => {
    //获取合约基本资料
    let contracts = await (0, fetch_1.batchGetBaseData)([address], chainID);
    if (contracts[0]) {
        //整理合约基本资料
        contracts = await (0, exports.formatBaseData)(contracts, chainID);
        let contract = contracts[0];
        contract.creator = "0x0000000000000000000000000000000000000000";
        //获取初始价格
        let result = await (0, fetch_1.getFirstPrice)(contract);
        contract.first_price = result ? result.price : 0;
        contract.is_check_price = result ? 1 : 0;
        contract.block_number = result ? result.firstBlockNumber : 0;
        //获取有流动性的池子
        let pools = JSON.parse(contract.pools);
        pools = await (0, exports.batchAllPool)(pools, chainID);
        let { hasLiquidityPools } = (0, exports.formatPool)([contract], pools);
        await (0, exports.setToken)([contract], hasLiquidityPools, contract.chain_id);
        return contract;
    }
    else {
        return "";
    }
};
exports.queryContract = queryContract;
const checkPool = (contract, chainId) => {
    return new Promise(async (resolve) => {
        let pools = contract.pools ? JSON.parse(contract.pools) : [];
        pools = await (0, exports.batchAllPool)(pools, chainId);
        if (pools.length) {
            let { hasLiquidityPools } = (0, exports.formatPool)([contract], pools);
            resolve(hasLiquidityPools);
        }
        else {
            resolve([]);
        }
    });
};
exports.checkPool = checkPool;
const setToken = async (tokens, hasLiquidityPools, chainID) => {
    let config = constrants_1.Config[chainID];
    tokens = tokens.filter(item => {
        return item.chain_id == chainID;
    });
    let newTokens = {};
    let returnTokens = {};
    tokens = tokens.concat(config.stableToken);
    for (let item of tokens) {
        item.Token = (0, help_1.getToken)(item);
        newTokens[item.address] = item;
    }
    for (let item of hasLiquidityPools) {
        let token0 = newTokens[item.token0];
        let token1 = newTokens[item.token1];
        if (token0 && token1) {
            let price = await (0, exports.handleHasLiquidityPools)(item, token0.Token, token1.Token, chainID);
            let token = token0.address == item.contract ? token0 : token1;
            if (token.LiquidityPools) {
                token.LiquidityPools.push({
                    pool: item,
                    name: `${newTokens[item.token0].symbol}-${newTokens[item.token1].symbol}`,
                    version: item.version,
                    ...price
                });
            }
            else {
                token.LiquidityPools = [{
                        pool: item,
                        name: `${newTokens[item.token0].symbol}-${newTokens[item.token1].symbol}`,
                        version: item.version,
                        ...price
                    }];
            }
            newTokens[token.address] = token;
            returnTokens[token.address] = token.LiquidityPools;
        }
    }
    return returnTokens;
};
exports.setToken = setToken;
//添加多个合约
const addContract = async (addresses, chainID) => {
    const web3 = (0, help_1.getProvider)(chainID);
    let contracts = [];
    try {
        contracts = await (0, fetch_1.batchGetBaseData)(addresses, chainID);
        contracts = await (0, exports.formatBaseData)(contracts, chainID);
        if (chainID == 1) {
            let result = await (0, fetch_1.batchGetCreator)(addresses);
            contracts.forEach(item => {
                let find = result.find(items => {
                    return web3.utils.toChecksumAddress(items.contractAddress) == item.address;
                });
                if (find) {
                    item.block_number = find.blockNumber;
                    item.creator = find.contractCreator;
                }
            });
        }
        else {
            contracts.forEach(item => {
                item.creator = "0x0000000000000000000000000000000000000000";
            });
        }
    }
    catch (error) {
        let newList = [];
        for (let item of addresses) {
            try {
                let detail = await (0, fetch_1.getBaseData)(item, chainID);
                detail = await (0, exports.formatBaseData)([detail], chainID);
                if (chainID == 1) {
                    let result = await (0, fetch_1.batchGetCreator)([item]);
                    if (result.length) {
                        detail.block_number = result[0].blockNumber;
                        detail.creator = result[0].contractCreator;
                    }
                }
                else {
                    detail.creator = "0x0000000000000000000000000000000000000000";
                }
                newList.push(detail);
            }
            catch (error) {
                console.log(error);
            }
        }
        contracts = newList;
    }
    return contracts;
};
exports.addContract = addContract;
const getOtherToken = (addresses, swapEvents, chainId) => {
    addresses = addresses.concat(constrants_1.Config[chainId].stableContract);
    let effectiveAddresses = [];
    swapEvents.forEach(item => {
        if (addresses.indexOf(item.in_target) == -1) {
            effectiveAddresses.push(item.in_target);
        }
        if (addresses.indexOf(item.out_target) == -1) {
            effectiveAddresses.push(item.out_target);
        }
    });
    return new Set(effectiveAddresses);
};
exports.getOtherToken = getOtherToken;
//处理swapevent的所有地址
const handleSwapEventAddress = (swapEvents) => {
    let addresses = new Map();
    swapEvents.forEach(item => {
        if (constrants_1.Config[item.chain_id].stableContract.indexOf(item.in_target) == -1) {
            if (addresses.get(item.in_target)) {
                let update = addresses.get(item.in_target);
                update.count += 1;
                addresses.set(item.in_target, update);
            }
            else {
                addresses.set(item.in_target, {
                    address: item.in_target,
                    count: 1
                });
            }
        }
        if (constrants_1.Config[item.chain_id].stableContract.indexOf(item.out_target) == -1) {
            if (addresses.get(item.out_target)) {
                let update = addresses.get(item.out_target);
                update.count += 1;
                addresses.set(item.out_target, update);
            }
            else {
                addresses.set(item.out_target, {
                    address: item.out_target,
                    count: 1
                });
            }
        }
    });
    let setAddresses = [...addresses.values()];
    return lodash_1.default.orderBy(setAddresses, "count", "desc");
};
exports.handleSwapEventAddress = handleSwapEventAddress;
//获取合约所有持有人
const getAllHolder = async (contract, chainId) => {
    return new Promise(async (resolve) => {
        const web3 = (0, help_1.getProvider)(chainId);
        let allTransferEvents = await (0, fetch_1.getContractAllTransferEvent)(contract.address, contract.block_number, chainId);
        if (allTransferEvents) {
            let allTransferAddresses = [];
            allTransferEvents.forEach(item => {
                allTransferAddresses.push(web3.eth.abi.decodeParameter("address", item.topics[1]));
                allTransferAddresses.push(web3.eth.abi.decodeParameter("address", item.topics[2]));
            });
            let setAllAddresses = new Set(allTransferAddresses);
            let checkERC20Items = [];
            setAllAddresses.forEach(item => {
                checkERC20Items.push({
                    contractAddr: contract.address,
                    owner: item
                });
            });
            let allAddressBalance = await (0, fetch_1.batchCheckERC20Balance)(checkERC20Items, chainId);
            let formatBalance = [];
            allAddressBalance.forEach(item => {
                if (Number(item.balance) > 0) {
                    let percent = Number((Number(item.balance) / Number(contract.total_supply) * 100).toFixed(5));
                    formatBalance.push({
                        address: item.addr,
                        balance: (0, bignumber_js_1.default)(Number((Number(item.balance) / (10 ** Number(contract.decimals))).toFixed(5))).toFixed(),
                        percent
                    });
                }
            });
            resolve(lodash_1.default.orderBy(formatBalance, "balance", "desc"));
        }
        else {
            resolve([]);
        }
    });
};
exports.getAllHolder = getAllHolder;


/***/ }),

/***/ 24593:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.methods = exports.distribute = exports.execute = exports.execute2 = exports.multicall = exports.multicall2 = exports.multicall3 = void 0;
const web3_1 = __importDefault(__webpack_require__(3283));
const web3 = new web3_1.default();
const types_1 = __webpack_require__(21230);
const uniswapV31 = __importStar(__webpack_require__(95761));
const uniswapV32 = __importStar(__webpack_require__(38097));
const uniswapV2 = __importStar(__webpack_require__(23926));
const multicall3 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "bytes[]"], bytes);
    let sendParamss = [];
    let handleParamss = [];
    for (let item of params[1]) {
        let { sendParams, handleParams } = (0, exports.distribute)(item, chainId);
        if (sendParams) {
            sendParamss.push(sendParams);
        }
        if (handleParams) {
            handleParamss = handleParamss.concat(handleParams);
        }
    }
    return { sendParams: sendParamss, handleParams: handleParamss };
};
exports.multicall3 = multicall3;
const multicall2 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["bytes32", "bytes[]"], bytes);
    let sendParamss = [];
    let handleParamss = [];
    for (let item of params[1]) {
        let { sendParams, handleParams } = (0, exports.distribute)(item, chainId);
        if (sendParams) {
            sendParamss.push(sendParams);
        }
        if (handleParams) {
            handleParamss = handleParamss.concat(handleParams);
        }
    }
    return { sendParams: sendParamss, handleParams: handleParamss };
};
exports.multicall2 = multicall2;
const multicall = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter("bytes[]", bytes);
    let sendParamss = [];
    let handleParamss = [];
    for (let item of params) {
        let { sendParams, handleParams } = (0, exports.distribute)(item, chainId);
        if (sendParams) {
            sendParamss.push(sendParams);
        }
        if (handleParams) {
            handleParamss = handleParamss.concat(handleParams);
        }
    }
    let _findCreateAndInitializePoolIfNecessary = sendParamss.find(item => {
        return item.methodName == "createAndInitializePoolIfNecessary";
    });
    let _findDecreaseLiquidity = sendParamss.find(item => {
        return item.methodName == "decreaseLiquidity";
    });
    if (_findDecreaseLiquidity) {
        let findDecreaseLiquidity = handleParamss.find(item => {
            return item.methodName == "decreaseLiquidity";
        });
        let findSweepToken = handleParamss.find(item => {
            return item.methodName == "sweepToken";
        });
        if (findSweepToken) {
            findDecreaseLiquidity.target = findSweepToken.target;
            findDecreaseLiquidity.to = findSweepToken.to;
        }
        return { sendParams: _findDecreaseLiquidity, handleParams: [findDecreaseLiquidity] };
    }
    if (_findCreateAndInitializePoolIfNecessary) {
        let findCreateAndInitializePoolIfNecessary = handleParamss.find(item => {
            return item.methodName == "createAndInitializePoolIfNecessary";
        });
        let findMint = handleParamss.find(item => {
            return item.methodName == "mint";
        });
        if (findMint) {
            findCreateAndInitializePoolIfNecessary.amount = findMint.amount;
            findCreateAndInitializePoolIfNecessary.to = findMint.to;
        }
        return { sendParams: _findDecreaseLiquidity, handleParams: [findCreateAndInitializePoolIfNecessary] };
    }
    return { sendParams: sendParamss, handleParams: handleParamss };
};
exports.multicall = multicall;
const execute2 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["bytes", "bytes[]"], bytes);
    let commonds = web3.utils.hexToBytes(params[0]);
    let list = [];
    commonds.forEach((key, index) => {
        if (types_1.executeMethods[key]) {
            list = exports.methods[types_1.executeMethods[key]](params[1][index], chainId);
        }
    });
    return list;
};
exports.execute2 = execute2;
const execute = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["bytes", "bytes[]", "uint256"], bytes);
    let commonds = web3.utils.hexToBytes(params[0]);
    let list = [];
    commonds.forEach((key, index) => {
        if (types_1.executeMethods[key]) {
            list = exports.methods[types_1.executeMethods[key]](params[1][index], chainId);
        }
    });
    return list;
};
exports.execute = execute;
const distribute = (bytes, chainId) => {
    let methodHex = bytes.slice(0, 10);
    if (types_1.methodsEnum[methodHex]) {
        return exports.methods[types_1.methodsEnum[methodHex]](bytes, chainId);
    }
    else {
        return "";
    }
};
exports.distribute = distribute;
exports.methods = {
    multicall: exports.multicall,
    multicall2: exports.multicall2,
    multicall3: exports.multicall3,
    execute2: exports.execute2,
    execute: exports.execute,
    ...uniswapV31,
    ...uniswapV32,
    ...uniswapV2
};


/***/ }),

/***/ 23926:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.v2SwapExactOut = exports.v2SwapExactIn = exports.swapTokensForExactTokens = exports.swapTokensForExactETH = exports.swapExactTokensForTokensSupportingFeeOnTransferTokens = exports.swapExactTokensForTokens = exports.swapExactTokensForETHSupportingFeeOnTransferTokens = exports.swapExactTokensForETH = exports.swapExactETHForTokensSupportingFeeOnTransferTokens = exports.swapExactETHForTokens = exports.swapETHForExactTokens = exports.removeLiquidityWithPermit = exports.removeLiquidityETHSupportingFeeOnTransferTokens = exports.removeLiquidity = exports.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens = exports.removeLiquidityETHWithPermit = exports.addLiquidityETH = exports.addLiquidity = void 0;
const web3_1 = __importDefault(__webpack_require__(3283));
const web3 = new web3_1.default();
const constrants_1 = __webpack_require__(42654);
const addLiquidity = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["address", "address", "uint256", "uint256", "uint256", "uint256", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        tokenA: params[0],
        tokenB: params[1],
        amountADesired: params[2],
        amountBDesired: params[3],
        amountAMin: params[4],
        amountBMin: params[5],
        to: params[6],
        methodName: "addLiquidity",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.tokenA == constrants_1.Config[chainId].stableContract[0] ? sendParams.tokenB : sendParams.tokenA,
            amountIn: sendParams.amountADesired,
            amountOut: sendParams.amountADesired,
            to: sendParams.to,
            type: 3,
            methodName: "addLiquidity",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.addLiquidity = addLiquidity;
const addLiquidityETH = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "uint256", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        token: params[0],
        amountTokenDesired: params[1],
        amountTokenMin: params[2],
        amountETHMin: params[3],
        to: params[4],
        methodName: "addLiquidityETH",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.token,
            amountIn: "",
            amountOut: sendParams.amountTokenDesired,
            to: sendParams.to,
            methodName: "addLiquidityETH",
            version: "uniswapv2",
            type: 3,
        }];
    return { sendParams, handleParams };
};
exports.addLiquidityETH = addLiquidityETH;
const removeLiquidityETHWithPermit = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "uint256", "address", "uint256", "bool", "uint8", "bytes32", "bytes32"], bytes);
    let sendParams = {
        chainId: chainId,
        token: params[0],
        liquidity: params[1],
        amountTokenMin: params[2],
        amountETHMin: params[3],
        to: params[4],
        deadline: params[5],
        approveMax: params[6],
        v: params[7],
        r: params[8],
        s: params[9],
        methodName: "removeLiquidityETHWithPermit",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.token,
            liquidity: sendParams.liquidity,
            to: sendParams.to,
            methodName: "removeLiquidityETHWithPermit",
            version: "uniswapv2",
            type: 4
        }];
    return { sendParams, handleParams };
};
exports.removeLiquidityETHWithPermit = removeLiquidityETHWithPermit;
const removeLiquidityETHWithPermitSupportingFeeOnTransferTokens = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "uint256", "address", "uint256", "bool", "uint8", "bytes32", "bytes32"], bytes);
    let sendParams = {
        chainId: chainId,
        token: params[0],
        liquidity: params[1],
        amountTokenMin: params[2],
        amountETHMin: params[3],
        to: params[4],
        deadline: params[5],
        approveMax: params[6],
        v: params[7],
        r: params[8],
        s: params[9],
        methodName: "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.token,
            liquidity: sendParams.liquidity,
            to: sendParams.to,
            type: 4,
            methodName: "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens = removeLiquidityETHWithPermitSupportingFeeOnTransferTokens;
const removeLiquidity = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["address", "address", "uint256", "uint256", "uint256", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        tokenA: params[0],
        tokenB: params[1],
        liquidity: params[2],
        amountAMin: params[3],
        amountBMin: params[4],
        to: params[5],
        deadline: params[6],
        methodName: "removeLiquidity",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.tokenA,
            to: sendParams.to,
            type: 4,
            liquidity: sendParams.liquidity,
            amountIn: sendParams.amountAMin,
            amountOut: sendParams.amountBMin,
            methodName: "removeLiquidity",
            version: "uniswapv2"
        }, {
            chain_id: chainId,
            target: sendParams.tokenB,
            to: sendParams.to,
            type: 4,
            liquidity: sendParams.liquidity,
            amountIn: sendParams.amountAMin,
            amountOut: sendParams.amountBMin,
            methodName: "removeLiquidity",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.removeLiquidity = removeLiquidity;
const removeLiquidityETHSupportingFeeOnTransferTokens = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "uint256", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        token: params[0],
        liquidity: params[1],
        amountTokenMin: params[2],
        amountETHMin: params[3],
        to: params[4],
        deadline: params[5],
        methodName: "removeLiquidityETHSupportingFeeOnTransferTokens",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.token,
            amountIn: sendParams.amountETHMin,
            amountOut: sendParams.amountTokenMin,
            to: sendParams.to,
            type: 4,
            liquidity: sendParams.liquidity,
            methodName: "removeLiquidityETHSupportingFeeOnTransferTokens",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.removeLiquidityETHSupportingFeeOnTransferTokens = removeLiquidityETHSupportingFeeOnTransferTokens;
const removeLiquidityWithPermit = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["address", "address", "uint256", "uint256", "uint256", "address", "uint256", "bool", "uint8", "bytes32", "bytes32"], bytes);
    let sendParams = {
        chainId: chainId,
        tokenA: params[0],
        tokenB: params[1],
        liquidity: params[2],
        amountAMin: params[3],
        amountBMin: params[4],
        to: params[5],
        deadline: params[6],
        approveMax: params[7],
        v: params[8],
        r: params[9],
        s: params[10],
        methodName: "removeLiquidityWithPermit",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.tokenA,
            to: sendParams.to,
            type: 4,
            liquidity: sendParams.liquidity,
            amountIn: sendParams.amountAMin,
            amountOut: sendParams.amountBMin,
            methodName: "removeLiquidityWithPermit",
            version: "uniswapv2"
        }, {
            target: sendParams.tokenB,
            to: sendParams.to,
            type: 4,
            liquidity: sendParams.liquidity,
            amountIn: sendParams.amountAMin,
            amountOut: sendParams.amountBMin,
            methodName: "removeLiquidityWithPermit",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.removeLiquidityWithPermit = removeLiquidityWithPermit;
const swapETHForExactTokens = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "address[]", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        amountOut: params[0],
        path: params[1],
        to: params[2],
        deadline: params[3],
        methodName: "swapETHForExactTokens",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[1],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: "",
            amountOut: sendParams.amountOut,
            to: sendParams.to,
            type: 1,
            methodName: "swapETHForExactTokens",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.swapETHForExactTokens = swapETHForExactTokens;
const swapExactETHForTokens = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "address[]", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        amountOutMin: params[0],
        path: params[1],
        to: params[2],
        deadline: params[3],
        methodName: "swapExactETHForTokens",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[sendParams.path.length - 1],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: "",
            amountOut: sendParams.amountOutMin,
            to: sendParams.to,
            type: 1,
            methodName: "swapExactETHForTokens",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.swapExactETHForTokens = swapExactETHForTokens;
const swapExactETHForTokensSupportingFeeOnTransferTokens = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "address[]", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        amountOutMin: params[0],
        path: params[1],
        to: params[2],
        deadline: params[3],
        methodName: "swapExactETHForTokensSupportingFeeOnTransferTokens",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[sendParams.path.length - 1],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: "",
            amountOut: sendParams.amountOutMin,
            to: sendParams.to,
            type: 1,
            methodName: "swapExactETHForTokensSupportingFeeOnTransferTokens",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.swapExactETHForTokensSupportingFeeOnTransferTokens = swapExactETHForTokensSupportingFeeOnTransferTokens;
const swapExactTokensForETH = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapExactTokensForETH",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[0],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountIn,
            amountOut: sendParams.amountOutMin,
            to: sendParams.to,
            type: 2,
            methodName: "swapExactTokensForETH",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.swapExactTokensForETH = swapExactTokensForETH;
const swapExactTokensForETHSupportingFeeOnTransferTokens = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapExactTokensForETHSupportingFeeOnTransferTokens",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[0],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountIn,
            amountOut: sendParams.amountOutMin,
            to: sendParams.to,
            type: 2,
            methodName: "swapExactTokensForETHSupportingFeeOnTransferTokens",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.swapExactTokensForETHSupportingFeeOnTransferTokens = swapExactTokensForETHSupportingFeeOnTransferTokens;
const swapExactTokensForTokens = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapExactTokensForTokens",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[0],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountIn,
            amountOut: sendParams.amountOutMin,
            to: sendParams.to,
            type: 2,
            methodName: "swapExactTokensForTokens",
            version: "uniswapv2"
        }, {
            chain_id: chainId,
            target: sendParams.path[sendParams.path.length - 1],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountIn,
            amountOut: sendParams.amountOutMin,
            to: sendParams.to,
            type: 1,
            methodName: "swapExactTokensForTokens",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.swapExactTokensForTokens = swapExactTokensForTokens;
const swapExactTokensForTokensSupportingFeeOnTransferTokens = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[0],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountIn,
            amountOut: sendParams.amountOutMin,
            to: sendParams.to,
            methodName: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
            version: "uniswapv2",
            type: 2
        },
        {
            chain_id: chainId,
            target: sendParams.path[sendParams.path.length - 1],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountIn,
            amountOut: sendParams.amountOutMin,
            to: sendParams.to,
            methodName: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
            version: "uniswapv2",
            type: 1
        }
    ];
    return { sendParams, handleParams };
};
exports.swapExactTokensForTokensSupportingFeeOnTransferTokens = swapExactTokensForTokensSupportingFeeOnTransferTokens;
const swapTokensForExactETH = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        amountOut: params[0],
        amountInMax: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapTokensForExactETH",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[0],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountInMax,
            amountOut: sendParams.amountOut,
            to: sendParams.to,
            type: 2,
            methodName: "swapTokensForExactETH",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.swapTokensForExactETH = swapTokensForExactETH;
const swapTokensForExactTokens = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes);
    let sendParams = {
        chainId: chainId,
        amountOut: params[0],
        amountInMax: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapTokensForExactTokens",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[0],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountInMax,
            amountOut: sendParams.amountOut,
            to: sendParams.to,
            type: 2,
            methodName: "swapTokensForExactTokens",
            version: "uniswapv2"
        }, {
            chain_id: chainId,
            target: sendParams.path[sendParams.path.length - 1],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountInMax,
            amountOut: sendParams.amountOut,
            to: sendParams.to,
            type: 1,
            methodName: "swapTokensForExactTokens",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.swapTokensForExactTokens = swapTokensForExactTokens;
const v2SwapExactIn = (bytes, chainId) => {
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "address[]"], bytes);
    let sendParams = {
        chainId: chainId,
        amountIn: params[1],
        amountOut: params[2],
        path: params[3],
        to: params[0],
        methodName: "v2SwapExactIn",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[sendParams.path.length - 1],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountIn,
            amountOut: sendParams.amountOut,
            to: sendParams.to,
            type: constrants_1.Config[chainId].stableContract.indexOf(sendParams.path[sendParams.path.length - 1]) == -1 ? 1 : 2,
            methodName: "v2SwapExactIn",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.v2SwapExactIn = v2SwapExactIn;
const v2SwapExactOut = (bytes, chainId) => {
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "address[]"], bytes);
    let sendParams = {
        chainId: chainId,
        amountIn: params[1],
        amountOut: params[2],
        path: params[3],
        to: params[0],
        methodName: "v2SwapExactOut",
        version: "uniswapv2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[0],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountIn,
            amountOut: sendParams.amountOut,
            to: sendParams.to,
            type: 2,
            methodName: "v2SwapExactOut",
            version: "uniswapv2"
        }];
    return { sendParams, handleParams };
};
exports.v2SwapExactOut = v2SwapExactOut;


/***/ }),

/***/ 95761:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.mint = exports.createAndInitializePoolIfNecessary = exports.collect = exports.increaseLiquidity = exports.decreaseLiquidity = exports.sweepTokenWithFee = exports.unwrapWETH9WithFee = exports.v3SwapExactOut = exports.v3SwapExactIn = exports.unwrapWETH9 = exports.exactOutputSingle = exports.exactInputSingle = exports.exactOutput = exports.exactInput = exports.sweepToken = void 0;
const web3_1 = __importDefault(__webpack_require__(3283));
const web3 = new web3_1.default();
const Path = __importStar(__webpack_require__(1235));
const constrants_1 = __webpack_require__(42654);
const sweepToken = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "address"], bytes);
    let sendParams = {
        chainId: chainId,
        token: params[0],
        amountMinimum: params[1],
        recipient: params[2],
        methodName: "sweepToken",
        version: "uniswapv3-1"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.token,
            inTarget: sendParams.token,
            outTarget: sendParams.token,
            amountIn: "",
            amountOut: sendParams.amountMinimum,
            to: sendParams.recipient,
            type: 2,
            methodName: "sweepToken",
            version: "uniswapv3-1"
        }];
    return { sendParams, handleParams };
};
exports.sweepToken = sweepToken;
const exactInput = (bytes, chainId) => {
    bytes = bytes.slice(10);
    // 参数组解码,包含解码后参数值的对象，解码exactInput合约函数的event，获取函数参数
    let params = web3.eth.abi.decodeParameter([["bytes", "address", "uint256", "uint256", "uint256"]], bytes);
    let routes = Path.decodePath(params[0]);
    let sendParams = {
        chainId: chainId,
        inToken: routes[0].outToken,
        inAmount: params[3],
        outToken: routes[routes.length - 1].inToken,
        outAmount: params[4],
        recipient: params[1],
        methodName: "exactInput",
        version: "uniswapv3-1",
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.outToken,
            outTarget: sendParams.outToken,
            inTarget: sendParams.inToken,
            amountIn: sendParams.inAmount,
            amountOut: sendParams.outAmount,
            to: sendParams.recipient,
            type: 1,
            methodName: "exactInput",
            version: "uniswapv3-1",
        }];
    return { sendParams, handleParams };
};
exports.exactInput = exactInput;
const exactOutput = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["bytes", "address", "uint256", "uint256", "uint256"]], bytes);
    let routes = Path.decodePath(params[0]);
    let sendParams = {
        chainId: chainId,
        inToken: routes[routes.length - 1].inToken,
        inAmount: params[4],
        outToken: routes[0].outToken,
        outAmount: params[3],
        recipient: params[1],
        methodName: "exactOutput",
        version: "uniswapv3-1"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.inToken,
            outTarget: sendParams.outToken,
            inTarget: sendParams.inToken,
            amountIn: sendParams.inAmount,
            amountOut: sendParams.outAmount,
            to: sendParams.recipient,
            type: 2,
            methodName: "exactOutput",
            version: "uniswapv3-1",
        }];
    return { sendParams, handleParams };
};
exports.exactOutput = exactOutput;
const exactInputSingle = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "address", "uint256", "uint256", "uint256", "uint160"]], bytes);
    let sendParams = {
        chainId: chainId,
        tokenIn: params[0],
        tokenOut: params[1],
        fee: params[2],
        recipient: params[3],
        deadline: params[4],
        amountIn: params[5],
        amountOutMinimum: params[6],
        sqrtPriceLimitX96: params[7],
        methodName: "exactInputSingle",
        version: "uniswapv3-1"
    };
    let handleParams = [
        {
            chain_id: chainId,
            target: sendParams.tokenOut,
            outTarget: sendParams.tokenOut,
            inTarget: sendParams.tokenIn,
            amountIn: sendParams.amountIn,
            amountOut: sendParams.amountOutMinimum,
            to: sendParams.recipient,
            type: 1,
            methodName: "exactInputSingle",
            version: "uniswapv3-1"
        }
    ];
    return { sendParams, handleParams };
};
exports.exactInputSingle = exactInputSingle;
const exactOutputSingle = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "address", "uint256", "uint256", "uint256", "uint160"]], bytes);
    let sendParams = {
        chainId: chainId,
        inToken: params[0],
        inAmount: params[6],
        outToken: params[1],
        outAmount: params[5],
        recipient: params[3],
        methodName: "exactOutputSingle",
        version: "uniswapv3-1"
    };
    let handleParams = [
        {
            chain_id: chainId,
            target: sendParams.inToken,
            outTarget: sendParams.outToken,
            inTarget: sendParams.inToken,
            amountIn: sendParams.inAmount,
            amountOut: sendParams.outAmount,
            to: sendParams.recipient,
            type: 2,
            methodName: "exactOutputSingle",
            version: "uniswapv3-1"
        }
    ];
    return { sendParams, handleParams };
};
exports.exactOutputSingle = exactOutputSingle;
const unwrapWETH9 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "address"], bytes);
    let sendParams = {
        chainId: chainId,
        amount: params[0],
        recipient: params[1],
        methodName: "unwrapWETH9",
        version: "uniswapv3-1"
    };
    let handleParams = [{
            target: constrants_1.Config[chainId].stableContract[0],
            chain_id: chainId,
            outTarget: constrants_1.Config[chainId].stableContract[0],
            inTarget: constrants_1.Config[chainId].stableContract[0],
            amountIn: sendParams.amount,
            amountOut: sendParams.amount,
            to: sendParams.recipient,
            type: 2,
            methodName: "unwrapWETH9",
            version: "uniswapv3-1"
        }];
    return { sendParams, handleParams };
};
exports.unwrapWETH9 = unwrapWETH9;
const v3SwapExactIn = (bytes, chainId) => {
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "bytes"], bytes);
    let routes = Path.decodePath(params[3]);
    let sendParams = {
        chainId: chainId,
        inToken: routes[0].outToken,
        inAmount: params[1],
        outToken: routes[routes.length - 1].inToken,
        outAmount: params[2],
        recipient: params[0],
        methodName: "v3SwapExactIn",
        version: "uniswapv3-1",
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.outToken,
            outTarget: sendParams.outToken,
            inTarget: sendParams.inToken,
            amountIn: sendParams.inAmount,
            amountOut: sendParams.outAmount,
            to: sendParams.recipient,
            type: 1,
            methodName: "v3SwapExactIn",
            version: "uniswapv3-1",
        }];
    return { sendParams, handleParams };
};
exports.v3SwapExactIn = v3SwapExactIn;
const v3SwapExactOut = (bytes, chainId) => {
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "bytes"], bytes);
    let routes = Path.decodePath(params[3]);
    let sendParams = {
        chainId: chainId,
        inToken: routes[0].outToken,
        inAmount: params[1],
        outToken: routes[routes.length - 1].inToken,
        outAmount: params[2],
        recipient: params[0],
        methodName: "v3SwapExactOut",
        version: "uniswapv3-1",
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.inToken,
            outTarget: sendParams.outToken,
            inTarget: sendParams.inToken,
            amountIn: sendParams.inAmount,
            amountOut: sendParams.outAmount,
            to: sendParams.recipient,
            type: 2,
            methodName: "v3SwapExactOut",
            version: "uniswapv3-1",
        }];
    return { sendParams, handleParams };
};
exports.v3SwapExactOut = v3SwapExactOut;
const unwrapWETH9WithFee = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "address", "uint256", "address"], bytes);
    let sendParams = {
        chainId: chainId,
        amountMinimum: params[0],
        recipient: params[1],
        feeBips: params[2],
        feeRecipient: params[3],
        methodName: "unwrapWETH9WithFee",
        version: "uniswapv3-1"
    };
    let handleParams = [{
            target: constrants_1.Config[chainId].stableContract[0],
            chain_id: chainId,
            outTarget: constrants_1.Config[chainId].stableContract[0],
            inTarget: constrants_1.Config[chainId].stableContract[0],
            amountIn: sendParams.amountMinimum,
            amountOut: sendParams.amountMinimum,
            to: sendParams.recipient,
            type: 2,
            methodName: "unwrapWETH9WithFee",
            version: "uniswapv3-1"
        }];
    return { sendParams, handleParams };
};
exports.unwrapWETH9WithFee = unwrapWETH9WithFee;
const sweepTokenWithFee = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "address", "uint256", "address"], bytes);
    let sendParams = {
        chainId: chainId,
        token: params[0],
        amountMinimum: params[1],
        recipient: params[2],
        feeBips: params[3],
        feeRecipient: params[4],
        methodName: "sweepTokenWithFee",
        version: "uniswapv3-1"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.token,
            outTarget: sendParams.token,
            inTarget: sendParams.token,
            amountIn: sendParams.amountMinimum,
            amountOut: sendParams.amountMinimum,
            to: sendParams.recipient,
            type: 2,
            methodName: "sweepTokenWithFee",
            version: "uniswapv3-1"
        }];
    return { sendParams, handleParams };
};
exports.sweepTokenWithFee = sweepTokenWithFee;
const decreaseLiquidity = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["uint256", "uint128", "uint256", "uint256", "uint256"]], bytes);
    let sendParams = {
        chainId: chainId,
        tokenId: params[0],
        liquidity: params[1],
        amount0Min: params[2],
        amount1Min: params[3],
        deadline: params[4],
        methodName: "decreaseLiquidity",
        version: "uniswapv3-1"
    };
    let handleParams = [{
            chain_id: chainId,
            target: "",
            liquidity: sendParams.liquidity,
            to: "",
            type: 4,
            methodName: 'decreaseLiquidity',
            version: 'uniswapv3-1'
        }];
    return { sendParams, handleParams };
};
exports.decreaseLiquidity = decreaseLiquidity;
const increaseLiquidity = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["uint256", "uint256", "uint256", "uint256", "uint256", "uint256"]], bytes);
    let sendParams = {
        chainId: chainId,
        tokenId: params[0],
        amount0Desired: params[1],
        amount1Desired: params[2],
        amount0Min: params[3],
        amount1Min: params[4],
        deadline: params[5],
        methodName: "increaseLiquidity",
        version: "uniswapv3-1"
    };
    let handleParams = [{
            chain_id: chainId,
            target: "",
            amountIn: sendParams.amount0Desired,
            amountOut: sendParams.amount1Desired,
            to: "",
            type: 3,
            methodName: "increaseLiquidity",
            version: "uniswapv3-1"
        }];
    return { sendParams, handleParams };
};
exports.increaseLiquidity = increaseLiquidity;
const collect = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["uint256", "address", "uint128", "uint128"]], bytes);
    let sendParams = {
        chainId: chainId,
        tokenId: params[0],
        recipient: params[1],
        amount0Max: params[2],
        amount1Max: params[3],
        methodName: "collect",
        version: "uniswapv3-1"
    };
    let handleParams = [{
            chain_id: chainId,
            target: "",
            amountIn: sendParams.amount0Max,
            amountOut: sendParams.amount1Max,
            to: "",
            type: 2,
            methodName: "collect",
            version: "uniswapv3-1"
        }];
    return { sendParams, handleParams };
};
exports.collect = collect;
const createAndInitializePoolIfNecessary = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["address", "address", "uint24", "uint160"], bytes);
    let sendParams = {
        chainId: chainId,
        token0: params[0],
        token1: params[1],
        fee: params[2],
        sqrtPriceX96: params[3],
        methodName: "createAndInitializePoolIfNecessary",
        version: "uniswapv3-1"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.token0 == constrants_1.Config[chainId].stableContract[0] ? sendParams.token1 : sendParams.token0,
            amountIn: "",
            amountOut: "",
            to: "",
            type: 3,
            methodName: "createAndInitializePoolIfNecessary",
            version: "uniswapv3-1"
        }];
    return { sendParams, handleParams };
};
exports.createAndInitializePoolIfNecessary = createAndInitializePoolIfNecessary;
const mint = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "int24", "int24", "uint256", "uint256", "uint256", "uint256", "address", "uint256"]], bytes);
    let sendParams = {
        chainId: chainId,
        token0: params[0],
        token1: params[1],
        fee: params[2],
        tickLower: params[3],
        tickUpper: params[4],
        amount0Desired: params[5],
        amount1Desired: params[6],
        amount0Min: params[7],
        amount1Min: params[8],
        recipient: params[9],
        deadline: params[10],
        methodName: "mint",
        version: "uniswapv3-1"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.token0 == constrants_1.Config[chainId].stableContract[0] ? sendParams.token1 : sendParams.token0,
            amountIn: sendParams.amount0Desired,
            amountOut: sendParams.amount1Desired,
            to: sendParams.recipient,
            type: 3,
            methodName: "mint",
            version: "uniswapv3-1"
        }];
    return { sendParams, handleParams };
};
exports.mint = mint;


/***/ }),

/***/ 38097:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.swapExactTokensForTokens2 = exports.swapTokensForExactTokens2 = exports.mint2 = exports.increaseLiquidity2 = exports.exactOutputSingle2 = exports.exactInputSingle2 = exports.exactOutput2 = exports.exactInput2 = void 0;
const web3_1 = __importDefault(__webpack_require__(3283));
const web3 = new web3_1.default();
const Path = __importStar(__webpack_require__(1235));
const constrants_1 = __webpack_require__(42654);
const exactInput2 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["bytes", "address", "uint256", "uint256"]], bytes);
    let routes = Path.decodePath(params[0]);
    let sendParams = {
        chainId: chainId,
        inToken: routes[0].outToken,
        inAmount: params[2],
        outToken: routes[routes.length - 1].inToken,
        outAmount: params[3],
        recipient: params[1],
        methodName: "exactInput2",
        version: "uniswapv3-2",
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.outToken,
            outTarget: sendParams.outToken,
            inTarget: sendParams.inToken,
            amountIn: sendParams.inAmount,
            amountOut: sendParams.outAmount,
            to: sendParams.recipient,
            type: 1,
            methodName: "exactInput2",
            version: "uniswapv3-2",
        }];
    return { sendParams, handleParams };
};
exports.exactInput2 = exactInput2;
const exactOutput2 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["bytes", "address", "uint256", "uint256"]], bytes);
    let routes = Path.decodePath(params[0]);
    let sendParams = {
        chainId: chainId,
        inToken: routes[routes.length - 1].inToken,
        inAmount: params[3],
        outToken: routes[0].outToken,
        outAmount: params[2],
        recipient: params[1],
        methodName: "exactOutput2",
        version: "uniswapv3-2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.inToken,
            outTarget: sendParams.outToken,
            inTarget: sendParams.inToken,
            amountIn: sendParams.inAmount,
            amountOut: sendParams.outAmount,
            to: sendParams.recipient,
            type: 2,
            methodName: "exactOutput2",
            version: "uniswapv3-2",
        }];
    return { sendParams, handleParams };
};
exports.exactOutput2 = exactOutput2;
const exactInputSingle2 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "address", "uint256", "uint256", "uint160"]], bytes);
    let sendParams = {
        chainId: chainId,
        tokenIn: params[0],
        tokenOut: params[1],
        fee: params[2],
        recipient: params[3],
        amountIn: params[4],
        amountOutMinimum: params[5],
        sqrtPriceLimitX96: params[6],
        methodName: "exactInputSingle2",
        version: "uniswapv3-2"
    };
    let handleParams = [
        {
            chain_id: chainId,
            target: sendParams.tokenOut,
            outTarget: sendParams.tokenOut,
            inTarget: sendParams.tokenIn,
            amountIn: sendParams.amountIn,
            amountOut: sendParams.amountOutMinimum,
            to: sendParams.recipient,
            type: 1,
            methodName: "exactInputSingle2",
            version: "uniswapv3-2"
        }
    ];
    return { sendParams, handleParams };
};
exports.exactInputSingle2 = exactInputSingle2;
const exactOutputSingle2 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "address", "uint256", "uint256", "uint160"]], bytes);
    let sendParams = {
        chainId: chainId,
        inToken: params[0],
        inAmount: params[5],
        outToken: params[1],
        outAmount: params[4],
        recipient: params[3],
        methodName: "exactOutputSingle2",
        version: "uniswapv3-2"
    };
    let handleParams = [
        {
            chain_id: chainId,
            target: sendParams.inToken,
            outTarget: sendParams.outToken,
            inTarget: sendParams.inToken,
            amountIn: sendParams.inAmount,
            amountOut: sendParams.outAmount,
            to: sendParams.recipient,
            type: 2,
            methodName: "exactOutputSingle2",
            version: "uniswapv3-2"
        }
    ];
    return { sendParams, handleParams };
};
exports.exactOutputSingle2 = exactOutputSingle2;
const increaseLiquidity2 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let config = constrants_1.Config[chainId];
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint256", "uint256", "uint256"]], bytes);
    let sendParams = {
        chainId: chainId,
        token0: params[0],
        token1: params[1],
        tokenId: params[2],
        amount0Min: params[3],
        amount1Min: params[4],
        methodName: "increaseLiquidity2",
        version: "v3"
    };
    let handleParams = [{
            chain_id: chainId,
            target: params.token0 == config.stableContract[0] ? params.token1 : params.token0,
            amountIn: sendParams.amount0Min,
            amountOut: sendParams.amount1Min,
            to: "",
            type: 3,
            methodName: "increaseLiquidity2",
            version: "uniswapv3-2"
        }];
    return { sendParams, handleParams };
};
exports.increaseLiquidity2 = increaseLiquidity2;
const mint2 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "int24", "int24", "uint256", "uint256", "address"]], bytes);
    let sendParams = {
        chainId: chainId,
        token0: params[0],
        token1: params[1],
        fee: params[2],
        tickLower: params[3],
        tickUpper: params[4],
        amount0Min: params[5],
        amount1Min: params[6],
        recipient: params[7],
        methodName: "mint2",
        version: "uniswapv3-2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.token0 == constrants_1.Config[chainId].stableContract[0] ? sendParams.token1 : sendParams.token0,
            amountIn: sendParams.amount0Min,
            amountOut: sendParams.amount1Min,
            to: sendParams.recipient,
            type: 3,
            methodName: "mint2",
            version: "uniswapv3-2"
        }];
    return { sendParams, handleParams };
};
exports.mint2 = mint2;
const swapTokensForExactTokens2 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address"], bytes);
    let sendParams = {
        chainId: chainId,
        amountOut: params[0],
        amountInMax: params[1],
        path: params[2],
        to: params[3],
        methodName: "swapTokensForExactTokens2",
        version: "uniswapv3-2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            inTarget: sendParams.path[0],
            amountIn: sendParams.amountInMax,
            amountOut: sendParams.amountOut,
            to: sendParams.to,
            type: 2,
            methodName: "swapTokensForExactTokens2",
            version: "uniswapv3-2"
        }, {
            chain_id: chainId,
            target: sendParams.path[sendParams.path.length - 1],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountInMax,
            amountOut: sendParams.amountOut,
            to: sendParams.to,
            type: 1,
            methodName: "swapTokensForExactTokens2",
            version: "uniswapv3-2"
        }];
    return { sendParams, handleParams };
};
exports.swapTokensForExactTokens2 = swapTokensForExactTokens2;
const swapExactTokensForTokens2 = (bytes, chainId) => {
    bytes = bytes.slice(10);
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address"], bytes);
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        methodName: "swapExactTokensForTokens2",
        version: "uniswapv3-2"
    };
    let handleParams = [{
            chain_id: chainId,
            target: sendParams.path[sendParams.path.length - 1],
            inTarget: sendParams.path[0],
            outTarget: sendParams.path[sendParams.path.length - 1],
            amountIn: sendParams.amountIn,
            amountOut: sendParams.amountOutMin,
            to: sendParams.to,
            type: constrants_1.Config[chainId].stableContract.indexOf(sendParams.path[sendParams.path.length - 1]) == -1 ? 1 : 2,
            methodName: "swapExactTokensForTokens2",
            version: "uniswapv3-2"
        }];
    return { sendParams, handleParams };
};
exports.swapExactTokensForTokens2 = swapExactTokensForTokens2;


/***/ }),

/***/ 10849:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.telegramBatchFuckTugou = exports.encodeRsuhData = exports.sendSignedTransaction = exports.approveAll = exports.manualSwapSell = exports.manualSwapBuy = exports.encodeManualBuyCallData = exports.encodeManualSellCallData = exports.checkApprove = void 0;
const bignumber_js_1 = __importDefault(__webpack_require__(44431));
const path_1 = __webpack_require__(1235);
const abis_1 = __webpack_require__(83086);
const constrants_1 = __webpack_require__(42654);
const fetch_1 = __webpack_require__(96294);
const help_1 = __webpack_require__(53872);
const event_1 = __webpack_require__(87375);
//查看是否授权
const checkApprove = async (user, target, spender, amount, web3, privateKey) => {
    let contract = new web3.eth.Contract(abis_1.ERC20, target);
    let approveBalance = await contract.methods.allowance(user, spender).call();
    if (Number(approveBalance) >= Number(amount)) {
        return true;
    }
    else {
        return await (0, exports.approveAll)(target, spender, web3, privateKey);
    }
};
exports.checkApprove = checkApprove;
//手动卖请求打包
const encodeManualSellCallData = (manualParams, privateKey) => {
    let config = constrants_1.Config[manualParams.chainId];
    let web3 = (0, help_1.getProvider)(manualParams.chainId);
    let account = web3.eth.accounts.privateKeyToAccount(privateKey);
    let bytes = "";
    let router = "";
    if (manualParams.pool.tag == 'uniswapv3') {
        let contract = new web3.eth.Contract(abis_1.v3Router, config.v3Router);
        let tokenIn = manualParams.contract;
        let tokenOut = config.stableToken[0].address;
        const deadline = Math.round(new Date().getTime() / 1000) + 3600;
        let path = (0, path_1.encodePath)(tokenOut, tokenIn, manualParams.pool.fee);
        bytes = contract.methods.exactOutput([path, account.address, deadline, 0, (0, bignumber_js_1.default)(manualParams.amountIn).toFixed()]).encodeABI();
        router = config.v3Router;
    }
    else if (manualParams.pool.tag == 'uniswapv2') {
        let contract = new web3.eth.Contract(abis_1.v2Router, config.v2Router);
        let tokenIn = manualParams.contract;
        let tokenOut = config.stableToken[0].address;
        const deadline = Math.round(new Date().getTime() / 1000) + 3600;
        bytes = contract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens((0, bignumber_js_1.default)(manualParams.amountIn).toFixed(), 0, [tokenIn, tokenOut], account.address, deadline).encodeABI();
        router = config.v2Router;
    }
    else if (manualParams.pool.tag == 'camelotv2') {
        let contract = new web3.eth.Contract(abis_1.Camelot, config.camelotV2Router);
        let tokenIn = manualParams.contract;
        let tokenOut = config.stableToken[0].address;
        const deadline = Math.round(new Date().getTime() / 1000) + 3600;
        bytes = contract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens((0, bignumber_js_1.default)(manualParams.amountIn).toFixed(), 0, [tokenIn, tokenOut], account.address, "0x0000000000000000000000000000000000000000", deadline).encodeABI();
        router = config.camelotV2Router;
    }
    return { bytes, router };
};
exports.encodeManualSellCallData = encodeManualSellCallData;
//手动买请求打包
const encodeManualBuyCallData = (manualParams, privateKey) => {
    let config = constrants_1.Config[manualParams.chainId];
    let web3 = (0, help_1.getProvider)(manualParams.chainId);
    let account = web3.eth.accounts.privateKeyToAccount(privateKey);
    let allParams = [];
    if (manualParams.pool.tag == 'uniswapv3') {
        let contract = new web3.eth.Contract(abis_1.v3Router, config.v3Router);
        let tokenIn = config.stableToken[0].address;
        let tokenOut = manualParams.pool.token0 == config.stableToken[0].address ? manualParams.pool.token1 : manualParams.pool.token0;
        const deadline = Math.round(new Date().getTime() / 1000) + 86400;
        let bytes = contract.methods.exactInputSingle([tokenIn, tokenOut, manualParams.pool.fee, account.address, deadline, manualParams.amountIn, manualParams.amountOut, 0]).encodeABI();
        let params = {
            _pool: manualParams.pool.pool,
            _router: config.v3Router,
            _bytes: bytes
        };
        allParams.push(params);
    }
    else if (manualParams.pool.tag == 'uniswapv2') {
        let contract = new web3.eth.Contract(abis_1.v2Router, config.v2Router);
        let tokenIn = config.stableToken[0].address;
        let tokenOut = manualParams.pool.token0 == config.stableToken[0].address ? manualParams.pool.token1 : manualParams.pool.token0;
        const deadline = Math.round(new Date().getTime() / 1000) + 86400;
        let bytes = contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(manualParams.amountOut, [tokenIn, tokenOut], account.address, deadline).encodeABI();
        let params = {
            _pool: manualParams.pool.pool,
            _router: config.v2Router,
            _bytes: bytes
        };
        allParams.push(params);
    }
    else if (manualParams.pool.tag == 'camelotv2') {
        let contract = new web3.eth.Contract(abis_1.Camelot, config.camelotV2Router);
        let tokenIn = config.stableToken[0].address;
        let tokenOut = manualParams.pool.token0 == config.stableToken[0].address ? manualParams.pool.token1 : manualParams.pool.token0;
        const deadline = Math.round(new Date().getTime() / 1000) + 86400;
        let bytes = contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(manualParams.amountOut, [tokenIn, tokenOut], account.address, "0x0000000000000000000000000000000000000000", deadline).encodeABI();
        let params = {
            _pool: manualParams.pool.pool,
            _router: config.camelotV2Router,
            _bytes: bytes
        };
        allParams.push(params);
    }
    return allParams;
};
exports.encodeManualBuyCallData = encodeManualBuyCallData;
//手动买
const manualSwapBuy = async (manualParams, privateKey) => {
    return new Promise(async (resolve) => {
        let config = constrants_1.Config[manualParams.chainId];
        let web3 = (0, help_1.getProvider)(manualParams.chainId);
        let contract = new web3.eth.Contract(abis_1.Trade, config.DANDAOTrade);
        let allParams = (0, exports.encodeManualBuyCallData)(manualParams, privateKey);
        let encode = contract.methods.FuckTuGouBuy(manualParams.contract, manualParams.amountOut, 0, allParams).encodeABI();
        let account = web3.eth.accounts.privateKeyToAccount(privateKey);
        let preRequest = await (0, fetch_1.estimateGas)({
            from: account.address,
            to: config.DANDAOTrade,
            data: encode,
            value: (0, bignumber_js_1.default)(Number(manualParams.amountIn) + config.DANDAOFee).toFixed()
        }, web3);
        if (preRequest.success) {
            let nonce = await (0, fetch_1.getTransactionCount)(account.address, web3);
            let gasPrice = await (0, fetch_1.getGasPrice)(web3);
            let signTx = await web3.eth.accounts.signTransaction({
                nonce: nonce,
                from: account.address,
                to: config.DANDAOTrade,
                data: encode,
                gas: constrants_1.transactionGas[manualParams.chainId],
                maxFeePerGas: (0, bignumber_js_1.default)(Number(gasPrice) + manualParams.gasFee * 10 ** 9).toFixed(),
                maxPriorityFeePerGas: (0, bignumber_js_1.default)(manualParams.gasFee * 10 ** 9).toFixed(),
                value: (0, bignumber_js_1.default)(Number(manualParams.amountIn) + config.DANDAOFee).toFixed()
            }, account.privateKey);
            resolve({ success: true, signTx, msg: "预请求成功" });
        }
        else {
            resolve({ success: false, signTx: null, msg: preRequest.msg });
        }
    });
};
exports.manualSwapBuy = manualSwapBuy;
//手动卖
const manualSwapSell = async (manualParams, privateKey) => {
    return new Promise(async (resolve) => {
        let config = constrants_1.Config[manualParams.chainId];
        let web3 = (0, help_1.getProvider)(manualParams.chainId);
        let account = web3.eth.accounts.privateKeyToAccount(privateKey);
        let contract = new web3.eth.Contract(abis_1.Trade, config.DANDAOTrade);
        let { bytes, router } = (0, exports.encodeManualSellCallData)(manualParams, privateKey);
        let isApprove = await (0, exports.checkApprove)(account.address, manualParams.contract, config.DANDAOTrade, manualParams.amountIn, web3, privateKey);
        if (!isApprove) {
            resolve({ success: false, signTx: null, msg: "授权失败" });
            return;
        }
        let encode = contract.methods.FuckTuGouSell(manualParams.contract, router, manualParams.amountIn, manualParams.amountOut, bytes).encodeABI();
        let preRequest = await (0, fetch_1.estimateGas)({
            from: account.address,
            to: config.DANDAOTrade,
            data: encode,
            value: (0, bignumber_js_1.default)(config.DANDAOFee).toFixed()
        }, web3);
        if (preRequest.success) {
            let nonce = await (0, fetch_1.getTransactionCount)(account.address, web3);
            let gasPrice = await (0, fetch_1.getGasPrice)(web3);
            let signTx = await web3.eth.accounts.signTransaction({
                nonce: nonce,
                from: account.address,
                to: config.DANDAOTrade,
                data: encode,
                gas: constrants_1.transactionGas[manualParams.chainId],
                maxFeePerGas: (0, bignumber_js_1.default)(Number(gasPrice) + manualParams.gasFee * 10 ** 9).toFixed(),
                maxPriorityFeePerGas: (0, bignumber_js_1.default)(manualParams.gasFee * 10 ** 9).toFixed(),
                value: (0, bignumber_js_1.default)(config.DANDAOFee).toFixed()
            }, account.privateKey);
            resolve({ success: true, signTx, msg: "预请求成功" });
        }
        else {
            resolve({ success: false, signTx: null, msg: preRequest.msg });
        }
    });
};
exports.manualSwapSell = manualSwapSell;
const approveAll = async (target, spender, web3, privateKey) => {
    let account = web3.eth.accounts.privateKeyToAccount(privateKey);
    let contract = new web3.eth.Contract(abis_1.ERC20, target);
    let totalSupply = await contract.methods.totalSupply().call();
    let encode = contract.methods.approve(spender, totalSupply).encodeABI();
    let gas;
    try {
        gas = await web3.eth.estimateGas({
            from: account.address,
            to: target,
            data: encode,
        });
    }
    catch (err) {
        return false;
    }
    let gasPrice = await web3.eth.getGasPrice();
    let signTx = await web3.eth.accounts.signTransaction({
        from: account.address,
        to: target,
        data: encode,
        gas: gas,
        maxFeePerGas: (0, bignumber_js_1.default)(Number(gasPrice) + 5 * 10 ** 9).toFixed(),
        maxPriorityFeePerGas: (0, bignumber_js_1.default)(5 * 10 ** 9).toFixed(),
    }, privateKey);
    try {
        await web3.eth.sendSignedTransaction(signTx.rawTransaction);
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.approveAll = approveAll;
const sendSignedTransaction = async (target, chainId, signTx, type) => {
    return new Promise((resolve) => {
        let web3 = (0, help_1.getProvider)(chainId);
        web3.eth.sendSignedTransaction(signTx.rawTransaction).then(async (res) => {
            resolve({ target: target, chain_id: chainId, type: type, response_type: 1, msg: "swap成功", hash: res.transactionHash, transactionReceipt: res });
        }).catch(err => {
            resolve({ target: target, chain_id: chainId, type: type, response_type: 2, msg: err.message, hash: (0, help_1.getTransactionErrorHash)(err), transactionReceipt: (0, help_1.getTransactionErrorTransactionReceipt)(err) });
        });
    });
};
exports.sendSignedTransaction = sendSignedTransaction;
const encodeRsuhData = (pools, task) => {
    let config = constrants_1.Config[task.chain_id];
    let web3 = (0, help_1.getProvider)(task.chain_id);
    let account = web3.eth.accounts.privateKeyToAccount(task.private_key);
    let contract = new web3.eth.Contract(abis_1.Trade, config.DANDAOTrade);
    let allParams = [];
    pools.forEach(item => {
        if (item.version == 'uniswapv3') {
            let contract = new web3.eth.Contract(abis_1.v3Router, config.v3Router);
            let tokenIn = config.stableToken[0].address;
            let tokenOut = item.token0 == config.stableToken[0].address ? item.token1 : item.token0;
            const deadline = Math.round(new Date().getTime() / 1000) + 86400;
            let bytes = contract.methods.exactInputSingle([tokenIn, tokenOut, item.fee, account.address, deadline, (0, bignumber_js_1.default)(Number(task.amount) * 10 ** 18).toFixed(), 1, 0]).encodeABI();
            let params = {
                _pool: item.pool,
                _router: config.v3Router,
                _bytes: bytes
            };
            allParams.push(params);
        }
        else if (item.version == 'uniswapv2') {
            let contract = new web3.eth.Contract(abis_1.v2Router, config.v2Router);
            let tokenIn = config.stableToken[0].address;
            let tokenOut = item.token0 == config.stableToken[0].address ? item.token1 : item.token0;
            const deadline = Math.round(new Date().getTime() / 1000) + 86400;
            let bytes = contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(1, [tokenIn, tokenOut], account.address, deadline).encodeABI();
            let params = {
                _pool: item.pool,
                _router: config.v2Router,
                _bytes: bytes
            };
            allParams.push(params);
        }
        else if (item.version == 'camelotv2') {
            let contract = new web3.eth.Contract(abis_1.Camelot, config.camelotV2Router);
            let tokenIn = config.stableToken[0].address;
            let tokenOut = item.token0 == config.stableToken[0].address ? item.token1 : item.token0;
            const deadline = Math.round(new Date().getTime() / 1000) + 86400;
            let bytes = contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(1, [tokenIn, tokenOut], account.address, "0x0000000000000000000000000000000000000000", deadline).encodeABI();
            let params = {
                _pool: item.pool,
                _router: config.camelotV2Router,
                _bytes: bytes
            };
            allParams.push(params);
        }
    });
    return contract.methods.FuckTuGouBuy(task.target, 1, 0, allParams).encodeABI();
};
exports.encodeRsuhData = encodeRsuhData;
//批量开盘冲请求 
const telegramBatchFuckTugou = (taskList, chainId) => {
    return new Promise(async (resolve) => {
        let web3 = (0, help_1.getProvider)(chainId);
        let targets = taskList.map(item => item.target);
        let eligibleList = [];
        let config = constrants_1.Config[chainId];
        targets = [...new Set(targets)];
        let { transactionDetails, handleParams, transactions } = await (0, event_1.getBatchFuckBlockPendingEvent)(targets, chainId);
        let gasPrice = await (0, fetch_1.getGasPrice)(web3);
        if (transactionDetails.length) {
            for (let item of transactionDetails) {
                for (let task of taskList) {
                    if (task.target == item.target) {
                        let account = web3.eth.accounts.privateKeyToAccount(task.private_key);
                        let nonce = await (0, fetch_1.getTransactionCount)(account.address, web3);
                        let signTx = await web3.eth.accounts.signTransaction({
                            nonce: nonce,
                            from: account.address,
                            to: config.DANDAOTrade,
                            data: task.encode_data,
                            gas: constrants_1.transactionGas[task.chain_id],
                            maxFeePerGas: (0, bignumber_js_1.default)(Number(gasPrice) + task.gas_fee * 10 ** 9).toFixed(),
                            maxPriorityFeePerGas: (0, bignumber_js_1.default)(task.gas_fee * 10 ** 9).toFixed(),
                            value: (0, bignumber_js_1.default)(Number(task.amount) * 10 ** 18 + config.DANDAOFee).toFixed()
                        }, account.privateKey);
                        eligibleList.push({
                            ...task,
                            signTx
                        });
                    }
                }
            }
        }
        else {
            if (taskList.length) {
                let result = await (0, fetch_1.telegramBatchEstimateGas)(taskList, chainId);
                if (result.length) {
                    for (let item of result) {
                        let account = web3.eth.accounts.privateKeyToAccount(item.private_key);
                        let nonce = await (0, fetch_1.getTransactionCount)(account.address, web3);
                        let signTx = await web3.eth.accounts.signTransaction({
                            nonce: nonce,
                            from: account.address,
                            to: config.DANDAOTrade,
                            data: item.encode_data,
                            gas: item.gas,
                            maxFeePerGas: (0, bignumber_js_1.default)(Number(gasPrice) + item.gas_fee * 10 ** 9).toFixed(),
                            maxPriorityFeePerGas: (0, bignumber_js_1.default)(item.gas_fee * 10 ** 9).toFixed(),
                            value: (0, bignumber_js_1.default)(Number(item.amount) * 10 ** 18 + config.DANDAOFee).toFixed()
                        }, account.privateKey);
                        eligibleList.push({
                            ...item,
                            signTx
                        });
                    }
                }
            }
        }
        resolve({ eligibleList, handleParams, transactions });
    });
};
exports.telegramBatchFuckTugou = telegramBatchFuckTugou;


/***/ }),

/***/ 63607:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const node_schedule_1 = __importDefault(__webpack_require__(54221));
const web3_1 = __importDefault(__webpack_require__(3283));
const event_1 = __webpack_require__(87375);
const constrants_1 = __webpack_require__(42654);
const handle_1 = __webpack_require__(19586);
const fetch_1 = __webpack_require__(96294);
const help_1 = __webpack_require__(53872);
const fetch_2 = __webpack_require__(96294);
const eventEmiter_1 = __importDefault(__webpack_require__(66376));
__exportStar(__webpack_require__(19586), exports);
__exportStar(__webpack_require__(42654), exports);
__exportStar(__webpack_require__(87375), exports);
__exportStar(__webpack_require__(83086), exports);
__exportStar(__webpack_require__(96294), exports);
__exportStar(__webpack_require__(1235), exports);
__exportStar(__webpack_require__(53872), exports);
__exportStar(__webpack_require__(24593), exports);
__exportStar(__webpack_require__(10849), exports);
__exportStar(__webpack_require__(21230), exports);
class DANDAO {
    web3;
    isNode;
    currentBlockNumber = 0;
    isGetting = false;
    isGettingPending = false;
    config;
    eventInterVal;
    pendingInterVal;
    priceInterVal;
    chainID;
    wethPrice;
    tokens = {};
    taskTokens = {};
    eventEmiter;
    constructor(chainID, isNode) {
        this.isNode = isNode;
        this.chainID = chainID;
        this.eventEmiter = new eventEmiter_1.default();
        this.web3 = new web3_1.default(constrants_1.Config[chainID].prc);
        (0, help_1.configInitialization)([chainID]);
        this.config = constrants_1.Config[chainID];
        this.getEthPrice();
        if (chainID == 5) {
            (0, help_1.configInitialization)([1]);
        }
    }
    setPrc(prc) {
        constrants_1.Config[this.chainID].prc = prc;
        this.web3 = new web3_1.default(new web3_1.default.providers.HttpProvider(prc, { timeout: 60000 }));
        constrants_1.Config[this.chainID].provider = this.web3;
        if (this.chainID == 1) {
            constrants_1.Config[this.chainID].DANDAOFactoryContract = (0, fetch_2.getDanDaoContract)(this.chainID);
            constrants_1.Config[this.chainID].DANDAONFTFactoryContract = (0, fetch_2.getDanDaoNFTContract)(this.chainID);
        }
        else {
            constrants_1.Config[this.chainID].DANDAOFactoryContract = (0, fetch_2.getDanDaoContract)(this.chainID);
        }
    }
    async startBlockEvent(blockNumber = 0, callback) {
        this.eventEmiter.subscribe("eventCallback", callback);
        this.currentBlockNumber = blockNumber;
        if (this.isNode) {
            node_schedule_1.default.scheduleJob("*/10 * * * * *", async () => {
                this.getBlockEvent();
            });
        }
        else {
            this.eventInterVal = setInterval(() => {
                this.getBlockEvent();
            }, 10000);
        }
    }
    async getEthPrice() {
        let chainID = this.chainID == 5 ? 1 : this.chainID;
        let config = constrants_1.Config[chainID];
        let tokens = await (0, fetch_1.batchGetBaseData)([config.stableContract[0], config.stableContract[1]], chainID);
        if (tokens.length == 2) {
            let formartTokens = tokens.map(item => {
                return {
                    name: item.name,
                    chain_id: this.chainID,
                    address: item.contractAddr,
                    decimals: item.decimals,
                    symbol: item.symbol,
                };
            });
            let weth = (0, help_1.getToken)(formartTokens[0]);
            let usdc = (0, help_1.getToken)(formartTokens[1]);
            let computedPools = await (0, help_1.computedV3PairAddress)(weth, usdc, chainID);
            let pools = computedPools.map(item => {
                return item.pool;
            });
            let v3Pools = await (0, help_1.batchV3Pool)(pools, chainID, "uniswapv3");
            if (v3Pools.length) {
                let price = await (0, help_1.computedV3Price)(weth, usdc, v3Pools[0], chainID);
                this.wethPrice = price["WETH"];
            }
            if (this.isNode) {
                node_schedule_1.default.scheduleJob("*/10 * * * * *", async () => {
                    try {
                        let v3Pools = await (0, help_1.batchV3Pool)(pools, chainID, "uniswapv3");
                        if (v3Pools.length) {
                            let price = await (0, help_1.computedV3Price)(weth, usdc, v3Pools[0], chainID);
                            this.wethPrice = price["WETH"];
                        }
                    }
                    catch (error) {
                    }
                });
            }
            else {
                this.priceInterVal = setTimeout(async () => {
                    try {
                        let v3Pools = await (0, help_1.batchV3Pool)(pools, chainID, "uniswapv3");
                        if (v3Pools.length) {
                            let price = await (0, help_1.computedV3Price)(weth, usdc, v3Pools[0], chainID);
                            this.wethPrice = price["WETH"];
                        }
                    }
                    catch (error) {
                    }
                    this.getEthPrice();
                }, 10000);
            }
        }
        else {
            this.getEthPrice();
        }
    }
    async startBlockPendingEvent(callback) {
        this.eventEmiter.subscribe("pendingEventCallback", callback);
        if (this.isNode) {
            node_schedule_1.default.scheduleJob("*/2 * * * * *", async () => {
                let startTime = new Date().getTime();
                let result = await (0, event_1.getBlockPendingEvent)(this.chainID);
                this.pendingHanlder(result, new Date().getTime() - startTime);
            });
        }
        else {
            this.pendingInterVal = setInterval(async () => {
                let startTime = new Date().getTime();
                let result = await (0, event_1.getBlockPendingEvent)(this.chainID);
                this.pendingHanlder(result, new Date().getTime() - startTime);
            }, 2000);
        }
    }
    async stopBlockEvent() {
        clearInterval(this.eventInterVal);
        clearInterval(this.pendingInterVal);
        clearTimeout(this.priceInterVal);
    }
    pendingHanlder(res, ms) {
        let result = {
            model: "uniswap",
            chainId: this.config.chainID,
            createEvents: res.contracts,
            handleParams: res.handleParams,
            sendParams: res.sendParams,
            swapEvents: res.swapEvents,
            transactions: res.transactions,
            blockNumber: "pending",
            ms: ms
        };
        this.eventEmiter.emit("pendingEventCallback", { ...result });
    }
    async validateBlock(blockNumber) {
        try {
            let startTime = new Date().getTime();
            let events = await (0, event_1.getBlockEvent)(blockNumber - 3, blockNumber, this.config.chainID, this.web3);
            let result = {
                model: "uniswap",
                chainId: this.config.chainID,
                createEvents: events.contracts,
                handleParams: events.handleParams,
                sendParams: events.sendParams,
                transactions: events.transactions,
                swapEvents: events.swapEvents,
                blockNumber: blockNumber,
                ms: new Date().getTime() - startTime
            };
            this.eventEmiter.emit("eventCallback", { ...result });
        }
        catch (error) {
            console.log("失败了", error);
        }
    }
    async getBlockEvent() {
        let blockNumber;
        try {
            blockNumber = await this.web3.eth.getBlockNumber();
        }
        catch {
            return;
        }
        if (this.currentBlockNumber > blockNumber) {
            return;
        }
        let currentBlockNumber;
        currentBlockNumber = this.currentBlockNumber == 0 ? blockNumber : this.currentBlockNumber;
        try {
            let startTime = new Date().getTime();
            let events = await (0, event_1.getBlockEvent)(currentBlockNumber, blockNumber, this.config.chainID, this.web3);
            let result = {
                model: "uniswap",
                chainId: this.config.chainID,
                createEvents: events.contracts,
                handleParams: events.handleParams,
                sendParams: events.sendParams,
                transactions: events.transactions,
                swapEvents: events.swapEvents,
                blockNumber: blockNumber,
                ms: new Date().getTime() - startTime
            };
            this.eventEmiter.emit("eventCallback", { ...result });
            this.currentBlockNumber = blockNumber + 1;
        }
        catch (error) {
            console.log("失败了", error);
        }
    }
    async addContract(addresses, callback) {
        let constracts = await (0, handle_1.addContract)(addresses, this.chainID);
        callback(constracts);
    }
    async checkOwnerBurn(tokens) {
        tokens = tokens.filter(item => {
            return item.chain_id == this.chainID;
        });
        let addresses = tokens.map(item => {
            return item.address;
        });
        return await (0, handle_1.formatOwnerBurn)(addresses, this.chainID);
    }
}
exports["default"] = DANDAO;


/***/ }),

/***/ 97020:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const path = __webpack_require__(71017);
const log4js = __webpack_require__(60599);
class Logger {
    constructor() {
        this.init();
    }
    init() {
        log4js.configure({
            appenders: {
                smartMoney: {
                    type: 'dateFile',
                    pattern: '-yyyy-MM-dd.log',
                    alwaysIncludePattern: true,
                    encoding: 'utf-8',
                    filename: path.join(__dirname, 'logs', 'smartMoney')
                },
                mysql: {
                    type: 'dateFile',
                    pattern: '-yyyy-MM-dd.log',
                    alwaysIncludePattern: true,
                    encoding: 'utf-8',
                    filename: path.join(__dirname, 'logs', 'mysql')
                },
                out: {
                    type: 'console'
                }
            },
            categories: {
                default: { appenders: ['out'], level: 'info' },
                smartMoney: { appenders: ['smartMoney'], level: 'info' },
                mysql: { appenders: ['mysql'], level: 'info' },
            }
        });
    }
    smartMoneyLogger() {
        return log4js.getLogger('smartMoney');
    }
    mysqlLogger() {
        return log4js.getLogger('mysql');
    }
}
exports["default"] = Logger;


/***/ }),

/***/ 21230:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.executeMethods = exports.methodsEnum = void 0;
var methodsEnum;
(function (methodsEnum) {
    methodsEnum["0xb858183f"] = "exactInput2";
    methodsEnum["0xc04b8d59"] = "exactInput";
    methodsEnum["0x04e45aaf"] = "exactInputSingle2";
    methodsEnum["0x414bf389"] = "exactInputSingle";
    methodsEnum["0x09b81346"] = "exactOutput2";
    methodsEnum["0xf28c0498"] = "exactOutput";
    methodsEnum["0x5023b4df"] = "exactOutputSingle2";
    methodsEnum["0xdb3e2198"] = "exactOutputSingle";
    methodsEnum["0xac9650d8"] = "multicall";
    methodsEnum["0x1f0464d1"] = "multicall2";
    methodsEnum["0x5ae401dc"] = "multicall3";
    methodsEnum["0xdf2ab5bb"] = "sweepToken";
    methodsEnum["0xe0e189a0"] = "sweepTokenWithFee";
    methodsEnum["0x0c49ccbe"] = "decreaseLiquidity";
    methodsEnum["0xf100b205"] = "increaseLiquidity2";
    methodsEnum["0x219f5d17"] = "increaseLiquidity";
    methodsEnum["0x49404b7c"] = "unwrapWETH9";
    methodsEnum["0x9b2c0a37"] = "unwrapWETH9WithFee";
    methodsEnum["0xfc6f7865"] = "collect";
    methodsEnum["0x11ed56c9"] = "mint2";
    methodsEnum["0x88316456"] = "mint";
    methodsEnum["0x13ead562"] = "createAndInitializePoolIfNecessary";
    methodsEnum["0xe8e33700"] = "addLiquidity";
    methodsEnum["0xf305d719"] = "addLiquidityETH";
    methodsEnum["0xded9382a"] = "removeLiquidityETHWithPermit";
    methodsEnum["0x5b0d5984"] = "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens";
    methodsEnum["0xbaa2abde"] = "removeLiquidity";
    methodsEnum["0xaf2979eb"] = "removeLiquidityETHSupportingFeeOnTransferTokens";
    methodsEnum["0x2195995c"] = "removeLiquidityWithPermit";
    methodsEnum["0xfb3bdb41"] = "swapETHForExactTokens";
    methodsEnum["0x7ff36ab5"] = "swapExactETHForTokens";
    methodsEnum["0xb4822be3"] = "swapExactETHForTokensSupportingFeeOnTransferTokens2";
    methodsEnum["0xb6f9de95"] = "swapExactETHForTokensSupportingFeeOnTransferTokens";
    methodsEnum["0x18cbafe5"] = "swapExactTokensForETH";
    methodsEnum["0x52aa4c22"] = "swapExactTokensForETHSupportingFeeOnTransferTokens2";
    methodsEnum["0x791ac947"] = "swapExactTokensForETHSupportingFeeOnTransferTokens";
    methodsEnum["0x472b43f3"] = "swapExactTokensForTokens2";
    methodsEnum["0x38ed1739"] = "swapExactTokensForTokens";
    methodsEnum["0xac3893ba"] = "swapExactTokensForTokensSupportingFeeOnTransferTokens2";
    methodsEnum["0x5c11d795"] = "swapExactTokensForTokensSupportingFeeOnTransferTokens";
    methodsEnum["0x4a25d94a"] = "swapTokensForExactETH";
    methodsEnum["0x42712a67"] = "swapTokensForExactTokens2";
    methodsEnum["0x8803dbee"] = "swapTokensForExactTokens";
    methodsEnum["0x24856bc3"] = "execute2";
    methodsEnum["0x3593564c"] = "execute";
})(methodsEnum = exports.methodsEnum || (exports.methodsEnum = {}));
exports.executeMethods = {
    0: "v3SwapExactIn",
    1: "v3SwapExactOut",
    8: "v2SwapExactIn",
    9: "v2SwapExactOut",
};


/***/ }),

/***/ 66376:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const uuid_1 = __webpack_require__(42600);
class EventEmiter {
    //eventCallback  区块获取
    //pendingEventCallback pending区块获取
    //smartCallBack smartswap打出订单event回调
    callbacks = new Map();
    subscribe(method, callback, params) {
        let uuid = (0, uuid_1.v4)();
        if (this.callbacks.get(method)) {
            let methods = this.callbacks.get(method);
            let obj = {
                callback: callback,
                params: params
            };
            methods[uuid] = obj;
            this.callbacks.set(method, methods);
        }
        else {
            let methods = {};
            let obj = {
                callback: callback,
                params: params
            };
            methods[uuid] = obj;
            this.callbacks.set(method, methods);
        }
        return {
            remove: () => {
                let methods = this.callbacks.get(method);
                delete methods[uuid];
                this.callbacks.set(method, methods);
            }
        };
    }
    emit(method, params) {
        if (this.callbacks.get(method)) {
            let methods = this.callbacks.get(method);
            for (let key in methods) {
                let func = methods[key];
                func.callback(params, func.params);
            }
        }
    }
}
exports["default"] = EventEmiter;


/***/ }),

/***/ 96294:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.batchGetCreator = exports.getContractAllTransferEvent = exports.batchQueryENSname = exports.getNFTAllAddress = exports.batchGetCode = exports.checkApproveBalance = exports.getPendingBlock = exports.getBlockNumber = exports.getPendingEvent = exports.getDEXInfo = exports.getDecimals = exports.estimateGas = exports.telegramBatchEstimateGas = exports.batchCheckBalance = exports.batchCheckERC20Balance = exports.batchGETV3Pool = exports.batchGetPair = exports.getGasPrice = exports.getTransactionCount = exports.getBaseData = exports.batchGetBaseData = exports.batchGetTransactionCount = exports.getDanDaoNFTContract = exports.getBalance = exports.batchGetTransactionReceipt = exports.batchGetTransaction = exports.batchBlockRequest = exports.getFirstPrice = exports.getFirstTransactionBlockNumber = exports.getFirstPoolForBlockNumber = exports.batchGetTransferEvent = exports.getDanDaoContract = void 0;
const abis_1 = __webpack_require__(83086);
const help_1 = __webpack_require__(53872);
const axios_1 = __importDefault(__webpack_require__(43306));
const uuid_1 = __webpack_require__(42600);
const lodash_1 = __importDefault(__webpack_require__(96486));
const bignumber_js_1 = __importDefault(__webpack_require__(44431));
const constrants_1 = __webpack_require__(42654);
const ethers_1 = __webpack_require__(64211);
const web3_1 = __importDefault(__webpack_require__(3283));
const getDanDaoContract = (chainId) => {
    const config = (0, help_1.getConfig)(chainId);
    const web3 = (0, help_1.getProvider)(chainId);
    return new web3.eth.Contract(abis_1.DanDaoERC20Abi, config.DANDAOFactory);
};
exports.getDanDaoContract = getDanDaoContract;
//批量获取transfer event
const batchGetTransferEvent = (address, chainId, startBlock, blockCount = 200) => {
    return new Promise(async (resolve) => {
        const web3 = (0, help_1.getProvider)(chainId);
        web3.eth.getPastLogs({
            fromBlock: startBlock + 1,
            toBlock: startBlock + blockCount,
            address: address,
            topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]
        }).then(res => {
            resolve(res);
        }).catch(err => {
            resolve([]);
        });
    });
};
exports.batchGetTransferEvent = batchGetTransferEvent;
//获取第一个注入的池子
const getFirstPoolForBlockNumber = (contract) => {
    return new Promise(async (resolve) => {
        const config = (0, help_1.getConfig)(contract.chain_id);
        const web3 = (0, help_1.getProvider)(contract.chain_id);
        let toBlock = await web3.eth.getBlockNumber();
        let events = [];
        let tokenA = (0, help_1.getToken)({
            chain_id: contract.chain_id,
            address: contract.address,
            decimals: Number(contract.decimals),
            symbol: contract.symbol,
            name: contract.name,
        });
        let tokenB = (0, help_1.getToken)(config.stableToken[0]);
        let tokenList = [tokenA, tokenB];
        let [token0, token1] = tokenList[0].sortsBefore(tokenList[1]) ? [tokenList[0], tokenList[1]] : [tokenList[1], tokenList[0]];
        try {
            if (contract.chain_id == 42161) {
                let camelot = await web3.eth.getPastLogs({
                    fromBlock: contract.block_number,
                    toBlock: toBlock,
                    address: config.camelotFactory,
                    topics: ["0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9", web3.eth.abi.encodeParameter("address", token0.address), web3.eth.abi.encodeParameter("address", token1.address)]
                });
                let uniswapv2 = await web3.eth.getPastLogs({
                    fromBlock: contract.block_number,
                    toBlock: toBlock,
                    address: config.v2FactoryAddress,
                    topics: ["0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9", web3.eth.abi.encodeParameter("address", token0.address), web3.eth.abi.encodeParameter("address", token1.address)]
                });
                let uniswapv3 = await web3.eth.getPastLogs({
                    fromBlock: contract.block_number,
                    toBlock: toBlock,
                    address: config.v3FactoryAddress,
                    topics: ["0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118", web3.eth.abi.encodeParameter("address", token0.address), web3.eth.abi.encodeParameter("address", token1.address)]
                });
                events = camelot.concat(uniswapv2).concat(uniswapv3);
            }
            else {
                let uniswapv2 = await web3.eth.getPastLogs({
                    fromBlock: contract.block_number,
                    toBlock: toBlock,
                    address: config.v2FactoryAddress,
                    topics: ["0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9", web3.eth.abi.encodeParameter("address", token0.address), web3.eth.abi.encodeParameter("address", token1.address)]
                });
                let uniswapv3 = await web3.eth.getPastLogs({
                    fromBlock: contract.block_number,
                    toBlock: toBlock,
                    address: config.v3FactoryAddress,
                    topics: ["0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118", web3.eth.abi.encodeParameter("address", token0.address), web3.eth.abi.encodeParameter("address", token1.address)]
                });
                events = uniswapv2.concat(uniswapv3);
            }
        }
        catch (error) {
        }
        if (events.length) {
            events = lodash_1.default.orderBy(events, ["blockNumber"], ["asc"]);
            let firstPool = events[0];
            if (firstPool.address == config.camelotFactory) {
                let decode = web3.eth.abi.decodeParameters(["address", "uint256"], firstPool.data);
                resolve({
                    blockNumber: firstPool.blockNumber,
                    version: "camelotv2",
                    pool: decode[0],
                    token0: web3.eth.abi.decodeParameter("address", firstPool.topics[1]),
                    token1: web3.eth.abi.decodeParameter("address", firstPool.topics[2])
                });
            }
            else if (firstPool.address == config.v2FactoryAddress) {
                let decode = web3.eth.abi.decodeParameters(["address", "uint256"], firstPool.data);
                resolve({
                    blockNumber: firstPool.blockNumber,
                    version: "uniswapv2",
                    pool: decode[0],
                    token0: web3.eth.abi.decodeParameter("address", firstPool.topics[1]),
                    token1: web3.eth.abi.decodeParameter("address", firstPool.topics[2])
                });
            }
            else if (firstPool.address == config.v3FactoryAddress) {
                let decode = web3.eth.abi.decodeParameters(["uint256", "address"], firstPool.data);
                resolve({
                    blockNumber: firstPool.blockNumber,
                    version: "uniswapv3",
                    pool: decode[1],
                    token0: web3.eth.abi.decodeParameter("address", firstPool.topics[1]),
                    token1: web3.eth.abi.decodeParameter("address", firstPool.topics[2]),
                    fee: web3.eth.abi.decodeParameter("uint256", firstPool.topics[3]),
                });
            }
        }
        else {
            resolve(null);
        }
    });
};
exports.getFirstPoolForBlockNumber = getFirstPoolForBlockNumber;
//获取第一笔交易的blockNumber
const getFirstTransactionBlockNumber = (address, startNumber, chainId, count = 2000) => {
    return new Promise(async (resolve) => {
        const web3 = (0, help_1.getProvider)(chainId);
        web3.eth.getPastLogs({
            fromBlock: startNumber + 1,
            toBlock: startNumber + count,
            address: address,
            topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]
        }).then(async (res) => {
            if (res.length > 1) {
                lodash_1.default.sortBy(res, "blockNumber");
                resolve(res[1].blockNumber);
            }
            else {
                let blockNumber = await (0, exports.getFirstTransactionBlockNumber)(address, startNumber, chainId, count + 2000);
                resolve(blockNumber);
            }
        }).catch(err => {
            resolve(null);
        });
    });
};
exports.getFirstTransactionBlockNumber = getFirstTransactionBlockNumber;
//处理获取第一个注入池子的价格
const getFirstPrice = (contract) => {
    return new Promise(async (resolve) => {
        const web3 = (0, help_1.getProvider)(contract.chain_id);
        let firstBlockNumber = 0;
        let firstPool = await (0, exports.getFirstPoolForBlockNumber)(contract);
        let currentBlockNumber = await (0, exports.getBlockNumber)(contract.chain_id);
        let events = [];
        if (firstPool) {
            firstBlockNumber = firstPool.blockNumber;
            try {
                if (firstPool.version == "camelotv2") {
                    let list = await web3.eth.getPastLogs({
                        fromBlock: firstPool.blockNumber,
                        toBlock: currentBlockNumber - firstPool.blockNumber > 10000 ? firstPool.blockNumber + 10000 : currentBlockNumber,
                        address: firstPool.pool,
                        topics: ["0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f"]
                    });
                    if (list.length) {
                        list = lodash_1.default.orderBy(list, ["blockNumber"], ["asc"]);
                        list.forEach(item => {
                            item.decode = web3.eth.abi.decodeParameters(["uint256", "uint256"], item.data);
                        });
                        for (let event of list) {
                            let amount0 = 0;
                            let amount1 = 0;
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
                                };
                                events.push(params);
                                break;
                            }
                            else {
                                amount0 = Number(event.decode[0]);
                                amount1 = Number(event.decode[1]);
                            }
                        }
                    }
                }
                else if (firstPool.version == "uniswapv2") {
                    let list = await web3.eth.getPastLogs({
                        fromBlock: firstPool.blockNumber,
                        toBlock: currentBlockNumber - firstPool.blockNumber > 10000 ? firstPool.blockNumber + 10000 : currentBlockNumber,
                        address: firstPool.pool,
                        topics: ["0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f"]
                    });
                    if (list.length) {
                        list = lodash_1.default.orderBy(list, ["blockNumber"], ["asc"]);
                        list.forEach(item => {
                            item.decode = web3.eth.abi.decodeParameters(["uint256", "uint256"], item.data);
                        });
                        for (let event of list) {
                            let amount0 = 0;
                            let amount1 = 0;
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
                                };
                                events.push(params);
                                break;
                            }
                            else {
                                amount0 = Number(event.decode[0]);
                                amount1 = Number(event.decode[1]);
                            }
                        }
                    }
                }
                else if (firstPool.version == "uniswapv3") {
                    let list = await web3.eth.getPastLogs({
                        fromBlock: firstPool.blockNumber,
                        toBlock: currentBlockNumber - firstPool.blockNumber > 10000 ? firstPool.blockNumber + 10000 : currentBlockNumber,
                        address: firstPool.pool,
                        topics: ["0x7a53080ba414158be7ec69b987b5fb7d07dee101fe85488f0853ae16239d0bde"]
                    });
                    if (list.length) {
                        list = lodash_1.default.orderBy(list, ["blockNumber"], ["asc"]);
                        list.forEach(item => {
                            item.decode = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "uint256"], item.data);
                        });
                        let amount0 = 0;
                        let amount1 = 0;
                        for (let event of list) {
                            //检测是否是单边池子如果是那么累计到下一个池子
                            if (Number(event.decode[2]) > 0 && Number(event.decode[3]) > 0) {
                                let params = {
                                    amount0: (0, bignumber_js_1.default)(Number(event.decode[2]) + amount0).toFixed(),
                                    amount1: (0, bignumber_js_1.default)(Number(event.decode[3]) + amount1).toFixed(),
                                    token0: firstPool.token0,
                                    token1: firstPool.token1,
                                    blockNumber: event.blockNumber,
                                    pool: firstPool.pool,
                                    version: "uniswapv3"
                                };
                                events.push(params);
                                break;
                            }
                            else {
                                amount0 = Number(event.decode[2]);
                                amount1 = Number(event.decode[3]);
                            }
                        }
                    }
                }
            }
            catch (error) {
            }
        }
        let firstPrice = 0;
        let poolBalance = '0';
        if (events.length) {
            events = lodash_1.default.orderBy(events, ["blockNumber"], ["asc"]);
            for (let item of events) {
                //判断是否是单边池，如果是单边池子那么就下一个
                if (Number(item.amount0) > 0 && Number(item.amount1) > 0) {
                    //如果是神剑、sushi、v2 全部用v2获取
                    let firstPool = {
                        pool: item.pool,
                        reserve0: item.amount0,
                        reserve1: item.amount1,
                        token0: item.token0,
                        token1: item.token1,
                        totalSupply: "0",
                        blockTimestampLast: 0
                    };
                    poolBalance = firstPool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? firstPool.reserve0 : firstPool.reserve1;
                    let price = await (0, help_1.computedV2Price)(item.token0, item.token1, firstPool, contract.chain_id);
                    firstPrice = price ? price[contract.symbol] : 0.00000000001;
                    break;
                }
            }
        }
        resolve({ price: (0, bignumber_js_1.default)(firstPrice).toFixed(), poolBalance: (0, bignumber_js_1.default)((Number(poolBalance) / (10 ** 18)).toFixed(5)).toFixed(), firstBlockNumber });
    });
};
exports.getFirstPrice = getFirstPrice;
//批量获取区块信息
const batchBlockRequest = (startNumber, endNumber, chainId) => {
    return new Promise(async (resolve) => {
        try {
            const web3 = (0, help_1.getProvider)(chainId);
            let params = [];
            let transactions = [];
            for (let i = startNumber; i <= endNumber; i++) {
                params.push({
                    jsonrpc: '2.0',
                    id: (0, uuid_1.v4)(),
                    method: 'eth_getBlockByNumber',
                    params: [web3.utils.numberToHex(i), true],
                });
            }
            let res = await (0, axios_1.default)({
                url: constrants_1.Config[chainId].prc,
                method: "post",
                data: params
            });
            if (res.data) {
                res.data.forEach(item => {
                    if (item.result && item.result.transactions.length) {
                        item.result.transactions.forEach(transaction => {
                            transaction.blockNumber = (0, bignumber_js_1.default)(Number(ethers_1.BigNumber.from(transaction.blockNumber).toBigInt())).toFixed();
                            transaction.gas = (0, bignumber_js_1.default)(Number(ethers_1.BigNumber.from(transaction.gas).toBigInt())).toFixed();
                            transaction.gasPrice = (0, bignumber_js_1.default)(Number(ethers_1.BigNumber.from(transaction.gasPrice).toBigInt())).toFixed();
                            transaction.value = (0, bignumber_js_1.default)(Number(ethers_1.BigNumber.from(transaction.value).toBigInt())).toFixed();
                            transaction.transactionIndex = (0, bignumber_js_1.default)(Number(ethers_1.BigNumber.from(transaction.transactionIndex).toBigInt())).toFixed();
                            transaction.nonce = (0, bignumber_js_1.default)(Number(ethers_1.BigNumber.from(transaction.nonce).toBigInt())).toFixed();
                        });
                        transactions = transactions.concat(item.result.transactions);
                    }
                });
            }
            resolve(transactions);
        }
        catch (error) {
            resolve([]);
        }
    });
};
exports.batchBlockRequest = batchBlockRequest;
//批量获取交易详情
const batchGetTransaction = (hashs, chainId) => {
    return new Promise((resolve) => {
        if (hashs.length) {
            const web3 = (0, help_1.getProvider)(chainId);
            let batch = new web3.eth.BatchRequest();
            let transactions = [];
            let success = 0;
            hashs.forEach(item => {
                batch.add(web3.eth.getTransaction.request(item, (err, res) => {
                    success++;
                    if (res) {
                        transactions.push(res);
                    }
                    if (success == hashs.length) {
                        resolve(transactions);
                    }
                }));
            });
            batch.execute();
        }
        else {
            resolve([]);
        }
    });
};
exports.batchGetTransaction = batchGetTransaction;
//批量获取交易详情
const batchGetTransactionReceipt = (hashs, chainId) => {
    return new Promise((resolve) => {
        if (hashs.length) {
            const web3 = (0, help_1.getProvider)(chainId);
            let batch = new web3.eth.BatchRequest();
            let transactions = [];
            let success = 0;
            hashs.forEach(item => {
                batch.add(web3.eth.getTransactionReceipt.request(item, (err, res) => {
                    success++;
                    if (res) {
                        transactions.push(res);
                    }
                    if (success == hashs.length) {
                        resolve(transactions);
                    }
                }));
            });
            batch.execute();
        }
        else {
            resolve([]);
        }
    });
};
exports.batchGetTransactionReceipt = batchGetTransactionReceipt;
//获取eth余额
const getBalance = (chainId, address) => {
    return new Promise((resolve) => {
        const web3 = (0, help_1.getProvider)(chainId);
        web3.eth.getBalance(address).then(res => {
            resolve(res);
        }).catch(err => {
            resolve(null);
        });
    });
};
exports.getBalance = getBalance;
//获取dandao合约
const getDanDaoNFTContract = (chainId) => {
    const config = (0, help_1.getConfig)(chainId);
    const web3 = (0, help_1.getProvider)(chainId);
    return new web3.eth.Contract(abis_1.DanDaoNFTAbi, config.DANDAONFTFactory);
};
exports.getDanDaoNFTContract = getDanDaoNFTContract;
//批量获取地址交易数量
const batchGetTransactionCount = (addresses, chainId) => {
    return new Promise((resolve) => {
        const web3 = (0, help_1.getProvider)(chainId);
        let batch = new web3.eth.BatchRequest();
        let result = [];
        let success = 0;
        addresses.forEach(item => {
            batch.add(web3.eth.getTransactionCount.request(item.address, (err, res) => {
                success++;
                if (res) {
                    if (res < 3000) {
                        result.push({
                            address: item.address,
                            count: res,
                            name: item.name
                        });
                    }
                }
                if (success == addresses.length) {
                    resolve(result);
                }
            }));
        });
        batch.execute();
    });
};
exports.batchGetTransactionCount = batchGetTransactionCount;
//批量获取erc20基本资料
const batchGetBaseData = (addresses, chainId) => {
    return new Promise(async (resolve) => {
        try {
            let config = constrants_1.Config[chainId];
            for (let i = 0; i < addresses.length; i++) {
                if (config.ignoreToken.indexOf(addresses[i]) != -1) {
                    addresses.splice(i, 1);
                    i--;
                }
            }
            let chunkAddresses = lodash_1.default.chunk(addresses, 500);
            let result = [];
            let contract = constrants_1.Config[chainId].DANDAOFactoryContract;
            for (let item of chunkAddresses) {
                let contractResult = await contract.methods.batchBaseData(item).call();
                result = result.concat(contractResult);
            }
            resolve(result);
        }
        catch (error) {
            resolve([]);
        }
    });
};
exports.batchGetBaseData = batchGetBaseData;
//获取单个基本资料
const getBaseData = (address, chainId) => {
    return new Promise((resolve) => {
        const contract = constrants_1.Config[chainId].DANDAOFactoryContract;
        contract.methods.getBaseData(address).call().then(baseData => {
            resolve(baseData);
        }).catch(err => {
            resolve(false);
        });
    });
};
exports.getBaseData = getBaseData;
//获取交易noce
const getTransactionCount = (address, web3) => {
    return new Promise(async (resolve) => {
        try {
            let count = await web3.eth.getTransactionCount(address);
            resolve(count);
        }
        catch (error) {
            resolve(Math.round(new Date().getTime() / 1000));
        }
    });
};
exports.getTransactionCount = getTransactionCount;
//获取当前gasprice
const getGasPrice = (web3) => {
    return new Promise(async (resolve) => {
        try {
            let gasPrice = await web3.eth.getGasPrice();
            resolve(gasPrice);
        }
        catch (error) {
            resolve(100);
        }
    });
};
exports.getGasPrice = getGasPrice;
//获取v2 pair
const batchGetPair = (addresses, chainId) => {
    return new Promise(async (resolve) => {
        try {
            let chunkAddresses = lodash_1.default.chunk(addresses, 500);
            let result = [];
            let contract = constrants_1.Config[chainId].DANDAOFactoryContract ? constrants_1.Config[chainId].DANDAOFactoryContract : (0, exports.getDanDaoContract)(chainId);
            for (let item of chunkAddresses) {
                let contractResult = await contract.methods.batchGetPair(item).call();
                result = result.concat(contractResult);
            }
            resolve(result);
        }
        catch (error) {
            resolve([]);
        }
    });
};
exports.batchGetPair = batchGetPair;
//获取v3 pool
const batchGETV3Pool = (addresses, chainId) => {
    return new Promise(async (resolve) => {
        try {
            let chunkAddresses = lodash_1.default.chunk(addresses, 500);
            let result = [];
            let contract = constrants_1.Config[chainId].DANDAOFactoryContract ? constrants_1.Config[chainId].DANDAOFactoryContract : (0, exports.getDanDaoContract)(chainId);
            for (let item of chunkAddresses) {
                let contractResult = await contract.methods.batchPoolData(item).call();
                result = result.concat(contractResult);
            }
            resolve(result);
        }
        catch (error) {
            resolve([]);
        }
    });
};
exports.batchGETV3Pool = batchGETV3Pool;
//批量获取erc20的余额
const batchCheckERC20Balance = (checkERC20Items, chainId) => {
    return new Promise(async (resolve) => {
        try {
            let chunkCheckERC20Items = lodash_1.default.chunk(checkERC20Items, 500);
            let result = [];
            let contract;
            if (chainId == 1) {
                contract = constrants_1.Config[chainId].DANDAONFTFactoryContract ? constrants_1.Config[chainId].DANDAONFTFactoryContract : (0, exports.getDanDaoNFTContract)(chainId);
            }
            else {
                contract = constrants_1.Config[chainId].DANDAOFactoryContract ? constrants_1.Config[chainId].DANDAOFactoryContract : (0, exports.getDanDaoNFTContract)(chainId);
            }
            for (let item of chunkCheckERC20Items) {
                let contractResult = await contract.methods.batchCheckERC20Balance(item).call();
                result = result.concat(contractResult);
            }
            resolve(result);
        }
        catch (error) {
            console.log(error);
            resolve([]);
        }
    });
};
exports.batchCheckERC20Balance = batchCheckERC20Balance;
//批量获取地址eth余额
const batchCheckBalance = (addresses, chainId) => {
    return new Promise(async (resolve) => {
        try {
            let chunkAddresses = lodash_1.default.chunk(addresses, 500);
            let result = [];
            let contract;
            if (chainId == 1) {
                contract = constrants_1.Config[chainId].DANDAONFTFactoryContract ? constrants_1.Config[chainId].DANDAONFTFactoryContract : (0, exports.getDanDaoNFTContract)(chainId);
            }
            else {
                contract = constrants_1.Config[chainId].DANDAOFactoryContract ? constrants_1.Config[chainId].DANDAOFactoryContract : (0, exports.getDanDaoNFTContract)(chainId);
            }
            for (let item of chunkAddresses) {
                let contractResult = await contract.methods.batchCheckBalance(item).call();
                result = result.concat(contractResult);
            }
            resolve(result);
        }
        catch (error) {
            console.log(error);
            resolve([]);
        }
    });
};
exports.batchCheckBalance = batchCheckBalance;
//批量预执行获取gas
const telegramBatchEstimateGas = (tasks, chainId) => {
    return new Promise((resolve) => {
        const web3 = (0, help_1.getProvider)(chainId);
        let config = constrants_1.Config[chainId];
        let batch = new web3.eth.BatchRequest();
        let success = 0;
        let eigibleList = [];
        tasks.forEach(task => {
            let account = web3.eth.accounts.privateKeyToAccount(task.private_key);
            batch.add(web3.eth.estimateGas.request({
                from: account.address,
                to: config.DANDAOTrade,
                data: task.encode_data,
                value: (0, bignumber_js_1.default)(Number(Number(task.amount) * 10 ** 18) + config.DANDAOFee).toFixed()
            }, (err, res) => {
                success++;
                if (res) {
                    eigibleList.push({ ...task, gas: res });
                }
                if (success == tasks.length) {
                    resolve(eigibleList);
                }
            }));
        });
        batch.execute();
    });
};
exports.telegramBatchEstimateGas = telegramBatchEstimateGas;
//预执行获取gas
const estimateGas = (params, web3) => {
    return new Promise((resolve) => {
        web3.eth.estimateGas(params).then(gas => {
            resolve({
                success: true,
                gas: gas,
                msg: "预请求成功"
            });
        }).catch(err => {
            resolve({
                success: false,
                gas: 0,
                msg: err.message
            });
        });
    });
};
exports.estimateGas = estimateGas;
//获取decimls
const getDecimals = (address, chainId) => {
    return new Promise((resolve) => {
        const config = (0, help_1.getConfig)(chainId);
        const web3 = (0, help_1.getProvider)(chainId);
        const contract = new web3.eth.Contract(abis_1.ERC20, address);
        contract.methods.decimals().call().then(decimals => {
            resolve(decimals);
        }).then(err => {
            resolve(0);
        });
    });
};
exports.getDecimals = getDecimals;
//请求dextool基本资料
const getDEXInfo = (address, chainId) => {
    return new Promise((resolve) => {
        (0, axios_1.default)({
            url: `https://www.dextools.io/shared/data/pair?address=${address.toLocaleLowerCase()}&chain=${constrants_1.Config[chainId].name}&audit=true&locks=true`,
            method: "get"
        }).then(res => {
            if (res.data.data[0]) {
                resolve(res.data.data[0].token);
            }
            else {
                resolve(false);
            }
        }).catch(err => {
            resolve(false);
        });
    });
};
exports.getDEXInfo = getDEXInfo;
//获取pending event
const getPendingEvent = (chainId, blockNumber) => {
    return new Promise((resolve) => {
        const web3 = (0, help_1.getProvider)(chainId);
        web3.eth.getPastLogs({ fromBlock: blockNumber, toBlock: blockNumber }).then(events => {
            resolve(events);
        }).catch(err => {
            resolve(null);
        });
    });
};
exports.getPendingEvent = getPendingEvent;
const getBlockNumber = (chainId) => {
    return new Promise((resolve) => {
        const web3 = (0, help_1.getProvider)(chainId);
        web3.eth.getBlockNumber().then(blockNumber => {
            resolve(blockNumber);
        }).catch(err => {
            resolve(null);
        });
    });
};
exports.getBlockNumber = getBlockNumber;
//获取pendingblock信息
const getPendingBlock = (chainId) => {
    return new Promise((resolve) => {
        const web3 = (0, help_1.getProvider)(chainId);
        web3.eth.getBlock("pending", true).then(block => {
            resolve(block);
        }).catch(err => {
            resolve(null);
        });
    });
};
exports.getPendingBlock = getPendingBlock;
//查看授权
const checkApproveBalance = (user, target, spender, chainId) => {
    return new Promise(async (resolve) => {
        try {
            let web3 = (0, help_1.getProvider)(chainId);
            let contract = new web3.eth.Contract(abis_1.ERC20, target);
            let approveBalance = await contract.methods.allowance(user, spender).call();
            resolve(approveBalance);
        }
        catch (error) {
            resolve(0);
        }
    });
};
exports.checkApproveBalance = checkApproveBalance;
//批量检测地址是否是合约
const batchGetCode = (addresses, chainId) => {
    return new Promise((resolve) => {
        try {
            const web3 = (0, help_1.getProvider)(chainId);
            let batch = new web3.eth.BatchRequest();
            let success = 0;
            let result = [];
            addresses.forEach(item => {
                batch.add(web3.eth.getCode.request(item, (err, res) => {
                    success++;
                    if (res == "0x") {
                        result.push(item);
                    }
                    if (success == addresses.length) {
                        resolve(result);
                    }
                }));
            });
            batch.execute();
        }
        catch (error) {
            resolve([]);
        }
    });
};
exports.batchGetCode = batchGetCode;
//批量获取nft所有持有人地址
const getNFTAllAddress = (address, startToken, endToken) => {
    return new Promise((resolve) => {
        let conctract = (0, exports.getDanDaoNFTContract)(1);
        conctract.methods.getNftAllAddress(address, startToken, endToken).call().then(result => {
            resolve(result);
        }).catch(err => {
            resolve(null);
        });
    });
};
exports.getNFTAllAddress = getNFTAllAddress;
const batchQueryENSname = (addresses) => {
    return new Promise((resolve) => {
        const config = constrants_1.Config[1];
        const web3 = new web3_1.default(config.prc);
        let factoryContract = new web3.eth.Contract(abis_1.DanDaoNFTAbi, config.DANDAONFTFactory);
        let newList = (0, help_1.sliceAddresses)(addresses);
        let resultList = [];
        for (let item of newList) {
            let notes = [];
            for (let items of item) {
                notes.push((0, help_1.hexENSAddress)(items));
            }
            factoryContract.methods.batchQueryDNSName("0x74e20bd2a1fe0cdbe45b9a1d89cb7e0a45b36376", notes).call().then(result => {
                resultList.concat(result);
            }).catch(err => {
            });
        }
        resolve(resultList);
    });
};
exports.batchQueryENSname = batchQueryENSname;
//获取合约所有的转账记录
const getContractAllTransferEvent = (address, startBlock, chainId) => {
    return new Promise((resolve) => {
        const web3 = (0, help_1.getProvider)(chainId);
        web3.eth.getPastLogs({
            fromBlock: startBlock,
            toBlock: "latest",
            address: address,
            topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]
        }).then(result => {
            resolve(result);
        }).catch(err => {
            resolve([]);
        });
    });
};
exports.getContractAllTransferEvent = getContractAllTransferEvent;
//获取合约创建者
const batchGetCreator = (addresses) => {
    return new Promise(async (resolve) => {
        let sliceAddresses = lodash_1.default.chunk(addresses, 5);
        let all = [];
        for (let item of sliceAddresses) {
            try {
                let result = await (0, axios_1.default)({
                    url: `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${item.join(",")}&apikey=XJZ14US5XTCG3JR1V716UBJP7XQ2IVNZ3S`,
                    method: "get"
                });
                if (result.data.status == 1) {
                    all = all.concat(result.data.result);
                }
            }
            catch (error) {
                try {
                    let result = await (0, axios_1.default)({
                        url: `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${item.join(",")}&apikey=XJZ14US5XTCG3JR1V716UBJP7XQ2IVNZ3S`,
                        method: "get"
                    });
                    if (result.data.status == 1) {
                        all = all.concat(result.data.result);
                    }
                }
                catch {
                }
            }
        }
        let hashs = all.map(item => {
            return item.txHash;
        });
        let transactions = await (0, exports.batchGetTransaction)(hashs, 1);
        all.forEach(item => {
            let find = transactions.find(transaction => {
                return transaction.hash == item.txHash;
            });
            if (find) {
                item.blockNumber = find.blockNumber;
            }
        });
        resolve(all);
    });
};
exports.batchGetCreator = batchGetCreator;


/***/ }),

/***/ 53872:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatAmount = exports.queryReserves = exports.batchV3Pool = exports.batchV2Pool = exports.getTransactionErrorHash = exports.getTransactionErrorTransactionReceipt = exports.generatePool = exports.getToken = exports.computedV3Price = exports.computedV2Price = exports.batchGETPair = exports.getV2Pair = exports.configInitialization = exports.getConfig = exports.getProvider = exports.computedPancakeV3PairAddress = exports.computedPancakeV2PairAddress = exports.computedV2PairAddress = exports.computedCamelotPairAddress = exports.computedSuShiPairAddress = exports.computedV3PairAddress = exports.hexENSAddress = exports.sliceAddresses = exports.recoverAccount = void 0;
const solidity_1 = __webpack_require__(33777);
const address_1 = __webpack_require__(64594);
const sdk_core_1 = __webpack_require__(98260);
const constrants_1 = __webpack_require__(42654);
const fetch_1 = __webpack_require__(96294);
const sdk_1 = __webpack_require__(7155);
const v3_sdk_1 = __webpack_require__(17589);
const bignumber_js_1 = __importDefault(__webpack_require__(44431));
const dns_packet_1 = __importDefault(__webpack_require__(64568));
const web3_1 = __importDefault(__webpack_require__(3283));
const recoverAccount = (signature) => {
    let web3 = new web3_1.default();
    let r = signature.slice(0, 66);
    let s = "0x" + signature.slice(66, 130);
    let v = "0x" + signature.slice(130, 132);
    let account = web3.eth.accounts.recover("DAN DAO login", v, r, s);
    return account;
};
exports.recoverAccount = recoverAccount;
const sliceAddresses = (addresses) => {
    let length = Math.ceil(addresses.length / 50);
    let newList = [];
    for (let i = 0; i < length; i++) {
        newList.push(addresses.slice(i * 50, (i + 1) * 50));
    }
    return newList;
};
exports.sliceAddresses = sliceAddresses;
//hex地址
const hexENSAddress = (address) => {
    let name = `${address.toLowerCase().substring(2)}.addr.reverse`;
    return `0x${dns_packet_1.default.name.encode(name).toString('hex')}`;
};
exports.hexENSAddress = hexENSAddress;
//计算uniswapv3地址
const computedV3PairAddress = (tokenA, tokenB, chainID) => {
    return new Promise(async (resolve) => {
        const config = (0, exports.getConfig)(chainID);
        let list = [];
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await (0, fetch_1.batchGetBaseData)([tokenA, tokenB], chainID);
            let newList = [];
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    };
                    newList.push((0, exports.getToken)(items));
                }
            }
            list = newList;
        }
        else {
            list = [tokenA, tokenB];
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]];
            let pools = [];
            for (let item of constrants_1.FeeAmount) {
                const pool = (0, v3_sdk_1.computePoolAddress)({
                    factoryAddress: config.v3FactoryAddress,
                    fee: item,
                    tokenA: token0,
                    tokenB: token1
                });
                pools.push({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, fee: item, version: "uniswapv3" });
            }
            resolve(pools);
        }
        else {
            resolve([]);
        }
    });
};
exports.computedV3PairAddress = computedV3PairAddress;
//计算sushiv2地址
const computedSuShiPairAddress = (tokenA, tokenB, chainID) => {
    return new Promise(async (resolve) => {
        const config = (0, exports.getConfig)(chainID);
        let list = [];
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await (0, fetch_1.batchGetBaseData)([tokenA, tokenB], chainID);
            let newList = [];
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    };
                    newList.push((0, exports.getToken)(items));
                }
            }
            list = newList;
        }
        else {
            list = [tokenA, tokenB];
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]];
            let pool = (0, address_1.getCreate2Address)(config.v2FactoryAddress, (0, solidity_1.keccak256)(['bytes'], [(0, solidity_1.pack)(['address', 'address'], [token0.address, token1.address])]), "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303");
            resolve({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, version: "uniswapv2" });
        }
        else {
            resolve(null);
        }
    });
};
exports.computedSuShiPairAddress = computedSuShiPairAddress;
//计算神剑v2地址
const computedCamelotPairAddress = (tokenA, tokenB, chainID) => {
    return new Promise(async (resolve) => {
        const config = (0, exports.getConfig)(chainID);
        let list = [];
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await (0, fetch_1.batchGetBaseData)([tokenA, tokenB], chainID);
            let newList = [];
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    };
                    newList.push((0, exports.getToken)(items));
                }
            }
            list = newList;
        }
        else {
            list = [tokenA, tokenB];
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]];
            let pool = (0, address_1.getCreate2Address)(config.camelotFactory, (0, solidity_1.keccak256)(['bytes'], [(0, solidity_1.pack)(['address', 'address'], [token0.address, token1.address])]), "0xa856464ae65f7619087bc369daaf7e387dae1e5af69cfa7935850ebf754b04c1");
            resolve({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, version: "camelotv2" });
        }
        else {
            resolve(null);
        }
    });
};
exports.computedCamelotPairAddress = computedCamelotPairAddress;
//计算uniswapv2地址
const computedV2PairAddress = (tokenA, tokenB, chainID) => {
    return new Promise(async (resolve) => {
        const config = (0, exports.getConfig)(chainID);
        let list = [];
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await (0, fetch_1.batchGetBaseData)([tokenA, tokenB], chainID);
            let newList = [];
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    };
                    newList.push((0, exports.getToken)(items));
                }
            }
            list = newList;
        }
        else {
            list = [tokenA, tokenB];
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]];
            let pool = (0, address_1.getCreate2Address)(config.v2FactoryAddress, (0, solidity_1.keccak256)(['bytes'], [(0, solidity_1.pack)(['address', 'address'], [token0.address, token1.address])]), "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f");
            resolve({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, version: "uniswapv2" });
        }
        else {
            resolve(null);
        }
    });
};
exports.computedV2PairAddress = computedV2PairAddress;
//计算pancake v2 地址
const computedPancakeV2PairAddress = (tokenA, tokenB, chainID) => {
    return new Promise(async (resolve) => {
        const config = (0, exports.getConfig)(chainID);
        let list = [];
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await (0, fetch_1.batchGetBaseData)([tokenA, tokenB], chainID);
            let newList = [];
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    };
                    newList.push((0, exports.getToken)(items));
                }
            }
            list = newList;
        }
        else {
            list = [tokenA, tokenB];
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]];
            let pool = (0, address_1.getCreate2Address)(config.v2FactoryAddress, (0, solidity_1.keccak256)(['bytes'], [(0, solidity_1.pack)(['address', 'address'], [token0.address, token1.address])]), "0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5");
            resolve({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, version: "uniswapv2" });
        }
        else {
            resolve(null);
        }
    });
};
exports.computedPancakeV2PairAddress = computedPancakeV2PairAddress;
//计算pancake v2 地址
const computedPancakeV3PairAddress = (tokenA, tokenB, chainID) => {
    return new Promise(async (resolve) => {
        const config = (0, exports.getConfig)(chainID);
        let list = [];
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await (0, fetch_1.batchGetBaseData)([tokenA, tokenB], chainID);
            let newList = [];
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    };
                    newList.push((0, exports.getToken)(items));
                }
            }
            list = newList;
        }
        else {
            list = [tokenA, tokenB];
        }
        if (list.length == 2) {
            let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]];
            let pools = [];
            for (let item of constrants_1.FeeAmount) {
                let pool = (0, address_1.getCreate2Address)(config.v3FactoryAddress, (0, solidity_1.keccak256)(['bytes'], [(0, solidity_1.pack)(['address', 'address', "uint"], [token0.address, token1.address, item])]), "0x6ce8eb472fa82df5469c6ab6d485f17c3ad13c8cd7af59b3d4a8026c5ce0f7e2");
                pools.push({ token0: token0.address, token1: token1.address, pool: pool, name: `${token0.symbol}-${token1.symbol}`, fee: item, version: "uniswapv3" });
            }
            resolve(pools);
        }
        else {
            resolve(null);
        }
    });
};
exports.computedPancakeV3PairAddress = computedPancakeV3PairAddress;
//获取web3
const getProvider = (chainID) => {
    return constrants_1.Config[chainID].provider;
};
exports.getProvider = getProvider;
//获取全局配置
const getConfig = (chainID) => {
    return constrants_1.Config[chainID];
};
exports.getConfig = getConfig;
const configInitialization = (chainIds) => {
    chainIds.forEach(item => {
        const web3 = new web3_1.default(new web3_1.default.providers.HttpProvider(constrants_1.Config[item].prc, { timeout: 60000 }));
        constrants_1.Config[item].provider = web3;
        if (item == 1) {
            constrants_1.Config[item].DANDAOFactoryContract = (0, fetch_1.getDanDaoContract)(item);
            constrants_1.Config[item].DANDAONFTFactoryContract = (0, fetch_1.getDanDaoNFTContract)(item);
        }
        else {
            constrants_1.Config[item].DANDAOFactoryContract = (0, fetch_1.getDanDaoContract)(item);
        }
    });
};
exports.configInitialization = configInitialization;
//获取v2pool
const getV2Pair = (pairAddress, chainID) => {
    return new Promise(async (resolve) => {
        try {
            let list = await (0, fetch_1.batchGetPair)([pairAddress], chainID);
            resolve(list[0]);
        }
        catch (error) {
            resolve(null);
        }
    });
};
exports.getV2Pair = getV2Pair;
//批量获取v2pool
const batchGETPair = (pairAddresses, chainID) => {
    return new Promise(async (resolve) => {
        try {
            let list = await (0, fetch_1.batchGetPair)(pairAddresses, chainID);
            resolve(list);
        }
        catch (error) {
            resolve([]);
        }
    });
};
exports.batchGETPair = batchGETPair;
//计算v2价格
const computedV2Price = (tokenA, tokenB, v2Pool, chainID) => {
    return new Promise(async (resolve) => {
        let list = [];
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await (0, fetch_1.batchGetBaseData)([tokenA, tokenB], chainID);
            let newList = [];
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    };
                    newList.push((0, exports.getToken)(items));
                }
            }
            list = newList;
        }
        else {
            list = [tokenA, tokenB];
        }
        if (list.length == 2) {
            try {
                let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]]; // does safety checks
                let _reserve0 = (0, bignumber_js_1.default)(v2Pool.reserve0);
                let _reserve1 = (0, bignumber_js_1.default)(v2Pool.reserve1);
                let pair = new sdk_1.Pair(new sdk_1.TokenAmount(token0, _reserve0.toFixed()), new sdk_1.TokenAmount(token1, _reserve1.toFixed()));
                const token0Price = pair.token0Price;
                const token1Price = pair.token1Price;
                const res = {};
                res[token0Price.baseCurrency.symbol] = token0Price.toSignificant(token0Price.baseCurrency.decimals);
                res[token1Price.baseCurrency.symbol] = token1Price.toSignificant(token1Price.baseCurrency.decimals);
                resolve(res);
            }
            catch (error) {
                let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]]; // does safety checks
                const res = {};
                res[token0.symbol] = 0;
                res[token1.symbol] = 0;
                resolve(res);
            }
        }
        else {
            resolve(null);
        }
    });
};
exports.computedV2Price = computedV2Price;
//计算v3价格
const computedV3Price = (tokenA, tokenB, v3Pool, chainID) => {
    return new Promise(async (resolve) => {
        let list = [];
        if (typeof tokenA == "string" && typeof tokenB == "string") {
            list = await (0, fetch_1.batchGetBaseData)([tokenA, tokenB], chainID);
            let newList = [];
            for (let item of list) {
                if (item.name && item.symbol && Number(item.decimals)) {
                    let items = {
                        name: item.name,
                        chain_id: chainID,
                        address: item.contractAddr,
                        decimals: item.decimals,
                        symbol: item.symbol,
                    };
                    newList.push((0, exports.getToken)(items));
                }
            }
            list = newList;
        }
        else {
            list = [tokenA, tokenB];
        }
        if (list.length == 2) {
            try {
                let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]]; // does safety checks
                let target1_target2_POOL = new v3_sdk_1.Pool(token0, token1, Number(v3Pool.fee), v3Pool.slot0[0], v3Pool.liquidity.toString(), Number(v3Pool.slot0[1]));
                const token0Price = target1_target2_POOL.token0Price;
                const token1Price = target1_target2_POOL.token1Price;
                const res = {};
                res[token0Price.baseCurrency.symbol] = token0Price.toSignificant(token0Price.baseCurrency.decimals);
                res[token1Price.baseCurrency.symbol] = token1Price.toSignificant(token1Price.baseCurrency.decimals);
                resolve(res);
            }
            catch (error) {
                let [token0, token1] = list[0].sortsBefore(list[1]) ? [list[0], list[1]] : [list[1], list[0]]; // does safety checks
                const res = {};
                res[token0.symbol] = 0;
                res[token1.symbol] = 0;
                resolve(null);
            }
        }
        else {
            resolve(null);
        }
    });
};
exports.computedV3Price = computedV3Price;
//获取token
const getToken = (token) => {
    return new sdk_core_1.Token(Number(token.chain_id), token.address, Number(token.decimals), token.symbol, token.name);
};
exports.getToken = getToken;
//生成池子地址
const generatePool = async (token, chainID) => {
    return new Promise(async (resolve) => {
        const stableToken = constrants_1.Config[chainID].stableToken;
        let pools = [];
        if (chainID == 1) {
            for (let item of stableToken) {
                let tokenA = (0, exports.getToken)(item);
                let tokenB = (0, exports.getToken)(token);
                let result = await (0, exports.computedV2PairAddress)(tokenA, tokenB, chainID);
                pools.push(result);
            }
            for (let item of stableToken) {
                let tokenA = (0, exports.getToken)(item);
                let tokenB = (0, exports.getToken)(token);
                let result = await (0, exports.computedV3PairAddress)(tokenA, tokenB, chainID);
                pools = pools.concat(result);
            }
            if (pools.length == 4) {
                resolve(JSON.stringify(pools));
            }
            else {
                resolve(null);
            }
        }
        else if (chainID == 5) {
            for (let item of stableToken) {
                let tokenA = (0, exports.getToken)(item);
                let tokenB = (0, exports.getToken)(token);
                let result = await (0, exports.computedV2PairAddress)(tokenA, tokenB, chainID);
                pools.push(result);
            }
            for (let item of stableToken) {
                let tokenA = (0, exports.getToken)(item);
                let tokenB = (0, exports.getToken)(token);
                let result = await (0, exports.computedV3PairAddress)(tokenA, tokenB, chainID);
                pools = pools.concat(result);
            }
            if (pools.length == 4) {
                resolve(JSON.stringify(pools));
            }
            else {
                resolve(null);
            }
        }
        else if (chainID == 42161) {
            for (let item of stableToken) {
                let tokenA = (0, exports.getToken)(item);
                let tokenB = (0, exports.getToken)(token);
                let result = await (0, exports.computedSuShiPairAddress)(tokenA, tokenB, chainID);
                pools.push(result);
            }
            for (let item of stableToken) {
                let tokenA = (0, exports.getToken)(item);
                let tokenB = (0, exports.getToken)(token);
                let result = await (0, exports.computedCamelotPairAddress)(tokenA, tokenB, chainID);
                pools.push(result);
            }
            for (let item of stableToken) {
                let tokenA = (0, exports.getToken)(item);
                let tokenB = (0, exports.getToken)(token);
                let result = await (0, exports.computedV3PairAddress)(tokenA, tokenB, chainID);
                pools = pools.concat(result);
            }
            if (pools.length == 5) {
                resolve(JSON.stringify(pools));
            }
            else {
                resolve(null);
            }
        }
    });
};
exports.generatePool = generatePool;
const getTransactionErrorTransactionReceipt = (err) => {
    let transactionReceipt = {};
    try {
        let result = JSON.parse(err.message.replace("Transaction has been reverted by the EVM:", ""));
        transactionReceipt = result;
    }
    catch (error) {
    }
    return transactionReceipt;
};
exports.getTransactionErrorTransactionReceipt = getTransactionErrorTransactionReceipt;
//处理错误信息
const getTransactionErrorHash = (err) => {
    let hash = "";
    try {
        let result = JSON.parse(err.message.replace("Transaction has been reverted by the EVM:", ""));
        hash = result.transactionHash;
    }
    catch (error) {
    }
    return hash;
};
exports.getTransactionErrorHash = getTransactionErrorHash;
//批量获取v2池子信息
const batchV2Pool = (addresses, chainID, version) => {
    return new Promise(async (resolve) => {
        let result = await (0, fetch_1.batchGetPair)(addresses, chainID);
        let newList = [];
        result.forEach((item, index) => {
            if (Number(item.totalSupply) > 0) {
                let pool = {
                    pool: addresses[index],
                    reserve0: item.reserve0,
                    reserve1: item.reserve1,
                    token0: item.token0,
                    token1: item.token1,
                    blockTimestampLast: item.blockTimestampLast,
                    totalSupply: item.totalSupply,
                    version: version,
                };
                newList.push(pool);
            }
        });
        resolve(newList);
    });
};
exports.batchV2Pool = batchV2Pool;
//批量获取v3池子信息
const batchV3Pool = async (addresses, chainID, version) => {
    return new Promise(async (resolve) => {
        let result = await (0, fetch_1.batchGETV3Pool)(addresses, chainID);
        let newList = [];
        result.forEach((item, index) => {
            if (Number(item.liquidity) > 0) {
                let pool = {
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
                };
                newList.push(pool);
            }
        });
        if (newList.length) {
            newList = await (0, exports.queryReserves)(newList, chainID);
        }
        resolve(newList);
    });
};
exports.batchV3Pool = batchV3Pool;
//获取v3池子余额
const queryReserves = async (pools, chainID) => {
    return new Promise(async (resolve) => {
        let checkERC20s = [];
        pools.forEach(item => {
            checkERC20s.push({
                contractAddr: item.token0,
                owner: item.pool
            });
            checkERC20s.push({
                contractAddr: item.token1,
                owner: item.pool
            });
        });
        let result = await (0, fetch_1.batchCheckERC20Balance)(checkERC20s, chainID);
        pools.forEach(item => {
            let _findToken0 = result.find(token => {
                return token.contractAddr == item.token0 && token.addr == item.pool;
            });
            let _findToken1 = result.find(token => {
                return token.contractAddr == item.token1 && token.addr == item.pool;
            });
            if (_findToken0) {
                item.reserve0 = _findToken0.balance;
            }
            if (_findToken1) {
                item.reserve1 = _findToken1.balance;
            }
        });
        resolve(pools);
    });
};
exports.queryReserves = queryReserves;
const formatAmount = (amount, decimals) => {
    let newAmount = (0, bignumber_js_1.default)(Number(amount) / (10 ** decimals)).toFixed();
    let amountArr = newAmount.split(".");
    return Number(`${amountArr[0]}.${amountArr[1].substring(0, 3)}`);
};
exports.formatAmount = formatAmount;


/***/ }),

/***/ 1235:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.decodePath = exports.skipToken = exports.getFirstPool = exports.decodeFirstPool = exports.encodePath = exports.numPools = exports.hasMultiplePools = void 0;
const web3_1 = __importDefault(__webpack_require__(3283));
const web3 = new web3_1.default();
const hasMultiplePools = (path) => {
    return path.length >= 86;
};
exports.hasMultiplePools = hasMultiplePools;
const numPools = (path) => {
    // Ignore the first token address. From then on every fee and token offset indicates a pool.
    return ((path.length - 40) / 46);
};
exports.numPools = numPools;
const encodePath = (token0, token1, fee) => {
    let hexFees = {
        500: "0001f4",
        3000: "000bb8",
        10000: "002710"
    };
    token0 = token0.replace("0x", "");
    token1 = token1.replace("0x", "");
    return '0x' + token0.toLocaleLowerCase() + hexFees[fee] + token1.toLocaleLowerCase();
};
exports.encodePath = encodePath;
const decodeFirstPool = (path) => {
    let outToken = web3.utils.toChecksumAddress(`0x${path.slice(0, 40)}`);
    let fee = Number(web3.utils.hexToNumber(`0x${path.slice(40, 46)}`));
    let inToken = web3.utils.toChecksumAddress(`0x${path.slice(46, 86)}`);
    return { outToken, inToken, fee };
};
exports.decodeFirstPool = decodeFirstPool;
const getFirstPool = (path) => {
    return path.slice(0, 86);
};
exports.getFirstPool = getFirstPool;
/// @notice Skips a token + fee element from the buffer and returns the remainder
/// @param path The swap path
/// @return The remaining token + fee elements in the path
const skipToken = (path) => {
    return path.slice(46, path.length);
};
exports.skipToken = skipToken;
const decodePath = (path) => {
    path = path.replace("0x", "");
    let routes = [];
    while (true) {
        let hasMultiplePool = (0, exports.hasMultiplePools)(path);
        if (hasMultiplePool) {
            routes.push((0, exports.decodeFirstPool)(path));
            path = (0, exports.skipToken)(path);
        }
        else {
            break;
        }
    }
    return routes;
};
exports.decodePath = decodePath;


/***/ }),

/***/ 95094:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.homeKeyboard = exports.walletKeyboard = exports.addWalletKeyboard = exports.settingKeyboard = exports.topFifteenMinutesTemplate = exports.topFiveMinutesTemplate = exports.watchLogSellTemplate = exports.watchLogBuyTemplate = exports.editorWatchLogSellTemplate = exports.editorWatchLogBuyTemplate = exports.watchTemplate = exports.handleWatchTemplate = exports.rushTemplate = exports.walletTemplate = exports.addWalletTemplate = exports.networkTemplate = exports.goBackHomeTemplate = exports.homeTemplate = exports.contractTemplate = exports.rushDetailTemplate = exports.editorRushDetailTemplate = exports.createContractTemplate = exports.pickerWalletTempalte = exports.pickerTaskWalletTempalte = exports.pickerFollowWalletTempalte = exports.editorContractTemplate = exports.errorTamplate = exports.pendingTamplate = exports.buySuccessTemplate = exports.sellSuccessTemplate = exports.editorSellSuccessTemplate = exports.editorBuySuccessTemplate = exports.getDexTool = exports.getTxScan = exports.getScan = exports.chainEnum = exports.defaultKeyboard = exports.dexNames = exports.getTypeName = exports.formatUSDPrice = void 0;
const bignumber_js_1 = __importDefault(__webpack_require__(44431));
const constrants_1 = __webpack_require__(42654);
const fetch_1 = __webpack_require__(96294);
const web3_1 = __importDefault(__webpack_require__(3283));
const dayjs_1 = __importDefault(__webpack_require__(27484));
const formatUSDPrice = (price) => {
    if (price >= 0 && price < 1000) {
        return (0, bignumber_js_1.default)(price).toFixed();
    }
    else if (price >= 1000 && price < 1000000) {
        return (0, bignumber_js_1.default)(Number((price / 1000).toFixed(3))).toFixed() + 'K';
    }
    else if (price >= 1000000 && price < 1000000000) {
        return (0, bignumber_js_1.default)(Number((price / 1000000).toFixed(3))).toFixed() + 'M';
    }
    else if (price >= 1000000000) {
        return (0, bignumber_js_1.default)(Number((price / 1000000000).toFixed(3))).toFixed() + 'B';
    }
};
exports.formatUSDPrice = formatUSDPrice;
const getTypeName = (type) => {
    switch (type) {
        case 1:
            return "手动买入";
        case 2:
            return "手动卖出";
        case 3:
            return "跟单买入";
        case 4:
            return "跟单卖出";
        case 5:
            return "抢开盘";
        case 6:
            return "MEV";
        case 7:
            return "自动卖出";
    }
};
exports.getTypeName = getTypeName;
exports.dexNames = {
    1: {
        "uniswapv3": "uniswap V3",
        "uniswapv2": "uniswap V2"
    },
    5: {
        "uniswapv3": "uniswap V3",
        "uniswapv2": "uniswap V2"
    },
    42161: {
        "uniswapv3": "uniswap V3",
        "uniswapv2": "sushiswap",
        "camelotv2": "camelotswap"
    }
};
exports.defaultKeyboard = [
    {
        text: '↪️ 返回首页',
        callback_data: "go_home"
    }
];
exports.chainEnum = {
    1: "Ethereum",
    42161: "Arbitrum",
    5: "Goerli"
};
const getScan = (address, chainId) => {
    switch (chainId) {
        case 1:
            return `https://etherscan.io/token/${address}`;
        case 42161:
            return `https://arbiscan.io/token/${address}`;
        case 5:
            return `https://goerli.etherscan.io/token/${address}`;
    }
};
exports.getScan = getScan;
const getTxScan = (hash, chainId) => {
    switch (chainId) {
        case 1:
            return `https://etherscan.io/tx/${hash}`;
        case 42161:
            return `https://arbiscan.io/tx/${hash}`;
        case 5:
            return `https://goerli.etherscan.io/tx/${hash}`;
    }
};
exports.getTxScan = getTxScan;
const getDexTool = (address, chainId) => {
    switch (chainId) {
        case 1:
            return `https://dexscreener.com/ethereum/${address}`;
        case 42161:
            return `https://dexscreener.com/arbitrum/${address}`;
        case 5:
            return `https://dexscreener.com/ethereum/${address}`;
    }
};
exports.getDexTool = getDexTool;
const editorBuySuccessTemplate = async (bot, contract, user, currentGasPrice, wethPrice, log) => {
    let tx = (0, exports.getTxScan)(log.hash, contract.chain_id);
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let exchangeValue = 0;
    let receiveAddress = user.default_address;
    let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id);
    let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, log.address);
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5));
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let dex = (0, exports.getDexTool)(contract.address, contract.chain_id);
    let perPrice = (0, bignumber_js_1.default)(Number((Number(log.price) * wethPrice).toFixed(15))).toFixed();
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 买入：${log.in_amount} ETH</b>\n` +
        `<b>💵 收入：${log.out_amount} ${log.symbol}</b>\n` +
        `<b>🚨 类型：${(0, exports.getTypeName)(log.type)}</b>\n` +
        `<b>⏳ 状态：成功</b>\n` +
        `<b>💰 总支出：$ ${log.cost}</b>\n` +
        `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 买入前价格: $ ${perPrice}</b>\n` +
        `<b>💵 买入后价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${log.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    const buyKeyboard = [
        [
            {
                text: `📈 K线图`,
                url: dex
            },
        ],
        [
            {
                text: `⛽ (${user.manual_gas_fee} Gwei)`,
                callback_data: `/set_gas_fee 2 ${log.id}`
            },
            {
                text: `💦 滑点(${user.manual_swap_fee} %)`,
                callback_data: `/set_swap_fee 2 ${log.id}`
            },
        ],
        [
            {
                text: `💯 卖出比例(${user.sell_percent} %)`,
                callback_data: `/set_sell_percent 2 ${log.id} `
            }
        ],
        [
            {
                text: `🚀 卖出`,
                callback_data: `/sell ${contract.chain_id} ${contract.address} 2 ${log.id}`
            },
        ],
    ];
    bot.editMessageText(str, {
        chat_id: user.query.message.chat.id,
        message_id: user.query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": buyKeyboard
        }
    });
};
exports.editorBuySuccessTemplate = editorBuySuccessTemplate;
const editorSellSuccessTemplate = async (bot, contract, user, currentGasPrice, wethPrice, log) => {
    let tx = (0, exports.getTxScan)(log.hash, contract.chain_id);
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let exchangeValue = 0;
    let receiveAddress = user.default_address;
    let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id);
    let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, log.address);
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5));
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let dex = (0, exports.getDexTool)(contract.address, contract.chain_id);
    let perPrice = (0, bignumber_js_1.default)(Number((Number(log.price) * wethPrice).toFixed(15))).toFixed();
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 卖出：${log.in_amount} ${log.symbol}</b>\n` +
        `<b>💵 收入：${log.out_amount} ETH</b>\n` +
        `<b>🚨 类型：${(0, exports.getTypeName)(log.type)}</b>\n` +
        `<b>⏳ 状态：成功</b>\n` +
        `<b>💰 总收入：$ ${log.cost}</b>\n` +
        `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 卖出前价格: $ ${perPrice}</b>\n` +
        `<b>💵 卖出后价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 卖出地址:</b>\n` +
        `<b>${log.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    const buyKeyboard = [
        [
            {
                text: `📈 K线图`,
                url: dex
            },
        ],
        [
            {
                text: `⛽ (${user.manual_gas_fee} Gwei)`,
                callback_data: `/set_gas_fee 3 ${log.id}`
            },
            {
                text: `💦 滑点(${user.manual_swap_fee} %)`,
                callback_data: `/set_swap_fee 3 ${log.id}`
            },
        ],
        [
            {
                text: `💰 买入金额(${user.amount} ETH)`,
                callback_data: `/set_buy_amount 3 ${log.id}`
            }
        ],
        [
            {
                text: `🚀 买入`,
                callback_data: `/buy ${contract.chain_id} ${contract.address} 1 ${log.id}`
            },
        ],
    ];
    bot.editMessageText(str, {
        chat_id: user.query.message.chat.id,
        message_id: user.query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": buyKeyboard
        }
    });
};
exports.editorSellSuccessTemplate = editorSellSuccessTemplate;
const sellSuccessTemplate = async (bot, msg, contract, user, currentGasPrice, wethPrice, log) => {
    let tx = (0, exports.getTxScan)(log.hash, contract.chain_id);
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let exchangeValue = 0;
    let receiveAddress = user.default_address;
    let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id);
    let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, log.address);
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5));
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let dex = (0, exports.getDexTool)(contract.address, contract.chain_id);
    let perPrice = (0, bignumber_js_1.default)(Number((Number(log.price) * wethPrice).toFixed(15))).toFixed();
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 卖出：${log.in_amount} ${log.symbol}</b>\n` +
        `<b>💵 收入：${log.out_amount} ETH</b>\n` +
        `<b>🚨 类型：${(0, exports.getTypeName)(log.type)}</b>\n` +
        `<b>⏳ 状态：成功</b>\n` +
        `<b>💰 总收入：$ ${log.cost}</b>\n` +
        `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 卖出前价格: $ ${perPrice}</b>\n` +
        `<b>💵 卖出后价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 卖出地址:</b>\n` +
        `<b>${log.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    const buyKeyboard = [
        [
            {
                text: `📈 K线图`,
                url: dex
            },
        ],
        [
            {
                text: `⛽ (${user.manual_gas_fee} Gwei)`,
                callback_data: `/set_gas_fee 3 ${log.id}`
            },
            {
                text: `💦 滑点(${user.manual_swap_fee} %)`,
                callback_data: `/set_swap_fee 3 ${log.id}`
            },
        ],
        [
            {
                text: `💰 买入金额(${user.amount} ETH)`,
                callback_data: `/set_buy_amount 3 ${log.id}`
            }
        ],
        [
            {
                text: `🚀 买入`,
                callback_data: `/buy ${contract.chain_id} ${contract.address} 1 ${log.id}`
            },
        ],
    ];
    bot.sendMessage(msg.message.chat.id, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    });
};
exports.sellSuccessTemplate = sellSuccessTemplate;
const buySuccessTemplate = async (bot, msg, contract, user, currentGasPrice, wethPrice, log) => {
    let tx = (0, exports.getTxScan)(log.hash, contract.chain_id);
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let exchangeValue = 0;
    let receiveAddress = user.default_address;
    let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id);
    let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, log.address);
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5));
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let dex = (0, exports.getDexTool)(contract.address, contract.chain_id);
    let perPrice = (0, bignumber_js_1.default)(Number((Number(log.price) * wethPrice).toFixed(15))).toFixed();
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 买入：${log.in_amount} ETH</b>\n` +
        `<b>💵 收入：${log.out_amount} ${log.symbol}</b>\n` +
        `<b>🚨 类型：${(0, exports.getTypeName)(log.type)}</b>\n` +
        `<b>⏳ 状态：成功</b>\n` +
        `<b>💰 总支出：$ ${log.cost}</b>\n` +
        `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 买入前价格: $ ${perPrice}</b>\n` +
        `<b>💵 买入后价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${log.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    const buyKeyboard = [
        [
            {
                text: `📈 K线图`,
                url: dex
            },
        ],
        [
            {
                text: `⛽ (${user.manual_gas_fee} Gwei)`,
                callback_data: `/set_gas_fee 2 ${log.id}`
            },
            {
                text: `💦 滑点(${user.manual_swap_fee} %)`,
                callback_data: `/set_swap_fee 2 ${log.id}`
            },
        ],
        [
            {
                text: `💯 卖出比例(${user.sell_percent} %)`,
                callback_data: `/set_sell_percent 2 ${log.id}`
            }
        ],
        [
            {
                text: `🚀 卖出`,
                callback_data: `/sell ${contract.chain_id} ${contract.address} 2 ${log.id}`
            },
        ],
    ];
    bot.sendMessage(msg.message.chat.id, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    });
};
exports.buySuccessTemplate = buySuccessTemplate;
const pendingTamplate = async (bot, msg, contract, amount, hash, type) => {
    let tx = (0, exports.getTxScan)(hash, contract.chain_id);
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let amountIn = null;
    if (type == 1) {
        amountIn = `<b>💵 买入：${(0, bignumber_js_1.default)(amount).toFixed()} ETH</b>\n`;
    }
    else if (type == 2) {
        amountIn = `<b>💵 卖出：${(0, bignumber_js_1.default)(amount).toFixed()} ${contract.symbol}</b>\n`;
    }
    else if (type == 3) {
        amountIn = `<b>💵 跟单买入：${(0, bignumber_js_1.default)(amount).toFixed()} ETH</b>\n`;
    }
    else if (type == 4) {
        amountIn = `<b>💵 跟单卖出：${(0, bignumber_js_1.default)(amount).toFixed()} ${contract.symbol}</b>\n`;
    }
    else if (type == 5) {
        amountIn = `<b>💵 抢开盘：${(0, bignumber_js_1.default)(amount).toFixed()} ${contract.symbol}</b>\n`;
    }
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        amountIn +
        `<b>🚨 类型：${(0, exports.getTypeName)(type)}</b>\n` +
        `<b>⏳ 状态：pending</b>\n` +
        `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n`;
    bot.sendMessage(msg.message.chat.id, str, {
        "parse_mode": "HTML"
    });
};
exports.pendingTamplate = pendingTamplate;
const errorTamplate = async (bot, msg, contract, amount, hash, type, remark) => {
    let a = "";
    if (hash) {
        let tx = (0, exports.getTxScan)(hash, contract.chain_id);
        a = `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n`;
    }
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let amountIn = null;
    if (type == 1) {
        amountIn = `<b>💵 买入：${(0, bignumber_js_1.default)(amount).toFixed()} ETH</b>\n`;
    }
    else if (type == 2) {
        amountIn = `<b>💵 卖出：${(0, bignumber_js_1.default)(amount).toFixed()} ${contract.symbol}</b>\n`;
    }
    else if (type == 3) {
        amountIn = `<b>💵 跟单买入：${(0, bignumber_js_1.default)(amount).toFixed()} ETH</b>\n`;
    }
    else if (type == 4) {
        amountIn = `<b>💵 跟单卖出：${(0, bignumber_js_1.default)(amount).toFixed()} ${contract.symbol}</b>\n`;
    }
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        amountIn +
        `<b>🚨 类型：${(0, exports.getTypeName)(type)}</b>\n` +
        `<b>⏳ 状态：失败</b>\n` +
        `<b>📄 原因：${remark}</b>\n` +
        a;
    bot.sendMessage(msg.message.chat.id, str, {
        "parse_mode": "HTML"
    });
};
exports.errorTamplate = errorTamplate;
const editorContractTemplate = async (bot, contract, user, currentGasPrice, wethPrice) => {
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let exchangeValue = 0;
    if (user.default_address) {
        let receiveAddress = user.default_address;
        let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id);
        let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, user.default_address);
        if (coinBalance.length) {
            userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
        }
        userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
    }
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5));
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let dex = (0, exports.getDexTool)(contract.address, contract.chain_id);
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 默认地址:</b>\n` +
        `<b>${user.default_address ? user.default_address : '暂无设定地址'}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    const contractKeyboard = [
        [
            {
                text: `💳 (${user.default_address ? user.default_address.substring(user.default_address.length - 15, user.default_address.length) : '点击选择钱包'})`,
                callback_data: "picker_wallet"
            },
        ],
        [
            {
                text: `📈 K线图`,
                url: dex
            },
        ],
        [
            {
                text: `⛽ (${user.manual_gas_fee} Gwei)`,
                callback_data: `/set_gas_fee 1 0`
            },
            {
                text: `💦 滑点(${user.manual_swap_fee} %)`,
                callback_data: `/set_swap_fee 1 0`
            },
        ],
        [
            {
                text: `💰 买入金额(${user.amount} ETH)`,
                callback_data: `/set_buy_amount 1 0`
            }
        ],
        [
            {
                text: `💯 卖出比例(${user.sell_percent} %)`,
                callback_data: `/set_sell_percent 1 0`
            }
        ],
        [
            {
                text: `🚀 买入`,
                callback_data: `/buy ${contract.chain_id} ${contract.address} 1 0`
            },
            {
                text: `🚀 卖出`,
                callback_data: `/sell ${contract.chain_id} ${contract.address} 2 0`
            },
        ],
    ];
    bot.editMessageText(str, {
        chat_id: user.query.message.chat.id,
        message_id: user.query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": contractKeyboard
        }
    });
};
exports.editorContractTemplate = editorContractTemplate;
const pickerFollowWalletTempalte = async (bot, msg, db, watchId) => {
    let wallets = await db.select("wallet", [`telegram_id=${msg.from.id}`]);
    let str = ``;
    if (wallets.length) {
        str += `<b>请选择一个钱包</b>`;
    }
    else {
        str = "<b>还未绑定钱包，请先进行钱包绑定</b>";
    }
    let find = await db.find("watch", [`id=${watchId}`, `telegram_id=${msg.from.id}`]);
    if (find) {
        let keyboard = [];
        wallets.forEach((item, index) => {
            let showAddr = item.address.substring(0, 15) + '···' + item.address.substring(item.address.length - 15, item.address.length);
            keyboard.push([
                {
                    text: showAddr,
                    callback_data: `/set_follow_wallet ${index} ${watchId}`
                }
            ]);
        });
        if (!wallets.length) {
            keyboard.push([{
                    text: '💳 添加钱包',
                    callback_data: "go_home"
                }]);
        }
        keyboard.push([{
                text: '↪️ 返回',
                callback_data: `/handle_watch ${find.address}`
            }]);
        bot.editMessageText(str, {
            chat_id: msg.message.chat.id,
            message_id: msg.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                "inline_keyboard": keyboard
            }
        });
    }
};
exports.pickerFollowWalletTempalte = pickerFollowWalletTempalte;
const pickerTaskWalletTempalte = async (bot, msg, task, db) => {
    let wallets = await db.select("wallet", [`telegram_id=${msg.from.id}`]);
    let str = ``;
    if (wallets.length) {
        str += `<b>请选择一个钱包</b>`;
    }
    else {
        str = "<b>还未绑定钱包，请先进行钱包绑定</b>";
    }
    let keyboard = [];
    wallets.forEach((item, index) => {
        let showAddr = item.address.substring(0, 15) + '···' + item.address.substring(item.address.length - 15, item.address.length);
        keyboard.push([
            {
                text: showAddr,
                callback_data: `/set_task_wallet ${index} ${task.id}`
            }
        ]);
    });
    if (!wallets.length) {
        keyboard.push([{
                text: '💳 添加钱包',
                callback_data: "go_home"
            }]);
    }
    bot.editMessageText(str, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": keyboard
        }
    });
};
exports.pickerTaskWalletTempalte = pickerTaskWalletTempalte;
const pickerWalletTempalte = async (bot, msg, db) => {
    let wallets = await db.select("wallet", [`telegram_id=${msg.from.id}`]);
    let str = ``;
    if (wallets.length) {
        str += `<b>请选择一个钱包</b>`;
    }
    else {
        str = "<b>还未绑定钱包，请先进行钱包绑定</b>";
    }
    let keyboard = [];
    let contractAddress = msg.message.text.split("\n")[3];
    wallets.forEach((item, index) => {
        let showAddr = item.address.substring(0, 15) + '···' + item.address.substring(item.address.length - 15, item.address.length);
        keyboard.push([
            {
                text: showAddr,
                callback_data: `/set_default_wallet ${index} ${contractAddress}`
            }
        ]);
    });
    if (!wallets.length) {
        keyboard.push([{
                text: '💳 添加钱包',
                callback_data: "go_home"
            }]);
    }
    bot.editMessageText(str, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": keyboard
        }
    });
};
exports.pickerWalletTempalte = pickerWalletTempalte;
const createContractTemplate = async (bot, currentGasPrice, wethPrice, chatId, contract) => {
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let pools = JSON.parse(contract.liquidity_pools);
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let dex = (0, exports.getDexTool)(contract.address, contract.chain_id);
    let price = (0, bignumber_js_1.default)((Number(pools[0][contract.symbol]) * wethPrice).toFixed(15)).toFixed();
    let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
    pools.forEach(item => {
        poolEthBalance += item.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(item.pool.reserve0) : Number(item.pool.reserve1);
        poolTokenBalance += item.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(item.pool.reserve1) : Number(item.pool.reserve0);
    });
    poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
    let percent = 0;
    if (Number(firstPrice) > Number(price)) {
        percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
    }
    else {
        percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
    }
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${pools[0].pool.pool}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][pools[0].version]}</b>\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        `<b>💵 初始价格: $ ${firstPrice}</b>\n` +
        `<b>📈 历史涨幅: ${percent} %</b>\n` +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n`;
    const contractKeyboard = [
        [
            {
                text: `📈 K线图`,
                url: dex
            },
        ],
        [
            {
                text: `🚀 买入`,
                callback_data: `/send_contract ${contract.address}`
            },
        ],
    ];
    bot.sendMessage(chatId, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": contractKeyboard
        }
    });
};
exports.createContractTemplate = createContractTemplate;
const editorRushDetailTemplate = async (bot, query, contract, task, currentGasPrice, wethPrice) => {
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let exchangeValue = 0;
    if (task.private_key) {
        let receiveAddress = task.address;
        let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id);
        let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, receiveAddress);
        if (coinBalance.length) {
            userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
        }
        userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5));
    }
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 默认地址:</b>\n` +
        `<b>${task.address ? task.address : '暂无设定地址'}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    let startTime = (0, dayjs_1.default)(task.start_time * 1000).format("YYYY-MM-DD HH:mm:ss");
    const contractKeyboard = [
        [
            {
                text: `💳 (${task.address ? task.address.substring(task.address.length - 15, task.address.length) : '点击选择钱包'})`,
                callback_data: `/picker_task_wallet ${task.id}`
            },
        ],
        [
            {
                text: `⛽ (${task.gas_fee} Gwei)`,
                callback_data: `/set_task_gas_fee  ${task.id}`
            },
            {
                text: `💰 买入金额(${task.amount} ETH)`,
                callback_data: `/set_task_buy_amount  ${task.id}`
            }
        ],
        [
            {
                text: `⏰ 时间(${startTime})`,
                callback_data: `/set_task_start_time  ${task.id}`
            }
        ],
        [
            {
                text: '❌ 删除任务',
                callback_data: `/delete_task ${task.id}`
            }
        ],
        exports.defaultKeyboard
    ];
    bot.editMessageText(str, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": contractKeyboard
        }
    });
};
exports.editorRushDetailTemplate = editorRushDetailTemplate;
const rushDetailTemplate = async (bot, chatId, contract, task, currentGasPrice, wethPrice) => {
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let exchangeValue = 0;
    if (task.private_key) {
        let receiveAddress = task.address;
        let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id);
        let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, receiveAddress);
        if (coinBalance.length) {
            userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
        }
        userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5));
    }
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 默认地址:</b>\n` +
        `<b>${task.address ? task.address : '暂无设定地址'}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    let startTime = (0, dayjs_1.default)(task.start_time * 1000).format("YYYY-MM-DD HH:mm:ss");
    const contractKeyboard = [
        [
            {
                text: `💳 (${task.address ? task.address.substring(task.address.length - 15, task.address.length) : '点击选择钱包'})`,
                callback_data: `/picker_task_wallet ${task.id}`
            },
        ],
        [
            {
                text: `⛽ (${task.gas_fee} Gwei)`,
                callback_data: `/set_task_gas_fee ${task.id}`
            },
            {
                text: `💰 买入金额(${task.amount} ETH)`,
                callback_data: `/set_task_buy_amount ${task.id}`
            }
        ],
        [
            {
                text: `⏰ 时间(${startTime})`,
                callback_data: `/set_task_start_time ${task.id}`
            }
        ],
        [
            {
                text: '❌ 删除任务',
                callback_data: `/delete_task ${task.id}`
            }
        ],
        exports.defaultKeyboard
    ];
    bot.sendMessage(chatId, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": contractKeyboard
        }
    });
};
exports.rushDetailTemplate = rushDetailTemplate;
const contractTemplate = async (bot, msg, contract, user, currentGasPrice, wethPrice) => {
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let exchangeValue = 0;
    if (user.default_address) {
        let receiveAddress = user.default_address;
        let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id);
        let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, user.default_address);
        if (coinBalance.length) {
            userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
        }
        userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5));
    }
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let dex = (0, exports.getDexTool)(contract.address, contract.chain_id);
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 默认地址:</b>\n` +
        `<b>${user.default_address ? user.default_address : '暂无设定地址'}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    const contractKeyboard = [
        [
            {
                text: `💳 (${user.default_address ? user.default_address.substring(user.default_address.length - 15, user.default_address.length) : '点击选择钱包'})`,
                callback_data: "picker_wallet"
            },
        ],
        [
            {
                text: `📈 K线图`,
                url: dex
            },
        ],
        [
            {
                text: `⛽ (${user.manual_gas_fee} Gwei)`,
                callback_data: `/set_gas_fee 1 0`
            },
            {
                text: `💦 滑点(${user.manual_swap_fee} %)`,
                callback_data: `/set_swap_fee 1 0`
            },
        ],
        [
            {
                text: `💰 买入金额(${user.amount} ETH)`,
                callback_data: `/set_buy_amount 1 0`
            }
        ],
        [
            {
                text: `💯 卖出比例(${user.sell_percent} %)`,
                callback_data: `/set_sell_percent 1 0`
            }
        ],
        [
            {
                text: `🚀 买入`,
                callback_data: `/buy ${contract.chain_id} ${contract.address} 1 0`
            },
            {
                text: `🚀 卖出`,
                callback_data: `/sell ${contract.chain_id} ${contract.address} 2 0`
            },
        ],
    ];
    bot.sendMessage(msg.from.id, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": contractKeyboard
        }
    });
};
exports.contractTemplate = contractTemplate;
const homeTemplate = (bot, msg) => {
    return new Promise(async (resolve) => {
        bot.sendMessage(msg.chat.id, `<b>📈📈📈📈📈📈📈📈📈📈📈📈</b>\n\n<b>欢迎使用dandaobot</b>\n\n<b>本bot不构成投资建议，请各自承担风险</b>\n\n<b>📈📈📈📈📈📈📈📈📈📈📈📈</b>\n`, {
            "parse_mode": "HTML",
            "reply_markup": {
                "inline_keyboard": exports.homeKeyboard
            }
        }).then(res => {
            resolve(res.message_id);
        });
    });
};
exports.homeTemplate = homeTemplate;
const goBackHomeTemplate = (bot, msg) => {
    let str = `<b>📈📈📈📈📈📈📈📈📈📈📈📈</b>\n\n<b>欢迎使用dandaobot</b>\n\n<b>本bot不构成投资建议，请各自承担风险</b>\n\n<b>📈📈📈📈📈📈📈📈📈📈📈📈</b>\n`;
    bot.editMessageText(str, {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id,
        reply_markup: {
            "inline_keyboard": exports.homeKeyboard
        }
    });
};
exports.goBackHomeTemplate = goBackHomeTemplate;
const networkTemplate = (bot, msg, chainIds) => {
    let netWorkKeyboard = [];
    chainIds.forEach(item => {
        netWorkKeyboard.push({
            text: exports.chainEnum[item],
            callback_data: exports.chainEnum[item],
        });
    });
    bot.editMessageText(`🌏<b>请选择归属链</b>\n\n<b>并非适用于全部自定义节点，如有自建节点是可以使用🫰🫰🫰</b>`, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": [netWorkKeyboard, [...exports.defaultKeyboard]]
        }
    });
};
exports.networkTemplate = networkTemplate;
const addWalletTemplate = (bot, msg) => {
    let str = "❗️❗️❗️ <b>请认准土狗BOT，请勿错发给骗子机器人</b>\n\n<b>请输选择绑定钱包方式</b>";
    bot.editMessageText(str, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": exports.addWalletKeyboard
        }
    });
};
exports.addWalletTemplate = addWalletTemplate;
const walletTemplate = async (bot, msg, db) => {
    let wallets = await db.select("wallet", [`telegram_id=${msg.from.id}`]);
    let str = ``;
    if (wallets.length) {
        str += `❗️❗️❗️ <b>请认准土狗BOT，请勿错发给骗子机器人</b>\n\n<b>共计绑定（${wallets.length}）个钱包</b>\n\n`;
        wallets.forEach((item, index) => {
            str += `<b>(${index + 1}) ${item.address}</b>\n`;
        });
    }
    else {
        str = "❗️❗️❗️ <b>请认准土狗BOT，请勿错发给骗子机器人</b>\n\n<b>还未绑定钱包，点击下方新增按钮添加一个钱包吧</b>\n\n";
    }
    bot.editMessageText(str, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": exports.walletKeyboard
        }
    });
};
exports.walletTemplate = walletTemplate;
const rushTemplate = async (bot, msg, db) => {
    let time = Math.round(new Date().getTime() / 1000) - 1800;
    let result = await db.leftJoin("task", "contract", [`telegram_id=${msg.chat.id}`, "type=5", `start_time>=${time}`], [], "target", "address");
    let str = "❗️❗️❗️ <b>冲狗有风险，投资需谨慎</b>\n\n";
    let listKeyboard = [];
    result.list.forEach(item => {
        listKeyboard.push([{
                text: item.name,
                callback_data: `/rush_detail ${item.id}`
            }]);
    });
    listKeyboard.push([{
            text: '💳 添加抢开盘',
            callback_data: "add_rush"
        }]);
    listKeyboard.push(exports.defaultKeyboard);
    bot.editMessageText(str, {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": listKeyboard
        }
    });
};
exports.rushTemplate = rushTemplate;
const handleWatchTemplate = async (bot, msg, address, db) => {
    let find = await db.find("watch", [`address='${address}'`, `telegram_id=${msg.from.id}`]);
    const web3 = new web3_1.default();
    if (find) {
        let str = `👀 *监听地址*\n\n`;
        str += "`" + address + "`\n\n";
        str += `📑 *备注：${find.name ? find.name : '无'}*\n`;
        str += `🚀 *是否跟买：${find.follow_buy == 1 ? '✅' : '❌'}*\n`;
        str += `🚀 *是否跟卖：${find.follow_sell == 1 ? '✅' : '❌'}*\n`;
        str += `💰 *跟单金额：${find.follow_amount} ETH*\n`;
        str += `⛽ *跟单Gas：${find.follow_gas_fee} Gwei*\n`;
        str += `💦 *跟单滑点：${find.follow_swap_fee} %*\n`;
        let account = find.follow_private_key ? web3.eth.accounts.privateKeyToAccount(find.follow_private_key) : null;
        const followKeyboard = [
            [
                {
                    text: `💳 (${account ? account.address.substring(account.address.length - 15, account.address.length) : '点击选择钱包'})`,
                    callback_data: `/picker_follow_wallet ${find.id}`
                },
            ],
            [
                {
                    text: `🚀 跟买 ${find.follow_buy == 1 ? '✅' : '❌'}`,
                    callback_data: `/set_follow_buy 5 ${find.id}`
                },
                {
                    text: `🚀 跟卖 ${find.follow_sell == 1 ? '✅' : '❌'}`,
                    callback_data: `/set_follow_sell 5 ${find.id}`
                },
            ],
            [
                {
                    text: `⛽ (${find.follow_gas_fee} Gwei)`,
                    callback_data: `/set_follow_gas_fee 5 ${find.id}`
                },
                {
                    text: `💦 滑点(${find.follow_swap_fee} %)`,
                    callback_data: `/set_follow_swap_fee 5 ${find.id}`
                },
            ],
            [
                {
                    text: `💰 买入金额(${find.follow_amount} ETH)`,
                    callback_data: `/set_follow_amount 5 ${find.id}`
                }
            ],
            [
                {
                    text: `📑 备注名称`,
                    callback_data: `/bind_watch_name ${address}`
                },
                {
                    text: `❌ 移除监听`,
                    callback_data: `/delete_watch ${address}`
                },
            ],
            [
                {
                    text: '↪️ 返回',
                    callback_data: "watch"
                }
            ]
        ];
        bot.editMessageText(str, {
            chat_id: msg.message.chat.id,
            message_id: msg.message.message_id,
            "parse_mode": "markdown",
            "reply_markup": {
                "inline_keyboard": followKeyboard
            }
        });
    }
    else {
        bot.sendMessage(msg.message.chat.id, "未找到监听地址");
    }
};
exports.handleWatchTemplate = handleWatchTemplate;
const watchTemplate = async (bot, msg, db) => {
    let watchList = await db.select("watch", [`telegram_id=${msg.from.id}`]);
    let str = ``;
    let watchKeyboard = [];
    if (watchList.length) {
        str += `👀 *监听地址列表*\n\n`;
        str += `*共计监听(${watchList.length})个地址，剩余可添加(${10 - watchList.length})个地址*\n\n`;
        watchList.forEach((item, index) => {
            let isFollow = (item.follow_buy == 1 || item.follow_sell == 1) ? "（跟单中）\n" : "";
            str += "钱包(" + (index + 1) + ")\n`" + item.address + "`\n" + isFollow + "\n";
            let text = item.name ? `${item.address.substring(item.address.length - 16, item.address.length)}(${item.name})` : `${item.address.substring(item.address.length - 16, item.address.length)}`;
            watchKeyboard.push([
                {
                    text: text,
                    callback_data: `/handle_watch ${item.address}`
                }
            ]);
        });
    }
    else {
        str = "👀 *监听地址列表</b>\n\n<b>还没有监听地址，下方添加一个吧*";
    }
    watchKeyboard.push([
        {
            text: '👀 新增监听地址',
            callback_data: "add_watch"
        }
    ]);
    watchKeyboard.push([...exports.defaultKeyboard]);
    bot.editMessageText(str, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "MARKDOWN",
        reply_markup: {
            "inline_keyboard": watchKeyboard
        }
    });
};
exports.watchTemplate = watchTemplate;
const editorWatchLogBuyTemplate = async (bot, contract, watchLog, user, currentGasPrice, wethPrice) => {
    let tx = (0, exports.getTxScan)(watchLog.hash, contract.chain_id);
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: watchLog.address }], contract.chain_id);
    let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, watchLog.address);
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let dex = (0, exports.getDexTool)(contract.address, contract.chain_id);
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 买入：${watchLog.amount_in} ETH</b>\n` +
        `<b>💵 收入：${watchLog.amount_out} ${contract.symbol}</b>\n` +
        `<b>🚨 类型：监听地址</b>\n` +
        `<b>⏳ 状态：成功</b>\n` +
        `<b>💰 总支出：$ ${watchLog.cost}</b>\n` +
        `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        `<b>💦 买入税: ${watchLog.swap_fee} %</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${watchLog.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    const buyKeyboard = [
        [
            {
                text: `📈 K线图`,
                url: dex
            },
        ],
        [
            {
                text: `⛽ (${user.manual_gas_fee} Gwei)`,
                callback_data: `/set_gas_fee 4 ${watchLog.id}`
            },
            {
                text: `💦 滑点(${user.manual_swap_fee} %)`,
                callback_data: `/set_swap_fee 4 ${watchLog.id}`
            },
        ],
        [
            {
                text: `💰 买入金额(${user.amount} ETH)`,
                callback_data: `/set_buy_amount 4 ${watchLog.id}`
            }
        ],
        [
            {
                text: `🚀 买入`,
                callback_data: `/buy ${contract.chain_id} ${contract.address} 1 ${watchLog.id}`
            },
        ],
    ];
    bot.editMessageText(str, {
        chat_id: user.query.message.chat.id,
        message_id: user.query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": buyKeyboard
        }
    });
};
exports.editorWatchLogBuyTemplate = editorWatchLogBuyTemplate;
const editorWatchLogSellTemplate = async (bot, contract, watchLog, user, currentGasPrice, wethPrice) => {
    let tx = (0, exports.getTxScan)(watchLog.hash, contract.chain_id);
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: watchLog.address }], contract.chain_id);
    let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, watchLog.address);
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let dex = (0, exports.getDexTool)(contract.address, contract.chain_id);
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 卖出：${watchLog.amount_in} ${contract.symbol}</b>\n` +
        `<b>💵 收入：${watchLog.amount_out} ETH</b>\n` +
        `<b>🚨 类型：监听地址</b>\n` +
        `<b>⏳ 状态：成功</b>\n` +
        `<b>💰 总收入：$ ${watchLog.cost}</b>\n` +
        `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        `<b>💦 卖出税: ${watchLog.swap_fee} %</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${watchLog.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    const buyKeyboard = [
        [
            {
                text: `📈 K线图`,
                url: dex
            },
        ],
        [
            {
                text: `⛽ (${user.manual_gas_fee} Gwei)`,
                callback_data: `/set_gas_fee 4 ${watchLog.id}`
            },
            {
                text: `💦 滑点(${user.manual_swap_fee} %)`,
                callback_data: `/set_swap_fee 4 ${watchLog.id}`
            },
        ],
        [
            {
                text: `💰 买入金额(${user.amount} ETH)`,
                callback_data: `/set_buy_amount 4 ${watchLog.id}`
            }
        ],
        [
            {
                text: `🚀 买入`,
                callback_data: `/buy ${contract.chain_id} ${contract.address} 1 0`
            },
        ],
    ];
    bot.editMessageText(str, {
        chat_id: user.query.message.chat.id,
        message_id: user.query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": buyKeyboard
        }
    });
};
exports.editorWatchLogSellTemplate = editorWatchLogSellTemplate;
const watchLogBuyTemplate = async (bot, contract, watchLog, user, currentGasPrice, wethPrice) => {
    let tx = (0, exports.getTxScan)(watchLog.hash, contract.chain_id);
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: watchLog.address }], contract.chain_id);
    let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, watchLog.address);
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let dex = (0, exports.getDexTool)(contract.address, contract.chain_id);
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 买入：${watchLog.amount_in} ETH</b>\n` +
        `<b>💵 收入：${watchLog.amount_out} ${contract.symbol}</b>\n` +
        `<b>🚨 类型：监听地址</b>\n` +
        `<b>⏳ 状态：成功</b>\n` +
        `<b>💰 总支出：$ ${watchLog.cost}</b>\n` +
        `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        `<b>💦 买入税: ${watchLog.swap_fee} %</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${watchLog.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    const buyKeyboard = [
        [
            {
                text: `📈 K线图`,
                url: dex
            },
        ],
        [
            {
                text: `⛽ (${user.manual_gas_fee} Gwei)`,
                callback_data: `/set_gas_fee 4 ${watchLog.id}`
            },
            {
                text: `💦 滑点(${user.manual_swap_fee} %)`,
                callback_data: `/set_swap_fee 4 ${watchLog.id}`
            },
        ],
        [
            {
                text: `💰 买入金额(${user.amount} ETH)`,
                callback_data: `/set_buy_amount 4 ${watchLog.id}`
            }
        ],
        [
            {
                text: `🚀 买入`,
                callback_data: `/buy ${contract.chain_id} ${contract.address} 1 0`
            },
        ],
    ];
    bot.sendMessage(watchLog.telegram_id, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    });
};
exports.watchLogBuyTemplate = watchLogBuyTemplate;
const watchLogSellTemplate = async (bot, contract, watchLog, user, currentGasPrice, wethPrice) => {
    let tx = (0, exports.getTxScan)(watchLog.hash, contract.chain_id);
    let scan = (0, exports.getScan)(contract.address, contract.chain_id);
    let poolEthBalance = 0;
    let poolTokenBalance = 0;
    let poolPercent = 0;
    let price = '0';
    let userCoinBalance = 0;
    let userEthBalance = 0;
    let coinBalance = await (0, fetch_1.batchCheckERC20Balance)([{ contractAddr: contract.address, owner: watchLog.address }], contract.chain_id);
    let ethBalance = await (0, fetch_1.getBalance)(contract.chain_id, watchLog.address);
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4));
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4));
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1);
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == constrants_1.Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0);
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3));
        price = (0, bignumber_js_1.default)((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed();
    }
    let firstPriceDom = "";
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = (0, bignumber_js_1.default)((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed();
        let percent = 0;
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2));
        }
        else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2));
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`;
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`;
    }
    let swapFeeDom = "";
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`;
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`;
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals));
    let dex = (0, exports.getDexTool)(contract.address, contract.chain_id);
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${exports.chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${exports.dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 卖出：${watchLog.amount_in} ${contract.symbol}</b>\n` +
        `<b>💵 收入：${watchLog.amount_out} ETH</b>\n` +
        `<b>🚨 类型：监听地址</b>\n` +
        `<b>⏳ 状态：成功</b>\n` +
        `<b>💰 总收入：$ ${watchLog.cost}</b>\n` +
        `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        `<b>💦 卖出税: ${watchLog.swap_fee} %</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${(0, exports.formatUSDPrice)(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${watchLog.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`;
    const buyKeyboard = [
        [
            {
                text: `📈 K线图`,
                url: dex
            },
        ],
        [
            {
                text: `⛽ (${user.manual_gas_fee} Gwei)`,
                callback_data: `/set_gas_fee 4 ${watchLog.id}`
            },
            {
                text: `💦 滑点(${user.manual_swap_fee} %)`,
                callback_data: `/set_swap_fee 4 ${watchLog.id}`
            },
        ],
        [
            {
                text: `💰 买入金额(${user.amount} ETH)`,
                callback_data: `/set_buy_amount 4 ${watchLog.id}`
            }
        ],
        [
            {
                text: `🚀 买入`,
                callback_data: `/buy ${contract.chain_id} ${contract.address} 1 0`
            },
        ],
    ];
    bot.sendMessage(watchLog.telegram_id, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    });
};
exports.watchLogSellTemplate = watchLogSellTemplate;
const topFiveMinutesTemplate = async (bot, chatId, list) => {
    let str = "";
    let buyKeyboard = [];
    list.forEach(item => {
        let scan = (0, exports.getScan)(item.address, item.chainId);
        str += `🎰 <b>(<a href='${scan}'>$${item.symbol}</a>) # ${exports.chainEnum[item.chainId]}</b>\n` +
            `🔁 <b>交易次数：${item.count} (${item.countPercent} %)</b>\n` +
            `👬 <b>持有人：${item.currentHolders} (${item.holdersPercent} %)</b>\n` +
            `💡 <b>聪明钱：${item.smartMoney}</b>\n` +
            `💵 <b>价格：$ ${item.currentPrice} (${item.pricePercent} %)</b>\n` +
            `💵 <b>历史涨幅：${item.historyPercent} %</b>\n` +
            `💧 <b>前20持仓：${item.topHolderPercent} %</b>\n` +
            `💰 <b>资金净流入：${item.allInflow} ETH</b>\n\n`;
        buyKeyboard.push([
            {
                text: `🚀 买入${item.symbol}`,
                callback_data: `/send_contract ${item.address}`
            }
        ]);
    });
    bot.sendMessage(chatId, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    });
};
exports.topFiveMinutesTemplate = topFiveMinutesTemplate;
const topFifteenMinutesTemplate = async (bot, chatId, list) => {
    let str = "";
    let buyKeyboard = [];
    list.forEach(item => {
        let scan = (0, exports.getScan)(item.address, item.chainId);
        str += `🎰 <b>(<a href='${scan}'>$${item.symbol}</a>) # ${exports.chainEnum[item.chainId]}</b>\n` +
            `🔁 <b>交易次数：${item.count} (${item.countPercent} %)</b>\n` +
            `👬 <b>30分钟内最高持有人：${item.hightHolders}</b>\n` +
            `👬 <b>持有人：${item.currentHolders} (${item.holdersPercent} %)</b>\n` +
            `💡 <b>聪明钱：${item.smartMoney}</b>\n` +
            `💵 <b>30分钟内最高价格：$ ${item.hightPrice}</b>\n` +
            `💵 <b>价格：$ ${item.currentPrice} (${item.pricePercent} %)</b>\n` +
            `💵 <b>历史涨幅：${item.historyPercent} %</b>\n` +
            `💧 <b>前20持仓：${item.topHolderPercent} %</b>\n` +
            `💰 <b>资金净流入：${item.allInflow} ETH</b>\n\n`;
        buyKeyboard.push([
            {
                text: `🚀 买入${item.symbol}`,
                callback_data: `/send_contract ${item.address}`
            }
        ]);
    });
    bot.sendMessage(chatId, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    });
};
exports.topFifteenMinutesTemplate = topFifteenMinutesTemplate;
exports.settingKeyboard = [
    [
        {
            text: '滑点',
            callback_data: "swap_fee"
        },
        {
            text: 'gas小费',
            callback_data: "gas_fee"
        },
        {
            text: 'gas小费',
            callback_data: "gas_fee"
        }
    ],
];
exports.addWalletKeyboard = [
    [
        {
            text: '➡️ 导入钱包',
            callback_data: "import_wallet"
        }
    ],
    [
        {
            text: '⬅️ 生成钱包',
            callback_data: "generate_wallet"
        }
    ],
    [...exports.defaultKeyboard]
];
exports.walletKeyboard = [
    [
        {
            text: '💳 新增钱包',
            callback_data: "add_wallet"
        },
        {
            text: '❌ 删除钱包',
            callback_data: "delete_wallet"
        }
    ],
    [...exports.defaultKeyboard]
];
exports.homeKeyboard = [
    [
        {
            text: '💳 钱包',
            callback_data: "wallet"
        },
    ],
    [
        {
            text: '🔭 监听地址',
            callback_data: "watch"
        },
    ],
    [
        {
            text: '💰 抢开盘',
            callback_data: "rush"
        },
        {
            text: '🔍 聪明钱查找',
            callback_data: "smart_money"
        }
    ],
    [
        {
            text: '🌎 节点设置',
            callback_data: "set_prc"
        }
    ]
];


/***/ }),

/***/ 39491:
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ 50852:
/***/ ((module) => {

"use strict";
module.exports = require("async_hooks");

/***/ }),

/***/ 14300:
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ 32081:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 35001:
/***/ ((module) => {

"use strict";
module.exports = require("cluster");

/***/ }),

/***/ 22057:
/***/ ((module) => {

"use strict";
module.exports = require("constants");

/***/ }),

/***/ 6113:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 9523:
/***/ ((module) => {

"use strict";
module.exports = require("dns");

/***/ }),

/***/ 82361:
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ 57147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 13685:
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ 85158:
/***/ ((module) => {

"use strict";
module.exports = require("http2");

/***/ }),

/***/ 95687:
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ 41808:
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ 22037:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 71017:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 85477:
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ 63477:
/***/ ((module) => {

"use strict";
module.exports = require("querystring");

/***/ }),

/***/ 12781:
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ 71576:
/***/ ((module) => {

"use strict";
module.exports = require("string_decoder");

/***/ }),

/***/ 39512:
/***/ ((module) => {

"use strict";
module.exports = require("timers");

/***/ }),

/***/ 24404:
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ 76224:
/***/ ((module) => {

"use strict";
module.exports = require("tty");

/***/ }),

/***/ 57310:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ 73837:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ 59796:
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, [56], () => (__webpack_require__(__webpack_require__.s = 91011)))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/amd options */
/******/ 	(() => {
/******/ 		__webpack_require__.amdO = {};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		var installedChunks = {
/******/ 			179: 1
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.O.require = (chunkId) => (installedChunks[chunkId]);
/******/ 		
/******/ 		var installChunk = (chunk) => {
/******/ 			var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 			__webpack_require__.O();
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__webpack_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					installChunk(require("./" + __webpack_require__.u(chunkId)));
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			__webpack_require__.e(56);
/******/ 			return next();
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	__webpack_exports__ = __webpack_exports__["default"];
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});