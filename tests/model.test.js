import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validateRecords,
  safeUrl,
  publicRecord,
  privateRecord,
  PRIVATE,
} from "../src/model.js";
const seed = JSON.parse(
  readFileSync(new URL("../src/seed.json", import.meta.url)),
);
test("all 16 original records migrate without losing descriptions or links", () => {
  assert.equal(seed.length, 16);
  assert.deepEqual(validateRecords(seed), seed);
  assert.ok(
    seed.some(
      (a) => a.name === "ReMember" && a.url === "https://remember.mmusa.org",
    ),
  );
});
test("public cloud documents never include private metadata", () => {
  const record = {
    ...seed[0],
    repo: "https://github.com/example/repo",
    notes: "Private notes",
    email: "owner@example.com",
  };
  const pub = publicRecord(record);
  for (const k of PRIVATE) assert.equal(k in pub, false);
  assert.equal(privateRecord(record).notes, "Private notes");
});
test("unsafe executable links and SVG data URLs are rejected", () => {
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("data:image/svg+xml;base64,AAAA", true), "");
  assert.throws(() =>
    validateRecords([{ ...seed[0], url: "javascript:alert(1)" }]),
  );
});
test("missing images supported and original image paths accepted", () => {
  assert.equal(validateRecords([{ ...seed[0], image: "" }])[0].image, "");
  assert.equal(safeUrl("/images/remember.jpeg", true), "/images/remember.jpeg");
});
test("invalid backups do not pass validation", () => {
  assert.throws(() => validateRecords([seed[0], seed[0]]));
  assert.throws(() => validateRecords([{ ...seed[0], status: "whatever" }]));
  assert.throws(() => validateRecords([{ ...seed[0], name: "" }]));
  assert.throws(() => validateRecords([{ ...seed[0], notes: {} }]));
});
