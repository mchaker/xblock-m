/**
 * @file
 * Worker process. This spawns the inference daemons.
 */

import { Worker } from "bullmq";

export const worker = new Worker(
  "firehose",
  `${process.cwd()}/lib/inference.ts`,
  {
    connection: {
      host: process.env.REDIS_HOSTNAME ?? "redis",
    },
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
  }
);
