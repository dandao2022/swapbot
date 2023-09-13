# DAN DAO Telegram Bot
基于uniswap的电报机器人，支持eth，arb，goerli

## 使用npm
```bash
npm install dandao

```

## 导入mysql
请先下载[mysql文件](https://github.com/dandao2022/swapbot/blob/main/src/db/dandao.sql)，并导入。

## 使用DANDAO
```bash
import DANDAO from "dandao"

new DANDAO({
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

## top推送

![](https://github.com/dandao2022/swapbot/blob/main/src/assets/2.png?raw=true)

## 新池子推送

![](https://github.com/dandao2022/swapbot/blob/main/src/assets/4.png?raw=true)

## 合约查找

![](https://github.com/dandao2022/swapbot/blob/main/src/assets/3.png?raw=true)