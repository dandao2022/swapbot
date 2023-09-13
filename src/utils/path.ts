import Web3 from "web3";
import { v3Path } from "../types"
const web3 = new Web3()
export const hasMultiplePools = (path: string) => {
    return path.length >= 86;
}

export const numPools = (path: string) => {
    // Ignore the first token address. From then on every fee and token offset indicates a pool.
    return ((path.length - 40) / 46);
}
export const encodePath = (token0: string, token1: string, fee: number) => {
    let hexFees = {
        500: "0001f4",
        3000: "000bb8",
        10000: "002710"
    }
    token0 = token0.replace("0x", "")
    token1 = token1.replace("0x", "")
    return '0x' + token0.toLocaleLowerCase() + hexFees[fee] + token1.toLocaleLowerCase()
}
export const decodeFirstPool = (path: string) => {
    let outToken = web3.utils.toChecksumAddress(`0x${path.slice(0, 40)}`)
    let fee = Number(web3.utils.hexToNumber(`0x${path.slice(40, 46)}`))
    let inToken = web3.utils.toChecksumAddress(`0x${path.slice(46, 86)}`)
    return { outToken, inToken, fee }
}

export const getFirstPool = (path: string) => {
    return path.slice(0, 86);
}

/// @notice Skips a token + fee element from the buffer and returns the remainder
/// @param path The swap path
/// @return The remaining token + fee elements in the path
export const skipToken = (path: string) => {
    return path.slice(46, path.length);
}
export const decodePath = (path: string) => {
    path = path.replace("0x", "")
    let routes: v3Path[] = []
    while (true) {
        let hasMultiplePool = hasMultiplePools(path);
        if (hasMultiplePool) {
            routes.push(decodeFirstPool(path))
            path = skipToken(path)
        } else {
            break;
        }
    }
    return routes;
}