import { Worker } from "bullmq";

export const worker = new Worker(
  "firehose",
  `${process.cwd()}/lib/inference.ts`,
  {
    connection: {
      host: "redis",
    },
  }
);
