import { describe, expect, it } from "vitest";

import { scrubMonitoringContext, scrubMonitoringText } from "./monitoring-event-scrubber.js";

describe("monitoring event scrubber", () => {
  it("redacts sensitive keys recursively", () => {
    expect(
      scrubMonitoringContext({
        componentStack: "at Page",
        nested: {
          privateObjectKey: "identity/passport.png",
          phone: "+77001234567",
        },
      }),
    ).toEqual({
      componentStack: "at Page",
      nested: {
        privateObjectKey: "[REDACTED]",
        phone: "[REDACTED]",
      },
    });
  });

  it("redacts risky scalar values", () => {
    expect(
      scrubMonitoringText(
        "failed url=/orders?token=secret&latitude=43.2389 phone +77001234567 iin 123456789012",
      ),
    ).not.toContain("+77001234567");
    expect(scrubMonitoringText("iin 123456789012")).toBe("iin [REDACTED]");
  });
});
