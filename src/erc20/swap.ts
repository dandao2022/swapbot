import BigNumber from "bignumber.js"
import { encodePath } from "../utils/path"
import { v3Router, v2Router, ERC20, Camelot, Trade } from "../config/abis"
import { Config, transactionGas } from "../config/constrants"
import { getTransactionCount, getGasPrice, estimateGas, telegramBatchEstimateGas } from "../utils/fetch"
import { getProvider, getTransactionErrorHash, getTransactionErrorTransactionReceipt } from "../utils/help"
import { pool, fuckTuGouParams, manualParams, telegramTask } from "../types"
import { getBatchFuckBlockPendingEvent } from "./event"

//查看是否授权
export const checkApprove = async (user: string, target: string, spender: string, amount: string, web3: any, privateKey: string) => {
    let contract = new web3.eth.Contract(ERC20, target)
    let approveBalance = await contract.methods.allowance(user, spender).call()
    if (Number(approveBalance) >= Number(amount)) {
        return true
    } else {
        return await approveAll(target, spender, web3, privateKey)
    }
}

//手动卖请求打包
export const encodeManualSellCallData = (manualParams: manualParams, privateKey: string) => {
    let config = Config[manualParams.chainId]
    let web3 = getProvider(manualParams.chainId)
    let account = web3.eth.accounts.privateKeyToAccount(privateKey)
    let bytes = ""
    let router = ""
    if (manualParams.pool.tag == 'uniswapv3') {
        let contract = new web3.eth.Contract(v3Router, config.v3Router)
        let tokenIn = manualParams.contract
        let tokenOut = config.stableToken[0].address
        const deadline = Math.round(new Date().getTime() / 1000) + 3600;
        let path = encodePath(tokenOut, tokenIn, manualParams.pool.fee)
        bytes = contract.methods.exactOutput([path, account.address, deadline, 0, BigNumber(manualParams.amountIn).toFixed()]).encodeABI()
        router = config.v3Router
    } else if (manualParams.pool.tag == 'uniswapv2') {
        let contract = new web3.eth.Contract(v2Router, config.v2Router)
        let tokenIn = manualParams.contract
        let tokenOut = config.stableToken[0].address
        const deadline = Math.round(new Date().getTime() / 1000) + 3600;
        bytes = contract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(BigNumber(manualParams.amountIn).toFixed(), 0, [tokenIn, tokenOut], account.address, deadline).encodeABI()
        router = config.v2Router
    } else if (manualParams.pool.tag == 'camelotv2') {
        let contract = new web3.eth.Contract(Camelot, config.camelotV2Router)
        let tokenIn = manualParams.contract
        let tokenOut = config.stableToken[0].address
        const deadline = Math.round(new Date().getTime() / 1000) + 3600;
        bytes = contract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(BigNumber(manualParams.amountIn).toFixed(), 0, [tokenIn, tokenOut], account.address, "0x0000000000000000000000000000000000000000", deadline).encodeABI()
        router = config.camelotV2Router
    }
    return { bytes, router }
}
//手动买请求打包
export const encodeManualBuyCallData = (manualParams: manualParams, privateKey: string) => {
    let config = Config[manualParams.chainId]
    let web3 = getProvider(manualParams.chainId)
    let account = web3.eth.accounts.privateKeyToAccount(privateKey)
    let allParams = []
    if (manualParams.pool.tag == 'uniswapv3') {
        let contract = new web3.eth.Contract(v3Router, config.v3Router)
        let tokenIn = config.stableToken[0].address
        let tokenOut = manualParams.pool.token0 == config.stableToken[0].address ? manualParams.pool.token1 : manualParams.pool.token0
        const deadline = Math.round(new Date().getTime() / 1000) + 86400;
        let bytes = contract.methods.exactInputSingle([tokenIn, tokenOut, manualParams.pool.fee, account.address, deadline, manualParams.amountIn, manualParams.amountOut, 0]).encodeABI()
        let params = {
            _pool: manualParams.pool.pool,
            _router: config.v3Router,
            _bytes: bytes
        }
        allParams.push(params)
    } else if (manualParams.pool.tag == 'uniswapv2') {
        let contract = new web3.eth.Contract(v2Router, config.v2Router)
        let tokenIn = config.stableToken[0].address
        let tokenOut = manualParams.pool.token0 == config.stableToken[0].address ? manualParams.pool.token1 : manualParams.pool.token0
        const deadline = Math.round(new Date().getTime() / 1000) + 86400;
        let bytes = contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(manualParams.amountOut, [tokenIn, tokenOut], account.address, deadline).encodeABI()
        let params = {
            _pool: manualParams.pool.pool,
            _router: config.v2Router,
            _bytes: bytes
        }
        allParams.push(params)
    } else if (manualParams.pool.tag == 'camelotv2') {
        let contract = new web3.eth.Contract(Camelot, config.camelotV2Router)
        let tokenIn = config.stableToken[0].address
        let tokenOut = manualParams.pool.token0 == config.stableToken[0].address ? manualParams.pool.token1 : manualParams.pool.token0
        const deadline = Math.round(new Date().getTime() / 1000) + 86400;
        let bytes = contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(manualParams.amountOut, [tokenIn, tokenOut], account.address, "0x0000000000000000000000000000000000000000", deadline).encodeABI()
        let params = {
            _pool: manualParams.pool.pool,
            _router: config.camelotV2Router,
            _bytes: bytes
        }
        allParams.push(params)
    }
    return allParams
}
//手动买
export const manualSwapBuy = async (manualParams: manualParams, privateKey: string) => {
    return new Promise<{ success: boolean, signTx: any, msg: string }>(async (resolve) => {
        let config = Config[manualParams.chainId]
        let web3 = getProvider(manualParams.chainId)
        let contract = new web3.eth.Contract(Trade, config.DANDAOTrade)
        let allParams: fuckTuGouParams[] = encodeManualBuyCallData(manualParams, privateKey)
        let encode = contract.methods.FuckTuGouBuy(manualParams.contract, manualParams.amountOut, 0, allParams).encodeABI()
        let account = web3.eth.accounts.privateKeyToAccount(privateKey)
        let preRequest = await estimateGas({
            from: account.address,
            to: config.DANDAOTrade,
            data: encode,
            value: BigNumber(Number(manualParams.amountIn) + config.DANDAOFee).toFixed()
        }, web3)
        if (preRequest.success) {
            let nonce = await getTransactionCount(account.address, web3);
            let gasPrice = await getGasPrice(web3)
            let signTx = await web3.eth.accounts.signTransaction({
                nonce: nonce,
                from: account.address,
                to: config.DANDAOTrade,
                data: encode,
                gas: transactionGas[manualParams.chainId], //设定固定gas limit
                maxFeePerGas: BigNumber(Number(gasPrice) + manualParams.gasFee * 10 ** 9).toFixed(),
                maxPriorityFeePerGas: BigNumber(manualParams.gasFee * 10 ** 9).toFixed(),
                value: BigNumber(Number(manualParams.amountIn) + config.DANDAOFee).toFixed()
            }, account.privateKey)
            resolve({ success: true, signTx, msg: "预请求成功" })
        } else {
            resolve({ success: false, signTx: null, msg: preRequest.msg })
        }
    })
}
//手动卖
export const manualSwapSell = async (manualParams: manualParams, privateKey: string) => {
    return new Promise<{ success: boolean, signTx: any, msg: string }>(async (resolve) => {
        let config = Config[manualParams.chainId]
        let web3 = getProvider(manualParams.chainId)
        let account = web3.eth.accounts.privateKeyToAccount(privateKey)
        let contract = new web3.eth.Contract(Trade, config.DANDAOTrade)
        let { bytes, router } = encodeManualSellCallData(manualParams, privateKey)
        let isApprove = await checkApprove(account.address, manualParams.contract, config.DANDAOTrade, manualParams.amountIn, web3, privateKey)
        if (!isApprove) {
            resolve({ success: false, signTx: null, msg: "授权失败" })
            return
        }
        let encode = contract.methods.FuckTuGouSell(manualParams.contract, router, manualParams.amountIn, manualParams.amountOut, bytes).encodeABI()
        let preRequest = await estimateGas({
            from: account.address,
            to: config.DANDAOTrade,
            data: encode,
            value: BigNumber(config.DANDAOFee).toFixed()
        }, web3)
        if (preRequest.success) {
            let nonce = await getTransactionCount(account.address, web3);
            let gasPrice = await getGasPrice(web3)
            let signTx = await web3.eth.accounts.signTransaction({
                nonce: nonce,
                from: account.address,
                to: config.DANDAOTrade,
                data: encode,
                gas: transactionGas[manualParams.chainId], //设定固定gas limit
                maxFeePerGas: BigNumber(Number(gasPrice) + manualParams.gasFee * 10 ** 9).toFixed(),
                maxPriorityFeePerGas: BigNumber(manualParams.gasFee * 10 ** 9).toFixed(),
                value: BigNumber(config.DANDAOFee).toFixed()
            }, account.privateKey)
            resolve({ success: true, signTx, msg: "预请求成功" })
        } else {
            resolve({ success: false, signTx: null, msg: preRequest.msg })
        }
    })
}
export const approveAll = async (target: string, spender: string, web3: any, privateKey: string) => {
    let account = web3.eth.accounts.privateKeyToAccount(privateKey)
    let contract = new web3.eth.Contract(ERC20, target)
    let totalSupply = await contract.methods.totalSupply().call()
    let encode = contract.methods.approve(spender, totalSupply).encodeABI()
    let gas
    try {
        gas = await web3.eth.estimateGas({
            from: account.address,
            to: target,
            data: encode,
        })
    } catch (err) {
        return false
    }
    let gasPrice = await web3.eth.getGasPrice()
    let signTx = await web3.eth.accounts.signTransaction({
        from: account.address,
        to: target,
        data: encode,
        gas: gas,
        maxFeePerGas: BigNumber(Number(gasPrice) + 5 * 10 ** 9).toFixed(),
        maxPriorityFeePerGas: BigNumber(5 * 10 ** 9).toFixed(),
    }, privateKey)
    try {
        await web3.eth.sendSignedTransaction(signTx.rawTransaction)
        return true
    } catch (error) {
        return false
    }
}
export const sendSignedTransaction = async (target: string, chainId: number, signTx: any, type: number) => {
    return new Promise<{ target: string, chain_id: number, type: number, response_type: number, msg: string, hash: string, transactionReceipt: any }>((resolve) => {
        let web3 = getProvider(chainId)
        web3.eth.sendSignedTransaction(signTx.rawTransaction).then(async res => {
            resolve({ target: target, chain_id: chainId, type: type, response_type: 1, msg: "swap成功", hash: res.transactionHash, transactionReceipt: res })
        }).catch(err => {
            resolve({ target: target, chain_id: chainId, type: type, response_type: 2, msg: err.message, hash: getTransactionErrorHash(err), transactionReceipt: getTransactionErrorTransactionReceipt(err) })
        })
    })
}
export const encodeRsuhData = (pools: pool[], task: telegramTask) => {
    let config = Config[task.chain_id]
    let web3 = getProvider(task.chain_id)
    let account = web3.eth.accounts.privateKeyToAccount(task.private_key)
    let contract = new web3.eth.Contract(Trade, config.DANDAOTrade)
    let allParams = []
    pools.forEach(item => {
        if (item.version == 'uniswapv3') {
            let contract = new web3.eth.Contract(v3Router, config.v3Router)
            let tokenIn = config.stableToken[0].address
            let tokenOut = item.token0 == config.stableToken[0].address ? item.token1 : item.token0
            const deadline = Math.round(new Date().getTime() / 1000) + 86400;
            let bytes = contract.methods.exactInputSingle([tokenIn, tokenOut, item.fee, account.address, deadline, BigNumber(Number(task.amount) * 10 ** 18).toFixed(), 1, 0]).encodeABI()
            let params = {
                _pool: item.pool,
                _router: config.v3Router,
                _bytes: bytes
            }
            allParams.push(params)
        } else if (item.version == 'uniswapv2') {
            let contract = new web3.eth.Contract(v2Router, config.v2Router)
            let tokenIn = config.stableToken[0].address
            let tokenOut = item.token0 == config.stableToken[0].address ? item.token1 : item.token0
            const deadline = Math.round(new Date().getTime() / 1000) + 86400;
            let bytes = contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(1, [tokenIn, tokenOut], account.address, deadline).encodeABI()
            let params = {
                _pool: item.pool,
                _router: config.v2Router,
                _bytes: bytes
            }
            allParams.push(params)
        } else if (item.version == 'camelotv2') {
            let contract = new web3.eth.Contract(Camelot, config.camelotV2Router)
            let tokenIn = config.stableToken[0].address
            let tokenOut = item.token0 == config.stableToken[0].address ? item.token1 : item.token0
            const deadline = Math.round(new Date().getTime() / 1000) + 86400;
            let bytes = contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(1, [tokenIn, tokenOut], account.address, "0x0000000000000000000000000000000000000000", deadline).encodeABI()
            let params = {
                _pool: item.pool,
                _router: config.camelotV2Router,
                _bytes: bytes
            }
            allParams.push(params)
        }
    })
    return contract.methods.FuckTuGouBuy(task.target, 1, 0, allParams).encodeABI()
}
//批量开盘冲请求 
export const telegramBatchFuckTugou = (taskList: telegramTask[], chainId: number) => {
    return new Promise<any>(async (resolve) => {
        let web3: any = getProvider(chainId)
        let targets = taskList.map(item => item.target)
        let eligibleList = []
        let config = Config[chainId]
        targets = [...new Set(targets)]
        let { transactionDetails, handleParams, transactions } = await getBatchFuckBlockPendingEvent(targets, chainId)
        let gasPrice = await getGasPrice(web3)
        if (transactionDetails.length) {
            for (let item of transactionDetails) {
                for (let task of taskList) {
                    if (task.target == item.target) {
                        let account = web3.eth.accounts.privateKeyToAccount(task.private_key)
                        let nonce = await getTransactionCount(account.address, web3)
                        let signTx = await web3.eth.accounts.signTransaction({
                            nonce: nonce,
                            from: account.address,
                            to: config.DANDAOTrade,
                            data: task.encode_data,
                            gas: transactionGas[task.chain_id], //设定固定gas limit
                            maxFeePerGas: BigNumber(Number(gasPrice) + task.gas_fee * 10 ** 9).toFixed(),
                            maxPriorityFeePerGas: BigNumber(task.gas_fee * 10 ** 9).toFixed(),
                            value: BigNumber(Number(task.amount) * 10 ** 18 + config.DANDAOFee).toFixed()
                        }, account.privateKey)
                        eligibleList.push({
                            ...task,
                            signTx
                        })
                    }
                }
            }
        } else {
            if (taskList.length) {
                let result = await telegramBatchEstimateGas(taskList, chainId)
                if (result.length) {
                    for (let item of result) {
                        let account = web3.eth.accounts.privateKeyToAccount(item.private_key)
                        let nonce = await getTransactionCount(account.address, web3)
                        let signTx = await web3.eth.accounts.signTransaction({
                            nonce: nonce,
                            from: account.address,
                            to: config.DANDAOTrade,
                            data: item.encode_data,
                            gas: item.gas, //设定固定gas limit
                            maxFeePerGas: BigNumber(Number(gasPrice) + item.gas_fee * 10 ** 9).toFixed(),
                            maxPriorityFeePerGas: BigNumber(item.gas_fee * 10 ** 9).toFixed(),
                            value: BigNumber(Number(item.amount) * 10 ** 18 + config.DANDAOFee).toFixed()
                        }, account.privateKey)
                        eligibleList.push({
                            ...item,
                            signTx
                        })
                    }
                }
            }
        }
        resolve({ eligibleList, handleParams, transactions })
    })
}