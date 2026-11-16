import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = readFileSync(resolve(root, "firebase-config.js"), "utf8");
const rules = JSON.parse(readFileSync(resolve(root, "database.rules.json"), "utf8"));
const firebaseJson = JSON.parse(readFileSync(resolve(root, "firebase.json"), "utf8"));
const firebaserc = JSON.parse(readFileSync(resolve(root, ".firebaserc"), "utf8"));
const failures = [];
if (!/projectId:\s*"scalegrid-1c506"/.test(config)) failures.push("Firebase project ID mismatch.");
if (!/databaseURL:\s*"https:\/\/scalegrid-1c506-default-rtdb\.asia-southeast1\.firebasedatabase\.app"/.test(config)) failures.push("Realtime Database URL mismatch.");
if (firebaserc.projects?.default !== "scalegrid-1c506") failures.push(".firebaserc project mismatch.");
if (firebaseJson.database?.rules !== "database.rules.json") failures.push("firebase.json rules path mismatch.");
if (rules.rules?.[".read"] !== false || rules.rules?.[".write"] !== false) failures.push("Root database access must remain denied.");
if (rules.rules?.publicContent?.[".read"] !== true) failures.push("publicContent must be publicly readable.");
if (failures.length) { failures.forEach(x => console.error("FAIL:",x)); process.exitCode=1; }
else console.log("Firebase package checks passed (static configuration and JSON checks only).");
