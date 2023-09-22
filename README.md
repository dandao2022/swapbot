# DAN DAO Telegram Bot

基于 uniswap 的电报机器人，支持 eth，arb，goerli

## 使用 npm

```bash
npm install dandao

```

## 导入 mysql

请先下载[mysql 文件](https://github.com/dandao2022/swapbot/blob/main/src/db/dandao.sql)，并导入。

## 使用 DANDAO

```bash
import {swapBot} from "dandao"

new swapBot({
    token: "电报token",
    adminName: "电报管理员username",
    chainIds: [1],
    dbData: {
        host: "127.0.0.1",
        user: "dandao",
        password: "12345678",
        port: 3306,
        database: "dandao"
    }
})

```

## 指令

```bash
/menu 首页

/bindTopChannel 5分钟top项目推送

/bindChannel 新加池子项目推送

```

## 首页

![](https://github.com/dandao2022/swapbot/blob/main/src/assets/5.png?raw=true)

## top 推送

![](https://github.com/dandao2022/swapbot/blob/main/src/assets/2.png?raw=true)

## 新池子推送

![](https://github.com/dandao2022/swapbot/blob/main/src/assets/4.png?raw=true)

## 合约查找

![](https://github.com/dandao2022/swapbot/blob/main/src/assets/3.png?raw=true)
