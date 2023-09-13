import BigNumber from "bignumber.js"
import { Config } from "../config/constrants"
import { getBalance, batchCheckERC20Balance } from "./fetch"
import Web3 from "web3"
import { insertItem } from "../types"
import dayjs from "dayjs"
export const formatUSDPrice = (price: number) => {
    if (price >= 0 && price < 1000) {
        return BigNumber(price).toFixed()
    } else if (price >= 1000 && price < 1000000) {
        return BigNumber(Number((price / 1000).toFixed(3))).toFixed() + 'K'
    } else if (price >= 1000000 && price < 1000000000) {
        return BigNumber(Number((price / 1000000).toFixed(3))).toFixed() + 'M'
    } else if (price >= 1000000000) {
        return BigNumber(Number((price / 1000000000).toFixed(3))).toFixed() + 'B'
    }
}
export const getTypeName = (type: number) => {
    switch (type) {
        case 1:
            return "手动买入"
        case 2:
            return "手动卖出"
        case 3:
            return "跟单买入"
        case 4:
            return "跟单卖出"
        case 5:
            return "抢开盘"
        case 6:
            return "MEV"
        case 7:
            return "自动卖出"
    }
}
export const dexNames = {
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
}
export const defaultKeyboard = [
    {
        text: '↪️ 返回首页',
        callback_data: "go_home"
    }
]
export const chainEnum = {
    1: "Ethereum",
    42161: "Arbitrum",
    5: "Goerli"
}
export const getScan = (address: string, chainId: number) => {
    switch (chainId) {
        case 1:
            return `https://etherscan.io/token/${address}`
        case 42161:
            return `https://arbiscan.io/token/${address}`
        case 5:
            return `https://goerli.etherscan.io/token/${address}`
    }
}
export const getTxScan = (hash: string, chainId: number) => {
    switch (chainId) {
        case 1:
            return `https://etherscan.io/tx/${hash}`
        case 42161:
            return `https://arbiscan.io/tx/${hash}`
        case 5:
            return `https://goerli.etherscan.io/tx/${hash}`
    }
}
export const getDexTool = (address: string, chainId: number) => {
    switch (chainId) {
        case 1:
            return `https://dexscreener.com/ethereum/${address}`
        case 42161:
            return `https://dexscreener.com/arbitrum/${address}`
        case 5:
            return `https://dexscreener.com/ethereum/${address}`
    }
}
export const editorBuySuccessTemplate = async (bot: any, contract: any, user: any, currentGasPrice: number, wethPrice: number, log: any) => {
    let tx = getTxScan(log.hash, contract.chain_id)
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let exchangeValue = 0
    let receiveAddress = user.default_address
    let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id)
    let ethBalance = await getBalance(contract.chain_id, log.address)
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5))
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let dex = getDexTool(contract.address, contract.chain_id)
    let perPrice = BigNumber(Number((Number(log.price) * wethPrice).toFixed(15))).toFixed()
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 买入：${log.in_amount} ETH</b>\n` +
        `<b>💵 收入：${log.out_amount} ${log.symbol}</b>\n` +
        `<b>🚨 类型：${getTypeName(log.type)}</b>\n` +
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
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${log.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
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
    ]
    bot.editMessageText(str, {
        chat_id: user.query.message.chat.id,
        message_id: user.query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": buyKeyboard
        }
    })
}
export const editorSellSuccessTemplate = async (bot: any, contract: any, user: any, currentGasPrice: number, wethPrice: number, log: any) => {
    let tx = getTxScan(log.hash, contract.chain_id)
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let exchangeValue = 0
    let receiveAddress = user.default_address
    let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id)
    let ethBalance = await getBalance(contract.chain_id, log.address)
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5))
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let dex = getDexTool(contract.address, contract.chain_id)
    let perPrice = BigNumber(Number((Number(log.price) * wethPrice).toFixed(15))).toFixed()
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 卖出：${log.in_amount} ${log.symbol}</b>\n` +
        `<b>💵 收入：${log.out_amount} ETH</b>\n` +
        `<b>🚨 类型：${getTypeName(log.type)}</b>\n` +
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
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 卖出地址:</b>\n` +
        `<b>${log.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
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
    ]
    bot.editMessageText(str, {
        chat_id: user.query.message.chat.id,
        message_id: user.query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": buyKeyboard
        }
    })
}
export const sellSuccessTemplate = async (bot: any, msg: any, contract: any, user: any, currentGasPrice: number, wethPrice: number, log: any) => {
    let tx = getTxScan(log.hash, contract.chain_id)
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let exchangeValue = 0
    let receiveAddress = user.default_address
    let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id)
    let ethBalance = await getBalance(contract.chain_id, log.address)
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5))
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let dex = getDexTool(contract.address, contract.chain_id)
    let perPrice = BigNumber(Number((Number(log.price) * wethPrice).toFixed(15))).toFixed()
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 卖出：${log.in_amount} ${log.symbol}</b>\n` +
        `<b>💵 收入：${log.out_amount} ETH</b>\n` +
        `<b>🚨 类型：${getTypeName(log.type)}</b>\n` +
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
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 卖出地址:</b>\n` +
        `<b>${log.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
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
    ]
    bot.sendMessage(msg.message.chat.id, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    }
    )
}
export const buySuccessTemplate = async (bot: any, msg: any, contract: any, user: any, currentGasPrice: number, wethPrice: number, log: any) => {
    let tx = getTxScan(log.hash, contract.chain_id)
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let exchangeValue = 0
    let receiveAddress = user.default_address
    let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id)
    let ethBalance = await getBalance(contract.chain_id, log.address)
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5))
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let dex = getDexTool(contract.address, contract.chain_id)
    let perPrice = BigNumber(Number((Number(log.price) * wethPrice).toFixed(15))).toFixed()
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>💵 买入：${log.in_amount} ETH</b>\n` +
        `<b>💵 收入：${log.out_amount} ${log.symbol}</b>\n` +
        `<b>🚨 类型：${getTypeName(log.type)}</b>\n` +
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
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${log.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
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
    ]
    bot.sendMessage(msg.message.chat.id, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    }
    )
}
export const pendingTamplate = async (bot: any, msg: any, contract: any, amount: number, hash: string, type: number) => {
    let tx = getTxScan(hash, contract.chain_id)
    let scan = getScan(contract.address, contract.chain_id)
    let amountIn = null
    if (type == 1) {
        amountIn = `<b>💵 买入：${BigNumber(amount).toFixed()} ETH</b>\n`
    } else if (type == 2) {
        amountIn = `<b>💵 卖出：${BigNumber(amount).toFixed()} ${contract.symbol}</b>\n`
    } else if (type == 3) {
        amountIn = `<b>💵 跟单买入：${BigNumber(amount).toFixed()} ETH</b>\n`
    } else if (type == 4) {
        amountIn = `<b>💵 跟单卖出：${BigNumber(amount).toFixed()} ${contract.symbol}</b>\n`
    } else if (type == 5) {
        amountIn = `<b>💵 抢开盘：${BigNumber(amount).toFixed()} ${contract.symbol}</b>\n`
    }
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        amountIn +
        `<b>🚨 类型：${getTypeName(type)}</b>\n` +
        `<b>⏳ 状态：pending</b>\n` +
        `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n`

    bot.sendMessage(msg.message.chat.id, str, {
        "parse_mode": "HTML"
    }
    )
}
export const errorTamplate = async (bot: any, msg: any, contract: any, amount: number, hash: string, type: number, remark: string) => {
    let a = ""
    if (hash) {
        let tx = getTxScan(hash, contract.chain_id)
        a = `<b>🔎 交易详情：<a href='${tx}'>点击查看</a></b>\n`
    }
    let scan = getScan(contract.address, contract.chain_id)
    let amountIn = null
    if (type == 1) {
        amountIn = `<b>💵 买入：${BigNumber(amount).toFixed()} ETH</b>\n`
    } else if (type == 2) {
        amountIn = `<b>💵 卖出：${BigNumber(amount).toFixed()} ${contract.symbol}</b>\n`
    } else if (type == 3) {
        amountIn = `<b>💵 跟单买入：${BigNumber(amount).toFixed()} ETH</b>\n`
    } else if (type == 4) {
        amountIn = `<b>💵 跟单卖出：${BigNumber(amount).toFixed()} ${contract.symbol}</b>\n`
    }
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        amountIn +
        `<b>🚨 类型：${getTypeName(type)}</b>\n` +
        `<b>⏳ 状态：失败</b>\n` +
        `<b>📄 原因：${remark}</b>\n` +
        a

    bot.sendMessage(msg.message.chat.id, str, {
        "parse_mode": "HTML"
    }
    )
}
export const editorContractTemplate = async (bot: any, contract: any, user: any, currentGasPrice: string, wethPrice: number) => {
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let exchangeValue = 0
    if (user.default_address) {
        let receiveAddress = user.default_address
        let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id)
        let ethBalance = await getBalance(contract.chain_id, user.default_address)
        if (coinBalance.length) {
            userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
        }
        userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
    }
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5))
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let dex = getDexTool(contract.address, contract.chain_id)
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 默认地址:</b>\n` +
        `<b>${user.default_address ? user.default_address : '暂无设定地址'}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
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
    ]
    bot.editMessageText(str, {
        chat_id: user.query.message.chat.id,
        message_id: user.query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": contractKeyboard
        }
    })
}
export const pickerFollowWalletTempalte = async (bot: any, msg: any, db: any, watchId: number) => {
    let wallets = await db.select("wallet", [`telegram_id=${msg.from.id}`])
    let str = ``
    if (wallets.length) {
        str += `<b>请选择一个钱包</b>`
    } else {
        str = "<b>还未绑定钱包，请先进行钱包绑定</b>"
    }
    let find = await db.find("watch", [`id=${watchId}`, `telegram_id=${msg.from.id}`])
    if (find) {
        let keyboard = []
        wallets.forEach((item, index) => {
            let showAddr = item.address.substring(0, 15) + '···' + item.address.substring(item.address.length - 15, item.address.length)
            keyboard.push([
                {
                    text: showAddr,
                    callback_data: `/set_follow_wallet ${index} ${watchId}`
                }
            ])
        })
        if (!wallets.length) {
            keyboard.push([{
                text: '💳 添加钱包',
                callback_data: "go_home"
            }])
        }
        keyboard.push([{
            text: '↪️ 返回',
            callback_data: `/handle_watch ${find.address}`
        }])
        bot.editMessageText(str, {
            chat_id: msg.message.chat.id,
            message_id: msg.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                "inline_keyboard": keyboard
            }
        })
    }
}
export const pickerTaskWalletTempalte = async (bot: any, msg: any, task: any, db: any) => {
    let wallets = await db.select("wallet", [`telegram_id=${msg.from.id}`])
    let str = ``
    if (wallets.length) {
        str += `<b>请选择一个钱包</b>`
    } else {
        str = "<b>还未绑定钱包，请先进行钱包绑定</b>"
    }
    let keyboard = []
    wallets.forEach((item, index) => {
        let showAddr = item.address.substring(0, 15) + '···' + item.address.substring(item.address.length - 15, item.address.length)
        keyboard.push([
            {
                text: showAddr,
                callback_data: `/set_task_wallet ${index} ${task.id}`
            }
        ])
    })
    if (!wallets.length) {
        keyboard.push([{
            text: '💳 添加钱包',
            callback_data: "go_home"
        }])
    }
    bot.editMessageText(str, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": keyboard
        }
    })
}
export const pickerWalletTempalte = async (bot: any, msg: any, db: any) => {
    let wallets = await db.select("wallet", [`telegram_id=${msg.from.id}`])
    let str = ``
    if (wallets.length) {
        str += `<b>请选择一个钱包</b>`
    } else {
        str = "<b>还未绑定钱包，请先进行钱包绑定</b>"
    }
    let keyboard = []
    let contractAddress = msg.message.text.split("\n")[3]
    wallets.forEach((item, index) => {
        let showAddr = item.address.substring(0, 15) + '···' + item.address.substring(item.address.length - 15, item.address.length)
        keyboard.push([
            {
                text: showAddr,
                callback_data: `/set_default_wallet ${index} ${contractAddress}`
            }
        ])
    })
    if (!wallets.length) {
        keyboard.push([{
            text: '💳 添加钱包',
            callback_data: "go_home"
        }])
    }
    bot.editMessageText(str, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": keyboard
        }
    })
}
export const createContractTemplate = async (bot: any, currentGasPrice: number, wethPrice: number, chatId: number, contract: insertItem) => {
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let pools = JSON.parse(contract.liquidity_pools)
    let scan = getScan(contract.address, contract.chain_id)
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let dex = getDexTool(contract.address, contract.chain_id)
    let price = BigNumber((Number(pools[0][contract.symbol]) * wethPrice).toFixed(15)).toFixed()
    let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
    pools.forEach(item => {
        poolEthBalance += item.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(item.pool.reserve0) : Number(item.pool.reserve1)
        poolTokenBalance += item.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(item.pool.reserve1) : Number(item.pool.reserve0)
    })
    poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
    let percent = 0
    if (Number(firstPrice) > Number(price)) {
        percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
    } else {
        percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
    }
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${pools[0].pool.pool}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][pools[0].version]}</b>\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        `<b>💵 初始价格: $ ${firstPrice}</b>\n` +
        `<b>📈 历史涨幅: ${percent} %</b>\n` +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n`
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
    ]
    bot.sendMessage(chatId, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": contractKeyboard
        }
    }
    )
}
export const editorRushDetailTemplate = async (bot: any, query: any, contract: any, task: any, currentGasPrice: string, wethPrice: number) => {
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let exchangeValue = 0
    if (task.private_key) {
        let receiveAddress = task.address
        let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id)
        let ethBalance = await getBalance(contract.chain_id, receiveAddress)
        if (coinBalance.length) {
            userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
        }
        userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5))
    }
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 默认地址:</b>\n` +
        `<b>${task.address ? task.address : '暂无设定地址'}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
    let startTime = dayjs(task.start_time * 1000).format("YYYY-MM-DD HH:mm:ss")
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
        defaultKeyboard
    ]
    bot.editMessageText(str, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": contractKeyboard
        }
    })
}
export const rushDetailTemplate = async (bot: any, chatId: number, contract: any, task: any, currentGasPrice: string, wethPrice: number) => {
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let exchangeValue = 0
    if (task.private_key) {
        let receiveAddress = task.address
        let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id)
        let ethBalance = await getBalance(contract.chain_id, receiveAddress)
        if (coinBalance.length) {
            userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
        }
        userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5))
    }
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 默认地址:</b>\n` +
        `<b>${task.address ? task.address : '暂无设定地址'}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
    let startTime = dayjs(task.start_time * 1000).format("YYYY-MM-DD HH:mm:ss")
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
        defaultKeyboard
    ]
    bot.sendMessage(chatId, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": contractKeyboard
        }
    }
    )
}
export const contractTemplate = async (bot: any, msg: any, contract: any, user: any, currentGasPrice: string, wethPrice: number) => {
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let exchangeValue = 0
    if (user.default_address) {
        let receiveAddress = user.default_address
        let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: receiveAddress }], contract.chain_id)
        let ethBalance = await getBalance(contract.chain_id, user.default_address)
        if (coinBalance.length) {
            userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
        }
        userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
        exchangeValue = Number((Number(contract.fastGetContractPrice.price) * userCoinBalance).toFixed(5))
    }
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let dex = getDexTool(contract.address, contract.chain_id)
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
        `<b>⛽ GasPrice: ${currentGasPrice} Gwei</b>\n` +
        `<b>💵 价格: $ ${price}</b>\n` +
        firstPriceDom +
        swapFeeDom +
        `<b>📺 池子占比: ${poolPercent} %</b>\n` +
        `<b>🎀 池子ETH: ${Number((poolEthBalance / (10 ** 18)).toFixed(5))} ETH</b>\n` +
        `<b>💎 池子${contract.symbol}: ${Number((poolTokenBalance / (10 ** Number(contract.decimals))).toFixed(5))} ${contract.symbol}</b>\n` +
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 默认地址:</b>\n` +
        `<b>${user.default_address ? user.default_address : '暂无设定地址'}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>💰 价值: ${exchangeValue} ETH</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
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
    ]
    bot.sendMessage(msg.from.id, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": contractKeyboard
        }
    }
    )
}
export const homeTemplate = (bot: any, msg: any) => {
    return new Promise<number>(async (resolve) => {
        bot.sendMessage(msg.chat.id, `<b>📈📈📈📈📈📈📈📈📈📈📈📈</b>\n\n<b>欢迎使用dandaobot</b>\n\n<b>本bot不构成投资建议，请各自承担风险</b>\n\n<b>📈📈📈📈📈📈📈📈📈📈📈📈</b>\n`
            , {
                "parse_mode": "HTML",
                "reply_markup": {
                    "inline_keyboard": homeKeyboard
                }
            }
        ).then(res => {
            resolve(res.message_id)
        })
    })
}
export const goBackHomeTemplate = (bot: any, msg: any) => {
    let str = `<b>📈📈📈📈📈📈📈📈📈📈📈📈</b>\n\n<b>欢迎使用dandaobot</b>\n\n<b>本bot不构成投资建议，请各自承担风险</b>\n\n<b>📈📈📈📈📈📈📈📈📈📈📈📈</b>\n`
    bot.editMessageText(str, {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id,
        reply_markup: {
            "inline_keyboard": homeKeyboard
        }
    })
}
export const networkTemplate = (bot: any, msg: any, chainIds: number[]) => {
    let netWorkKeyboard = []
    chainIds.forEach(item => {
        netWorkKeyboard.push({
            text: chainEnum[item],
            callback_data: chainEnum[item],
        })
    })
    bot.editMessageText(`🌏<b>请选择归属链</b>\n\n<b>并非适用于全部自定义节点，如有自建节点是可以使用🫰🫰🫰</b>`, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": [netWorkKeyboard, [...defaultKeyboard]]
        }
    })
}
export const addWalletTemplate = (bot: any, msg: any) => {
    let str = "❗️❗️❗️ <b>请认准土狗BOT，请勿错发给骗子机器人</b>\n\n<b>请输选择绑定钱包方式</b>"
    bot.editMessageText(str, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": addWalletKeyboard
        }
    })
}
export const walletTemplate = async (bot: any, msg: any, db: any) => {
    let wallets = await db.select("wallet", [`telegram_id=${msg.from.id}`])
    let str = ``
    if (wallets.length) {
        str += `❗️❗️❗️ <b>请认准土狗BOT，请勿错发给骗子机器人</b>\n\n<b>共计绑定（${wallets.length}）个钱包</b>\n\n`
        wallets.forEach((item, index) => {
            str += `<b>(${index + 1}) ${item.address}</b>\n`
        })
    } else {
        str = "❗️❗️❗️ <b>请认准土狗BOT，请勿错发给骗子机器人</b>\n\n<b>还未绑定钱包，点击下方新增按钮添加一个钱包吧</b>\n\n"
    }
    bot.editMessageText(str, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": walletKeyboard
        }
    })
}
export const rushTemplate = async (bot: any, msg: any, db: any) => {
    let time = Math.round(new Date().getTime() / 1000) - 1800
    let result = await db.leftJoin("task", "contract", [`telegram_id=${msg.chat.id}`, "type=5", `start_time>=${time}`], [], "target", "address")
    let str = "❗️❗️❗️ <b>冲狗有风险，投资需谨慎</b>\n\n"
    let listKeyboard = []
    result.list.forEach(item => {
        listKeyboard.push([{
            text: item.name,
            callback_data: `/rush_detail ${item.id}`
        }])
    })
    listKeyboard.push([{
        text: '💳 添加抢开盘',
        callback_data: "add_rush"
    }])
    listKeyboard.push(defaultKeyboard)
    bot.editMessageText(str, {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": listKeyboard
        }
    })
}
export const handleWatchTemplate = async (bot: any, msg: any, address: string, db: any) => {
    let find = await db.find("watch", [`address='${address}'`, `telegram_id=${msg.from.id}`])
    const web3 = new Web3()
    if (find) {
        let str = `👀 *监听地址*\n\n`
        str += "`" + address + "`\n\n"
        str += `📑 *备注：${find.name ? find.name : '无'}*\n`
        str += `🚀 *是否跟买：${find.follow_buy == 1 ? '✅' : '❌'}*\n`
        str += `🚀 *是否跟卖：${find.follow_sell == 1 ? '✅' : '❌'}*\n`
        str += `💰 *跟单金额：${find.follow_amount} ETH*\n`
        str += `⛽ *跟单Gas：${find.follow_gas_fee} Gwei*\n`
        str += `💦 *跟单滑点：${find.follow_swap_fee} %*\n`
        let account = find.follow_private_key ? web3.eth.accounts.privateKeyToAccount(find.follow_private_key) : null
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
        ]
        bot.editMessageText(str, {
            chat_id: msg.message.chat.id,
            message_id: msg.message.message_id,
            "parse_mode": "markdown",
            "reply_markup": {
                "inline_keyboard": followKeyboard
            }
        }
        )
    } else {
        bot.sendMessage(msg.message.chat.id, "未找到监听地址")
    }
}
export const watchTemplate = async (bot: any, msg: any, db: any) => {
    let watchList = await db.select("watch", [`telegram_id=${msg.from.id}`])
    let str = ``
    let watchKeyboard = []
    if (watchList.length) {
        str += `👀 *监听地址列表*\n\n`
        str += `*共计监听(${watchList.length})个地址，剩余可添加(${10 - watchList.length})个地址*\n\n`
        watchList.forEach((item, index) => {
            let isFollow = (item.follow_buy == 1 || item.follow_sell == 1) ? "（跟单中）\n" : ""
            str += "钱包(" + (index + 1) + ")\n`" + item.address + "`\n" + isFollow + "\n"
            let text = item.name ? `${item.address.substring(item.address.length - 16, item.address.length)}(${item.name})` : `${item.address.substring(item.address.length - 16, item.address.length)}`
            watchKeyboard.push([
                {
                    text: text,
                    callback_data: `/handle_watch ${item.address}`
                }
            ])
        })
    } else {
        str = "👀 *监听地址列表</b>\n\n<b>还没有监听地址，下方添加一个吧*"
    }
    watchKeyboard.push([
        {
            text: '👀 新增监听地址',
            callback_data: "add_watch"
        }
    ])
    watchKeyboard.push([...defaultKeyboard])
    bot.editMessageText(str, {
        chat_id: msg.message.chat.id,
        message_id: msg.message.message_id,
        parse_mode: "MARKDOWN",
        reply_markup: {
            "inline_keyboard": watchKeyboard
        }
    })
}
export const editorWatchLogBuyTemplate = async (bot: any, contract: any, watchLog: any, user: any, currentGasPrice: number, wethPrice: number) => {
    let tx = getTxScan(watchLog.hash, contract.chain_id)
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: watchLog.address }], contract.chain_id)
    let ethBalance = await getBalance(contract.chain_id, watchLog.address)
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let dex = getDexTool(contract.address, contract.chain_id)
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
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
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${watchLog.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
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
    ]
    bot.editMessageText(str, {
        chat_id: user.query.message.chat.id,
        message_id: user.query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": buyKeyboard
        }
    })
}
export const editorWatchLogSellTemplate = async (bot: any, contract: any, watchLog: any, user: any, currentGasPrice: number, wethPrice: number) => {
    let tx = getTxScan(watchLog.hash, contract.chain_id)
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: watchLog.address }], contract.chain_id)
    let ethBalance = await getBalance(contract.chain_id, watchLog.address)
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let dex = getDexTool(contract.address, contract.chain_id)
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
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
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${watchLog.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
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
    ]
    bot.editMessageText(str, {
        chat_id: user.query.message.chat.id,
        message_id: user.query.message.message_id,
        parse_mode: "HTML",
        reply_markup: {
            "inline_keyboard": buyKeyboard
        }
    })
}
export const watchLogBuyTemplate = async (bot: any, contract: any, watchLog: any, user: any, currentGasPrice: number, wethPrice: number) => {
    let tx = getTxScan(watchLog.hash, contract.chain_id)
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: watchLog.address }], contract.chain_id)
    let ethBalance = await getBalance(contract.chain_id, watchLog.address)
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let dex = getDexTool(contract.address, contract.chain_id)
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
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
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${watchLog.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
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
    ]
    bot.sendMessage(watchLog.telegram_id, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    }
    )
}
export const watchLogSellTemplate = async (bot: any, contract: any, watchLog: any, user: any, currentGasPrice: number, wethPrice: number) => {
    let tx = getTxScan(watchLog.hash, contract.chain_id)
    let scan = getScan(contract.address, contract.chain_id)
    let poolEthBalance = 0
    let poolTokenBalance = 0
    let poolPercent = 0
    let price = '0'
    let userCoinBalance = 0
    let userEthBalance = 0
    let coinBalance = await batchCheckERC20Balance([{ contractAddr: contract.address, owner: watchLog.address }], contract.chain_id)
    let ethBalance = await getBalance(contract.chain_id, watchLog.address)
    if (coinBalance.length) {
        userCoinBalance = Number((Number(coinBalance[0].balance) / (10 ** Number(coinBalance[0].decimals))).toFixed(4))
    }
    userEthBalance = Number((Number(ethBalance) / (10 ** 18)).toFixed(4))
    if (contract.fastGetContractPrice.pool) {
        poolEthBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve0) : Number(contract.fastGetContractPrice.pool.reserve1)
        poolTokenBalance = contract.fastGetContractPrice.pool.token0 == Config[contract.chain_id].stableContract[0] ? Number(contract.fastGetContractPrice.pool.reserve1) : Number(contract.fastGetContractPrice.pool.reserve0)
        poolPercent = Number((poolTokenBalance / Number(contract.total_supply) * 100).toFixed(3))
        price = BigNumber((Number(contract.fastGetContractPrice.price) * Number(wethPrice)).toFixed(15)).toFixed()
    }
    let firstPriceDom = ""
    if (Number(contract.first_price) > 0 && Number(price) > 0) {
        let firstPrice = BigNumber((Number(contract.first_price) * wethPrice).toFixed(15)).toFixed()
        let percent = 0
        if (Number(firstPrice) > Number(price)) {
            percent = -Number(((1 - Number(price) / Number(firstPrice)) * 100).toFixed(2))
        } else {
            percent = Number(((Number(price) / Number(firstPrice) - 1) * 100).toFixed(2))
        }
        firstPriceDom += `<b>💵 初始价格: $ ${firstPrice}</b>\n`
        firstPriceDom += `<b>📈 历史涨幅: ${percent} %</b>\n`
    }
    let swapFeeDom = ""
    if (contract.is_get_swap_fee == 1) {
        swapFeeDom += `<b>💦 买入税: ${contract.buy_fee} %</b>\n`
        swapFeeDom += `<b>💦 卖出税: ${contract.sell_fee} %</b>\n`
    }
    let total = Number(contract.total_supply) / (10 ** Number(contract.decimals))
    let dex = getDexTool(contract.address, contract.chain_id)
    let str = `🎰 <b>${contract.name}(<a href='${scan}'>$${contract.symbol}</a>) # ${chainEnum[contract.chain_id]}</b>\n\n` +
        `<b>🏫 合约地址:</b>\n` +
        `<b>${contract.address}</b>\n` +
        `<b>🏤 池子地址:</b>\n` +
        `<b>${contract.fastGetContractPrice.pool ? contract.fastGetContractPrice.pool.pool : '暂无池子'}</b>\n\n` +
        `<b>🛒 DEX: ${dexNames[contract.chain_id][contract.fastGetContractPrice.pool.version]}</b>\n` +
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
        `<b>💰 市值: $ ${formatUSDPrice(Number((total * Number(price)).toFixed(3)))}</b>\n\n` +
        `<b>📌 买入地址:</b>\n` +
        `<b>${watchLog.address}</b>\n` +
        `<b>🎉 账户${contract.symbol}: ${userCoinBalance} ${contract.symbol}</b>\n` +
        `<b>📫 账户ETH: ${userEthBalance} ETH</b>\n`
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
    ]
    bot.sendMessage(watchLog.telegram_id, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    }
    )
}
export const topFiveMinutesTemplate = async (bot: any, chatId: number, list: any[]) => {
    let str = ""
    let buyKeyboard = []
    list.forEach(item => {
        let scan = getScan(item.address, item.chainId)
        str += `🎰 <b>(<a href='${scan}'>$${item.symbol}</a>) # ${chainEnum[item.chainId]}</b>\n` +
            `🔁 <b>交易次数：${item.count} (${item.countPercent} %)</b>\n` +
            `👬 <b>持有人：${item.currentHolders} (${item.holdersPercent} %)</b>\n` +
            `💡 <b>聪明钱：${item.smartMoney}</b>\n` +
            `💵 <b>价格：$ ${item.currentPrice} (${item.pricePercent} %)</b>\n` +
            `💵 <b>历史涨幅：${item.historyPercent} %</b>\n` +
            `💧 <b>前20持仓：${item.topHolderPercent} %</b>\n` +
            `💰 <b>资金净流入：${item.allInflow} ETH</b>\n\n`
        buyKeyboard.push([
            {
                text: `🚀 买入${item.symbol}`,
                callback_data: `/send_contract ${item.address}`
            }
        ])
    })
    bot.sendMessage(chatId, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    }
    )
}
export const topFifteenMinutesTemplate = async (bot: any, chatId: number, list: any[]) => {
    let str = ""
    let buyKeyboard = []
    list.forEach(item => {
        let scan = getScan(item.address, item.chainId)
        str += `🎰 <b>(<a href='${scan}'>$${item.symbol}</a>) # ${chainEnum[item.chainId]}</b>\n` +
            `🔁 <b>交易次数：${item.count} (${item.countPercent} %)</b>\n` +
            `👬 <b>30分钟内最高持有人：${item.hightHolders}</b>\n` +
            `👬 <b>持有人：${item.currentHolders} (${item.holdersPercent} %)</b>\n` +
            `💡 <b>聪明钱：${item.smartMoney}</b>\n` +
            `💵 <b>30分钟内最高价格：$ ${item.hightPrice}</b>\n` +
            `💵 <b>价格：$ ${item.currentPrice} (${item.pricePercent} %)</b>\n` +
            `💵 <b>历史涨幅：${item.historyPercent} %</b>\n` +
            `💧 <b>前20持仓：${item.topHolderPercent} %</b>\n` +
            `💰 <b>资金净流入：${item.allInflow} ETH</b>\n\n`
        buyKeyboard.push([
            {
                text: `🚀 买入${item.symbol}`,
                callback_data: `/send_contract ${item.address}`
            }
        ])
    })
    bot.sendMessage(chatId, str, {
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": buyKeyboard
        }
    }
    )
}
export const settingKeyboard = [
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
]
export const addWalletKeyboard = [
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
    [...defaultKeyboard]
]
export const walletKeyboard = [
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
    [...defaultKeyboard]
]
export const homeKeyboard = [
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
]