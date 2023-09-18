import { JTable, SqlGenerator } from "./sqlGenerator";
import mysql from "mysql2";
import { Connection, ConnectionOptions } from "mysql2/promise";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFilePs = promisify(fs.writeFile);

/** 确保目录存在 */
function ensureDir(dir: string) {
  const isExist = fs.existsSync(dir);
  if (!isExist) {
    fs.mkdirSync(dir);
  }
}

/** 根据表前缀验证表名 */
function verifyTableName(tableName: string, tablePrefix: string) {
  const reg = new RegExp(`^${tablePrefix}.*`);
  return reg.test(tableName);
}

/** 去掉无用sql */
function removeNoUseSql(sql: string) {
  sql = sql.replace(/AUTO_INCREMENT=\d+ /, "");
  return sql;
}

export interface Json2SqlOpt {
  /** mysql配置 */
  mysql: ConnectionOptions;
  /** 表前缀 */
  tablePrefix: string;
  /** 输出目录 */
  outputDir: string;
  /** 是否同步表结构 */
  isSync?: boolean;
  /** 是否打印日志 */
  isLog?: boolean;
}

export class Json2Sql {
  /** mysql连接 */
  private conn: Connection;
  /** 数据库配置 */
  private mysqlConf: ConnectionOptions;
  /** 表前缀 */
  private tablePrefix: string;
  /** 输出目录 */
  private outputDir: string;
  /** 是否同步表结构 */
  private isSync: boolean;
  /** 是否打印日志 */
  private isLog: boolean;

  constructor(opt: Json2SqlOpt) {
    this.mysqlConf = opt.mysql;
    this.tablePrefix = opt.tablePrefix;
    this.conn = mysql.createConnection(opt.mysql).promise();
    this.outputDir = path.resolve(__dirname, opt.outputDir);
    this.isSync = opt.isSync || true;
    this.isLog = opt.isLog || true;
    // 生成输出目录
    ensureDir(this.outputDir);
  }

  /** 打印日志 */
  private printLog(...args: any[]) {
    if (this.isLog) console.log(...args);
  }

  /** 从数据库中输出sql文件 */
  private async outputSqlFromDatabase() {
    const sqlName = `${this.tablePrefix.split("_")[0]}.sql`;
    const sqlPath = path.resolve(this.outputDir, sqlName);
    let str = "";
    // 获取sql内容
    const [tables]: any = await this.conn.query("show tables");
    for (let table of tables) {
      const tableName = table[`Tables_in_${this.mysqlConf.database}`];
      const isCorrectTable = verifyTableName(tableName, this.tablePrefix);
      if (isCorrectTable) {
        const [[ret]]: any = await this.conn.query(`show create table ${tableName}`);
        let sql = ret["Create Table"];
        sql = removeNoUseSql(sql);
        str += `${sql};\n\n`;
        this.printLog(`生成表sql: ${tableName}`);
      }
    }
    // 写入文件
    await writeFilePs(sqlPath, str);
  }

  /** 获取生成的sql */
  async getGenSql(tables: Record<string, JTable>) {
    let str = "";
    // 获取sql内容
    for (let key of Object.keys(tables)) {
      const table = tables[key];
      const { sql } = new SqlGenerator({ tablePrefix: this.tablePrefix, tableName: key, table }).genSql();
      str += `${sql}\n\n`;
    }
    return str;
  }

  /** 同步表 */
  async syncTable(tables: Record<string, JTable>) {
    for (let key of Object.keys(tables)) {
      const table = tables[key];
      const fullTableName = `${this.tablePrefix}${key}`;
      const { sql } = new SqlGenerator({ tablePrefix: this.tablePrefix, tableName: key, table }).genSql();
      if (this.isSync) {
        await this.conn.query(`DROP TABLE IF EXISTS ${fullTableName};`);
        this.printLog(`删除表${fullTableName}`);
      }
      await this.conn.query(sql);
      this.printLog(`生成表${fullTableName}`);
    }
    // 输出文件
    await this.outputSqlFromDatabase();
    // 关闭mysql连接
    await this.conn.destroy();
  }
}
