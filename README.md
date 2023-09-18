## @wenye123/json2sql

用 json 方式写 sql

#### 安装

```bash
npm i -D @wenye123/json2sql
```

#### 使用例子

```ts
const mysqlConf = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "123456",
  database: "test",
  charset: "utf8mb4",
};
const json2Sql = new Json2Sql({
  mysql: mysqlConf,
  tablePrefix: "test_", // 表前缀
  outputDir: "../test/tmp", // 指定输出sql的目录
  isSync: true, // 是否同步表结构
  isLog: true, // 是否打印日志
});

// 同步表 先将json格式的表同步到数据库 再将表导出sql到输出目录
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
```
