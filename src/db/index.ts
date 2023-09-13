var mysql = require('mysql');
import Logger from "../logger";
import { dbData } from "../types";
const logger = new Logger()
const mysqlLogger = logger.mysqlLogger()
class Client {
    public pool: any;
    public logger = new Logger()
    public dbData = {
        host: "127.0.0.1",
        user: "dandao",
        password: "12345678",
        port: 3306,
        database: "dandao"
    }
    constructor(dbData?: dbData) {
        this.dbData = dbData ? dbData : this.dbData
        this.pool = this.create()
    }
    create() {
        var pool = mysql.createPool({
            host: this.dbData.host,
            port: this.dbData.port,
            user: this.dbData.user,
            password: this.dbData.password,
            database: this.dbData.database,
            connectionLimit: 100
        });
        return pool;
    }
    //处理单条插入数据
    getInsertData(table: string, params: any) {
        let sql = `select column_name from Information_schema.columns  where table_Name = '${table}' and TABLE_SCHEMA='${this.dbData.database}'`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        let insertData: any = {}
                        for (let item of rows) {
                            if (params[item.COLUMN_NAME]) {
                                if (item.COLUMN_NAME != 'id') {
                                    insertData[item.COLUMN_NAME] = params[item.COLUMN_NAME]
                                }
                            }
                            if (item.COLUMN_NAME == 'create_time') {
                                if (!insertData[item.COLUMN_NAME]) {
                                    insertData[item.COLUMN_NAME] = Math.round(new Date().getTime() / 1000)
                                }
                            }
                        }
                        resolve(insertData)
                    }
                });
            })
        })
    }
    //处理单条更新数据
    getUpdateData(table: string, params: any) {
        let sql = `select column_name from Information_schema.columns  where table_Name = '${table}' and TABLE_SCHEMA='${this.dbData.database}'`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        let values: any[] = []
                        let key: any[] = []
                        let updates: any[] = []
                        for (let item of rows) {
                            if (params[item.COLUMN_NAME] != undefined) {
                                if (item.COLUMN_NAME != 'id') {
                                    updates.push(`${item.COLUMN_NAME}=values(${item.COLUMN_NAME})`);
                                }
                                values.push(params[item.COLUMN_NAME]);
                                key.push(item.COLUMN_NAME);
                            }
                        }
                        resolve({ key, values, updates })
                    }
                });
            })
        })
    }
    //处理多条更新数据
    getUpdateListData(table: string, list: any[]) {
        let sql = `select column_name from Information_schema.columns  where table_Name = '${table}' and TABLE_SCHEMA='${this.dbData.database}'`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        let key: any[] = [];
                        let values: any[] = [];
                        let updates: any[] = []
                        let first = list[0]
                        for (let item of list) {
                            let pushValus: any[] = []
                            for (let items of rows) {
                                if (item[items.COLUMN_NAME] != undefined) {
                                    pushValus.push(item[items.COLUMN_NAME])
                                }
                            }
                            values.push(pushValus)
                        }
                        for (let item of rows) {
                            if (first[item.COLUMN_NAME] != undefined) {
                                if (item.COLUMN_NAME != 'id') {
                                    updates.push(`${item.COLUMN_NAME}=values(${item.COLUMN_NAME})`);
                                }
                                key.push(item.COLUMN_NAME);
                            }
                        }
                        resolve({ key, values, updates })
                    }
                });
            })
        })
    }
    //处理多条插入数据
    getInsertListData(table: string, list: any[]) {
        let sql = `select column_name from Information_schema.columns  where table_Name = '${table}' and TABLE_SCHEMA='${this.dbData.database}'`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        let key: any[] = [];
                        let values: any[] = [];
                        for (let item of list) {
                            let pushValus: any[] = []
                            for (let items of rows) {
                                if (items.COLUMN_NAME != 'id') {
                                    pushValus.push(item[items.COLUMN_NAME])
                                }
                            }
                            values.push(pushValus)
                        }
                        for (let item of rows) {
                            if (item.COLUMN_NAME != 'id') {
                                key.push(item.COLUMN_NAME);
                            }
                        }
                        resolve({ key, values })
                    }
                });
            })
        })
    }
    //插入单条数据 table：表名 params：接收的参数
    async insert(table: string, params: any) {
        let insertData: any = await this.getInsertData(table, params)
        let sql: string = `insert into ${table} set ?`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, insertData, function (err: any, rows: any) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        resolve(rows.insertId)
                    }
                });
            })
        })
    }
    //插入单条数据 table：表名 params：接收的参数
    async insertList(table: string, params: any) {
        let insertData: any = await this.getInsertListData(table, params)
        let sql: string = `insert into ${table} (${insertData.key.join(',')}) values ?`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.release();
                connection.query(sql, [insertData.values], function (err: any, rows: any) {
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        resolve(rows)
                    }
                });
            })
        })
    }
    //插入单条数据(插入更新模式) table：表名 params：接收的参数
    async update(table: string, params: any) {
        let updateData: any = await this.getUpdateData(table, params)
        let sql: string = `insert into ${table} (${updateData.key.join(',')}) values(?) on duplicate key update ${updateData.updates.join(',')}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.release();
                connection.query(sql, [updateData.values], function (err: any, rows: any) {
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        resolve(rows.insertId)
                    }
                });
            })
        })
    }
    //插入多条数据(插入更新模式) table：表名 params：接收的参数
    async updateList(table: string, params: any) {
        let updateData: any = await this.getUpdateListData(table, params)
        let sql: string = `insert into ${table} (${updateData.key.join(',')}) values ? on duplicate key update ${updateData.updates.join(',')}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                connection.query(sql, [updateData.values], function (err: any, rows: any) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        resolve(rows)
                    }
                });
            })
        })
    }
    //查询列表分页 tabel:表名  where：查询条件数组形式   order：排序数组形式  paging：分页
    pagingSelect(table: string, where: any[] = [], order: any[] = [], paging: any = { page: 1, pageSize: 15 }) {
        let whereStr: string = where.length ? where.join(' and ') : ' 1=1 ';
        let orderStr: string = order.length ? `order by ` + order.join(',') : '';
        let sql: string = `select * from ${table} where ${whereStr} ${orderStr} limit ${(paging.page - 1) * paging.pageSize}, ${paging.pageSize}`;
        let returnData: any = {
            page: paging.page,
            pageSize: paging.pageSize,
            list: [],
            total: 0,
        }
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        returnData.list = rows
                        returnData.total = 0
                        resolve(returnData)
                    } else {
                        resolve(returnData)
                    }
                });
            });
        })
    }
    // 查询列表 tabel:表名  where：查询条件数组形式   order：排序数组形式 
    find(table: string, where: any[] = [], order: any[] = []) {
        let whereStr: string = where.length ? where.join(' and ') : ' 1=1 ';
        let orderStr: string = order.length ? `order by ` + order.join(',') : '';
        let sql: string = `select * from ${table} where ${whereStr} ${orderStr}`;
        return new Promise<any>((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    connection.release();
                    //释放链接
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        resolve(rows[0])
                    } else {
                        resolve(null)
                    }
                });
            });
        })
    }
    // 查询列表 tabel:表名  where：查询条件数组形式   order：排序数组形式 
    select(table: string, where: any[] = [], order: any[] = [], limit: number = 50000, field: string[] = []) {
        let whereStr: string = where.length ? where.join(' and ') : ' 1=1 ';
        let orderStr: string = order.length ? `order by ` + order.join(',') : '';
        let sql: string = `select ${field.length ? field.join(",") : '*'} from ${table} where ${whereStr} ${orderStr} limit 0, ${limit}`;
        return new Promise<any[]>((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    //释放链接
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        resolve(rows)
                    } else {
                        resolve([])
                    }
                });
            });
        })
    }
    // 删除数据 tabel:表名  where：查询条件数组形式 
    delete(table: string, where: any[] = []) {
        let whereStr: string = where.length ? where.join(' and ') : ' 1=1 ';
        let sql: string = `delete from ${table} where ${whereStr}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    //释放链接
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        resolve(rows)
                    }
                });
            });
        })
    }

    //批量获取
    batchQuery(table: string, key: string, list: any[], field: string[] = []) {
        let sql = `select ${field.length ? field.join(",") : '*'} from ${table} where ${key} in (${list.join(",")})`
        return new Promise<any[]>((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    //释放链接
                    connection.release();
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        resolve(rows)
                    } else {
                        resolve([])
                    }
                });
            });
        })
    }
    //获取总和
    sum(table: string, sumKey: string, where: any[] = []) {
        let whereStr: string = where.length ? where.join(' and ') : ' 1=1 ';
        let sql: string = `select sum(${sumKey}) as allSum from ${table} where ${whereStr}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    connection.release();
                    //释放链接
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        resolve(rows[0].allSum)
                    }
                });
            });
        })
    }
    // 查询表数据条数 table：表名
    count(table: string, where: any[] = []) {
        let whereStr: string = where.length ? where.join(' and ') : ' 1=1 ';
        let sql: string = `select count(*) as count from ${table} where ${whereStr}`;
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    connection.release();
                    //释放链接
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        resolve(rows[0].count)
                    }
                });
            });
        })
    }
    //左关联 select * from trade_log as s left join minting as t on s.address = t.address where id > 0
    leftJoin(table1: string, table2: string, where: any[] = [], order: any[] = [], table1Key: string, table2Key: string, paging = { page: 1, pageSize: 15 }) {
        let whereStr: string = where.length ? where.join(' and ') : ' 1=1 ';
        let orderStr: string = order.length ? `order by ` + order.join(',') : '';
        let sql: string = `select * from ${table1} as s left join ${table2} as t on s.${table1Key} = t.${table2Key} where ${whereStr} ${orderStr} limit ${(paging.page - 1) * paging.pageSize}, ${paging.pageSize}`;
        let returnData = {
            page: paging.page,
            pageSize: paging.pageSize,
            list: [],
            total: 0,
        };
        return new Promise((resolve) => {
            this.pool.getConnection(function (err: any, connection: any) {
                if (err) {
                    mysqlLogger.info(err)
                }
                connection.query(sql, function (err: any, rows: any) {
                    connection.release();
                    //释放链接
                    if (err) {
                        mysqlLogger.info(err)
                    }
                    if (rows) {
                        returnData.list = rows;
                        returnData.total = 0;
                        resolve(returnData);
                    } else {
                        resolve(returnData)
                    }
                });
            });
        })
    }
}
export default Client