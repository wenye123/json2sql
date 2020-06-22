/** 数据表 */
export interface JTable {
  /** 表注释 */
  comment: string;
  /** 表字段 */
  fields?: JTableField;
  /** 索引字段 */
  indexes?: JTableIndex;
  /** 是否使用myisam引擎 */
  isMyisam?: boolean;
}

/** 表字段 */
export interface JTableField {
  [fieldName: string]:
    | JTableFieldEnum
    | JTableFieldInteger
    | JTableFieldNumber
    | JTableFieldString
    | JTableFieldText
    | JTableFieldDateTime
    | JTableFieldCustom;
}
export type JTableFieldEnum = {
  /** 枚举/布尔类型 */
  type: "enum";
  /** 注释 */
  comment: string;
  /** 是否有符号，默认false */
  signed?: boolean;
  /** 是否为null，默认false */
  isNull?: boolean;
  /** 默认值，默认为0 */
  default?: number | null;
};
export type JTableFieldInteger = {
  /** 整数类型 */
  type: "integer";
  /** 注释 */
  comment: string;
  /** 是否有符号，默认false */
  signed?: boolean;
  /** 是否为null，默认false */
  isNull?: boolean;
  /** 默认值，默认为0 */
  default?: number | null;
  /** 是否自动递增，默认false */
  autoIncrement?: boolean;
};
export type JTableFieldNumber = {
  /** 小数类型 */
  type: "number";
  /** 注释 */
  comment: string;
  /** 整数精度，默认10 */
  per1?: number;
  /** 小数精度，默认2 */
  per2?: number;
  /** 是否有符号，默认false */
  signed?: boolean;
  /** 是否为null，默认false */
  isNull?: boolean;
  /** 默认值，默认为0.0 */
  default?: number | null;
};
export type JTableFieldString = {
  /** 字符串类型 */
  type: "string";
  /** 长度 */
  length: number;
  /** 注释 */
  comment: string;
  /** 是否为null，默认false */
  isNull?: boolean;
  /** 默认值，默认为空字符串 */
  default?: string | null;
};
export type JTableFieldText = {
  /** text类型 */
  type: "text";
  /** 注释 */
  comment: string;
};
export type JTableFieldDateTime = {
  /** 日期时间类型 */
  type: "datetime";
  /** 注释 */
  comment: string;
  /** 是否为null，默认false */
  isNull?: boolean;
  /** 是否自动更新时间，默认false */
  isUpdateCurr?: boolean;
  /** 默认值，默认为null，表示不会出现default字样，也可以通过设置为curr表示当前时间 */
  default?: "curr" | string | null;
};
export type JTableFieldCustom = {
  /** 自定义类型 */
  type: "custom";
  /** 去掉表名的原始sql语句，如`date NULL COMMENT '日期'` */
  rawStr: string;
};

/** 索引字段 */
export interface JTableIndex {
  [indexName: string]: JTablePrimaryIndex | JTableUniqueIndex | JTableNormalIndex;
}
export type JTablePrimaryIndex = {
  /** 主键 */
  type: "primary";
};
export type JTableUniqueIndex = {
  /** 唯一索引 */
  type: "unique";
  /** 索引字段，数组表示联合索引 */
  fields: string | string[];
  /** 注释 */
  comment: string;
};
export type JTableNormalIndex = {
  /** 普通索引 */
  type: "normal";
  /** 索引字段，数组表示联合索引 */
  fields: string | string[];
  /** 注释 */
  comment: string;
};

/** sql生成器选项 */
export interface SqlGeneratorOpt {
  /** 表名字 */
  tableName: string;
  /** 表json结构 */
  table: JTable;
}

/** 序列化sql */
function serializeSql(strs: string[]) {
  return strs
    .map((i) => i.trim())
    .filter((item) => item !== "")
    .join(" ");
}

/** 字段默认值 */
function getDefFieldVal<U>(val: any, defVal: U): U {
  return val === undefined ? defVal : val;
}

/** sql生成器 */
export class SqlGenerator {
  /** 全表名 */
  private tableName = "";
  /** json描述的表 */
  private table: JTable;

  constructor(opt: SqlGeneratorOpt) {
    const primaryId = `${opt.tableName}_id`;
    this.tableName = opt.tableName;
    this.table = {
      comment: opt.table.comment,
      fields: {
        ...this.getDefTopFields(primaryId),
        ...opt.table.fields,
        ...this.getDefTailFields(),
      },
      indexes: {
        ...this.getDefIndexes(primaryId),
        ...opt.table.indexes,
      },
      isMyisam: opt.table.isMyisam || false,
    };
  }

  /** 获取默认头部字段 */
  private getDefTopFields(primaryId: string): JTableField {
    return {
      [primaryId]: { type: "integer", comment: "主键", autoIncrement: true },
    };
  }

  /** 获取默认尾部字段 */
  private getDefTailFields(): JTableField {
    return {
      update_time: { type: "datetime", comment: "更新时间", isUpdateCurr: true },
      create_time: { type: "datetime", comment: "创建时间", default: "curr" },
    };
  }

  /** 获取默认索引 */
  private getDefIndexes(primaryId: string): JTableIndex {
    return {
      [primaryId]: { type: "primary" },
    };
  }

  /** 生成表字段sql */
  private genFields(fields: JTableField) {
    const fieldSqlArr: string[] = [];
    const comFields: JTableField = {}; // 补全的表字段

    for (let fieldName of Object.keys(fields)) {
      let field = fields[fieldName];
      let sql = "";

      if (field.type === "enum") {
        field = {
          ...field,
          signed: getDefFieldVal(field.signed, false),
          isNull: getDefFieldVal(field.isNull, false),
          default: getDefFieldVal(field.default, 0),
        };
        sql = serializeSql([
          `\`${fieldName}\` tinyint(1)`,
          `${field.signed ? "" : "unsigned"}`,
          `${field.isNull ? "" : "NOT"} NULL`,
          `${field.default === null ? "" : `DEFAULT ${field.default}`}`,
          `COMMENT '${field.comment}'`,
        ]);
      } else if (field.type === "integer") {
        field = {
          ...field,
          signed: getDefFieldVal(field.signed, false),
          isNull: getDefFieldVal(field.isNull, false),
          default: getDefFieldVal(field.default, 0),
          autoIncrement: getDefFieldVal(field.autoIncrement, false),
        };
        sql = serializeSql([
          `\`${fieldName}\` int(11)`,
          `${field.signed ? "" : "unsigned"}`,
          `${field.isNull ? "" : "NOT"} NULL`,
          `${field.autoIncrement ? "" : field.default === null ? "" : `DEFAULT ${field.default}`}`,
          `${field.autoIncrement ? "AUTO_INCREMENT" : ""}`,
          `COMMENT '${field.comment}'`,
        ]);
      } else if (field.type === "number") {
        field = {
          ...field,
          per1: getDefFieldVal(field.per1, 10),
          per2: getDefFieldVal(field.per2, 2),
          signed: getDefFieldVal(field.signed, false),
          isNull: getDefFieldVal(field.isNull, false),
          default: getDefFieldVal(field.default, 0),
        };
        sql = serializeSql([
          `\`${fieldName}\` decimal(${field.per1}, ${field.per2})`,
          `${field.signed ? "" : "unsigned"}`,
          `${field.isNull ? "" : "NOT"} NULL`,
          `${field.default === null ? "" : `DEFAULT ${field.default}`}`,
          `COMMENT '${field.comment}'`,
        ]);
      } else if (field.type === "string") {
        field = {
          ...field,
          isNull: getDefFieldVal(field.isNull, false),
          default: getDefFieldVal(field.default, ""),
        };
        sql = serializeSql([
          `\`${fieldName}\` varchar(${field.length})`,
          `${field.isNull ? "" : "NOT"} NULL`,
          `${field.default === null ? "" : `DEFAULT '${field.default}'`}`,
          `COMMENT '${field.comment}'`,
        ]);
      } else if (field.type === "text") {
        sql = serializeSql([`\`${fieldName}\` text`, `COMMENT '${field.comment}'`]);
      } else if (field.type === "datetime") {
        field = {
          ...field,
          isNull: field.isNull || false,
          default: field.default || null,
          isUpdateCurr: field.isUpdateCurr || false,
        };
        sql = serializeSql([
          `\`${fieldName}\` datetime`,
          `${field.isUpdateCurr ? "" : field.isNull ? "" : "NOT"} NULL`,
          `${
            field.default === null
              ? ""
              : `DEFAULT ${field.default === "curr" ? "CURRENT_TIMESTAMP" : `'${field.default}'`}`
          }`,
          `${field.isUpdateCurr ? "ON UPDATE CURRENT_TIMESTAMP" : ""}`,
          `COMMENT '${field.comment}'`,
        ]);
      } else if (field.type === "custom") {
        sql = serializeSql([`\`${fieldName}\``, field.rawStr.trim()]);
      } else {
        throw Error("不支持的字段类型");
      }

      fieldSqlArr.push(sql);
      comFields[fieldName] = field;
    }
    return { fieldSqlArr, comFields };
  }

  /** 生成索引sql */
  private genIndex(indexes: JTableIndex) {
    const indexSqlArr: string[] = [];

    for (let indexName of Object.keys(indexes)) {
      let index = indexes[indexName];
      const fieldName =
        index.type === "primary"
          ? `\`${indexName}\``
          : typeof index.fields === "string"
          ? `\`${index.fields}\``
          : index.fields
              .map((item) => {
                return `\`${item}\``;
              })
              .join(",");
      if (index.type === "primary") {
        indexSqlArr.push(`PRIMARY KEY (${fieldName})`);
      } else if (index.type === "normal") {
        indexSqlArr.push(`KEY \`nor:${indexName}\` (${fieldName}) COMMENT '${index.comment}'`);
      } else if (index.type === "unique") {
        indexSqlArr.push(`UNIQUE KEY \`uni:${indexName}\` (${fieldName}) COMMENT '${index.comment}'`);
      } else {
        throw new Error("不支持的索引类型");
      }
    }
    return indexSqlArr;
  }

  /** 生成sql */
  genSql() {
    // 生成字段sql & 补全字段json
    const { fieldSqlArr, comFields } = this.genFields(this.table.fields || {});
    this.table.fields = comFields;
    // 生成索引sql
    const indexSqlArr = this.genIndex(this.table.indexes || {});
    // 生成其他(表名字，引擎，注释)
    const content = [...fieldSqlArr, ...indexSqlArr];
    const engine = this.table.isMyisam ? "myisam" : "innodb";
    const sql = `CREATE TABLE \`${this.tableName}\` (\n  ${content.join(",\n  ")} \n) ENGINE=${engine} COMMENT='${
      this.table.comment
    }';`;
    return { sql, jTable: this.table };
  }
}
