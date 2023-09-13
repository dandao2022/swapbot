import Web3 from "web3"
const web3:any = new Web3()
import { handleParams } from "../../types"
export const swapExactETHForTokensSupportingFeeOnTransferTokens2 = (bytes: string, chainId: number)=>{
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "address[]", "address", "address","uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountOutMin: params[0],
        path: params[1],
        to: params[2],
        deadline: params[4],
        methodName: "swapExactETHForTokensSupportingFeeOnTransferTokens2",
        version: "camelotv2"
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.path[sendParams.path.length - 1],
        inTarget:sendParams.path[0],
        outTarget: sendParams.path[sendParams.path.length - 1],
        amountIn: "",
        amountOut: sendParams.amountOutMin,
        to: sendParams.to,
        type: 1,
        methodName: "swapExactETHForTokensSupportingFeeOnTransferTokens2",
        version: "camelotv2"
    }]
    return { sendParams, handleParams }
}

export const swapExactTokensForETHSupportingFeeOnTransferTokens2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "address", "uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        deadline: params[5],
        methodName: "swapExactTokensForETHSupportingFeeOnTransferTokens2",
        version: "camelotv2"
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.path[0],
        inTarget:sendParams.path[0],
        outTarget: sendParams.path[sendParams.path.length - 1],
        amountIn: sendParams.amountIn,
        amountOut: sendParams.amountOutMin,
        to: sendParams.to,
        type: 2,
        methodName: "swapExactTokensForETHSupportingFeeOnTransferTokens2",
        version: "camelotv2"
    }]
    return { sendParams, handleParams }
}

export const swapExactTokensForTokensSupportingFeeOnTransferTokens2 = (bytes: string, chainId: number) => {
    bytes = bytes.slice(10)
    let params = web3.eth.abi.decodeParameters(["uint256", "uint256", "address[]", "address", "address","uint256"], bytes)
    let sendParams = {
        chainId: chainId,
        amountIn: params[0],
        amountOutMin: params[1],
        path: params[2],
        to: params[3],
        deadline: params[5],
        methodName: "swapExactTokensForTokensSupportingFeeOnTransferTokens2",
        version: "camelotv2"
    }
    let handleParams: handleParams[] = [{
        chain_id: chainId,
        target: sendParams.path[0],
        inTarget:sendParams.path[0],
        outTarget: sendParams.path[sendParams.path.length - 1],
        amountIn: sendParams.amountIn,
        amountOut: sendParams.amountOutMin,
        to: sendParams.to,
        methodName: "swapExactTokensForTokensSupportingFeeOnTransferTokens2",
        version: "camelotv2",
        type: 2
    },
    {
        chain_id: chainId,
        target: sendParams.path[sendParams.path.length - 1],
        inTarget:sendParams.path[0],
        outTarget: sendParams.path[sendParams.path.length - 1],
        amountIn: sendParams.amountIn,
        amountOut: sendParams.amountOutMin,
        to: sendParams.to,
        methodName: "swapExactTokensForTokensSupportingFeeOnTransferTokens2",
        version: "camelotv2",
        type: 1
    }
    ]
    return { sendParams, handleParams }
}