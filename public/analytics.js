/* RaportFinansowy24 content attribution. First-party only; no PII is collected here. */
(() => {
  if (window.__rf24AnalyticsLoaded) return;
  window.__rf24AnalyticsLoaded = true;
  const storageKey = "rf24_content_attribution";
  const params = new URLSearchParams(window.location.search);
  const read = (key) => params.get(key) || "";
  const allowed = ["video_id", "hook_id", "platform", "topic", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}"); } catch {}
  const current = {};
  for (const key of allowed) current[key] = read(key) || saved[key] || "";
  current.visitor_id = saved.visitor_id || (crypto.randomUUID ? crypto.randomUUID() : "v-" + Date.now() + "-" + Math.random().toString(36).slice(2));
  current.first_landing_path = saved.first_landing_path || (location.pathname + location.search).slice(0, 300);
  current.page_path = (location.pathname + location.search).slice(0, 300);
  current.is_test = read("rf24_test") === "1" || saved.is_test === true;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ ...saved, ...current, first_landing_path: current.first_landing_path }));
    document.cookie = "rf24_content_attribution=" + encodeURIComponent(JSON.stringify(current)) + "; Path=/; Max-Age=2592000; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
  } catch {}
  const send = (event_name, extra = {}) => {
    const payload = { ...current, ...extra, event_name };
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/event", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/analytics/event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  };
  send("page_view");
  document.addEventListener("click", (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!anchor) return;
    try {
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname !== "/api/go") return;
      for (const key of allowed) if (current[key] && !url.searchParams.has(key)) url.searchParams.set(key, current[key]);
      if (current.visitor_id) url.searchParams.set("visitor_id", current.visitor_id);
      if (current.is_test) url.searchParams.set("rf24_test", "1");
      anchor.href = url.toString();
    } catch {}
  }, true);
  window.RF24Analytics = { track: send, getAttribution: () => ({ ...current }) };
})();
