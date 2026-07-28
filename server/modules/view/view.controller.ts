import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { join } from 'path';

@Controller()
export class ViewController {

  @Get(['/', '*'])
  async render(@Req() req: Request, @Res() res: Response) {
    const platformData = req.__platform_data__ ?? {};
    res.render(join(process.cwd(), 'dist/client/index.html'), {
      __platform__: JSON.stringify(platformData),
    });
  }
}