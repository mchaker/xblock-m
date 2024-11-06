/**
 * @file
 * This is where all the inference work happens.
 *
 */
import { env } from "@xenova/transformers";

env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.extra = {
  mlas: {
    enable_gemm_fastmath_arm64_bfloat16: 1,
  },
};
env.allowRemoteModels = false;
env.localModelPath = "./models";

console.log(env);

import { THRESHOLD } from "./constants";
import { CommitCreateEvent } from "@skyware/jetstream";
import { Job } from "bullmq";
import zip from "lodash.zip";

// Uncomment the following and comment out the line after to use another pretrained model
// import { pipeline } from "@xenova/transformers";
import { pipeline } from "./pipeline";
import { createLabel } from "./moderate";

// Allocate a pipeline
const model = pipeline(
  "multi-label-image-classification", // Probably change to 'image-classification'
  "howdyaendra/microsoft-swinv2-small-patch4-window16-256-finetuned-xblockm" // e.g. 'Xenova/vit-base-patch16-224'
);

export default async function (
  job: Job<CommitCreateEvent<"app.bsky.feed.post">>
) {
  try {
    await job.log("Start processing job");
    const pipeline = await model;

    if (job.data.commit.record.embed?.$type === "app.bsky.embed.images") {
      const urls = job.data.commit.record.embed.images.map(
        (d) =>
          `https://cdn.bsky.app/img/feed_fullsize/plain/${job.data.did}/${d.image.ref.$link}@jpeg`
      );

      const results: { score: number; label: string }[][] = await pipeline(
        urls
      );

      const items = zip(urls, results).filter(
        ([_, scores]) =>
          Math.max(
            ...(scores
              ?.filter((d) => d.label !== "negative")
              .map((d) => d.score) ?? [])
          ) >= THRESHOLD
      );

      await createLabel(job.data, items);
    }
  } catch (e) {
    console.error(e);
  }
}
