import Web3 from "web3"
const web3 = new Web3()
import { methodsEnum, executeMethods } from "../types"
import * as uniswapV31 from "./methods/uniswapv3-1"
import * as uniswapV32 from "./methods/uniswapv3-2"
import * as uniswapV2 from "./methods/uniswapv2"
export const multicall3 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params: any = web3.eth.abi.decodeParameters(["uint256", "bytes[]"], bytes)
    let sendParamss = []
    let handleParamss = []
    for (let item of params[1]) {
        let { sendParams, handleParams } = distribute(item, chainId)
        if (sendParams) {
            sendParamss.push(sendParams)
        }
        if (handleParams) {
            handleParamss = handleParamss.concat(handleParams)
        }
    }
    return { sendParams: sendParamss, handleParams: handleParamss }
}
export const multicall2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params: any = web3.eth.abi.decodeParameters(["bytes32", "bytes[]"], bytes)
    let sendParamss = []
    let handleParamss = []
    for (let item of params[1]) {
        let { sendParams, handleParams } = distribute(item, chainId)
        if (sendParams) {
            sendParamss.push(sendParams)
        }
        if (handleParams) {
            handleParamss = handleParamss.concat(handleParams)
        }
    }
    return { sendParams: sendParamss, handleParams: handleParamss }
}
export const multicall = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params: any = web3.eth.abi.decodeParameter("bytes[]", bytes)
    let sendParamss = []
    let handleParamss = []
    for (let item of params) {
        let { sendParams, handleParams } = distribute(item, chainId)
        if (sendParams) {
            sendParamss.push(sendParams)
        }
        if (handleParams) {
            handleParamss = handleParamss.concat(handleParams)
        }
    }
    let _findCreateAndInitializePoolIfNecessary = sendParamss.find(item => {
        return item.methodName == "createAndInitializePoolIfNecessary"
    })
    let _findDecreaseLiquidity = sendParamss.find(item => {
        return item.methodName == "decreaseLiquidity"
    })
    if (_findDecreaseLiquidity) {
        let findDecreaseLiquidity = handleParamss.find(item => {
            return item.methodName == "decreaseLiquidity"
        })
        let findSweepToken = handleParamss.find(item => {
            return item.methodName == "sweepToken"
        })
        if (findSweepToken) {
            findDecreaseLiquidity.target = findSweepToken.target
            findDecreaseLiquidity.to = findSweepToken.to
        }
        return { sendParams: _findDecreaseLiquidity, handleParams: [findDecreaseLiquidity] }
    }
    if (_findCreateAndInitializePoolIfNecessary) {
        let findCreateAndInitializePoolIfNecessary = handleParamss.find(item => {
            return item.methodName == "createAndInitializePoolIfNecessary"
        })
        let findMint = handleParamss.find(item => {
            return item.methodName == "mint"
        })
        if (findMint) {
            findCreateAndInitializePoolIfNecessary.amount = findMint.amount
            findCreateAndInitializePoolIfNecessary.to = findMint.to
        }
        return { sendParams: _findDecreaseLiquidity, handleParams: [findCreateAndInitializePoolIfNecessary] }
    }
    return { sendParams: sendParamss, handleParams: handleParamss }
}
export const execute2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params:any = web3.eth.abi.decodeParameters(["bytes", "bytes[]"], bytes)
    let commonds = web3.utils.hexToBytes(params[0])
    let list = []
    commonds.forEach((key, index) => {
        if (executeMethods[key]) {
            list = methods[executeMethods[key]](params[1][index], chainId)
        }
    })
    return list
}
export const execute = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params:any  = web3.eth.abi.decodeParameters(["bytes", "bytes[]", "uint256"], bytes)
    let commonds = web3.utils.hexToBytes(params[0])
    let list = []
    commonds.forEach((key, index) => {
        if (executeMethods[key]) {
            list = methods[executeMethods[key]](params[1][index], chainId)
        }
    })
    return list
}
export const distribute = (bytes: string, chainId: number) => {
    let methodHex = bytes.slice(0, 10)
    if (methodsEnum[methodHex]) {
        return methods[methodsEnum[methodHex]](bytes, chainId)
    } else {
        return ""
    }
}

export const methods = {
    multicall,
    multicall2,
    multicall3,
    execute2,
    execute,
    ...uniswapV31,
    ...uniswapV32,
    ...uniswapV2
}