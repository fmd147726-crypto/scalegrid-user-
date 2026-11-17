import test from "node:test";
import assert from "node:assert/strict";
import { faqServiceCategoryIds, isFaqVisibleOnHome, isFaqAssignedToService } from "../faq-utils.js";
test("multi-service FAQ assignments support more than one category", () => {
  const faq = { serviceCategoryIds: ["websites", "applications", "websites"] };
  assert.deepEqual(faqServiceCategoryIds(faq), ["websites", "applications"]);
  assert.equal(isFaqAssignedToService(faq, "websites"), true);
  assert.equal(isFaqAssignedToService(faq, "automation"), false);
});
test("legacy single service assignment remains supported", () => {
  assert.deepEqual(faqServiceCategoryIds({ serviceCategoryId: "automation" }), ["automation"]);
});
test("homepage visibility defaults on and can be disabled", () => {
  assert.equal(isFaqVisibleOnHome({}), true);
  assert.equal(isFaqVisibleOnHome({ showOnHome: false }), false);
});
