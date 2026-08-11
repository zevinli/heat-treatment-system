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
import { CanRole, NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { ProductService } from './product.service';
import { PAGINATION } from '../../config/constants';
import { parsePagination, parsePositiveInt } from '../../common/utils/pagination';

@Controller('api/products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  // 静态子路由必须放在 :id 之前，否则会被当成产品 ID 而永远无法访问。
  @Get('incomplete')
  @CanRole('product:view')
  async getIncompleteProducts(@Query('limit') limit?: string) {
    return this.productService.findIncompleteProducts(parsePositiveInt(limit, 10, 100));
  }

  @Get('material-thresholds')
  @CanRole('product:view')
  async getMaterialThresholds() {
    return this.productService.getMaterialThresholds();
  }

  @NeedLogin()
  @CanRole('product:update')
  @Put('material-thresholds')
  async setMaterialThreshold(
    @Body() body: { material: string; threshold: number },
  ) {
    return this.productService.setMaterialThreshold(body.material, body.threshold);
  }

  // 获取所有产品
  @Get()
  @CanRole('product:view')
  async findAll(
    @Query('search') search?: string,
    @Query('customerCode') customerCode?: string,
    @Query('status') status?: string,
    @Query('material') material?: string,
    @Query('process') process?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pagination = parsePagination(page, pageSize, {
      page: PAGINATION.DEFAULT_PAGE, pageSize: PAGINATION.DEFAULT_PAGE_SIZE, maxPageSize: PAGINATION.MAX_PAGE_SIZE,
    });
    return this.productService.findAll({
      search,
      customerCode,
      status,
      material,
      process,
      ...pagination,
    });
  }

  // 根据ID获取产品
  @Get(':id')
  @CanRole('product:view')
  async findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  // 创建产品
  @NeedLogin()
  @CanRole('product:create')
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
      customerIds?: string[];
      status?: string;
      warningThreshold?: number;
      attachments?: string[];
    },
  ) {
    return this.productService.create(body);
  }

  // 更新产品
  @NeedLogin()
  @CanRole('product:update')
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
      customerIds?: string[];
      status?: string;
      warningThreshold?: number;
      attachments?: string[];
    },
  ) {
    return this.productService.update(id, body);
  }

  // 删除产品
  @NeedLogin()
  @CanRole('product:delete')
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.userContext;
    return this.productService.delete(id, userId);
  }

  // 批量删除产品
  @NeedLogin()
  @CanRole('product:delete')
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
  @CanRole('product:update')
  @Post('batch-update-threshold')
  async batchUpdateThreshold(
    @Body() body: { productIds: string[]; warningThreshold: number },
  ) {
    return this.productService.batchUpdateThreshold(body.productIds, body.warningThreshold);
  }

}
