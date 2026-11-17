import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const config = readFileSync(new URL("../firebase-config.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("public HTML metadata contains real line breaks, not escaped text", () => {
  assert.equal(html.includes("\\n"), false);
  assert.match(html, /<meta property="og:image"/);
  assert.match(html, /<link rel="canonical"/);
});

test("public website reads published content, not private working content", () => {
  assert.match(app, /ref\(db,\s*"publicContent"\)/);
  assert.doesNotMatch(app, /ref\(db,\s*"siteContent"\)/);
});

test("legacy notifications remain subscribed independently", () => {
  assert.match(app, /ref\(db,\s*"notifications"\)/);
});

test("public Pages URL matches the connected user-site repository", () => {
  assert.match(config, /https:\/\/fmd147726-crypto\.github\.io\/scalegrid-user-\//);
  assert.match(html, /<script type="module" src="app\.js"><\/script>/);
});


test("homepage includes its saved portfolio, approach, about, process and FAQ sections", () => {
  assert.match(app, /sections = sections\.map\(\(\[id,section\]\) => \{/);
  assert.doesNotMatch(app, /sections = sections\.filter\(\(\[,section\]\) => \["hero","serviceGrid","contact"\]/);
  assert.match(app, /renderPortfolio\(section\)/);
  assert.match(app, /renderFaq\(section\)/);
});

test("service pages display FAQs only when the service is explicitly assigned", () => {
  assert.match(app, /isFaqAssignedToService\(item,serviceCategoryId\)/);
  assert.match(app, /isFaqVisibleOnHome\(item\)/);
});
