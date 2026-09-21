import { describe, beforeEach, expect, it } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { StudentController } from "./student.controller.js";
import { StudentService } from "./student.service.js";
import { PrismaService } from "../prisma.service.js";

describe("StudentController", () => {
  let controller: StudentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      // EmailVerifiedGuard is applied to routes on this controller and injects
      // PrismaService, so both need a stand-in for the module to compile.
      providers: [
        { provide: StudentService, useValue: {} },
        { provide: PrismaService, useValue: {} }
      ]
    }).compile();

    controller = module.get<StudentController>(StudentController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
