import Web3 from "web3"
const web3: any = new Web3()
import { handleParams } from "../../types"
import { Config } from "../../config/constrants"
export const addLiquidity = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["address", "address", "uint256", "uint256", "uint256", "uint256", "address", "uint256"], bytes)
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
    }

    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.tokenA == Config[chainId].stableContract[0] ? sendParams.tokenB : sendParams.tokenA,
        amountIn: sendParams.amountADesired,
        amountOut: sendParams.amountADesired,
        to: sendParams.to,
        type: 3,
        methodName: "addLiquidity",
        version: "uniswapv2"
    }]
    return { sendParams, handleParams }
}
export const addLiquidityETH = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "uint256", "address", "uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        token: params[0],
        amountTokenDesired: params[1],
        amountTokenMin: params[2],
        amountETHMin: params[3],
        to: params[4],
        methodName: "addLiquidityETH",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.token,
        amountIn: "",
        amountOut: sendParams.amountTokenDesired,
        to: sendParams.to,
        methodName: "addLiquidityETH",
        version: "uniswapv2",
        type: 3,
    }]
    return { sendParams, handleParams }
}
export const removeLiquidityETHWithPermit = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "uint256", "address", "uint256", "bool", "uint8", "bytes32", "bytes32"], bytes)
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
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.token,
        liquidity: sendParams.liquidity,
        to: sendParams.to,
        methodName: "removeLiquidityETHWithPermit",
        version: "uniswapv2",
        type: 4
    }]
    return { sendParams, handleParams }
}
export const removeLiquidityETHWithPermitSupportingFeeOnTransferTokens = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "uint256", "address", "uint256", "bool", "uint8", "bytes32", "bytes32"], bytes)
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
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.token,
        liquidity: sendParams.liquidity,
        to: sendParams.to,
        type: 4,
        methodName: "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens",
        version: "uniswapv2"
    }]
    return { sendParams, handleParams }
}
export const removeLiquidity = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["address", "address", "uint256", "uint256", "uint256", "address", "uint256"], bytes)
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
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const removeLiquidityETHSupportingFeeOnTransferTokens = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "uint256", "address", "uint256"], bytes)
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
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.token,
        amountIn: sendParams.amountETHMin,
        amountOut: sendParams.amountTokenMin,
        to: sendParams.to,
        type: 4,
        liquidity: sendParams.liquidity,
        methodName: "removeLiquidityETHSupportingFeeOnTransferTokens",
        version: "uniswapv2"
    }]
    return { sendParams, handleParams }
}
export const removeLiquidityWithPermit = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["address", "address", "uint256", "uint256", "uint256", "address", "uint256", "bool", "uint8", "bytes32", "bytes32"], bytes)
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
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const swapETHForExactTokens = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "address[]", "address", "uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountOut: params[0],
        path: params[1],
        to: params[2],
        deadline: params[3],
        methodName: "swapETHForExactTokens",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const swapExactETHForTokens = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "address[]", "address", "uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountOutMin: params[0],
        path: params[1],
        to: params[2],
        deadline: params[3],
        methodName: "swapExactETHForTokens",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const swapExactETHForTokensSupportingFeeOnTransferTokens = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "address[]", "address", "uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountOutMin: params[0],
        path: params[1],
        to: params[2],
        deadline: params[3],
        methodName: "swapExactETHForTokensSupportingFeeOnTransferTokens",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const swapExactTokensForETH = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapExactTokensForETH",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const swapExactTokensForETHSupportingFeeOnTransferTokens = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapExactTokensForETHSupportingFeeOnTransferTokens",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const swapExactTokensForTokens = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapExactTokensForTokens",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const swapExactTokensForTokensSupportingFeeOnTransferTokens = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
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
    ]
    return { sendParams, handleParams }
}
export const swapTokensForExactETH = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountOut: params[0],
        amountInMax: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapTokensForExactETH",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const swapTokensForExactTokens = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountOut: params[0],
        amountInMax: params[1],
        path: params[2],
        to: params[3],
        deadline: params[4],
        methodName: "swapTokensForExactTokens",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}
export const v2SwapExactIn = (bytes: string, chainId: number) => {
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "address[]"], bytes)
    let sendParams = {
        chainId: chainId,
        amountIn: params[1],
        amountOut: params[2],
        path: params[3],
        to: params[0],
        methodName: "v2SwapExactIn",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.path[sendParams.path.length - 1],
        inTarget: sendParams.path[0],
        outTarget: sendParams.path[sendParams.path.length - 1],
        amountIn: sendParams.amountIn,
        amountOut: sendParams.amountOut,
        to: sendParams.to,
        type: Config[chainId].stableContract.indexOf(sendParams.path[sendParams.path.length - 1]) == -1 ? 1 : 2,
        methodName: "v2SwapExactIn",
        version: "uniswapv2"
    }]
    return { sendParams, handleParams }
}
export const v2SwapExactOut = (bytes: string, chainId: number) => {
    let params = web3.eth.abi.decodeParameters(["address", "uint256", "uint256", "address[]"], bytes)
    let sendParams = {
        chainId: chainId,
        amountIn: params[1],
        amountOut: params[2],
        path: params[3],
        to: params[0],
        methodName: "v2SwapExactOut",
        version: "uniswapv2"
    }
    let handleParams: handleParams[] = [{
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
    }]
    return { sendParams, handleParams }
}