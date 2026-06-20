import { Test } from "@nestjs/testing";
import { afterAll, describe, expect, it } from "vitest";

import { ConfigurationModule } from "../configuration/configuration.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { HealthReadinessService } from "./health-readiness.service.js";

const hasDockerBackedEnvironment =
  Boolean(process.env.DATABASE_URL) &&
  Boolean(process.env.REDIS_URL) &&
  Boolean(process.env.S3_ENDPOINT) &&
  Boolean(process.env.S3_BUCKET_PRIVATE);

const describeWithInfrastructure = hasDockerBackedEnvironment ? describe : describe.skip;

describeWithInfrastructure("health readiness integration", () => {
  let closeModule: (() => Promise<void>) | undefined;

  afterAll(async () => {
    await closeModule?.();
  });

  it("checks PostGIS, Redis, and private object storage", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule],
      providers: [HealthReadinessService],
    }).compile();
    closeModule = () => moduleRef.close();

    const readiness = moduleRef.get(HealthReadinessService);
    const result = await readiness.check();
    const dependencies = result.dependencies;

    expect(result.status).toBe("ok");
    expect(dependencies?.postgis?.status).toBe("ok");
    expect(dependencies?.redis?.status).toBe("ok");
    expect(dependencies?.objectStorage?.status).toBe("ok");
  });
});
