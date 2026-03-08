import fs from "node:fs";
import path from "node:path";
import { vi } from "vitest"; // globals configured, others are available automatically

import { generateJSON, TMP_DIR } from "../generate";
import { getDirectories } from "../utils";

// ensure tmp dir is clean before each test (shouldn't actually be written)
beforeEach(() => {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
});

// helper to intercept written JSON without touching disk
function captureWrite() {
  const calls: Array<{ path: string; data: string }> = [];
  const spy = vi
    .spyOn(fs, "writeFileSync")
    .mockImplementation((p: any, data: any) => {
      // ignore descriptor paths; convert to string when possible
      calls.push({ path: String(p), data: String(data) });
    });
  return { spy, calls, restore: () => spy.mockRestore() };
}

describe("json generator", () => {
  it("produces valid JSON for a single human", async () => {
    const { spy, calls, restore } = captureWrite();
    await generateJSON("craig");
    restore();

    expect(calls.length).toBe(1);
    const written = JSON.parse(calls[0].data);
    expect(written.name).toBe("craig");
    expect(Array.isArray(written.entries)).toBe(true);
    expect(written.entries.length).toBeGreaterThan(0);
    expect(written.entries.some((e: any) => e.section === "career")).toBe(true);
  });

  it("throws when asked to generate a nonexistent human", async () => {
    await expect(generateJSON("no-such-person")).rejects.toThrow();
  });

  it("can generate valid JSON for every human", async () => {
    const humansDir = path.resolve(process.cwd(), "src/humans");
    const humans = getDirectories(humansDir);
    expect(humans.length).toBeGreaterThan(0);

    const { spy, calls, restore } = captureWrite();
    for (const h of humans) {
      await generateJSON(h);
    }
    restore();

    // expect one write per human
    expect(calls.length).toBe(humans.length);
    for (let i = 0; i < humans.length; i++) {
      const parsed = JSON.parse(calls[i].data);
      expect(parsed.name).toBe(humans[i]);
    }
  });
});
