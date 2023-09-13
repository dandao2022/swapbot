const path = require('path')
const log4js = require('koa-log4')
class Logger {
    constructor() {
        this.init()
    }
    init() {
        log4js.configure({
            appenders: {
                smartMoney: {
                    type: 'dateFile',
                    pattern: '-yyyy-MM-dd.log',
                    alwaysIncludePattern: true,
                    encoding: 'utf-8',
                    filename: path.join(__dirname, 'logs', 'smartMoney')
                },
                mysql: {
                    type: 'dateFile',
                    pattern: '-yyyy-MM-dd.log',
                    alwaysIncludePattern: true,
                    encoding: 'utf-8',
                    filename: path.join(__dirname, 'logs', 'mysql')
                },
                out: {
                    type: 'console'
                }
            },
            categories: {
                default: { appenders: ['out'], level: 'info' },
                smartMoney: { appenders: ['smartMoney'], level: 'info' },
                mysql: { appenders: ['mysql'], level: 'info' },
            }
        })
    }
    smartMoneyLogger() {
        return log4js.getLogger('smartMoney')
    }
    mysqlLogger() {
        return log4js.getLogger('mysql')
    }
}

export default Logger