import { describe, beforeAll, afterAll, expect, it } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module.js";

// The project is ESM ("type": "module"), so supertest is a default import and
// relative imports need the .js extension. The single route exercised here is
// AppController's root handler, which does not touch the database.
describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("/ (GET)", async () => {
    const response = await request(app.getHttpServer()).get("/").expect(200);
    expect(response.text).toBe("Hello World!");
  });
});
