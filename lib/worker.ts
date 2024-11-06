/**
 * @file
 * Worker process. This spawns the inference daemons.
 */

import { Worker } from "bullmq";

export const worker = new Worker(
  "xblock",
  `${process.cwd()}/lib/inference.ts`,
  {
    connection: {
      host: process.env.REDIS_HOSTNAME ?? "redis",
      tls: process.env.USE_REDIS_TLS ? {} : undefined,
    },
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
  }
);
