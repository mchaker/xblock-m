/**
 * @file
 * This is where the labeling work happens when an image is above the inference threshold
 */

// import { Bot, PostReference } from "@skyware/bot";
import { Bot, PostReference } from "@skyware/bot";
import { CommitCreateEvent } from "@skyware/jetstream";
import { THRESHOLD } from "./constants";

const { BSKY_USERNAME, BSKY_PASSWORD } = process.env;
const bot = new Bot();

const loggedIn = bot.login({
  identifier: BSKY_USERNAME!,
  password: BSKY_PASSWORD!,
});

export const createLabel = async (
  post: CommitCreateEvent<"app.bsky.feed.post">,
  images: [
    string | undefined,
    (
      | {
          score: number;
          label: string;
        }[]
      | undefined
    )
  ][]
) => {
  if (!images.length) {
    return false;
  }

  const labels = images
    .flatMap(([, scores]) =>
      scores?.filter((s) => s.score >= THRESHOLD).map((s) => `${s.label}-label`)
    )
    .filter((i) => i);

  const comment = images.map(
    ([uri, scores]) =>
      `${uri?.split("/").pop()?.split("@").shift()}: ${Object.values(
        scores?.sort((a, b) => b.score - a.score).shift()!
      ).join("-")}`
  );

  console.log(
    `at://${post.did}/${post.commit.collection}/${post.commit.cid}`,
    labels,
    comment
  );

  // await loggedIn;

  // const reference = new PostReference(
  //   {
  //     uri: `at://${post.did}/${post.commit.collection}/${post.commit.cid}`,
  //     cid: post.commit.cid,
  //   },
  //   bot
  // );

  // return bot.label({
  //   reference,
  //   labels,
  //   comment,
  // });
};
