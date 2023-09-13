import BigNumber from "bignumber.js"
import { Token } from '@uniswap/sdk-core'
export enum methodsEnum {
    "0xb858183f" = "exactInput2",
    "0xc04b8d59" = "exactInput",
    "0x04e45aaf" = "exactInputSingle2",
    "0x414bf389" = "exactInputSingle",
    "0x09b81346" = "exactOutput2",
    "0xf28c0498" = "exactOutput",
    "0x5023b4df" = "exactOutputSingle2",
    "0xdb3e2198" = "exactOutputSingle",
    "0xac9650d8" = "multicall",
    "0x1f0464d1" = "multicall2",
    "0x5ae401dc" = "multicall3",
    "0xdf2ab5bb" = "sweepToken",
    "0xe0e189a0" = "sweepTokenWithFee",
    "0x0c49ccbe" = "decreaseLiquidity",
    "0xf100b205" = "increaseLiquidity2",
    "0x219f5d17" = "increaseLiquidity",
    "0x49404b7c" = "unwrapWETH9",
    "0x9b2c0a37" = "unwrapWETH9WithFee",
    "0xfc6f7865" = "collect",
    "0x11ed56c9" = "mint2",
    "0x88316456" = "mint",
    "0x13ead562" = "createAndInitializePoolIfNecessary",
    "0xe8e33700" = "addLiquidity",
    "0xf305d719" = "addLiquidityETH",
    "0xded9382a" = "removeLiquidityETHWithPermit",
    "0x5b0d5984" = "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens",
    "0xbaa2abde" = "removeLiquidity",
    "0xaf2979eb" = "removeLiquidityETHSupportingFeeOnTransferTokens",
    "0x2195995c" = "removeLiquidityWithPermit",
    "0xfb3bdb41" = "swapETHForExactTokens",
    "0x7ff36ab5" = "swapExactETHForTokens",
    "0xb4822be3" = "swapExactETHForTokensSupportingFeeOnTransferTokens2",
    "0xb6f9de95" = "swapExactETHForTokensSupportingFeeOnTransferTokens",
    "0x18cbafe5" = "swapExactTokensForETH",
    "0x52aa4c22" = "swapExactTokensForETHSupportingFeeOnTransferTokens2",
    "0x791ac947" = "swapExactTokensForETHSupportingFeeOnTransferTokens",
    "0x472b43f3" = "swapExactTokensForTokens2",
    "0x38ed1739" = "swapExactTokensForTokens",
    "0xac3893ba" = "swapExactTokensForTokensSupportingFeeOnTransferTokens2",
    "0x5c11d795" = "swapExactTokensForTokensSupportingFeeOnTransferTokens",
    "0x4a25d94a" = "swapTokensForExactETH",
    "0x42712a67" = "swapTokensForExactTokens2",
    "0x8803dbee" = "swapTokensForExactTokens",
    "0x24856bc3" = "execute2",
    "0x3593564c" = "execute"
}

export const executeMethods = {
    0: "v3SwapExactIn",
    1: "v3SwapExactOut",
    8: "v2SwapExactIn",
    9: "v2SwapExactOut",
}
export interface v3SwapLog {
    from?: string,
    inToken: string;
    inDecimals?: number,
    inSymbol?: string,
    inName?: string
    inAmount: number,
    outToken: string;
    outDecimals?: number,
    outSymbol?: string,
    outName?: string
    outAmount: number,
    swapPool?: string,
    recipient: string
}
export interface token {
    chain_id?: number,
    address: string,
    decimals?: number,
    symbol?: string,
    name?: string
}

export interface pair {
    reserve0: string,
    reserve1: string,
    blockTimestampLast: string,
    totalSupply: string
}

export interface config {
    chainID: number,
    prc: string,
    v3FactoryAddress: string,
    v3Router: string,
    v3Position: string,
    stableContract: string[],
    WETH: any,
}
export interface token {
    chainId?: number,
    address: string,
    totalSupply?: string,
    decimals?: number,
    symbol?: string,
    name?: string
}
export interface Immutables {
    factory: string
    token0: string
    token1: string
    fee: number
    tickSpacing: number
    maxLiquidityPerTick: BigNumber,
    name?: string,
    poolAddress?: string
}
export interface createEvent {
    name: string,
    chain_id: number,
    symbol: string,
    decimals: string,
    totalSupply: string,
    owner: string,
    address: string,
}
export interface callbackEvent {
    model: string,
    chainId: number,
    blockNumber: number | string,
    createEvents: createEvent[],
    handleParams: handleParams[],
    swapEvents: swapEvent[],
    sendParams: any[],
    transactions: any[],
    ms: number
}
export interface followCallbackEvent {
    model: string,
    chainId: number,
    blockNumber: number | string,
    handleParams: handleParams[],
    transactions: any[],
    ms: number
}
export interface v2Pool {
    pool: string,
    reserve0: string,
    reserve1: string,
    token0: string,
    token1: string,
    blockTimestampLast: number,
    totalSupply: string,
    name?: string,
    version?: string,
    contract?: string
}

export interface v3Pool {
    pool: string,
    maxLiquidityPerTick: string,
    tickSpacing: string,
    liquidity: string,
    reserve0: string,
    reserve1: string,
    fee: number,
    token0: string,
    token1: string,
    slot0: any,
    name?: string,
    version?: string,
    contract?: string
}

export interface v3Path {
    inToken: string;
    outToken: string;
    fee: number
}
export interface checkERC20Item {
    contractAddr: string,
    owner: string
}
export interface checkERC20Response {
    contractAddr: string;
    addr: string;
    decimals: number;
    balance: string;
}
export interface handleParams {
    target: string,
    inTarget?: string,
    outTarget?: string,
    amountIn?: string,
    amountOut?: string,
    liquidity?: string,
    from?: string,
    to: string,
    methodName: string,
    version: string,
    type: number,
    transactionHex?: string
    chain_id?: number,
    transaction_hash?: string
    receive?: string
    method_name?: string,
    create_time?: number
}

export interface insertItem {
    chain_id: number,
    name: string,
    symbol: string,
    decimals: string | number,
    total_supply: string | number,
    owner: string,
    address: string,
    is_add_liquidity: number,
    is_remove_liquidity: number,
    is_get_swap_fee: number,
    pools: string,
    liquidity_pools: any,
    reserve0: string | number,
    first_price: string,
    liquidity_total: string | number,
    creator: string,
    update_time: number,
    create_time: number,
    buy_fee?: number,
    sell_fee?: number,
    block_number?: number,
    jsonPools?: any,
    LiquidityPools?: any,
    Token?: Token,
}
export interface sendParams {
    amountIn: string,
    amountOut: string,
    version: string,
    chainID: number,
    address: string,
    poolFee: number
}
export interface checkPoolCallBack {
    address: string,
    is_add_liquidity: number,
    is_remove_liquidity: number,
    liquidity_total: string | number,
    reserve0: string | number,
    liquidity_pools: any,
}

export interface pool {
    token0: string,
    token1: string,
    pool: string,
    name: string,
    tag: string,
    fee: number,
    version?: string
}

export interface fuckTuGouParams {
    _pool: string,
    _router: string,
    _bytes: string,
    _amount: string,
}

export interface manualParams {
    amountIn: string,
    amountOut: string,
    chainId: number,
    contract: string,
    swapFee: number,
    gasFee: number,
    pool: pool
}

export interface baseData {
    name: string,
    chain_id?: number,
    symbol: string,
    decimals: number,
    totalSupply: string,
    owner: string
    contractAddr: string
}

export interface initParams {
    chainIds: number[],
    adminName: string,
    token: string,
    dbData: dbData
}
export interface dbData {
    host: string,
    user: string,
    password: string,
    port: number,
    database: string
}
export interface commandTask {
    uuid: string,
    target: string,
    price: number | string,
    type: number, //type==1 限价买入，type==2 限价卖出
    amount?: number, //买入数量
    sellPercent?: number, //卖出比例
    gasFee: number,
    swapFee: number,
    privateKey: string
}

export interface msgPushCallBack {
    chainId: number, //链id
    chainName: string, //链名称
    name: string,//合约名称
    symbol: string,//代币
    totalSupply: string, //币总量
    owner: string, //合约所有者
    firstPrice: string, //初始价格
    dexName: string, //上线的dex
    scanUrl: string, //scan链接
    dexUrl: string, //scan链接
    poolBalance: number //池子余额
}

export interface watchTransaction {
    address: string,
    name: string,
    telegram_id: number,
    telegram_name: string,
    create_time: number,
    id: number,
    hash: string
}

export interface watchLog {
    id?: number,
    chain_id: number,
    address: string, //监听地址
    name: string, //监听地址名称
    in_target: string, //买入币种地址
    in_all_reserve?: string,
    in_price?: string,
    in_name?: string,
    in_pool?: string,
    in_decimals?: number,
    in_version?: string,
    in_symbol?: string,
    out_target: string, //输出币种地址
    out_all_reserve?: string,
    out_price?: string,
    out_name?: string,
    out_pool?: string,
    out_decimals?: number,
    out_version?: string,
    out_symbol?: string,
    telegram_id: number, //电报id
    telegram_name: string, //电报名称
    hash: string, //交易hex
    price: string, //成交均价
    amount_in: string, //付出多少
    amount_out: string,//收入多少
    cost: number, //成本价格 付出 + gas
    type: number, //类型 1买入 2卖出
    left_amount?: string, //剩余仓位
    swap_fee: number, //买卖滑点
    create_time: number, //创建时间
}
export interface telegramTask {
    id: number,
    chain_id: number,
    address: string,
    private_key: string,
    target: string,
    telegram_id: number,
    telegram_name: string,
    amount: string,
    percent: number,
    pool_percent: number,
    type: number,
    encode_data: string,
    swap_fee: number,
    gas_fee: number,
    start_time: number,
    create_time: number
}

export interface swapEvent {
    id?: number,
    hash: string,
    chain_id: number,
    from_address: string,
    to_address: string,
    in_target: string,
    in_amount: string,
    in_swap_fee: number,
    swap_out_address: string,
    out_target: string,
    out_amount: string,
    out_swap_fee: number,
    swap_in_address: string,
    swap_routers: string,
    block_number: number,
    effective_gas_price: string,
    gas_used: string,
    create_time: number
}