# 热处理收发货管理系统 - 完整开发文档 卷1
# 项目配置与后端基础

**版本**: COMPLETE v1.0  
**性质**: 一字不差的完整代码  
**说明**: 本文档包含所有配置和后端基础代码，逐行可复制

---

## 卷1 目录

1. 根目录配置文件（19个文件完整代码）
2. 数据库结构（schema.ts 完整代码）
3. 后端通用模块（完整代码）
4. 后端业务模块 - Customer（完整代码）
5. 后端业务模块 - Product（完整代码）

---

# 第一章：根目录配置文件

## 1.1 package.json

**文件路径**: `package.json`

```json
{
  "name": "fullstack-nestjs-template",
  "version": "2.1.5",
  "private": true,
  "flags": {
    "supportBusinessUser": true,
    "supportTiptapAndStreamdown": true
  },
  "scripts": {
    "dev": "npm run upgrade && ./scripts/dev.sh",
    "dev:server": "NODE_ENV=development nest start --watch",
    "dev:client": "NODE_ENV=development rspack serve --config rspack.config.js --env mode=development",
    "gen:db-schema": "fullstack-cli gen-db-schema",
    "gen:openapi": "echo 'UNSUPPORTED, SKIP'",
    "build": "./scripts/build.sh",
    "build:prod": "npm run build:server && npm run build:client",
    "build:server": "NODE_ENV=production nest build",
    "build:client": "NODE_ENV=production rspack build --config rspack.config.js --env mode=production",
    "start": "NODE_ENV=production node main.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config test/e2e/jest.config.js",
    "eslint": "eslint . --quiet",
    "stylelint": "stylelint client/src/**/*.css --quiet",
    "type:check": "concurrently -n \"server,client\" -c \"blue,green\" \"npm run type:check:server\" \"npm run type:check:client\"",
    "type:check:client": "tsc --noEmit --project tsconfig.app.json",
    "type:check:server": "tsc --noEmit --project tsconfig.node.json",
    "lint": "concurrently \"npm run eslint\" \"npm run type:check\" \"npm run stylelint\"",
    "format": "prettier --write \"{server,client,test}/**/*.{js,ts,tsx,json,md}\"",
    "upgrade": "fullstack-cli sync --disable-gen-openapi",
    "postinstall": "fullstack-cli action-plugin init"
  },
  "dependencies": {
    "@lark-apaas/fullstack-nestjs-core": "^1.1.0",
    "@nestjs/axios": "^4.0.1",
    "@nestjs/common": "^10.4.20",
    "@nestjs/config": "^3.3.0",
    "@nestjs/core": "^10.4.20",
    "@nestjs/swagger": "^7.4.2",
    "@nestjs/platform-express": "^10.4.20",
    "@tanstack/react-form": "^1.27.6",
    "@tanstack/react-query": "^5.90.12",
    "axios": "^1.12.2",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.2",
    "crypto-js": "^4.2.0",
    "dotenv": "^17.2.2",
    "drizzle-orm": "0.44.6",
    "hbs": "^4.2.0",
    "radix-ui": "latest",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@nestjs/cli": "^10.4.9",
    "@nestjs/schematics": "^10.2.3",
    "@nestjs/testing": "^10.4.20",
    "@types/crypto-js": "^4.2.2",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "concurrently": "^9.1.2",
    "eslint": "^9.17.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "jest": "^29.7.0",
    "prettier": "^3.4.2",
    "stylelint": "^16.12.0",
    "stylelint-config-standard": "^36.0.1",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.19.0"
  }
}
```

## 1.2 tsconfig.json

**文件路径**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["client/src/*"],
      "@client/*": ["client/*"],
      "@server/*": ["server/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["client/src", "shared", "server"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 1.3 tsconfig.app.json

**文件路径**: `tsconfig.app.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["client/src/*"]
    }
  },
  "include": ["client/src"]
}
```

## 1.4 tsconfig.node.json

**文件路径**: `tsconfig.node.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@server/*": ["server/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["server", "shared"]
}
```

## 1.5 rspack.config.js

**文件路径**: `rspack.config.js`

```javascript
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  extends: '@lark-apaas/fullstack-rspack-preset/preset.config.js',
  entry: {
    main: './client/src/index.tsx',
  },
  resolve: {
    tsConfig: {
      configFile: path.resolve(__dirname, './tsconfig.app.json'),
    },
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  output: {
    filename: '[name].js',
    chunkFilename: 'chunks/[name].[contenthash:8].js',
  },
  optimization: isDev
    ? {}
    : {
        splitChunks: {
          chunks: 'async',
          minSize: 20000,
          cacheGroups: {
            asyncVendors: {
              test: /[\\/]node_modules[\\/]/,
              chunks: 'async',
              name: 'async-vendors',
              priority: 10,
            },
          },
        },
      },
};
```

## 1.6 nest-cli.json

**文件路径**: `nest-cli.json`

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "server",
  "compilerOptions": {
    "deleteOutDir": true,
    "tsConfigPath": "tsconfig.node.json",
    "assets": [
      {
        "include": "capabilities/**/*.json",
        "outDir": "dist/server",
        "watchAssets": true
      }
    ],
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "introspectComments": true,
          "classValidatorShim": true
        }
      }
    ]
  }
}
```

## 1.7 tailwind.config.ts

**文件路径**: `tailwind.config.ts`

```typescript
import { createTailwindPresetOfSimple } from '@lark-apaas/fullstack-presets';

export default {
  presets: [createTailwindPresetOfSimple()],
  content: [
    './client/src/**/*.{ts,tsx,css}',
  ],
  plugins: [],
};
```

## 1.8 postcss.config.js

**文件路径**: `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## 1.9 components.json

**文件路径**: `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "client/src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

## 1.10 .env

**文件路径**: `.env`

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/heat_treatment

# 应用配置
NODE_ENV=development
PORT=3000

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## 1.11 .gitignore

**文件路径**: `.gitignore`

```
# Dependencies
node_modules
.pnp
.pnp.js

# Build
dist
build
*.tsbuildinfo

# Environment
.env.local
.env.*.local

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log
npm-debug.log*

# Testing
coverage
.nyc_output

# Misc
.cache
.temp
```

## 1.12 .npmrc

**文件路径**: `.npmrc`

```
registry=https://registry.npmmirror.com
```

## 1.13 .prettierrc

**文件路径**: `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## 1.14 eslint.config.js

**文件路径**: `eslint.config.js`

```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  }
);
```

## 1.15 .stylelintrc.js

**文件路径**: `.stylelintrc.js`

```javascript
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
        ],
      },
    ],
  },
};
```

## 1.16 README.md

**文件路径**: `README.md`

```markdown
# 热处理收发货管理系统

基于 NestJS + React 的全栈管理系统

## 功能特性

- 来货登记与流程卡打印
- 快速发货与送货单管理
- 库存实时查询与预警
- 智能对账与报表生成
- 数据统计与可视化

## 技术栈

- 后端: NestJS + Drizzle ORM + PostgreSQL
- 前端: React + Tailwind CSS + shadcn/ui
- 构建: Rspack + Nest CLI

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
├── client/          # 前端代码
├── server/          # 后端代码
├── shared/          # 共享类型
└── scripts/         # 脚本文件
```
```

---

# 第二章：数据库结构完整代码

## 2.1 server/database/schema.ts

**文件路径**: `server/database/schema.ts`
**说明**: 这是数据库的核心结构定义，包含7张表的完整DDL

```typescript
/* eslint-disable */
/** auto generated, do not edit */
import { pgTable, uniqueIndex, pgPolicy, uuid, varchar, text, integer, index, doublePrecision, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 自定义类型：用户档案
export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

// 文件附件类型定义
export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

// 自定义类型：文件附件
export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

// 自定义类型：带时区的时间戳
export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number};
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number){
    if(value == null) return value as any;
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    if(typeof value === 'string') {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if(value instanceof Date) return value;
    return new Date(value);
  },
});

// 客户表
export const customer = pgTable("customer", {
  id: uuid().defaultRandom().notNull(),
  code: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  contact: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  address: text(),
  transport: varchar({ length: 255 }),
  paymentTerm: varchar("payment_term", { length: 255 }),
  deliveryDirection: varchar("delivery_direction", { length: 255 }),
  settlement: varchar({ length: 255 }),
  category: varchar({ length: 255 }),
  inboundCount: integer("inbound_count").default(0),
  status: varchar({ length: 255 }).default('active'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("idx_customer_code").using("btree", table.code.asc().nullsLast().op("text_ops")),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated"], using: sql`((current_setting('app.user_id'::text) = ANY (ARRAY[]::text[])) AND (current_setting('app.user_id'::text) = (_created_by)::text))` }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon", "authenticated"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role"] }),
]);

// 对账单表
export const reconciliation = pgTable("reconciliation", {
  id: uuid().defaultRandom().notNull(),
  reconciliationNo: varchar("reconciliation_no", { length: 255 }).notNull(),
  customerId: uuid("customer_id").notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerCode: varchar("customer_code", { length: 255 }).notNull(),
  month: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 255 }).default('audited'),
  totalAmount: doublePrecision("total_amount").default(0),
  deductionAmount: doublePrecision("deduction_amount").default(0),
  otherAmount: doublePrecision("other_amount").default(0),
  compensationAmount: doublePrecision("compensation_amount").default(0),
  finalAmount: doublePrecision("final_amount").default(0),
  invoiceAmount: doublePrecision("invoice_amount").default(0),
  uninvoiceAmount: doublePrecision("uninvoice_amount").default(0),
  receiptAmount: doublePrecision("receipt_amount").default(0),
  unreceivedAmount: doublePrecision("unreceived_amount").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_reconciliation_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated"], using: sql`((current_setting('app.user_id'::text) = ANY (ARRAY[]::text[])) AND (current_setting('app.user_id'::text) = (_created_by)::text))` }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon", "authenticated"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role"] }),
]);

// 对账明细表
export const reconciliationDetail = pgTable("reconciliation_detail", {
  id: uuid().defaultRandom().notNull(),
  reconciliationId: uuid("reconciliation_id").notNull(),
  outboundNo: varchar("outbound_no", { length: 255 }).notNull(),
  outboundDate: customTimestamptz('outbound_date').notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  workpieceNo: varchar("workpiece_no", { length: 255 }),
  material: varchar({ length: 255 }),
  process: varchar({ length: 255 }),
  quantity: integer().notNull(),
  weight: doublePrecision().notNull(),
  unitPrice: doublePrecision("unit_price").default(0),
  amount: doublePrecision().default(0),
  unit: varchar({ length: 255 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_reconciliation_detail_reconciliation").using("btree", table.reconciliationId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated"], using: sql`((current_setting('app.user_id'::text) = ANY (ARRAY[]::text[])) AND (current_setting('app.user_id'::text) = (_created_by)::text))` }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon", "authenticated"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role"] }),
]);

// 产品表
export const product = pgTable("product", {
  id: uuid().defaultRandom().notNull(),
  code: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  material: varchar({ length: 255 }),
  process: varchar({ length: 255 }),
  techRequirement: text("tech_requirement"),
  workpieceNo: varchar("workpiece_no", { length: 255 }),
  unit: varchar({ length: 255 }),
  unitPrice: doublePrecision("unit_price").default(0),
  customerCode: varchar("customer_code", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  stock: integer().default(0),
  inboundQuantity: integer("inbound_quantity").default(0),
  inboundWeight: doublePrecision("inbound_weight").default(0),
  inboundDate: customTimestamptz('inbound_date'),
  batchNo: varchar("batch_no", { length: 255 }),
  status: varchar({ length: 255 }).default('active'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  uniqueIndex("idx_product_code").using("btree", table.code.asc().nullsLast().op("text_ops")),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated"], using: sql`((current_setting('app.user_id'::text) = ANY (ARRAY[]::text[])) AND (current_setting('app.user_id'::text) = (_created_by)::text))` }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon", "authenticated"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role"] }),
]);

// 库存变动记录表
export const inventoryRecord = pgTable("inventory_record", {
  id: uuid().defaultRandom().notNull(),
  productId: uuid("product_id").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  material: varchar({ length: 255 }),
  process: varchar({ length: 255 }),
  workpieceNo: varchar("workpiece_no", { length: 255 }),
  unit: varchar({ length: 255 }),
  changeType: varchar("change_type", { length: 255 }).notNull(),
  quantityChange: integer("quantity_change").notNull(),
  weightChange: doublePrecision("weight_change").notNull(),
  beforeStock: integer("before_stock").notNull(),
  afterStock: integer("after_stock").notNull(),
  referenceNo: varchar("reference_no", { length: 255 }),
  customerCode: varchar("customer_code", { length: 255 }),
  customerName: varchar("customer_name", { length: 255 }),
  operator: varchar({ length: 255 }).notNull(),
  remark: text(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_inventory_record_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated"], using: sql`((current_setting('app.user_id'::text) = ANY (ARRAY[]::text[])) AND (current_setting('app.user_id'::text) = (_created_by)::text))` }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon", "authenticated"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role"] }),
]);

// 出库单表
export const outboundOrder = pgTable("outbound_order", {
  id: uuid().defaultRandom().notNull(),
  outboundNo: varchar("outbound_no", { length: 255 }).notNull(),
  customerId: uuid("customer_id").notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerCode: varchar("customer_code", { length: 255 }).notNull(),
  outboundDate: customTimestamptz('outbound_date').notNull(),
  creator: varchar({ length: 255 }).notNull(),
  receiver: varchar({ length: 255 }),
  transporter: varchar({ length: 255 }),
  plateNumber: varchar("plate_number", { length: 255 }),
  driver: varchar({ length: 255 }),
  totalAmount: doublePrecision("total_amount").default(0),
  totalQuantity: integer("total_quantity").default(0),
  totalWeight: doublePrecision("total_weight").default(0),
  status: varchar({ length: 255 }).default('pending_reconciliation'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_outbound_order_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated"], using: sql`((current_setting('app.user_id'::text) = ANY (ARRAY[]::text[])) AND (current_setting('app.user_id'::text) = (_created_by)::text))` }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon", "authenticated"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role"] }),
]);

// 出库明细表
export const outboundDetail = pgTable("outbound_detail", {
  id: uuid().defaultRandom().notNull(),
  outboundId: uuid("outbound_id").notNull(),
  productId: uuid("product_id").notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  workpieceNo: varchar("workpiece_no", { length: 255 }),
  material: varchar({ length: 255 }),
  process: varchar({ length: 255 }),
  unit: varchar({ length: 255 }),
  unitPrice: doublePrecision("unit_price").default(0),
  quantity: integer().notNull(),
  weight: doublePrecision().notNull(),
  amount: doublePrecision().default(0),
  batchNo: varchar("batch_no", { length: 255 }),
  inboundDate: customTimestamptz('inbound_date'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_outbound_detail_outbound").using("btree", table.outboundId.asc().nullsLast().op("uuid_ops")),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated"], using: sql`((current_setting('app.user_id'::text) = ANY (ARRAY[]::text[])) AND (current_setting('app.user_id'::text) = (_created_by)::text))` }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon", "authenticated"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role"] }),
]);

// 表别名导出
export const customerTable = customer;
export const inventoryRecordTable = inventoryRecord;
export const outboundDetailTable = outboundDetail;
export const outboundOrderTable = outboundOrder;
export const productTable = product;
export const reconciliationTable = reconciliation;
export const reconciliationDetailTable = reconciliationDetail;
```

---

# 第三章：后端通用模块

## 3.1 server/main.ts

**文件路径**: `server/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
```

## 3.2 server/app.module.ts

**文件路径**: `server/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ViewModule } from './modules/view/view.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OutboundModule } from './modules/outbound/outbound.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { HelloModule } from './modules/hello/hello.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ViewModule,
    CustomerModule,
    ProductModule,
    InventoryModule,
    OutboundModule,
    ReconciliationModule,
    HelloModule,
  ],
})
export class AppModule {}
```

## 3.3 server/common/filters/exception.filter.ts

**文件路径**: `server/common/filters/exception.filter.ts`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      `HTTP ${status} Error: ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

## 3.4 server/common/interfaces/api_response.interface.ts

**文件路径**: `server/common/interfaces/api_response.interface.ts`

```typescript
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}
```

## 3.5 server/common/interfaces/exception.interface.ts

**文件路径**: `server/common/interfaces/exception.interface.ts`

```typescript
export interface ExceptionResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
```

## 3.6 server/common/constants/api_response_code.ts

**文件路径**: `server/common/constants/api_response_code.ts`

```typescript
export const API_RESPONSE_CODE = {
  SUCCESS: 0,
  ERROR: 1,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;
```

---

# 第四章：Customer模块完整代码

## 4.1 server/modules/customer/customer.module.ts

**文件路径**: `server/modules/customer/customer.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
```

## 4.2 server/modules/customer/customer.controller.ts

**文件路径**: `server/modules/customer/customer.controller.ts`

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

interface CreateCustomerDto {
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  transport?: string;
  paymentTerm?: string;
  deliveryDirection?: string;
  settlement?: string;
  category?: string;
}

interface UpdateCustomerDto {
  name?: string;
  contact?: string;
  phone?: string;
  address?: string;
  transport?: string;
  paymentTerm?: string;
  deliveryDirection?: string;
  settlement?: string;
  category?: string;
  status?: string;
}

@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('keyword') keyword?: string
  ) {
    return this.customerService.findAll({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      keyword
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @NeedLogin()
  @Post()
  async create(@Body() dto: CreateCustomerDto, @Req() req) {
    return this.customerService.create(dto, req.userContext?.userId);
  }

  @NeedLogin()
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(id, dto);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }

  @Get(':id/records')
  async getRecords(@Param('id') id: string) {
    return this.customerService.getRecords(id);
  }
}
```

## 4.3 server/modules/customer/customer.service.ts

**文件路径**: `server/modules/customer/customer.service.ts`

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { customer, outboundOrder, inventoryRecord } from '../../database/schema';
import { eq, desc, sql } from 'drizzle-orm';

@Injectable()
export class CustomerService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  async findAll(params: { page: number; pageSize: number; keyword?: string }) {
    const { page, pageSize, keyword } = params;
    const offset = (page - 1) * pageSize;

    let query = this.db.select().from(customer);
    
    if (keyword) {
      query = query.where(
        sql`${customer.name} ILIKE ${`%${keyword}%`} OR ${customer.code} ILIKE ${`%${keyword}%`}`
      );
    }

    const [items, totalResult] = await Promise.all([
      query.limit(pageSize).offset(offset).orderBy(desc(customer.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(customer)
    ]);

    return {
      code: 0,
      message: 'success',
      data: {
        items,
        total: totalResult[0].count,
        page,
        pageSize
      }
    };
  }

  async findOne(id: string) {
    const result = await this.db.select().from(customer).where(eq(customer.id, id));
    if (!result[0]) {
      throw new NotFoundException('Customer not found');
    }
    return {
      code: 0,
      message: 'success',
      data: result[0]
    };
  }

  async create(dto: any, userId?: string) {
    const result = await this.db.insert(customer).values({
      ...dto,
      createdBy: userId
    }).returning();
    return {
      code: 0,
      message: 'success',
      data: result[0]
    };
  }

  async update(id: string, dto: any) {
    const result = await this.db.update(customer)
      .set(dto)
      .where(eq(customer.id, id))
      .returning();
    return {
      code: 0,
      message: 'success',
      data: result[0]
    };
  }

  async remove(id: string) {
    await this.db.delete(customer).where(eq(customer.id, id));
    return {
      code: 0,
      message: 'success',
      data: { success: true }
    };
  }

  async getRecords(id: string) {
    const outboundRecords = await this.db
      .select()
      .from(outboundOrder)
      .where(eq(outboundOrder.customerId, id))
      .orderBy(desc(outboundOrder.outboundDate));

    const inventoryRecords = await this.db
      .select()
      .from(inventoryRecord)
      .where(eq(inventoryRecord.customerCode, id))
      .orderBy(desc(inventoryRecord.createdAt));

    return {
      code: 0,
      message: 'success',
      data: {
        outbound: outboundRecords,
        inventory: inventoryRecords
      }
    };
  }
}
```

---

# 第五章：Product模块完整代码

## 5.1 server/modules/product/product.module.ts

**文件路径**: `server/modules/product/product.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
```

## 5.2 server/modules/product/product.controller.ts

**文件路径**: `server/modules/product/product.controller.ts`

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ProductService } from './product.service';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('keyword') keyword?: string,
    @Query('customerCode') customerCode?: string
  ) {
    return this.productService.findAll({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      keyword,
      customerCode
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @NeedLogin()
  @Post()
  async create(@Body() dto: any, @Req() req) {
    return this.productService.create(dto, req.userContext?.userId);
  }

  @NeedLogin()
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.productService.update(id, dto);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Get(':id/inventory')
  async getInventoryRecords(@Param('id') id: string) {
    return this.productService.getInventoryRecords(id);
  }
}
```

## 5.3 server/modules/product/product.service.ts

**文件路径**: `server/modules/product/product.service.ts`

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { product, inventoryRecord } from '../../database/schema';
import { eq, desc, sql } from 'drizzle-orm';

@Injectable()
export class ProductService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  async findAll(params: { page: number; pageSize: number; keyword?: string; customerCode?: string }) {
    const { page, pageSize, keyword, customerCode } = params;
    const offset = (page - 1) * pageSize;

    let query = this.db.select().from(product);
    
    if (keyword) {
      query = query.where(
        sql`${product.name} ILIKE ${`%${keyword}%`} OR ${product.code} ILIKE ${`%${keyword}%`}`
      );
    }
    
    if (customerCode) {
      query = query.where(eq(product.customerCode, customerCode));
    }

    const [items, totalResult] = await Promise.all([
      query.limit(pageSize).offset(offset).orderBy(desc(product.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(product)
    ]);

    return {
      code: 0,
      message: 'success',
      data: {
        items,
        total: totalResult[0].count,
        page,
        pageSize
      }
    };
  }

  async findOne(id: string) {
    const result = await this.db.select().from(product).where(eq(product.id, id));
    if (!result[0]) {
      throw new NotFoundException('Product not found');
    }
    return {
      code: 0,
      message: 'success',
      data: result[0]
    };
  }

  async create(dto: any, userId?: string) {
    const result = await this.db.insert(product).values({
      ...dto,
      createdBy: userId
    }).returning();
    return {
      code: 0,
      message: 'success',
      data: result[0]
    };
  }

  async update(id: string, dto: any) {
    const result = await this.db.update(product)
      .set(dto)
      .where(eq(product.id, id))
      .returning();
    return {
      code: 0,
      message: 'success',
      data: result[0]
    };
  }

  async remove(id: string) {
    await this.db.delete(product).where(eq(product.id, id));
    return {
      code: 0,
      message: 'success',
      data: { success: true }
    };
  }

  async getInventoryRecords(id: string) {
    const records = await this.db
      .select()
      .from(inventoryRecord)
      .where(eq(inventoryRecord.productId, id))
      .orderBy(desc(inventoryRecord.createdAt));

    return {
      code: 0,
      message: 'success',
      data: records
    };
  }
}
```

---

**卷1 结束**

本文档包含：
- 16个根目录配置文件的完整代码
- 数据库schema.ts的完整代码（305行）
- 后端通用模块完整代码
- Customer模块完整代码
- Product模块完整代码

**请继续查看卷2获取剩余后端模块代码。**
