import { COUNTRY_OPTIONS } from "./src/modules/diagnostics/evaluate.js";

// Original
function resolveCountryOriginal(value: string) {
  const normalized = value.trim();
  const byCode = COUNTRY_OPTIONS.find((country) => country.code === normalized.toUpperCase());
  const byName = COUNTRY_OPTIONS.find(
    (country) => country.name.toLocaleLowerCase("es") === normalized.toLocaleLowerCase("es"),
  );
  return byCode ?? byName;
}

// Optimized
const countryByCode = new Map();
const countryByName = new Map();
for (const country of COUNTRY_OPTIONS) {
  countryByCode.set(country.code, country);
  countryByName.set(country.name.toLocaleLowerCase("es"), country);
}

function resolveCountryOptimized(value: string) {
  const normalized = value.trim();
  const byCode = countryByCode.get(normalized.toUpperCase());
  if (byCode) return byCode;

  return countryByName.get(normalized.toLocaleLowerCase("es"));
}

const N = 1000000;
const testValues = ["pe", "Perú", " mx ", "Otro país", "unknown"];

console.time("Original");
for (let i = 0; i < N; i++) {
  for (const v of testValues) {
    resolveCountryOriginal(v);
  }
}
console.timeEnd("Original");

console.time("Optimized");
for (let i = 0; i < N; i++) {
  for (const v of testValues) {
    resolveCountryOptimized(v);
  }
}
console.timeEnd("Optimized");
