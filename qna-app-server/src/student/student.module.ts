import { Module } from '@nestjs/common';
import { StudentController } from './student.controller.js';
import { StudentService } from './student.service.js';
import { EmailVerifiedGuard } from '../user/guards/email-verified.guard.js';

@Module({
  controllers: [StudentController],
  providers: [StudentService, EmailVerifiedGuard]
})
export class StudentModule {}
