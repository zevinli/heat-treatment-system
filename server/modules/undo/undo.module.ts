import { Module } from '@nestjs/common';
import { UndoController } from './undo.controller';
import { UndoService } from './undo.service';
import { PermissionModule } from '../permission/permission.module';
import { InboundModule } from '../inbound/inbound.module';
import { OutboundModule } from '../outbound/outbound.module';

@Module({
  imports: [PermissionModule, InboundModule, OutboundModule],
  controllers: [UndoController],
  providers: [UndoService],
  exports: [UndoService],
})
export class UndoModule {}
