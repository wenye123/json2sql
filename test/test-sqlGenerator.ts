import { SqlGenerator, JTable } from "../src/sqlGenerator";
import { assert } from "chai";
import { getMysqlConn } from "./util";

const tableName = "test_table";
function genSql(table: JTable) {
  const { sql } = new SqlGenerator({
    tableName,
    table: table,
  }).genSql();
  return sql;
}

let sql = "";
async function validSql() {
  const { conn, destroyConn } = await getMysqlConn();
  await conn.query(`DROP TABLE IF EXISTS ${tableName};`);
  await conn.query(sql);
  await destroyConn();
}

describe("genSql", function () {
  describe("fields", function () {
    afterEach(validSql);
    it("enum", function () {
      sql = genSql({
        comment: "测试表",
        fields: {
          a: { type: "enum", comment: "aa" },
          b: { type: "enum", comment: "bb", signed: true },
          c: { type: "enum", comment: "cc", isNull: true },
          d: { type: "enum", comment: "dd", default: 10 },
          e: { type: "enum", comment: "ee", default: null },
        },
      });
      assert.match(sql, new RegExp("`a` tinyint\\(1\\) unsigned NOT NULL DEFAULT 0 COMMENT 'aa'"));
      assert.match(sql, new RegExp("`b` tinyint\\(1\\) NOT NULL DEFAULT 0 COMMENT 'bb'"));
      assert.match(sql, new RegExp("`c` tinyint\\(1\\) unsigned NULL DEFAULT 0 COMMENT 'cc'"));
      assert.match(sql, new RegExp("`d` tinyint\\(1\\) unsigned NOT NULL DEFAULT 10 COMMENT 'dd'"));
      assert.match(sql, new RegExp("`e` tinyint\\(1\\) unsigned NOT NULL COMMENT 'ee'"));
    });
    it("integer", function () {
      sql = genSql({
        comment: "测试表",
        fields: {
          a: { type: "integer", comment: "aa" },
          b: { type: "integer", comment: "bb", signed: true },
          c: { type: "integer", comment: "cc", isNull: true },
          d: { type: "integer", comment: "dd", default: 10 },
          e: { type: "integer", comment: "ee", default: null },
        },
      });
      assert.match(sql, new RegExp("`a` int\\(11\\) unsigned NOT NULL DEFAULT 0 COMMENT 'aa'"));
      assert.match(sql, new RegExp("`b` int\\(11\\) NOT NULL DEFAULT 0 COMMENT 'bb'"));
      assert.match(sql, new RegExp("`c` int\\(11\\) unsigned NULL DEFAULT 0 COMMENT 'cc'"));
      assert.match(sql, new RegExp("`d` int\\(11\\) unsigned NOT NULL DEFAULT 10 COMMENT 'dd'"));
      assert.match(sql, new RegExp("`e` int\\(11\\) unsigned NOT NULL COMMENT 'ee'"));
    });
    it("number", function () {
      sql = genSql({
        comment: "测试表",
        fields: {
          a: { type: "number", comment: "aa" },
          b: { type: "number", comment: "bb", signed: true },
          c: { type: "number", comment: "cc", isNull: true },
          d: { type: "number", comment: "dd", default: 10 },
          e: { type: "number", comment: "ee", default: null },
          f: { type: "number", comment: "ff", per1: 5, per2: 3 },
        },
      });
      assert.match(sql, new RegExp("`a` decimal\\(10, 2\\) unsigned NOT NULL DEFAULT 0 COMMENT 'aa'"));
      assert.match(sql, new RegExp("`b` decimal\\(10, 2\\) NOT NULL DEFAULT 0 COMMENT 'bb'"));
      assert.match(sql, new RegExp("`c` decimal\\(10, 2\\) unsigned NULL DEFAULT 0 COMMENT 'cc'"));
      assert.match(sql, new RegExp("`d` decimal\\(10, 2\\) unsigned NOT NULL DEFAULT 10 COMMENT 'dd'"));
      assert.match(sql, new RegExp("`e` decimal\\(10, 2\\) unsigned NOT NULL COMMENT 'ee'"));
      assert.match(sql, new RegExp("`f` decimal\\(5, 3\\) unsigned NOT NULL DEFAULT 0 COMMENT 'ff'"));
    });
    it("string", function () {
      sql = genSql({
        comment: "测试表",
        fields: {
          a: { type: "string", length: 40, comment: "aa" },
          b: { type: "string", length: 40, comment: "bb", isNull: true },
          c: { type: "string", length: 40, comment: "cc", default: "wenye" },
          d: { type: "string", length: 40, comment: "dd", default: null },
        },
      });
      assert.match(sql, new RegExp("`a` varchar\\(40\\) NOT NULL DEFAULT '' COMMENT 'aa'"));
      assert.match(sql, new RegExp("`b` varchar\\(40\\) NULL DEFAULT '' COMMENT 'bb'"));
      assert.match(sql, new RegExp("`c` varchar\\(40\\) NOT NULL DEFAULT 'wenye' COMMENT 'cc'"));
      assert.match(sql, new RegExp("`d` varchar\\(40\\) NOT NULL COMMENT 'dd'"));
    });
    it("text", function () {
      sql = genSql({
        comment: "测试表",
        fields: {
          a: { type: "text", comment: "aa" },
        },
      });
      assert.match(sql, new RegExp("`a` text COMMENT 'aa'"));
    });
    it("datetime", function () {
      sql = genSql({
        comment: "测试表",
        fields: {
          a: { type: "datetime", comment: "aa" },
          b: { type: "datetime", comment: "bb", isNull: true },
          c: { type: "datetime", comment: "cc", isUpdateCurr: true },
          d: { type: "datetime", comment: "dd", default: "2000/01/01 10:00:00" },
        },
      });
      assert.match(sql, new RegExp("`a` datetime NOT NULL COMMENT 'aa'"));
      assert.match(sql, new RegExp("`b` datetime NULL COMMENT 'bb'"));
      assert.match(sql, new RegExp("`c` datetime NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'cc'"));
      assert.match(sql, new RegExp("`d` datetime NOT NULL DEFAULT '2000/01/01 10:00:00' COMMENT 'dd'"));
    });
    it("custom", function () {
      sql = genSql({
        comment: "测试表",
        fields: {
          a: { type: "custom", rawStr: "datetime NOT NULL default CURRENT_TIMESTAMP COMMENT 'aa'" },
        },
      });
      assert.match(sql, new RegExp("`a` datetime NOT NULL default CURRENT_TIMESTAMP COMMENT 'aa'"));
    });
  });

  describe("index", function () {
    afterEach(validSql);
    it("normal", function () {
      sql = genSql({
        comment: "测试表",
        fields: {
          a: { type: "number", comment: "aa" },
          b: { type: "number", comment: "bb" },
        },
        indexes: {
          a: { type: "normal", fields: "a", comment: "aa" },
          a_b: { type: "normal", fields: ["a", "b"], comment: "bb" },
        },
      });
      assert.match(sql, new RegExp("KEY `nor:a` \\(`a`\\) COMMENT 'aa'"));
      assert.match(sql, new RegExp("KEY `nor:a_b` \\(`a`,`b`\\) COMMENT 'bb'"));
    });
    it("unique", function () {
      sql = genSql({
        comment: "测试表",
        fields: {
          a: { type: "number", comment: "aa" },
          b: { type: "number", comment: "bb" },
        },
        indexes: {
          a: { type: "unique", fields: "a", comment: "aa" },
          a_b: { type: "unique", fields: ["a", "b"], comment: "bb" },
        },
      });
      assert.match(sql, new RegExp("KEY `uni:a` \\(`a`\\) COMMENT 'aa'"));
      assert.match(sql, new RegExp("KEY `uni:a_b` \\(`a`,`b`\\) COMMENT 'bb'"));
    });
  });

  describe("other", function () {
    afterEach(validSql);
    it("comment", function () {
      sql = genSql({ comment: "测试表" });
      assert.match(sql, new RegExp("测试表"));
    });
    it("innodb", function () {
      sql = genSql({ comment: "测试表" });
      assert.match(sql, new RegExp("innodb"));
    });
    it("myisam", function () {
      sql = genSql({ comment: "测试表", isMyisam: true });
      assert.match(sql, new RegExp("myisam"));
    });
  });


});
