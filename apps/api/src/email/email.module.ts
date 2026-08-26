import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailTriggersService } from './email.triggers.service';

@Global()
@Module({
  providers: [EmailService, EmailTriggersService],
  exports: [EmailService, EmailTriggersService],
})
export class EmailModule {}
