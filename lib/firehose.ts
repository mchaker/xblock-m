/**
 * @file
 * Jetstream firehose consumer
 */

import { Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";
import debug from "debug";
import { Queue } from "bullmq";

export const queue = new Queue("xblock", {
  connection: {
    host: process.env.REDIS_HOSTNAME ?? "redis",
  },
});

const log = debug("xblock:firehose");

const jetstream = new Jetstream({
  ws: WebSocket,
  wantedCollections: ["app.bsky.feed.post"],
});

const batch: any = [];

jetstream.onCreate("app.bsky.feed.post", (event) => {
  if (
    event.commit.record.embed?.$type === "app.bsky.embed.images" &&
    event.commit.record.langs?.includes("en")
  ) {
    batch.push(event);
    if (batch.length >= 30) {
      console.log(batch);
      queue
        .add(new Date().toISOString(), batch, { lifo: true })
        .then(() => {
          batch.length = 0;
        })
        .catch((e) => log(e));
    }
  }
});

jetstream.start();

console.log("Firehose consumer running...");
