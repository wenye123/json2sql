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

```sql 
# 需要注意的是 生成每张表都会自动加上主键 创建时间 更新时间三个字段
CREATE TABLE `test_user` (
  `user_id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(40) NOT NULL DEFAULT '' COMMENT '用户名',
  `age` int(11) unsigned NOT NULL DEFAULT 0 COMMENT '年龄',
  `update_time` datetime NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`user_id`) 
) ENGINE=innodb COMMENT='用户表';
```