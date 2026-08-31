import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { StudentModule } from "./student/student.module.js";
import { UserModule } from "./user/user.module.js";

@Module({
  imports: [UserModule, StudentModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
