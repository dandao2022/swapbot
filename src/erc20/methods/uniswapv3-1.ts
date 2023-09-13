import Web3 from "web3"
const web3: any = new Web3()
import * as Path from "../../utils/path"
import { handleParams } from "../../types"
import { Config } from "../../config/constrants"
export const sweepToken = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "address"], bytes)
    let sendParams = {
        chainId: chainId,
        token: params[0],
        amountMinimum: params[1],
        recipient: params[2],
        methodName: "sweepToken",
        version: "uniswapv3-1"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}

export const exactInput = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    // 参数组解码,包含解码后参数值的对象，解码exactInput合约函数的event，获取函数参数
    let params = web3.eth.abi.decodeParameter([["bytes", "address", "uint256", "uint256", "uint256"]], bytes)
    let routes = Path.decodePath(params[0])
    let sendParams = {
        chainId: chainId,
        inToken: routes[0].outToken,
        inAmount: params[3],
        outToken: routes[routes.length - 1].inToken,
        outAmount: params[4],
        recipient: params[1],
        methodName: "exactInput",
        version: "uniswapv3-1",
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const exactOutput = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["bytes", "address", "uint256", "uint256", "uint256"]], bytes)
    let routes = Path.decodePath(params[0])
    let sendParams = {
        chainId: chainId,
        inToken: routes[routes.length - 1].inToken,
        inAmount: params[4],
        outToken: routes[0].outToken,
        outAmount: params[3],
        recipient: params[1],
        methodName: "exactOutput",
        version: "uniswapv3-1"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const exactInputSingle = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "address", "uint256", "uint256", "uint256", "uint160"]], bytes)
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
    }
    let handleParams: handleParams[] = [
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
    ]
    return { sendParams, handleParams }
}

export const exactOutputSingle = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "address", "uint256", "uint256", "uint256", "uint160"]], bytes)
    let sendParams = {
        chainId: chainId,
        inToken: params[0],
        inAmount: params[6],
        outToken: params[1],
        outAmount: params[5],
        recipient: params[3],
        methodName: "exactOutputSingle",
        version: "uniswapv3-1"
    }
    let handleParams: handleParams[] = [
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
    ]
    return { sendParams, handleParams }
}

export const unwrapWETH9 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "address"], bytes)
    let sendParams = {
        chainId: chainId,
        amount: params[0],
        recipient: params[1],
        methodName: "unwrapWETH9",
        version: "uniswapv3-1"
    }
    let handleParams: handleParams[] = [{
        target: Config[chainId].stableContract[0],
        chain_id: chainId,
        outTarget: Config[chainId].stableContract[0],
        inTarget:  Config[chainId].stableContract[0],
        amountIn: sendParams.amount,
        amountOut: sendParams.amount,
        to: sendParams.recipient,
        type: 2,
        methodName: "unwrapWETH9",
        version: "uniswapv3-1"
    }]
    return { sendParams, handleParams }
}
export const v3SwapExactIn = (bytes: string, chainId: number) => {
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "bytes"], bytes)
    let routes = Path.decodePath(params[3])
    let sendParams = {
        chainId: chainId,
        inToken: routes[0].outToken,
        inAmount: params[1],
        outToken: routes[routes.length - 1].inToken,
        outAmount: params[2],
        recipient: params[0],
        methodName: "v3SwapExactIn",
        version: "uniswapv3-1",
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const v3SwapExactOut = (bytes: string, chainId: number) => {
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "bytes"], bytes)
    let routes = Path.decodePath(params[3])
    let sendParams = {
        chainId: chainId,
        inToken: routes[0].outToken,
        inAmount: params[1],
        outToken: routes[routes.length - 1].inToken,
        outAmount: params[2],
        recipient: params[0],
        methodName: "v3SwapExactOut",
        version: "uniswapv3-1",
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const unwrapWETH9WithFee = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "address", "uint256", "address"], bytes)
    let sendParams = {
        chainId: chainId,
        amountMinimum: params[0],
        recipient: params[1],
        feeBips: params[2],
        feeRecipient: params[3],
        methodName: "unwrapWETH9WithFee",
        version: "uniswapv3-1"
    }
    let handleParams: handleParams[] = [{
        target: Config[chainId].stableContract[0],
        chain_id: chainId,
        outTarget: Config[chainId].stableContract[0],
        inTarget: Config[chainId].stableContract[0],
        amountIn: sendParams.amountMinimum,
        amountOut: sendParams.amountMinimum,
        to: sendParams.recipient,
        type: 2,
        methodName: "unwrapWETH9WithFee",
        version: "uniswapv3-1"
    }]
    return { sendParams, handleParams }
}

export const sweepTokenWithFee = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "address", "uint256", "address"], bytes)
    let sendParams = {
        chainId: chainId,
        token: params[0],
        amountMinimum: params[1],
        recipient: params[2],
        feeBips: params[3],
        feeRecipient: params[4],
        methodName: "sweepTokenWithFee",
        version: "uniswapv3-1"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const decreaseLiquidity = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["uint256", "uint128", "uint256", "uint256", "uint256"]], bytes)
    let sendParams = {
        chainId: chainId,
        tokenId: params[0],
        liquidity: params[1],
        amount0Min: params[2],
        amount1Min: params[3],
        deadline: params[4],
        methodName: "decreaseLiquidity",
        version: "uniswapv3-1"
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: "",
        liquidity: sendParams.liquidity,
        to: "",
        type: 4,
        methodName: 'decreaseLiquidity',
        version: 'uniswapv3-1'
    }]
    return { sendParams, handleParams }
}
export const increaseLiquidity = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["uint256", "uint256", "uint256", "uint256", "uint256", "uint256"]], bytes)
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
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: "",
        amountIn: sendParams.amount0Desired,
        amountOut: sendParams.amount1Desired,
        to: "",
        type: 3,
        methodName: "increaseLiquidity",
        version: "uniswapv3-1"
    }]
    return { sendParams, handleParams }
}
export const collect = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["uint256", "address", "uint128", "uint128"]], bytes)
    let sendParams = {
        chainId: chainId,
        tokenId: params[0],
        recipient: params[1],
        amount0Max: params[2],
        amount1Max: params[3],
        methodName: "collect",
        version: "uniswapv3-1"
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: "",
        amountIn: sendParams.amount0Max,
        amountOut: sendParams.amount1Max,
        to: "",
        type: 2,
        methodName: "collect",
        version: "uniswapv3-1"
    }]
    return { sendParams, handleParams }
}

export const createAndInitializePoolIfNecessary = (bytes: string, chainId) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["address", "address", "uint24", "uint160"], bytes)
    let sendParams = {
        chainId: chainId,
        token0: params[0],
        token1: params[1],
        fee: params[2],
        sqrtPriceX96: params[3],
        methodName: "createAndInitializePoolIfNecessary",
        version: "uniswapv3-1"
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.token0 == Config[chainId].stableContract[0] ? sendParams.token1 : sendParams.token0,
        amountIn: "",
        amountOut: "",
        to: "",
        type: 3,
        methodName: "createAndInitializePoolIfNecessary",
        version: "uniswapv3-1"
    }]
    return { sendParams, handleParams }
}

export const mint = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "int24", "int24", "uint256", "uint256", "uint256", "uint256", "address", "uint256"]], bytes)
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
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.token0 == Config[chainId].stableContract[0] ? sendParams.token1 : sendParams.token0,
        amountIn: sendParams.amount0Desired,
        amountOut: sendParams.amount1Desired,
        to: sendParams.recipient,
        type: 3,
        methodName: "mint",
        version: "uniswapv3-1"
    }]
    return { sendParams, handleParams }
}