import { Test, TestingModule } from "@nestjs/testing";
import { StudentController } from "./student.controller.js";
import { StudentService } from "./student.service.js";
import { PrismaService } from "../prisma.service.js";

describe("StudentController", () => {
  let controller: StudentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [
        { provide: StudentService, useValue: {} },
        // EmailVerifiedGuard, applied to some routes here, injects Prisma.
        { provide: PrismaService, useValue: {} }
      ]
    }).compile();

    controller = module.get<StudentController>(StudentController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
