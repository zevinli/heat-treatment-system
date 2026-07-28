# 热处理收发货管理系统 - 完整开发文档 卷2
# 后端剩余模块完整代码

**版本**: COMPLETE v1.0  
**性质**: 一字不差的完整代码  

---

## 卷2 目录

1. Inventory模块完整代码
2. Outbound模块完整代码
3. Reconciliation模块完整代码
4. Hello示例模块完整代码
5. View视图模块完整代码
6. 插件能力配置

---

# 第一章：Inventory模块完整代码

## 1.1 server/modules/inventory/inventory.module.ts

**文件路径**: `server/modules/inventory/inventory.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
```

## 1.2 server/modules/inventory/inventory.controller.ts

**文件路径**: `server/modules/inventory/inventory.controller.ts`

```typescript
import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

interface InboundDto {
  productId: string;
  quantity: number;
  weight: number;
  batchNo?: string;
  remark?: string;
}

interface OutboundDto {
  productId: string;
  quantity: number;
  referenceNo?: string;
  remark?: string;
}

@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('keyword') keyword?: string,
    @Query('material') material?: string,
    @Query('process') process?: string
  ) {
    return this.inventoryService.findAll({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      keyword,
      material,
      process
    });
  }

  @Get('records')
  async getRecords(
    @Query('productId') productId?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10'
  ) {
    return this.inventoryService.getRecords({
      productId,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    });
  }

  @Get('warning')
  async getWarnings() {
    return this.inventoryService.getWarnings();
  }

  @NeedLogin()
  @Post('inbound')
  async inbound(@Body() dto: InboundDto, @Req() req) {
    return this.inventoryService.inbound(dto, req.userContext?.userId);
  }

  @NeedLogin()
  @Post('outbound')
  async outbound(@Body() dto: OutboundDto, @Req() req) {
    return this.inventoryService.outbound(dto, req.userContext?.userId);
  }
}
```

## 1.3 server/modules/inventory/inventory.service.ts

**文件路径**: `server/modules/inventory/inventory.service.ts`

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { product, inventoryRecord } from '../../database/schema';
import { eq, desc, sql } from 'drizzle-orm';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  async findAll(params: { page: number; pageSize: number; keyword?: string; material?: string; process?: string }) {
    const { page, pageSize, keyword, material, process } = params;
    const offset = (page - 1) * pageSize;

    let query = this.db.select().from(product);
    
    if (keyword) {
      query = query.where(
        sql`${product.name} ILIKE ${`%${keyword}%`} OR ${product.code} ILIKE ${`%${keyword}%`}`
      );
    }
    
    if (material) {
      query = query.where(eq(product.material, material));
    }
    
    if (process) {
      query = query.where(eq(product.process, process));
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

  async getRecords(params: { productId?: string; page: number; pageSize: number }) {
    const { productId, page, pageSize } = params;
    const offset = (page - 1) * pageSize;

    let query = this.db.select().from(inventoryRecord);
    
    if (productId) {
      query = query.where(eq(inventoryRecord.productId, productId));
    }

    const [items, totalResult] = await Promise.all([
      query.limit(pageSize).offset(offset).orderBy(desc(inventoryRecord.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(inventoryRecord)
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

  async getWarnings() {
    const lowStockItems = await this.db
      .select()
      .from(product)
      .where(sql`${product.stock} < 10`)
      .orderBy(product.stock);

    const overdueItems = await this.db
      .select()
      .from(product)
      .where(
        sql`${product.inboundDate} < CURRENT_DATE - INTERVAL '30 days' AND ${product.stock} > 0`
      );

    return {
      code: 0,
      message: 'success',
      data: {
        lowStock: lowStockItems,
        overdue: overdueItems
      }
    };
  }

  async inbound(dto: any, userId?: string) {
    const { productId, quantity, weight, batchNo, remark } = dto;

    const [existingProduct] = await this.db
      .select()
      .from(product)
      .where(eq(product.id, productId));

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const beforeStock = existingProduct.stock || 0;
    const afterStock = beforeStock + quantity;

    await this.db.update(product)
      .set({
        stock: afterStock,
        inboundQuantity: (existingProduct.inboundQuantity || 0) + quantity,
        inboundWeight: (existingProduct.inboundWeight || 0) + weight,
        inboundDate: new Date(),
        batchNo: batchNo || existingProduct.batchNo
      })
      .where(eq(product.id, productId));

    await this.db.insert(inventoryRecord).values({
      productId,
      productName: existingProduct.name,
      material: existingProduct.material,
      process: existingProduct.process,
      workpieceNo: existingProduct.workpieceNo,
      unit: existingProduct.unit,
      changeType: 'inbound',
      quantityChange: quantity,
      weightChange: weight,
      beforeStock,
      afterStock,
      referenceNo: batchNo,
      customerCode: existingProduct.customerCode,
      customerName: existingProduct.customerName,
      operator: userId || 'system',
      remark,
      createdBy: userId
    });

    return {
      code: 0,
      message: 'success',
      data: { success: true }
    };
  }

  async outbound(dto: any, userId?: string) {
    const { productId, quantity, referenceNo, remark } = dto;

    const [existingProduct] = await this.db
      .select()
      .from(product)
      .where(eq(product.id, productId));

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const beforeStock = existingProduct.stock || 0;
    
    if (beforeStock < quantity) {
      return {
        code: 1,
        message: 'Insufficient stock',
        data: null
      };
    }

    const afterStock = beforeStock - quantity;

    await this.db.update(product)
      .set({ stock: afterStock })
      .where(eq(product.id, productId));

    await this.db.insert(inventoryRecord).values({
      productId,
      productName: existingProduct.name,
      material: existingProduct.material,
      process: existingProduct.process,
      workpieceNo: existingProduct.workpieceNo,
      unit: existingProduct.unit,
      changeType: 'outbound',
      quantityChange: -quantity,
      weightChange: 0,
      beforeStock,
      afterStock,
      referenceNo,
      customerCode: existingProduct.customerCode,
      customerName: existingProduct.customerName,
      operator: userId || 'system',
      remark,
      createdBy: userId
    });

    return {
      code: 0,
      message: 'success',
      data: { success: true }
    };
  }
}
```

---

# 第二章：Outbound模块完整代码

## 2.1 server/modules/outbound/outbound.module.ts

**文件路径**: `server/modules/outbound/outbound.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { OutboundController } from './outbound.controller';
import { OutboundService } from './outbound.service';

@Module({
  controllers: [OutboundController],
  providers: [OutboundService],
})
export class OutboundModule {}
```

## 2.2 server/modules/outbound/outbound.controller.ts

**文件路径**: `server/modules/outbound/outbound.controller.ts`

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { OutboundService } from './outbound.service';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

interface CreateOutboundDto {
  customerId: string;
  outboundDate: string;
  receiver?: string;
  transporter?: string;
  plateNumber?: string;
  driver?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
  }>;
}

interface UpdateOutboundDto {
  receiver?: string;
  transporter?: string;
  plateNumber?: string;
  driver?: string;
  status?: string;
}

@Controller('api/outbound')
export class OutboundController {
  constructor(private readonly outboundService: OutboundService) {}

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.outboundService.findAll({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      customerId,
      startDate,
      endDate
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.outboundService.findOne(id);
  }

  @NeedLogin()
  @Post()
  async create(@Body() dto: CreateOutboundDto, @Req() req) {
    return this.outboundService.create(dto, req.userContext?.userId);
  }

  @NeedLogin()
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOutboundDto) {
    return this.outboundService.update(id, dto);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.outboundService.remove(id);
  }
}
```

## 2.3 server/modules/outbound/outbound.service.ts

**文件路径**: `server/modules/outbound/outbound.service.ts`

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { outboundOrder, outboundDetail, product, customer } from '../../database/schema';
import { eq, desc, sql } from 'drizzle-orm';

@Injectable()
export class OutboundService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  async findAll(params: { page: number; pageSize: number; customerId?: string; startDate?: string; endDate?: string }) {
    const { page, pageSize, customerId, startDate, endDate } = params;
    const offset = (page - 1) * pageSize;

    let query = this.db.select().from(outboundOrder);
    
    if (customerId) {
      query = query.where(eq(outboundOrder.customerId, customerId));
    }
    
    if (startDate) {
      query = query.where(sql`${outboundOrder.outboundDate} >= ${startDate}`);
    }
    
    if (endDate) {
      query = query.where(sql`${outboundOrder.outboundDate} <= ${endDate}`);
    }

    const [items, totalResult] = await Promise.all([
      query.limit(pageSize).offset(offset).orderBy(desc(outboundOrder.outboundDate)),
      this.db.select({ count: sql<number>`count(*)` }).from(outboundOrder)
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
    const [order] = await this.db
      .select()
      .from(outboundOrder)
      .where(eq(outboundOrder.id, id));

    if (!order) {
      throw new NotFoundException('Outbound order not found');
    }

    const details = await this.db
      .select()
      .from(outboundDetail)
      .where(eq(outboundDetail.outboundId, id));

    return {
      code: 0,
      message: 'success',
      data: { ...order, details }
    };
  }

  async create(dto: any, userId?: string) {
    const { customerId, outboundDate, receiver, transporter, plateNumber, driver, items } = dto;

    const [customerInfo] = await this.db
      .select()
      .from(customer)
      .where(eq(customer.id, customerId));

    if (!customerInfo) {
      throw new NotFoundException('Customer not found');
    }

    const outboundNo = `CK${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    let totalAmount = 0;
    let totalQuantity = 0;
    let totalWeight = 0;

    const detailItems = [];

    for (const item of items) {
      const [productInfo] = await this.db
        .select()
        .from(product)
        .where(eq(product.id, item.productId));

      if (!productInfo) {
        continue;
      }

      const amount = item.quantity * (item.unitPrice || productInfo.unitPrice || 0);
      const weight = item.quantity * 0.5;

      totalAmount += amount;
      totalQuantity += item.quantity;
      totalWeight += weight;

      detailItems.push({
        productId: item.productId,
        productName: productInfo.name,
        workpieceNo: productInfo.workpieceNo,
        material: productInfo.material,
        process: productInfo.process,
        unit: productInfo.unit,
        unitPrice: item.unitPrice || productInfo.unitPrice || 0,
        quantity: item.quantity,
        weight,
        amount,
        batchNo: productInfo.batchNo,
        inboundDate: productInfo.inboundDate
      });

      await this.db.update(product)
        .set({ stock: (productInfo.stock || 0) - item.quantity })
        .where(eq(product.id, item.productId));
    }

    const [order] = await this.db.insert(outboundOrder).values({
      outboundNo,
      customerId,
      customerName: customerInfo.name,
      customerCode: customerInfo.code,
      outboundDate: new Date(outboundDate),
      creator: userId || 'system',
      receiver,
      transporter,
      plateNumber,
      driver,
      totalAmount,
      totalQuantity,
      totalWeight,
      status: 'pending_reconciliation',
      createdBy: userId
    }).returning();

    for (const detail of detailItems) {
      await this.db.insert(outboundDetail).values({
        outboundId: order.id,
        ...detail,
        createdBy: userId
      });
    }

    return {
      code: 0,
      message: 'success',
      data: order
    };
  }

  async update(id: string, dto: any) {
    const result = await this.db.update(outboundOrder)
      .set(dto)
      .where(eq(outboundOrder.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundException('Outbound order not found');
    }

    return {
      code: 0,
      message: 'success',
      data: result[0]
    };
  }

  async remove(id: string) {
    await this.db.delete(outboundDetail).where(eq(outboundDetail.outboundId, id));
    await this.db.delete(outboundOrder).where(eq(outboundOrder.id, id));

    return {
      code: 0,
      message: 'success',
      data: { success: true }
    };
  }
}
```

---

# 第三章：Reconciliation模块完整代码

## 3.1 server/modules/reconciliation/reconciliation.module.ts

**文件路径**: `server/modules/reconciliation/reconciliation.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';

@Module({
  controllers: [ReconciliationController],
  providers: [ReconciliationService],
})
export class ReconciliationModule {}
```

## 3.2 server/modules/reconciliation/reconciliation.controller.ts

**文件路径**: `server/modules/reconciliation/reconciliation.controller.ts`

```typescript
import { Controller, Get, Post, Put, Body, Param, Query, Req } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

interface CreateReconciliationDto {
  customerId: string;
  month: string;
  outboundIds: string[];
}

interface UpdateReconciliationDto {
  deductionAmount?: number;
  otherAmount?: number;
  compensationAmount?: number;
  invoiceAmount?: number;
  receiptAmount?: number;
}

@Controller('api/reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('customerId') customerId?: string,
    @Query('month') month?: string
  ) {
    return this.reconciliationService.findAll({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      customerId,
      month
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reconciliationService.findOne(id);
  }

  @NeedLogin()
  @Post()
  async create(@Body() dto: CreateReconciliationDto, @Req() req) {
    return this.reconciliationService.create(dto, req.userContext?.userId);
  }

  @NeedLogin()
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateReconciliationDto) {
    return this.reconciliationService.update(id, dto);
  }

  @NeedLogin()
  @Post(':id/audit')
  async audit(@Param('id') id: string) {
    return this.reconciliationService.audit(id);
  }
}
```

## 3.3 server/modules/reconciliation/reconciliation.service.ts

**文件路径**: `server/modules/reconciliation/reconciliation.service.ts`

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { reconciliation, reconciliationDetail, outboundOrder, outboundDetail, customer } from '../../database/schema';
import { eq, desc, sql } from 'drizzle-orm';

@Injectable()
export class ReconciliationService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase
  ) {}

  async findAll(params: { page: number; pageSize: number; customerId?: string; month?: string }) {
    const { page, pageSize, customerId, month } = params;
    const offset = (page - 1) * pageSize;

    let query = this.db.select().from(reconciliation);
    
    if (customerId) {
      query = query.where(eq(reconciliation.customerId, customerId));
    }
    
    if (month) {
      query = query.where(eq(reconciliation.month, month));
    }

    const [items, totalResult] = await Promise.all([
      query.limit(pageSize).offset(offset).orderBy(desc(reconciliation.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(reconciliation)
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
    const [recon] = await this.db
      .select()
      .from(reconciliation)
      .where(eq(reconciliation.id, id));

    if (!recon) {
      throw new NotFoundException('Reconciliation not found');
    }

    const details = await this.db
      .select()
      .from(reconciliationDetail)
      .where(eq(reconciliationDetail.reconciliationId, id));

    return {
      code: 0,
      message: 'success',
      data: { ...recon, details }
    };
  }

  async create(dto: any, userId?: string) {
    const { customerId, month, outboundIds } = dto;

    const [customerInfo] = await this.db
      .select()
      .from(customer)
      .where(eq(customer.id, customerId));

    if (!customerInfo) {
      throw new NotFoundException('Customer not found');
    }

    const reconciliationNo = `R${month.replace('-', '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    let totalAmount = 0;

    for (const outboundId of outboundIds) {
      const [order] = await this.db
        .select()
        .from(outboundOrder)
        .where(eq(outboundOrder.id, outboundId));

      if (order) {
        totalAmount += order.totalAmount || 0;
      }
    }

    const [recon] = await this.db.insert(reconciliation).values({
      reconciliationNo,
      customerId,
      customerName: customerInfo.name,
      customerCode: customerInfo.code,
      month,
      status: 'draft',
      totalAmount,
      deductionAmount: 0,
      otherAmount: 0,
      compensationAmount: 0,
      finalAmount: totalAmount,
      invoiceAmount: 0,
      uninvoiceAmount: totalAmount,
      receiptAmount: 0,
      unreceivedAmount: totalAmount,
      createdBy: userId
    }).returning();

    for (const outboundId of outboundIds) {
      const details = await this.db
        .select()
        .from(outboundDetail)
        .where(eq(outboundDetail.outboundId, outboundId));

      for (const detail of details) {
        await this.db.insert(reconciliationDetail).values({
          reconciliationId: recon.id,
          outboundNo: outboundId,
          outboundDate: new Date(),
          productName: detail.productName,
          workpieceNo: detail.workpieceNo,
          material: detail.material,
          process: detail.process,
          quantity: detail.quantity,
          weight: detail.weight,
          unitPrice: detail.unitPrice,
          amount: detail.amount,
          unit: detail.unit,
          createdBy: userId
        });
      }
    }

    return {
      code: 0,
      message: 'success',
      data: recon
    };
  }

  async update(id: string, dto: any) {
    const [existing] = await this.db
      .select()
      .from(reconciliation)
      .where(eq(reconciliation.id, id));

    if (!existing) {
      throw new NotFoundException('Reconciliation not found');
    }

    const finalAmount = (existing.totalAmount || 0) 
      - (dto.deductionAmount !== undefined ? dto.deductionAmount : existing.deductionAmount || 0)
      + (dto.otherAmount !== undefined ? dto.otherAmount : existing.otherAmount || 0)
      - (dto.compensationAmount !== undefined ? dto.compensationAmount : existing.compensationAmount || 0);

    const uninvoiceAmount = finalAmount - (dto.invoiceAmount !== undefined ? dto.invoiceAmount : existing.invoiceAmount || 0);
    const unreceivedAmount = finalAmount - (dto.receiptAmount !== undefined ? dto.receiptAmount : existing.receiptAmount || 0);

    const result = await this.db.update(reconciliation)
      .set({
        ...dto,
        finalAmount,
        uninvoiceAmount,
        unreceivedAmount
      })
      .where(eq(reconciliation.id, id))
      .returning();

    return {
      code: 0,
      message: 'success',
      data: result[0]
    };
  }

  async audit(id: string) {
    const result = await this.db.update(reconciliation)
      .set({ status: 'audited' })
      .where(eq(reconciliation.id, id))
      .returning();

    if (!result[0]) {
      throw new NotFoundException('Reconciliation not found');
    }

    return {
      code: 0,
      message: 'success',
      data: result[0]
    };
  }
}
```

---

# 第四章：Hello示例模块完整代码

## 4.1 server/modules/hello/hello.module.ts

**文件路径**: `server/modules/hello/hello.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { HelloController } from './hello.controller';
import { HelloService } from './hello.service';

@Module({
  controllers: [HelloController],
  providers: [HelloService],
})
export class HelloModule {}
```

## 4.2 server/modules/hello/hello.controller.ts

**文件路径**: `server/modules/hello/hello.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { HelloService } from './hello.service';

@Controller('api/hello')
export class HelloController {
  constructor(private readonly helloService: HelloService) {}

  @Get()
  async getHello() {
    return this.helloService.getHello();
  }
}
```

## 4.3 server/modules/hello/hello.service.ts

**文件路径**: `server/modules/hello/hello.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class HelloService {
  async getHello() {
    return {
      code: 0,
      message: 'Hello from Heat Treatment Management System!',
      data: {
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
  }
}
```

---

# 第五章：View视图模块完整代码

## 5.1 server/modules/view/view.module.ts

**文件路径**: `server/modules/view/view.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ViewController } from './view.controller';

@Module({
  controllers: [ViewController],
})
export class ViewModule {}
```

## 5.2 server/modules/view/view.controller.ts

**文件路径**: `server/modules/view/view.controller.ts`

```typescript
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class ViewController {
  @Get()
  async index(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'client/dist/index.html'));
  }
}
```

---

# 第六章：插件能力配置

## 6.1 server/capabilities/intelligent_writing_quick_quality_1.json

**文件路径**: `server/capabilities/intelligent_writing_quick_quality_1.json`

```json
{
  "name": "智能写作",
  "description": "基于AI的智能写作助手",
  "version": "1.0.0",
  "actions": [
    {
      "key": "write",
      "name": "写作",
      "description": "根据提示生成文本内容"
    }
  ]
}
```

## 6.2 server/capabilities/image_info_extract_structured_1.json

**文件路径**: `server/capabilities/image_info_extract_structured_1.json`

```json
{
  "name": "图片信息提取",
  "description": "从图片中提取结构化信息",
  "version": "1.0.0",
  "actions": [
    {
      "key": "extract",
      "name": "提取",
      "description": "从图片中提取文本和信息"
    }
  ]
}
```

---

**卷2 结束**

本文档包含：
- Inventory模块完整代码
- Outbound模块完整代码
- Reconciliation模块完整代码
- Hello示例模块完整代码
- View视图模块完整代码
- 插件能力配置

**请继续查看卷3获取前端页面完整代码。**
