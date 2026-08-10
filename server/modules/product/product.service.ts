import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { eq, like, and, sql, inArray, isNull } from 'drizzle-orm';
import {
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { TENANT_DATABASE } from '../../common/tenant-database.provider';
import { 
  productTable, 
  productMaterialThresholdTable,
  inboundDetailTable,
  outboundDetailTable,
  productCustomerTable,
  productBatchTable,
} from '../../database/schema';
import { yuanToCents } from '../../common/utils/currency';
import { PAGINATION } from '../../config/constants';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @Inject(TENANT_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // 获取所有产品 - 过滤已删除的，支持多客户查询
  async findAll(params: {
    search?: string;
    customerCode?: string;
    customerId?: string;
    status?: string;
    material?: string;
    process?: string;
    includeDeleted?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { search, customerCode, customerId, status, material, process, includeDeleted = false, page = PAGINATION.DEFAULT_PAGE, pageSize = PAGINATION.DEFAULT_PAGE_SIZE } = params;

    const offset = (page - 1) * pageSize;
    
    // 构建基础查询条件
    const conditions: any[] = [];
    
    // 默认排除已删除的产品 - 统一使用isNull
    if (!includeDeleted) {
      conditions.push(isNull(productTable.deletedAt));
    }
    
    if (search) {
      conditions.push(sql`${productTable.name} ILIKE ${`%${search}%`} OR ${productTable.code} ILIKE ${`%${search}%`}`);
    }
    if (status) {
      conditions.push(eq(productTable.status, status));
    }
    if (material) {
      conditions.push(eq(productTable.material, material));
    }
    if (process) {
      conditions.push(eq(productTable.process, process));
    }

    // 处理客户筛选：支持通过关联表查询多客户产品
    let query;
    if (customerId) {
      // 通过关联表查询该客户关联的产品
      query = this.db
        .select({
          product: productTable,
        })
        .from(productTable)
        .innerJoin(
          productCustomerTable,
          eq(productTable.id, productCustomerTable.productId)
        )
        .where(and(
          ...conditions,
          eq(productCustomerTable.customerId, customerId),
          eq(productCustomerTable.isActive, true)
        ));
    } else if (customerCode) {
      // 向后兼容：通过customerCode字段查询
      conditions.push(eq(productTable.customerCode, customerCode));
      query = conditions.length > 0
        ? this.db.select().from(productTable).where(and(...conditions))
        : this.db.select().from(productTable);
    } else {
      query = conditions.length > 0
        ? this.db.select().from(productTable).where(and(...conditions))
        : this.db.select().from(productTable);
    }

    // 查询总数
    let total: number;
    if (customerId) {
      const countResult = await this.db
        .select({ count: sql<number>`count(DISTINCT ${productTable.id})` })
        .from(productTable)
        .innerJoin(
          productCustomerTable,
          eq(productTable.id, productCustomerTable.productId)
        )
        .where(and(
          ...conditions,
          eq(productCustomerTable.customerId, customerId),
          eq(productCustomerTable.isActive, true)
        ));
      total = countResult[0]?.count || 0;
    } else {
      const countResult = conditions.length > 0
        ? await this.db.select({ count: sql<number>`count(*)` }).from(productTable).where(and(...conditions))
        : await this.db.select({ count: sql<number>`count(*)` }).from(productTable);
      total = countResult[0]?.count || 0;
    }

    // 执行查询
    const items = await query.limit(pageSize).offset(offset);
    
    // 如果使用了关联表查询，提取产品数据
    const formattedItems = customerId ? items.map((item: any) => item.product) : items;

    return {
      items: formattedItems,
      total,
      page,
      pageSize,
    };
  }

  // 根据ID获取产品 - 排除已删除，包含关联客户信息
  async findById(id: string, includeDeleted = false) {
    const whereConditions: any[] = [eq(productTable.id, id)];
    if (!includeDeleted) {
      whereConditions.push(sql`${productTable.deletedAt} IS NULL`);
    }
    
    const [product] = await this.db
      .select()
      .from(productTable)
      .where(and(...whereConditions));
    
    if (!product) return null;
    
    // 获取关联的客户列表
    const customers = await this.db
      .select({
        customerId: productCustomerTable.customerId,
        isActive: productCustomerTable.isActive,
      })
      .from(productCustomerTable)
      .where(and(
        eq(productCustomerTable.productId, id),
        eq(productCustomerTable.isActive, true)
      ));
    
    return {
      ...product,
      linkedCustomers: customers,
    };
  }

  // 根据编码获取产品 - 排除已删除
  async findByCode(code: string, includeDeleted = false) {
    const whereConditions: any[] = [eq(productTable.code, code)];
    if (!includeDeleted) {
      whereConditions.push(sql`${productTable.deletedAt} IS NULL`);
    }
    
    const result = await this.db
      .select()
      .from(productTable)
      .where(and(...whereConditions));
    return result[0] || null;
  }

  // 创建产品 - 支持多客户关联
  async create(data: {
    code: string;
    name: string;
    material?: string;
    process?: string;
    techRequirement?: string;
    workpieceNo?: string;
    unit?: string;
    unitPrice?: number;
    customerCode: string;
    customerName: string;
    customerIds?: string[]; // 新增：关联的客户ID列表
    status?: string;
    warningThreshold?: number;
    attachments?: string[];
  }) {
    // 检查编码是否已存在（包含已删除的）
    const existing = await this.findByCode(data.code, true);
    if (existing && !existing.deletedAt) {
      throw new BadRequestException(`产品编码 ${data.code} 已存在`);
    }
    
    // 如果存在已删除的产品，恢复它
    if (existing?.deletedAt) {
      throw new BadRequestException(`产品编码 ${data.code} 曾被删除，请使用其他编码或联系管理员恢复`);
    }

    // 计算金额转分
    const unitPriceCents = yuanToCents(data.unitPrice || 0);

    // 获取默认阈值
    let warningThreshold = data.warningThreshold ?? 50;
    if (data.warningThreshold === undefined && data.material) {
      const thresholdConfig = await this.db
        .select()
        .from(productMaterialThresholdTable)
        .where(eq(productMaterialThresholdTable.material, data.material))
        .limit(1);
      if (thresholdConfig.length > 0) {
        warningThreshold = thresholdConfig[0].defaultThreshold;
      }
    }

    const result = await this.db
      .insert(productTable)
      .values({
        code: data.code,
        name: data.name,
        material: data.material || null,
        process: data.process || null,
        techRequirement: data.techRequirement || null,
        workpieceNo: data.workpieceNo || null,
        unit: data.unit || '件',
        unitPrice: data.unitPrice || 0,
        unitPriceCents: unitPriceCents,
        customerCode: data.customerCode,
        customerName: data.customerName,
        status: data.status || 'complete',
        stock: 0,
        stockWeight: 0,
        inboundQuantity: 0,
        inboundWeight: 0,
        warningThreshold,
        attachments: data.attachments || [],
        version: 1,
      })
      .returning();

    const product = result[0];

    // 如果指定了关联客户列表，创建关联关系
    if (data.customerIds && data.customerIds.length > 0) {
      await this.linkCustomers(product.id, data.customerIds);
    }

    return product;
  }

  // 关联产品与客户
  async linkCustomers(productId: string, customerIds: string[]) {
    // 先删除现有非活跃关联
    await this.db
      .delete(productCustomerTable)
      .where(eq(productCustomerTable.productId, productId));
    
    // 创建新的关联
    if (customerIds.length > 0) {
      await this.db.insert(productCustomerTable).values(
        customerIds.map(customerId => ({
          productId,
          customerId,
          isActive: true,
        }))
      );
    }
  }

  // 更新产品 - 同时更新unitPriceCents和客户关联
  async update(
    id: string,
    data: {
      name?: string;
      material?: string;
      process?: string;
      techRequirement?: string;
      workpieceNo?: string;
      unit?: string;
      unitPrice?: number;
      customerCode?: string;
      customerName?: string;
      customerIds?: string[]; // 新增：更新关联客户
      status?: string;
      stock?: number;
      inboundQuantity?: number;
      inboundWeight?: number;
      warningThreshold?: number;
      attachments?: string[];
    },
  ) {
    // 如果更新了单价，同时更新unitPriceCents
    const updateData: any = { ...data };
    delete updateData.customerIds; // 客户关联单独处理
    
    if (data.unitPrice !== undefined) {
      updateData.unitPriceCents = yuanToCents(data.unitPrice);
    }

    // 自动状态流转
    const existing = await this.findById(id);
    if (existing && existing.status === 'incomplete') {
      const name = data.name ?? existing.name;
      const material = data.material ?? existing.material;
      const process = data.process ?? existing.process;
      const unitPrice = data.unitPrice ?? existing.unitPrice;

      if (name && material && process && unitPrice && unitPrice > 0) {
        updateData.status = 'complete';
      }
    }

    const result = await this.db
      .update(productTable)
      .set(updateData)
      .where(eq(productTable.id, id))
      .returning();
    
    // 更新客户关联
    if (data.customerIds !== undefined) {
      await this.linkCustomers(id, data.customerIds);
    }
    
    return result[0] || null;
  }

  // 批量更新产品预警阈值
  async batchUpdateThreshold(productIds: string[], warningThreshold: number) {
    if (!productIds || productIds.length === 0) {
      throw new BadRequestException('产品ID列表不能为空');
    }
    if (warningThreshold < 0) {
      throw new BadRequestException('预警阈值不能为负数');
    }

    const results = await Promise.all(
      productIds.map(async (id) => {
        const result = await this.db
          .update(productTable)
          .set({ warningThreshold })
          .where(eq(productTable.id, id))
          .returning();
        return result[0];
      }),
    );

    return {
      updatedCount: results.filter(Boolean).length,
      products: results.filter(Boolean),
    };
  }

  // 获取待完善产品列表
  async findIncompleteProducts(limit: number = 10) {
    return await this.db
      .select()
      .from(productTable)
      .where(and(
        eq(productTable.status, 'incomplete'),
        sql`${productTable.deletedAt} IS NULL`,
      ))
      .limit(limit);
  }

  // 获取材质默认阈值配置
  async getMaterialThresholds() {
    return await this.db.select().from(productMaterialThresholdTable);
  }

  // 设置材质默认阈值
  async setMaterialThreshold(material: string, defaultThreshold: number) {
    if (!material) {
      throw new BadRequestException('材质名称不能为空');
    }
    if (defaultThreshold < 0) {
      throw new BadRequestException('默认阈值不能为负数');
    }

    const result = await this.db
      .insert(productMaterialThresholdTable)
      .values({
        material,
        defaultThreshold,
      })
      .onConflictDoUpdate({
        target: productMaterialThresholdTable.material,
        set: { defaultThreshold },
      })
      .returning();

    return result[0];
  }

  // 软删除产品 - 检查关联数据完整性
  async delete(id: string, operatorId?: string) {
    // 检查产品是否存在
    const existing = await this.findById(id);
    if (!existing) {
      throw new BadRequestException('产品不存在或已删除');
    }

    // 检查是否有库存
    if (existing.stock > 0) {
      throw new BadRequestException(`产品库存不为零（当前库存：${existing.stock}），无法删除`);
    }

    // 检查是否有未完成的入库单明细
    const inboundDetails = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inboundDetailTable)
      .where(eq(inboundDetailTable.productId, id));

    // 检查是否有未完成的出库单明细
    const outboundDetails = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(outboundDetailTable)
      .where(eq(outboundDetailTable.productId, id));

    const result = await this.db
      .update(productTable)
      .set({
        deletedAt: new Date(),

        status: 'deleted',
      })
      .where(eq(productTable.id, id))
      .returning();

    return {
      product: result[0],
      hasInboundRecords: inboundDetails[0]?.count > 0,
      hasOutboundRecords: outboundDetails[0]?.count > 0,
      message: '产品已删除，历史单据中的产品信息已保留',
    };
  }

  // 批量删除产品
  async batchDelete(ids: string[], operatorId?: string) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('产品ID列表不能为空');
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    // 逐个删除产品，记录成功和失败的
    for (const id of ids) {
      try {
        await this.delete(id, operatorId);
        results.success.push(id);
      } catch (error: any) {
        results.failed.push({ id, reason: error.message || '删除失败' });
      }
    }

    return {
      total: ids.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      results,
      message: `成功删除 ${results.success.length} 个产品，失败 ${results.failed.length} 个`,
    };
  }

  // 恢复已删除产品
  async restore(id: string) {
    const existing = await this.findById(id, true);
    if (!existing) {
      throw new BadRequestException('产品不存在');
    }
    if (!existing.deletedAt) {
      throw new BadRequestException('产品未删除，无需恢复');
    }

    // 检查编码是否已被其他产品使用
    const codeExists = await this.db
      .select({ id: productTable.id })
      .from(productTable)
      .where(and(
        eq(productTable.code, existing.code),
        sql`${productTable.deletedAt} IS NULL`,
        sql`${productTable.id} != ${id}`,
      ));
    
    if (codeExists.length > 0) {
      throw new BadRequestException(`产品编码 ${existing.code} 已被其他产品使用，无法恢复`);
    }

    const result = await this.db
      .update(productTable)
      .set({
        deletedAt: null,

        status: 'active',
      })
      .where(eq(productTable.id, id))
      .returning();

    return result[0];
  }

  // 批量获取产品
  async findByIds(ids: string[]) {
    if (!ids || ids.length === 0) return [];
    
    return await this.db
      .select()
      .from(productTable)
      .where(and(
        inArray(productTable.id, ids),
        sql`${productTable.deletedAt} IS NULL`,
      ));
  }

  // 检查产品是否可出库（有库存且未删除）
  async checkProductAvailable(productId: string, requiredQuantity: number) {
    const product = await this.findById(productId);
    
    if (!product) {
      return { available: false, reason: '产品不存在或已删除' };
    }
    
    if (product.stock < requiredQuantity) {
      return { 
        available: false, 
        reason: `库存不足，当前库存 ${product.stock}，需要 ${requiredQuantity}` 
      };
    }
    
    return { available: true, stock: product.stock };
  }
}
