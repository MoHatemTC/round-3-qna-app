import { Test, TestingModule } from "@nestjs/testing";
import { StudentService } from "./student.service.js";
import { PrismaService } from "../prisma.service.js";

describe("StudentService", () => {
  let service: StudentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        // The real PrismaService opens a Postgres connection in its
        // constructor, which has no place in a unit test.
        { provide: PrismaService, useValue: {} }
      ]
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
