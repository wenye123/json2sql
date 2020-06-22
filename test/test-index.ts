import { Json2Sql } from "../src";
import { mysqlConf } from "./config";
import fs from "fs";
import path from "path";
import { assert } from "chai";

/** 删除文件夹 */
function delDir(path: string) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach((file) => {
      let curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) {
        delDir(curPath); //递归删除文件夹
      } else {
        fs.unlinkSync(curPath); //删除文件
      }
    });
    fs.rmdirSync(path);
  }
}

describe("json2sql", function () {
  afterEach(async function () {
    delDir(path.resolve(__dirname, "../test/tmp"));
  });

  it("syncTable", async function () {
    const json2Sql = new Json2Sql({
      mysql: mysqlConf,
      tablePrefix: "test_",
      outputDir: "../test/tmp",
    });

    await json2Sql.syncTable({
      user: {
        comment: "用户表",
        fields: {
          name: { type: "string", length: 40, comment: "用户名" },
          age: { type: "integer", comment: "年龄" },
        },
      },
      task: {
        comment: "任务表",
        fields: {
          type: { type: "enum", comment: "任务类型" },
          title: { type: "string", length: 40, comment: "任务标题" },
        },
      },
    });

    const content = fs.readFileSync(path.resolve(__dirname, "../test/tmp/test.sql")).toString();
    assert.isNotEmpty(content);
  });
});
