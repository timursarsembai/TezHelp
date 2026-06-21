import { describe, expect, it } from "vitest";

import { ChatPolicy } from "./chat-policy.js";

describe("ChatPolicy", () => {
  it("allows sending only while a selected order is active", () => {
    expect(() => ChatPolicy.assertUserCanSend("provider_selected")).not.toThrow();
    expect(() => ChatPolicy.assertUserCanSend("in_progress")).not.toThrow();
    expect(() => ChatPolicy.assertUserCanSend("completed")).toThrow();
    expect(() => ChatPolicy.assertUserCanSend("receiving_offers")).toThrow();
  });

  it("validates photo and voice metadata", () => {
    expect(() =>
      ChatPolicy.assertAttachmentMetadata({
        kind: "photo",
        contentType: "image/webp",
        sizeBytes: 1024,
      }),
    ).not.toThrow();
    expect(() =>
      ChatPolicy.assertAttachmentMetadata({
        kind: "voice",
        contentType: "audio/webm",
        sizeBytes: 1024,
        durationSeconds: 120,
      }),
    ).not.toThrow();
    expect(() =>
      ChatPolicy.assertAttachmentMetadata({
        kind: "voice",
        contentType: "audio/webm",
        sizeBytes: 1024,
        durationSeconds: 181,
      }),
    ).toThrow();
  });
});
