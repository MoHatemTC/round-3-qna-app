import { describe, beforeEach, expect, it } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { StudentService } from "./student.service.js";
import { PrismaService } from "../prisma.service.js";

describe("StudentService", () => {
  let service: StudentService;

  beforeEach(async () => {
    // StudentService injects PrismaService, so the module needs a stand-in for
    // it - without one, compile() fails before a single assertion runs.
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentService, { provide: PrismaService, useValue: {} }]
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
