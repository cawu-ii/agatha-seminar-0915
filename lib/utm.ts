export interface UtmParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const STORAGE_KEY = "agatha_utm_params";

/** Reads utm_* from the current URL's query string. Missing values come back as "". */
export function readUtmFromLocation(): UtmParams {
  if (typeof window === "undefined") {
    return { utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "" };
  }
  const params = new URLSearchParams(window.location.search);
  const result = {} as UtmParams;
  for (const key of UTM_KEYS) {
    result[key] = params.get(key) ?? "";
  }
  return result;
}

/** Persists UTM params for the session so they survive client-side navigation before submit. */
export function storeUtmParams(utm: UtmParams): void {
  if (typeof window === "undefined") return;
  const hasAny = UTM_KEYS.some((k) => utm[k]);
  if (!hasAny) return; // don't overwrite a previously captured UTM with an empty visit
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
}

export function readStoredUtmParams(): UtmParams {
  if (typeof window === "undefined") {
    return { utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "" };
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return readUtmFromLocation();
    return JSON.parse(raw) as UtmParams;
  } catch {
    return { utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "" };
  }
}
