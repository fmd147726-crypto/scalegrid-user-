export function faqServiceCategoryIds(faq) {
  const plural = Array.isArray(faq?.serviceCategoryIds) ? faq.serviceCategoryIds : [];
  const legacy = typeof faq?.serviceCategoryId === "string" ? [faq.serviceCategoryId] : [];
  return [...new Set([...plural, ...legacy].map(value => String(value || "").trim()).filter(Boolean))];
}
export function isFaqVisibleOnHome(faq) { return faq?.showOnHome !== false; }
export function isFaqAssignedToService(faq, serviceCategoryId) {
  const id = String(serviceCategoryId || "").trim();
  return Boolean(id) && faqServiceCategoryIds(faq).includes(id);
}
