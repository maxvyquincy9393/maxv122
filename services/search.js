const fetchFn =
  global.fetch || ((...args) => import("node-fetch").then(({ default: fn }) => fn(...args)));

const DUCKDUCKGO_ENDPOINT = "https://api.duckduckgo.com/";
const SERPER_ENDPOINT = "https://google.serper.dev/search";

function sanitizeText(text) {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

async function fetchDuckDuckGo(query, { limit = 3 } = {}) {
  const url = new URL(DUCKDUCKGO_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("no_redirect", "1");
  url.searchParams.set("no_html", "1");

  const response = await fetchFn(url.toString(), {
    headers: {
      "User-Agent": "MaxvyBot/1.0 (+https://maxvy.ai)",
    },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo error: ${response.status}`);
  }

  const data = await response.json();
  const results = [];

  if (Array.isArray(data.RelatedTopics)) {
    for (const item of data.RelatedTopics) {
      if (item.Topics && Array.isArray(item.Topics)) {
        for (const sub of item.Topics) {
          if (results.length >= limit) break;
          if (sub.FirstURL && sub.Text) {
            results.push({
              title: sanitizeText(sub.Text.split(" - ")[0] || sub.Text),
              snippet: sanitizeText(sub.Text),
              url: sub.FirstURL,
              source: "duckduckgo",
            });
          }
        }
      } else if (item.FirstURL && item.Text) {
        results.push({
          title: sanitizeText(item.Text.split(" - ")[0] || item.Text),
          snippet: sanitizeText(item.Text),
          url: item.FirstURL,
          source: "duckduckgo",
        });
      }
      if (results.length >= limit) break;
    }
  }

  if (!results.length && data.AbstractURL && data.AbstractText) {
    results.push({
      title: sanitizeText(data.Heading || query),
      snippet: sanitizeText(data.AbstractText),
      url: data.AbstractURL,
      source: "duckduckgo",
    });
  }

  return results.slice(0, limit);
}

async function fetchSerper(query, { limit = 3 } = {}) {
  if (!process.env.SERPER_API_KEY) {
    return [];
  }

  const response = await fetchFn(SERPER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.SERPER_API_KEY,
    },
    body: JSON.stringify({
      q: query,
      gl: "id",
      hl: "id",
      num: limit,
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper error: ${response.status}`);
  }

  const data = await response.json();
  const organic = Array.isArray(data.organic) ? data.organic : [];

  return organic.slice(0, limit).map((item) => ({
    title: sanitizeText(item.title),
    snippet: sanitizeText(item.snippet || item.description),
    url: item.link,
    source: "serper",
  }));
}

async function webSearch(query, options = {}) {
  const searchQuery = sanitizeText(query);
  if (!searchQuery) {
    return [];
  }

  const limit = options.limit || 3;
  const errors = [];

  try {
    const serperResults = await fetchSerper(searchQuery, { limit });
    if (serperResults.length) {
      return serperResults.slice(0, limit);
    }
  } catch (error) {
    errors.push(error.message);
  }

  try {
    const duckResults = await fetchDuckDuckGo(searchQuery, { limit });
    if (duckResults.length) {
      return duckResults;
    }
  } catch (error) {
    errors.push(error.message);
  }

  if (errors.length) {
    throw new Error(errors.join(" | "));
  }

  return [];
}

module.exports = {
  webSearch,
  fetchDuckDuckGo,
  fetchSerper,
};
