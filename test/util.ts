import mysql from "mysql2";
import { mysqlConf } from "./config";

/** 获取mysql链接 */
export function getMysqlConn() {
  const conn = mysql
    .createConnection(mysqlConf)
    .promise();
  return {
    conn,
    destroyConn: async () => conn.destroy(),
  };
}
