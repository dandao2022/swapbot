import Web3 from "web3"
const web3: any = new Web3()
import * as Path from "../../utils/path"
import { handleParams } from "../../types"
import { Config } from "../../config/constrants"
export const exactInput2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["bytes", "address", "uint256", "uint256"]], bytes)
    let routes = Path.decodePath(params[0])
    let sendParams = {
        chainId: chainId,
        inToken: routes[0].outToken,
        inAmount: params[2],
        outToken: routes[routes.length - 1].inToken,
        outAmount: params[3],
        recipient: params[1],
        methodName: "exactInput2",
        version: "uniswapv3-2",
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
        methodName: "exactInput2",
        version: "uniswapv3-2",
    }]
    return { sendParams, handleParams }
}
export const exactOutput2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["bytes", "address", "uint256", "uint256"]], bytes)
    let routes = Path.decodePath(params[0])
    let sendParams = {
        chainId: chainId,
        inToken: routes[routes.length - 1].inToken,
        inAmount: params[3],
        outToken: routes[0].outToken,
        outAmount: params[2],
        recipient: params[1],
        methodName: "exactOutput2",
        version: "uniswapv3-2"
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
        methodName: "exactOutput2",
        version: "uniswapv3-2",
    }]
    return { sendParams, handleParams }
}
export const exactInputSingle2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "address", "uint256", "uint256", "uint160"]], bytes)
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
            methodName: "exactInputSingle2",
            version: "uniswapv3-2"
        }
    ]
    return { sendParams, handleParams }
}

export const exactOutputSingle2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "address", "uint256", "uint256", "uint160"]], bytes)
    let sendParams = {
        chainId: chainId,
        inToken: params[0],
        inAmount: params[5],
        outToken: params[1],
        outAmount: params[4],
        recipient: params[3],
        methodName: "exactOutputSingle2",
        version: "uniswapv3-2"
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
            methodName: "exactOutputSingle2",
            version: "uniswapv3-2"
        }
    ]
    return { sendParams, handleParams }
}

export const increaseLiquidity2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let config = Config[chainId]
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint256", "uint256", "uint256"]], bytes)
    let sendParams = {
        chainId: chainId,
        token0: params[0],
        token1: params[1],
        tokenId: params[2],
        amount0Min: params[3],
        amount1Min: params[4],
        methodName: "increaseLiquidity2",
        version: "v3"
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: params.token0 == config.stableContract[0] ? params.token1 : params.token0,
        amountIn: sendParams.amount0Min,
        amountOut: sendParams.amount1Min,
        to: "",
        type: 3,
        methodName: "increaseLiquidity2",
        version: "uniswapv3-2"
    }]
    return { sendParams, handleParams }
}
export const mint2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameter([["address", "address", "uint24", "int24", "int24", "uint256", "uint256", "address"]], bytes)
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
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.token0 == Config[chainId].stableContract[0] ? sendParams.token1 : sendParams.token0,
        amountIn: sendParams.amount0Min,
        amountOut: sendParams.amount1Min,
        to: sendParams.recipient,
        type: 3,
        methodName: "mint2",
        version: "uniswapv3-2"
    }]
    return { sendParams, handleParams }
}
export const swapTokensForExactTokens2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address"], bytes)
    let sendParams = {
        chainId: chainId,
        amountOut: params[0],
        amountInMax: params[1],
        path: params[2],
        to: params[3],
        methodName: "swapTokensForExactTokens2",
        version: "uniswapv3-2"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}

export const swapExactTokensForTokens2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address"], bytes)
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        methodName: "swapExactTokensForTokens2",
        version: "uniswapv3-2"
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.path[sendParams.path.length - 1],
        inTarget: sendParams.path[0],
        outTarget: sendParams.path[sendParams.path.length - 1],
        amountIn: sendParams.amountIn,
        amountOut: sendParams.amountOutMin,
        to: sendParams.to,
        type: Config[chainId].stableContract.indexOf(sendParams.path[sendParams.path.length - 1]) == -1 ? 1 : 2,
        methodName: "swapExactTokensForTokens2",
        version: "uniswapv3-2"
    }]
    return { sendParams, handleParams }
}