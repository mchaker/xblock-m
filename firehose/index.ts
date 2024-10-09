import { CommitCreateEvent, Jetstream } from "@skyware/jetstream";
import WebSocket from "ws";
import debug from "debug";
import Queue from "better-queue";

const BATCH_SIZE = 8;

const events = new Queue(
  (batch: CommitCreateEvent<"app.bsky.feed.post">[], cb: Function) => {
    fetch("http://queue:8000/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    })
      .then((r) => r.json())
      .then((r) => {
        log(r);
        return cb(r);
      })
      .catch(console.error);
  },
  { batchSize: BATCH_SIZE, batchDelay: 5000, batchDelayTimeout: 10000 }
);

const log = debug("xblock:firehose");

const jetstream = new Jetstream({
  ws: WebSocket,
  wantedCollections: ["app.bsky.feed.post"],
});

jetstream.onCreate("app.bsky.feed.post", (event) => {
  if (event.commit.record.embed?.$type === "app.bsky.embed.images") {
    const author = event.did;
    const urls = event.commit.record.embed.images.map(
      (img) =>
        `https://cdn.bsky.app/img/feed_fullsize/plain/${author}/${img.image.ref.$link}@jpeg`
    );
    events.push({ urls, event });
  }
});

jetstream.start();
console.log("Firehose consumer running...");
