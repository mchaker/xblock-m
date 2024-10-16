import { Worker } from "bullmq";

export const worker = new Worker(
  "firehose",
  `${import.meta.dirname}/inference.ts`
);
