import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rules = JSON.parse(readFileSync(new URL("../database.rules.json", import.meta.url), "utf8")).rules;

test("database root is closed by default", () => {
  assert.equal(rules[".read"], false);
  assert.equal(rules[".write"], false);
});

test("admin access is UID-based and supports multiple Super Admins", () => {
  assert.equal(rules.adminUids[".read"], false);
  assert.match(rules.adminUids.$uid[".write"], /role/);
  assert.match(rules.admins.$uid[".write"], /role/);
  assert.doesNotMatch(rules.adminUids.$uid[".write"], /fmd147726|fmd541616/);
});

test("published website content is public but publishing is restricted", () => {
  assert.equal(rules.publicContent[".read"], true);
  assert.match(rules.publicContent[".write"], /adminUids/);
  assert.match(rules.publicContent[".write"], /publishing/);
});

test("private working content has no broad parent access", () => {
  assert.equal(rules.siteContent[".read"], undefined);
  assert.equal(rules.siteContent[".write"], undefined);
  assert.match(rules.siteContent.services[".read"], /adminUids/);
  assert.match(rules.siteContent.services[".write"], /permissions/);
});

test("legacy public paths remain read-only", () => {
  assert.equal(rules.pages[".read"], true);
  assert.equal(rules.pages[".write"], false);
  assert.equal(rules.categories[".read"], true);
  assert.equal(rules.categories[".write"], false);
});
