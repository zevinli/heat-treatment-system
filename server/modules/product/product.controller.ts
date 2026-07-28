import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Logger,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { ProductService } from './product.service';
import { PAGINATION } from '../../config/constants';

@Controller('api/products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  // 获取所有产品
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('customerCode') customerCode?: string,
    @Query('status') status?: string,
    @Query('material') material?: string,
    @Query('process') process?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.productService.findAll({
      search,
      customerCode,
      status,
      material,
      process,
      page: page ? parseInt(page, 10) : PAGINATION.DEFAULT_PAGE,
      pageSize: pageSize ? parseInt(pageSize, 10) : PAGINATION.DEFAULT_PAGE_SIZE,
    });
  }

  // 根据ID获取产品
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  // 创建产品
  @NeedLogin()
  @Post()
  async create(
    @Body()
    body: {
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
      status?: string;
    },
  ) {
    return this.productService.create(body);
  }

  // 更新产品
  @NeedLogin()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      material?: string;
      process?: string;
      techRequirement?: string;
      workpieceNo?: string;
      unit?: string;
      unitPrice?: number;
      customerCode?: string;
      customerName?: string;
      status?: string;
      stock?: number;
      inboundQuantity?: number;
      inboundWeight?: number;
    },
  ) {
    return this.productService.update(id, body);
  }

  // 删除产品
  @NeedLogin()
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.userContext;
    return this.productService.delete(id, userId);
  }

  // 批量删除产品
  @NeedLogin()
  @Post('batch-delete')
  async batchDelete(
    @Body() body: { ids: string[] },
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.productService.batchDelete(body.ids, userId);
  }

  // 批量更新产品预警阈值
  @NeedLogin()
  @Post('batch-update-threshold')
  async batchUpdateThreshold(
    @Body() body: { productIds: string[]; warningThreshold: number },
  ) {
    return this.productService.batchUpdateThreshold(body.productIds, body.warningThreshold);
  }

  // 获取待完善产品列表
  @Get('incomplete')
  async getIncompleteProducts(@Query('limit') limit?: string) {
    return this.productService.findIncompleteProducts(limit ? parseInt(limit, 10) : 10);
  }

  // 获取材质默认阈值配置
  @Get('material-thresholds')
  async getMaterialThresholds() {
    return this.productService.getMaterialThresholds();
  }

  // 设置材质默认阈值
  @NeedLogin()
  @Put('material-thresholds')
  async setMaterialThreshold(
    @Body() body: { material: string; threshold: number },
  ) {
    return this.productService.setMaterialThreshold(body.material, body.threshold);
  }
}
