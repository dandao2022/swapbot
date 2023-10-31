import Web3 from "web3"
import { getProvider } from "../utils/help"
import { getTransactionCount, getGasPrice, batchSendTransaction } from "../utils/fetch"
import BigNumber from "bignumber.js"
export const encodeEthsData = (id: number, name: string, amt: number, count: number) => {
    const web3 = new Web3()
    let datas = []
    for (let i = 0; i < count; i++) {
        datas.push(web3.utils.utf8ToHex(`data:,{"p":"erc-20","op":"mint","tick":"${name}","id":"${id}","amt":"${amt}"}`))
        id++
    }
    return datas
}

export const encodeEthsTransaction = (chainId: number, id: number, name: string, amt: number, count: number, privateKey: string) => {
    return new Promise<string[]>(async (resolve) => {
        let datas = encodeEthsData(id, name, amt, count)
        let provider = getProvider(chainId)
        let account = provider.eth.accounts.privateKeyToAccount(privateKey)
        let nonce = await getTransactionCount(account.address, provider);
        let gasPrice = await getGasPrice(provider)
        let rawTransactions = []
        for (let item of datas) {
            let signTx = await provider.eth.accounts.signTransaction({
                nonce: nonce,
                from: account.address,
                to: account.address,
                data: item,
                gas: 25000,
                maxFeePerGas: BigNumber(Number(gasPrice) + 5 * 10 ** 9).toFixed(),
                maxPriorityFeePerGas: BigNumber(5 * 10 ** 9).toFixed(),
                value: 0
            }, account.privateKey)
            rawTransactions.push(signTx.rawTransaction)
            nonce++
        }
        resolve(rawTransactions)
    })
}

export const batchMintEths = async (chainId: number, id: number, name: string, amt: number, count: number, privateKey: string) => {
    return new Promise(async (resolve) => {
        let rawTransactions = await encodeEthsTransaction(chainId, id, name, amt, count, privateKey)
        let result = await batchSendTransaction(rawTransactions, chainId)
        resolve(result)
    })
}