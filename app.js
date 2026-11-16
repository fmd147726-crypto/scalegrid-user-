import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";
import { firebaseConfig, appCheckSiteKey } from "./firebase-config.js";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
if (appCheckSiteKey) initializeAppCheck(app,{provider:new ReCaptchaV3Provider(appCheckSiteKey),isTokenAutoRefreshEnabled:true});
const db = getDatabase(app);
const $ = (id) => document.getElementById(id);
let siteContent = {};
let notifications = {};
let connected = false;
let toastTimer;
let announcementTimer = null;

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const entries = (value) => value && typeof value === "object" ? Object.entries(value).sort((a,b) => (Number(a[1]?.order) || 0) - (Number(b[1]?.order) || 0)) : [];
const text = (value, fallback = "") => String(value ?? fallback).trim();
function safeHref(value, fallback = "#") {
  const raw = text(value, fallback);
  if (raw.startsWith("#")) return raw;
  try {
    const url = new URL(raw, location.href);
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol) ? url.href : fallback;
  } catch { return fallback; }
}
function safeImage(value) {
  const raw = text(value);
  if (!raw) return "";
  try { const url = new URL(raw, location.href); return url.protocol === "https:" ? url.href : ""; }
  catch { return ""; }
}
function showToast(message) {
  const el = $("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
function iconMarkup(value) {
  const icon = text(value, "✳");
  return `<span aria-hidden="true">${esc(icon.slice(0, 8))}</span>`;
}
function orderedEnabled(collection) {
  return entries(collection).filter(([, item]) => item && item.enabled !== false);
}
function highlightHeadline(value) {
  const parts = text(value).split("|");
  if (parts.length < 2) return esc(parts[0]);
  return `${esc(parts.slice(0, -1).join("|").trim())} <em>${esc(parts.slice(-1)[0].trim())}</em>`;
}

function serviceCategoryHref(id, category = {}) {
  const slug = text(category.slug) || id;
  return `#service/${encodeURIComponent(slug)}`;
}
function renderNav() {
  const nav = $("site-nav");
  const footerNav = $("footer-nav");
  const categories = orderedEnabled(siteContent.serviceCategories);
  const otherPages = orderedEnabled(siteContent.pages).filter(([id,page]) => id !== "home" && id !== "about" && page?.enabled !== false);
  const serviceMenu = categories.length
    ? `<details class="nav-dropdown"><summary>Services <span aria-hidden="true">⌄</span></summary><div class="nav-dropdown-menu">${categories.map(([id,item]) => `<a href="${esc(serviceCategoryHref(id,item))}">${esc(item.name || id)}</a>`).join("")}</div></details>`
    : `<a href="#services">Services</a>`;
  const pagesMenu = otherPages.length
    ? `<details class="nav-dropdown"><summary>Pages <span aria-hidden="true">⌄</span></summary><div class="nav-dropdown-menu">${otherPages.map(([id,page]) => `<a href="#page/${encodeURIComponent(page.slug || id)}">${esc(page.title || id)}</a>`).join("")}</div></details>`
    : "";
  if (nav) nav.innerHTML = `<a href="#home">Home</a>${serviceMenu}<a href="#page/about">About</a>${pagesMenu}<a href="#contact">Contact</a>`;
  if (footerNav) footerNav.innerHTML = [
    `<a href="#home">Home</a>`,
    ...categories.slice(0,5).map(([id,item])=>`<a href="${esc(serviceCategoryHref(id,item))}">${esc(item.name || id)}</a>`),
    `<a href="#page/about">About</a>`,
    `<a href="#contact">Contact</a>`
  ].join("");
}

function renderSocials() {
  const target = $("footer-socials");
  if (!target) return;
  const rows = orderedEnabled(siteContent.socialLinks);
  target.innerHTML = rows.length ? rows.map(([,item]) => `<a href="${esc(safeHref(item.url))}" target="_blank" rel="noopener noreferrer">${esc(item.label || "Social link")} ↗</a>`).join("") : `<span class="contact-detail">Social links will appear here when added.</span>`;
}
function renderHeaderAndFooter() {
  const settings = siteContent.settings || {};
  const brand = text(settings.brandName, "ScaleGrid");
  $("brand-name").textContent = brand;
  $("footer-brand-name").textContent = brand;
  $("footer-tagline").textContent = text(settings.tagline, "Digital solutions that move your business forward.");
  $("copyright").innerHTML = `© <span id="year">${new Date().getFullYear()}</span> ${esc(settings.footerText || `${brand}. All rights reserved.`)}`;
  const wa = normalizeWhatsApp(settings.whatsappNumber || "8801575808490");
  const showWhatsApp = settings.showWhatsApp !== false && Boolean(wa);
  const waHref = `https://wa.me/${wa}`;
  const floating = $("floating-whatsapp");
  floating.hidden = !showWhatsApp;
  if (showWhatsApp) floating.href = waHref;
  const headerCta = $("header-cta");
  if (showWhatsApp) {
    headerCta.href = waHref;
    headerCta.target = "_blank";
    headerCta.rel = "noopener noreferrer";
    headerCta.innerHTML = `Let's talk <span>↗</span>`;
  } else {
    headerCta.href = "#contact";
    headerCta.removeAttribute("target");
  }
  renderNav();
  renderSocials();
}
function normalizeWhatsApp(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  // The stored value should be international format, without a leading plus.
  if (digits.startsWith("00")) return digits.slice(2);
  return digits;
}
function sectionHeading(section) {
  const kicker = section.kicker ? `<span class="section-kicker">${esc(section.kicker)}</span>` : "";
  const title = section.title ? `<h2>${esc(section.title)}</h2>` : "";
  const intro = section.subtitle || section.description ? `<p class="section-intro">${esc(section.subtitle || section.description)}</p>` : "";
  return `<div class="section-head"><div>${kicker}${title}</div>${intro}</div>`;
}
function emptyMessage(message = "Content will appear here once it has been added in the Admin Panel.") {
  return `<div class="empty-inline">${esc(message)}</div>`;
}
function renderHero(section) {
  const settings = siteContent.settings || {};
  const whatsapp = normalizeWhatsApp(settings.whatsappNumber || "8801575808490");
  const primaryHref = safeHref(section.primaryHref || (whatsapp ? `https://wa.me/${whatsapp}` : "#contact"));
  const isExternal = /^https?:/.test(primaryHref);
  const secondaryHref = safeHref(section.secondaryHref || "#services");
  return `<section class="hero wrap" id="${esc(section.anchor || "home")}">
    <div class="hero-content">
      ${section.eyebrow ? `<span class="eyebrow">${esc(section.eyebrow)}</span>` : ""}
      <h1>${highlightHeadline(section.title || "")}</h1>
      <p class="hero-copy">${esc(section.subtitle || "")}</p>
      <div class="hero-actions">${section.primaryLabel ? `<a class="button-primary" href="${esc(primaryHref)}" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ""}>${esc(section.primaryLabel)} <span>↗</span></a>` : ""}${section.secondaryLabel ? `<a class="button-secondary" href="${esc(secondaryHref)}">${esc(section.secondaryLabel)} <span>↗</span></a>` : ""}</div>
      ${section.footnote ? `<div class="hero-footnote">${esc(section.footnote)}</div>` : ""}
    </div>
    <div class="hero-art" aria-hidden="true"><div class="orbit"><div class="orbit-core"><span class="brand-mark"><span></span><span></span><span></span></span></div>${section.visualLabel1 ? `<div class="orbit-chip chip-one"><strong>${esc(section.visualLabel1)}</strong>${esc(section.visualText1 || "")}</div>` : ""}${section.visualLabel2 ? `<div class="orbit-chip chip-two"><strong>${esc(section.visualLabel2)}</strong>${esc(section.visualText2 || "")}</div>` : ""}${section.visualLabel3 ? `<div class="orbit-chip chip-three"><strong>${esc(section.visualLabel3)}</strong>${esc(section.visualText3 || "")}</div>` : ""}<i class="spark spark-a"></i><i class="spark spark-b"></i><i class="spark spark-c"></i></div></div>
  </section>`;
}

function renderServiceGrid(section, selectedCategoryId = "") {
  const categoryRows = orderedEnabled(siteContent.serviceCategories);
  const categories = siteContent.serviceCategories || {};
  const services = orderedEnabled(siteContent.services).filter(([,item]) =>
    (!selectedCategoryId || item.categoryId === selectedCategoryId) &&
    (!item.categoryId || categories[item.categoryId]?.enabled !== false)
  );
  const filters = !selectedCategoryId && categoryRows.length
    ? `<div class="service-filters" aria-label="Filter services"><button class="service-filter active" type="button" data-service-filter="all">All services</button>${categoryRows.map(([key,item]) => `<button class="service-filter" type="button" data-service-filter="${esc(key)}">${esc(item.name || key)}</button>`).join("")}</div>`
    : "";
  const cards = services.map(([key,item], index) => {
    const category = categories[item.categoryId]?.name || item.category || "Digital solution";
    const features = Array.isArray(item.features) ? item.features : String(item.features || "").split("\n").filter(Boolean);
    const libraryImage = siteContent.media?.[item.imageMediaId];
    const image = safeImage(item.imageUrl || libraryImage?.url);
    const imageAlt = text(item.imageAlt || libraryImage?.alt || item.title || "Service image");
    const visual = image ? `<img class="service-image" loading="lazy" src="${esc(image)}" alt="${esc(imageAlt)}">` : `<div class="card-icon">${iconMarkup(item.icon)}</div>`;
    const categoryHref = item.categoryId && categories[item.categoryId] ? serviceCategoryHref(item.categoryId,categories[item.categoryId]) : "#contact";
    const configuredHref = text(item.ctaUrl);
    const destination = configuredHref && configuredHref !== "#contact" ? safeHref(configuredHref) : categoryHref;
    const actionLabel = configuredHref && configuredHref !== "#contact" ? text(item.ctaLabel,"Learn more") : (selectedCategoryId ? text(item.ctaLabel,"Discuss this service") : "Explore service");
    return `<article class="service-card" data-service-card data-category-id="${esc(item.categoryId || "")}"><div class="card-index">${String(index + 1).padStart(2,"0")} / ${esc(category)}</div>${visual}<h3>${esc(item.title || "Service")}</h3><p>${esc(item.summary || item.description || "")}</p>${item.description && item.summary ? `<p class="service-details">${esc(item.description)}</p>` : ""}${item.priceLabel ? `<div class="service-price">${esc(item.priceLabel)}</div>` : ""}${features.length ? `<div class="tags">${features.slice(0,3).map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div>` : ""}<a class="text-link" href="${esc(destination)}">${esc(actionLabel)} <span>↗</span></a></article>`;
  }).join("");
  const title = section.title || (selectedCategoryId ? "Services in this category" : "Explore our services");
  return `<section class="section" id="${esc(section.anchor || (selectedCategoryId ? "category-services" : "services"))}"><div class="wrap">${sectionHeading({...section,title})}${filters}<div class="service-grid">${cards || emptyMessage("Services for this category will appear here when they are added in the Admin Panel.")}</div></div></section>`;
}


function renderPortfolio(section, serviceCategoryId = "") {
  const categories = siteContent.portfolioCategories || {};
  const serviceCategories = siteContent.serviceCategories || {};
  const categoryRows = orderedEnabled(categories);
  const allProjects = orderedEnabled(siteContent.portfolio).filter(([,item]) => !item.categoryId || categories[item.categoryId]);
  const projects = serviceCategoryId
    ? allProjects.filter(([,item]) => (item.serviceCategoryId || (serviceCategories[item.categoryId] ? item.categoryId : "")) === serviceCategoryId)
    : allProjects;
  const filters = !serviceCategoryId && categoryRows.length ? `<div class="service-filters" aria-label="Filter portfolio"><button class="service-filter active" type="button" data-portfolio-filter="all">All projects</button>${categoryRows.map(([key,item]) => `<button class="service-filter" type="button" data-portfolio-filter="${esc(key)}">${esc(item.name || key)}</button>`).join("")}</div>` : "";
  const cards = projects.map(([,item]) => {
    const libraryImage = siteContent.media?.[item.imageMediaId];
    const image = safeImage(item.imageUrl || libraryImage?.url || item.image);
    const category = categories[item.categoryId]?.name || item.category || "Project";
    const projectType = item.projectType === "client" ? "Client project" : item.projectType === "personal" ? "Independent project" : "Concept project";
    const tags = Array.isArray(item.tags) ? item.tags : String(item.tags || "").split(",").map(x => x.trim()).filter(Boolean);
    return `<article class="portfolio-card" data-portfolio-card data-category-id="${esc(item.categoryId || "")}"><div class="portfolio-visual">${image ? `<img loading="lazy" src="${esc(image)}" alt="${esc(item.imageAlt || libraryImage?.alt || item.title || "Project preview")}">` : `<span class="portfolio-symbol">${esc((item.title || "SG").split(/\s+/).slice(0,2).map(w => w[0]).join("").toUpperCase())}</span>`}</div><div class="portfolio-content"><div class="project-meta">${esc(projectType)} · ${esc(category)}</div><h3>${esc(item.title || "Project")}</h3><p>${esc(item.summary || item.description || "")}</p>${item.description && item.summary ? `<p class="project-details">${esc(item.description)}</p>` : ""}${tags.length ? `<div class="tags">${tags.slice(0,5).map(tag => `<span class="tag">${esc(tag)}</span>`).join("")}</div>` : ""}${item.projectUrl ? `<a class="text-link" href="${esc(safeHref(item.projectUrl))}" target="_blank" rel="noopener noreferrer">View project <span>↗</span></a>` : ""}</div></article>`;
  }).join("");
  return `<section class="section" id="${esc(section.anchor || "work")}"><div class="wrap">${sectionHeading(section)}${filters}<div class="portfolio-grid">${cards || emptyMessage(serviceCategoryId ? "Relevant project examples will appear here as they are assigned to this service page." : "Portfolio examples will appear here. Add your own projects or clearly labelled concepts in the Admin Panel.")}</div></div></section>`;
}

function renderRichText(section) {
  return `<section class="section" id="${esc(section.anchor || "about")}"><div class="wrap rich-layout"><div><span class="section-kicker">${esc(section.kicker || "ABOUT SCALEGRID")}</span><h2>${esc(section.title || "")}</h2></div><div><p class="rich-lead">${esc(section.lead || "")}</p><p class="rich-body">${esc(section.body || "")}</p></div></div></section>`;
}
function renderFeatures(section) {
  const items = orderedEnabled(siteContent.features).map(([,item]) => item);
  const cards = items.map((item,index) => `<article class="feature-card"><div class="card-index">${String(index+1).padStart(2,"0")}</div><div class="card-icon">${iconMarkup(item.icon)}</div><h3>${esc(item.title || "")}</h3><p>${esc(item.description || "")}</p></article>`).join("");
  return `<section class="section" id="${esc(section.anchor || "why-scalegrid")}"><div class="wrap">${sectionHeading(section)}<div class="feature-grid">${cards || emptyMessage("Add your reasons and value points in the Why choose us area of the Admin Panel.")}</div></div></section>`;
}
function renderProcess(section) {
  const items = orderedEnabled(siteContent.process);
  const cards = items.map(([key,item],index) => `<article class="process-item">${item.icon ? `<span class="process-icon">${iconMarkup(item.icon)}</span>` : ""}<span class="process-number">STEP ${String(index+1).padStart(2,"0")}</span><h3>${esc(item.title || "")}</h3><p>${esc(item.description || "")}</p></article>`).join("");
  return `<section class="section" id="${esc(section.anchor || "process")}"><div class="wrap">${sectionHeading(section)}<div class="process-list">${cards || emptyMessage("Add your project steps in the Admin Panel.")}</div></div></section>`;
}

function renderFaq(section, serviceCategoryId = "") {
  const faqs = orderedEnabled(siteContent.faqs).filter(([,item]) => !serviceCategoryId || !item.serviceCategoryId || item.serviceCategoryId === serviceCategoryId);
  const categories = siteContent.faqCategories || {};
  const grouped = new Map();
  faqs.forEach(([,item]) => {
    const categoryId = item.categoryId || "";
    const group = categories[categoryId]?.name || item.category || "General";
    if (!grouped.has(categoryId || "general")) grouped.set(categoryId || "general", {label:group,items:[]});
    grouped.get(categoryId || "general").items.push(item);
  });
  const usedGroups = [...grouped.entries()];
  const filters = usedGroups.length > 1 ? `<div class="service-filters faq-filters" aria-label="Filter frequently asked questions"><button class="service-filter active" type="button" data-faq-filter="all">All questions</button>${usedGroups.map(([key,group])=>`<button class="service-filter" type="button" data-faq-filter="${esc(key)}">${esc(group.label)}</button>`).join("")}</div>` : "";
  const body = usedGroups.map(([key,group]) => `<div class="faq-category-group" data-faq-group="${esc(key)}">${usedGroups.length > 1 ? `<h3 class="faq-group-title">${esc(group.label)}</h3>` : ""}${group.items.map(item => `<details class="faq-item"><summary>${esc(item.question || "")}</summary><div class="faq-answer">${esc(item.answer || "")}</div></details>`).join("")}</div>`).join("");
  return `<section class="section" id="${esc(section.anchor || "faq")}"><div class="wrap">${sectionHeading(section)}${filters}<div class="faq-list">${body || emptyMessage("Service questions and answers will appear here when they are added in the Admin Panel.")}</div></div></section>`;
}

function renderContact(section) {
  const settings = siteContent.settings || {};
  const wa = normalizeWhatsApp(settings.whatsappNumber || "8801575808490");
  const href = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text(settings.whatsappMessage, "Hello ScaleGrid, I'd like to discuss a project."))}` : "#";
  const email = text(settings.contactEmail);
  return `<section class="section" id="${esc(section.anchor || "contact")}"><div class="wrap"><div class="contact-panel"><div><span class="section-kicker">${esc(section.kicker || "START A CONVERSATION")}</span><h2>${esc(section.title || "Ready to move forward?")}</h2><p>${esc(section.subtitle || section.description || "Tell us what you are building. We'll help you explore a practical next step.")}</p></div><div class="contact-action">${wa ? `<a class="button-primary" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(section.buttonLabel || "Chat on WhatsApp")} <span>↗</span></a>` : `<span class="contact-detail">WhatsApp contact has not been configured yet.</span>`}${email ? `<a class="contact-detail" href="mailto:${esc(email)}">${esc(email)}</a>` : ""}${settings.contactInfo ? `<span class="contact-detail">${esc(settings.contactInfo)}</span>` : ""}${section.note ? `<span class="contact-detail">${esc(section.note)}</span>` : ""}</div></div></div></section>`;
}
function renderGeneric(section, key) {
  const items = Array.isArray(section.items) ? section.items : [];
  const cards = items.filter(item => item && item.enabled !== false).map(item => `<article class="feature-card"><div class="card-icon">${iconMarkup(item.icon)}</div><h3>${esc(item.title || "")}</h3><p>${esc(item.description || "")}</p></article>`).join("");
  if (section.type === "announcement") return `<section class="section" id="${esc(section.anchor || key)}"><div class="wrap">${sectionHeading(section)}<div class="rich-body">${esc(section.body || "")}</div></div></section>`;
  return `<section class="section" id="${esc(section.anchor || key)}"><div class="wrap">${sectionHeading(section)}<div class="feature-grid">${cards || emptyMessage()}</div></div></section>`;
}

function updatePageMetadata(title, description, image) {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta && description) meta.content = description;
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogTitle) ogTitle.content = title;
  if (ogDescription && description) ogDescription.content = description;
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && image) ogImage.content = safeImage(image);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = location.href;
}
function renderSectionList(slug, sections) {
  return sections.map(([key,section]) => {
    switch (section.type) {
      case "hero": return renderHero({...section,anchor:section.anchor || (slug === "home" ? "home" : `page-${slug}`)});
      case "serviceGrid": return renderServiceGrid(section);
      case "portfolioGrid": return renderPortfolio(section);
      case "richText": return renderRichText(section);
      case "featureGrid": return renderFeatures(section);
      case "processList": return renderProcess(section);
      case "faqList": return renderFaq(section);
      case "contact": return renderContact(section);
      default: return renderGeneric(section,key);
    }
  }).join("");
}
function renderAboutPage() {
  const main = $("site-main");
  const savedAbout = siteContent.pages?.about;
  if (savedAbout && savedAbout.enabled !== false) {
    const sections = orderedEnabled(savedAbout.sections);
    main.innerHTML = `<div class="custom-page-content">${renderSectionList("about",sections)}</div>`;
    updatePageMetadata(text(savedAbout.seoTitle) || `About — ${text(siteContent.settings?.brandName,"ScaleGrid")}`,text(savedAbout.metaDescription || savedAbout.description || siteContent.settings?.seoDescription),savedAbout.ogImage);
    return;
  }
  const homeSections = orderedEnabled(siteContent.pages?.home?.sections);
  const aboutSections = homeSections.filter(([,section]) => ["richText","featureGrid","processList"].includes(section.type));
  main.innerHTML = `<div class="custom-page-content">${aboutSections.length ? renderSectionList("about",aboutSections) : `<section class="page-empty wrap"><span class="section-kicker">ABOUT SCALEGRID</span><h1>Digital solutions built around your goals.</h1><p>Get in touch to discuss what your business needs next.</p></section>`}${renderContact({anchor:"contact",title:"Let's talk about your next step.",subtitle:"Tell us what you are looking to build or improve."})}</div>`;
  updatePageMetadata(`About — ${text(siteContent.settings?.brandName,"ScaleGrid")}`,text(siteContent.settings?.siteDescription || siteContent.settings?.seoDescription));
}
function resolveServiceCategory(value) {
  return Object.entries(siteContent.serviceCategories || {}).find(([id,item]) => id === value || text(item?.slug) === value) || null;
}
function currentServiceCategory() {
  const hash = location.hash || "";
  if (!hash.startsWith("#service/")) return null;
  const requested = decodeURIComponent(hash.slice(9)).split("/")[0];
  return resolveServiceCategory(requested);
}
function renderServiceCategoryPage(categoryId, category) {
  const main = $("site-main");
  const name = text(category.name,"Services");
  const description = text(category.description,"Explore how ScaleGrid can help in this area.");
  const icon = iconMarkup(category.icon || "✳");
  const hero = `<section class="service-page-hero"><div class="wrap"><a class="back-link" href="#home">← Back to home</a><div class="service-page-mark">${icon}</div><span class="section-kicker">SCALEGRID SERVICES</span><h1>${esc(name)}</h1><p>${esc(description)}</p><div class="hero-actions"><a class="button-primary" href="#contact">Discuss this service <span>↗</span></a><a class="button-secondary" href="#category-work">Explore relevant work</a></div></div></section>`;
  const homeSections = orderedEnabled(siteContent.pages?.home?.sections);
  const processSection = homeSections.find(([,section]) => section.type === "processList")?.[1];
  const featureSection = homeSections.find(([,section]) => section.type === "featureGrid")?.[1];
  const html = [
    hero,
    renderServiceGrid({kicker:"WHAT WE OFFER",title:`Our ${name} services`,subtitle:"Explore the ways we can help you plan, build and improve.",anchor:"category-services"},categoryId),
    featureSection ? renderFeatures({...featureSection,anchor:"category-approach"}) : "",
    processSection ? renderProcess({...processSection,anchor:"category-process"}) : "",
    renderPortfolio({kicker:"RELEVANT WORK",title:`Our work in ${name}`,subtitle:"Examples and concepts related to this service.",anchor:"category-work"},categoryId),
    renderFaq({kicker:"QUESTIONS, ANSWERED",title:`About ${name}`,subtitle:"Answers to help you understand the service and the next step.",anchor:"category-faq"},categoryId),
    renderContact({anchor:"contact",kicker:"READY TO GET STARTED?",title:`Let's discuss your ${name.toLowerCase()} project.`,subtitle:"Tell us what you are trying to achieve and we will help shape the right next step."})
  ].join("");
  main.innerHTML = html;
  updatePageMetadata(`${name} — ${text(siteContent.settings?.brandName,"ScaleGrid")}`,description,category.imageUrl || siteContent.settings?.ogImage);
}
function renderPage(slug) {
  const pages = siteContent.pages || {};
  const page = pages[slug];
  const main = $("site-main");
  if (slug === "about") { renderAboutPage(); return; }
  if (!page || page.enabled === false) {
    if (slug === "home" && !page) {
      main.innerHTML = `<section class="page-empty wrap"><span class="section-kicker">SCALEGRID</span><h1>This website is being prepared.</h1><p>Website content will appear here after the ScaleGrid owner publishes it from the Admin Panel.</p></section>`;
      updatePageMetadata(`${text(siteContent.settings?.brandName,"ScaleGrid")} — Digital Solutions`,text(siteContent.settings?.siteDescription));
      return;
    }
    main.innerHTML = `<section class="page-empty wrap"><span class="section-kicker">PAGE NOT AVAILABLE</span><h1>This page isn't available.</h1><p>It may have been unpublished or the address may have changed.</p><a class="button-secondary" href="#home">Back to home</a></section>`;
    updatePageMetadata(`${text(siteContent.settings?.brandName,"ScaleGrid")} — Page not found`,text(siteContent.settings?.seoDescription));
    return;
  }
  let sections = orderedEnabled(page.sections);
  if (slug === "home") {
    // Keep the homepage focused: introduction, service discovery and a direct contact path.
    sections = sections.filter(([,section]) => ["hero","serviceGrid","contact"].includes(section.type));
  }
  if (!sections.length) {
    main.innerHTML = `<section class="page-empty wrap"><span class="section-kicker">${esc(page.title || "PAGE")}</span><h1>Content is being prepared.</h1><p>This page has no published sections yet. You can add them in the Admin Panel.</p></section>`;
  } else {
    const rendered = renderSectionList(slug,sections);
    main.innerHTML = slug === "home" ? rendered : `<div class="custom-page-content">${rendered}</div>`;
  }
  updatePageMetadata(text(page.seoTitle) || (slug === "home" && text(siteContent.settings?.siteTitle) ? text(siteContent.settings.siteTitle) : `${text(page.title,slug)} — ${text(siteContent.settings?.brandName,"ScaleGrid")}`),text(page.metaDescription || siteContent.settings?.seoDescription || siteContent.settings?.siteDescription),page.ogImage || siteContent.settings?.ogImage);
}
function currentPageSlug() {
  const hash = location.hash || "#home";
  if (hash.startsWith("#page/")) {
    const requested = decodeURIComponent(hash.slice(6)).split("/")[0];
    const match = Object.entries(siteContent.pages || {}).find(([id,page]) => id === requested || page?.slug === requested);
    return match ? match[0] : requested;
  }
  return "home";
}
function render() {
  if (!connected) return;
  renderHeaderAndFooter();
  const categoryRoute = currentServiceCategory();
  if (categoryRoute) renderServiceCategoryPage(categoryRoute[0],categoryRoute[1]);
  else renderPage(currentPageSlug());
  const menu = $("site-nav");
  if (menu) menu.classList.remove("open");
  document.body.classList.remove("menu-open");
  $("menu-toggle")?.setAttribute("aria-expanded", "false");
  const hash = location.hash;
  if (hash && !hash.startsWith("#page/") && !hash.startsWith("#service/") && hash !== "#home") {
    const anchor = decodeURIComponent(hash.slice(1));
    requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  } else window.scrollTo({top:0,behavior:"auto"});
  renderNotification();
}


function currentAnnouncementCategoryId() {
  return currentServiceCategory()?.[0] || "";
}
function scheduleAnnouncementRefresh(items) {
  if (announcementTimer) clearTimeout(announcementTimer);
  const now = Date.now();
  const future = items.flatMap(([,item]) => [Number(item.startsAt)||0,Number(item.endsAt)||0]).filter(time=>time>now);
  if (!future.length) return;
  const next = Math.min(...future);
  announcementTimer = setTimeout(() => renderNotification(),Math.max(1000,Math.min(next-now+250,2147483000)));
}
function renderNotification() {
  const overlay = $("announcement");
  if (!overlay) return;
  const now = Date.now();
  const categoryId = currentAnnouncementCategoryId();
  const all = Object.entries(notifications || {}).filter(([,item]) => item && item.enabled !== false && text(item.title) && text(item.message));
  scheduleAnnouncementRefresh(all);
  const active = all.filter(([,item]) => {
    const startsAt = Number(item.startsAt)||0;
    const endsAt = Number(item.endsAt)||0;
    const inTimeWindow = (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
    const targetsCategory = item.serviceCategoryId ? item.serviceCategoryId === categoryId : !categoryId || !item.serviceCategoryId;
    return inTimeWindow && targetsCategory;
  }).sort((a,b) => {
    const aSpecific = a[1].serviceCategoryId ? 1 : 0;
    const bSpecific = b[1].serviceCategoryId ? 1 : 0;
    return bSpecific-aSpecific || (Number(b[1].createdAt)||0)-(Number(a[1].createdAt)||0);
  });
  const [id,item] = active.find(([noticeId]) => sessionStorage.getItem(`scalegridNoticeDismissed:${noticeId}`) !== "1") || [];
  if (!id) {
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden","true");
    document.body.classList.remove("announcement-open");
    return;
  }
  $("announcement-title").textContent = text(item.title);
  $("announcement-message").textContent = text(item.message);
  const destination = safeHref(item.destinationUrl || "");
  const linkNode = $("announcement-link");
  if (linkNode) {
    linkNode.href = destination;
    linkNode.hidden = !item.destinationUrl || destination === "#";
  }
  const imageUrl = safeImage(item.bannerUrl || item.imageUrl);
  const imageNode = $("announcement-image");
  if (imageNode) {
    imageNode.src = imageUrl || "";
    imageNode.hidden = !imageUrl;
  }
  overlay.dataset.notificationId = id;
  overlay.hidden = false;
  overlay.setAttribute("aria-hidden","false");
  document.body.classList.add("announcement-open");
  requestAnimationFrame(() => overlay.querySelector(".announcement-dialog")?.focus());
}

$("site-main")?.addEventListener("click", (event) => {
  const serviceFilter = event.target.closest("[data-service-filter]");
  const portfolioFilter = event.target.closest("[data-portfolio-filter]");
  const faqFilter = event.target.closest("[data-faq-filter]");
  const filter = serviceFilter || portfolioFilter || faqFilter;
  if (!filter) return;
  const attribute = serviceFilter ? "serviceFilter" : portfolioFilter ? "portfolioFilter" : "faqFilter";
  const selected = filter.dataset[attribute];
  const selector = serviceFilter ? "[data-service-filter]" : portfolioFilter ? "[data-portfolio-filter]" : "[data-faq-filter]";
  filter.parentElement.querySelectorAll(selector).forEach(button => button.classList.toggle("active", button === filter));
  if (faqFilter) {
    const groups = filter.closest("section")?.querySelectorAll("[data-faq-group]") || [];
    groups.forEach(group => { group.hidden = selected !== "all" && group.dataset.faqGroup !== selected; });
    return;
  }
  const cardSelector = serviceFilter ? "[data-service-card]" : "[data-portfolio-card]";
  const cards = filter.closest("section")?.querySelectorAll(cardSelector) || [];
  let visible = 0;
  cards.forEach(card => {
    const match = selected === "all" || card.dataset.categoryId === selected;
    card.hidden = !match;
    if (match) visible++;
  });
  const gridSelector = serviceFilter ? ".service-grid" : ".portfolio-grid";
  const grid = filter.closest("section")?.querySelector(gridSelector);
  let empty = grid?.querySelector(".filter-empty");
  if (grid && visible === 0) {
    if (!empty) { empty = document.createElement("div"); empty.className = "empty-inline filter-empty"; empty.textContent = serviceFilter ? "No services are currently listed in this category." : "No projects are currently listed in this category."; grid.append(empty); }
  } else empty?.remove();
});

$("menu-toggle")?.addEventListener("click", () => {
  const nav = $("site-nav");
  const open = !nav.classList.contains("open");
  nav.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  $("menu-toggle").setAttribute("aria-expanded", String(open));
});
$("site-nav")?.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    $("site-nav").classList.remove("open");
    document.body.classList.remove("menu-open");
    $("menu-toggle").setAttribute("aria-expanded", "false");
  }
});
function closeAnnouncement() {
  const overlay = $("announcement");
  if (!overlay || overlay.hidden) return;
  const id = overlay.dataset.notificationId;
  if (id) sessionStorage.setItem(`scalegridNoticeDismissed:${id}`, "1");
  renderNotification();
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("announcement-open");
}
$("announcement-close")?.addEventListener("click", closeAnnouncement);
$("announcement")?.addEventListener("click", (event) => {
  if (event.target === $("announcement")) closeAnnouncement();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAnnouncement();
});
window.addEventListener("hashchange", render);

onValue(ref(db, "publicContent"), (snapshot) => {
  siteContent = snapshot.exists() ? snapshot.val() : {};
  connected = true;
  render();
}, (error) => {
  console.error("ScaleGrid published content could not be loaded:", error);
  $("site-main").innerHTML = `<section class="page-empty wrap"><span class="section-kicker">CONNECTION ISSUE</span><h1>We're having trouble loading the site.</h1><p>Please refresh in a moment. If the issue continues, check the Firebase Realtime Database rules and configuration.</p></section>`;
});

// Preserve the previous project's notification stream while keeping it separate from editable site content.
onValue(ref(db, "notifications"), (snapshot) => {
  notifications = snapshot.exists() ? snapshot.val() : {};
  renderNotification();
}, (error) => console.warn("Existing notification stream is unavailable:", error));
