import { CommitCreateEvent } from "@skyware/jetstream";
import { Job } from "bullmq";
import { pipeline } from "./pipeline";

console.log("inference");

// Allocate a pipeline for sentiment-analysis
const model = pipeline();

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
      const results = await pipeline(urls);
      const filtered = results.filter((p) =>
        p.some((d) => d.score > 0.75 && d.label !== "negative")
      );
      if (filtered.length > 0) {
        console.log(urls, filtered);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
