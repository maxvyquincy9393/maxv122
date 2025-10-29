// === BROWSER SERVICE ===
// Real-time web access, scraping, and search

const axios = require("axios");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

/**
 * Search Google and get real-time results
 * @param {string} query - Search query
 * @param {number} numResults - Number of results to return
 * @returns {Promise<Array>} Search results
 */
async function searchGoogle(query, numResults = 5) {
  try {
    console.log(`🔍 Searching Google for: ${query}`);

    // Use Google Custom Search API or scrape
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${numResults}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Parse search results
    $(".g").each((index, element) => {
      if (results.length >= numResults) return false;

      const title = $(element).find("h3").text();
      const link = $(element).find("a").attr("href");
      const snippet = $(element).find(".VwiC3b").text() || $(element).find(".lEBKkf").text();

      if (title && link) {
        results.push({
          title,
          url: link,
          snippet,
          index: index + 1,
        });
      }
    });

    console.log(`✅ Found ${results.length} results`);
    return results;
  } catch (error) {
    console.error("❌ Google search error:", error.message);
    // Fallback to DuckDuckGo
    return await searchDuckDuckGo(query, numResults);
  }
}

/**
 * Search DuckDuckGo (fallback)
 * @param {string} query - Search query
 * @param {number} numResults - Number of results
 * @returns {Promise<Array>} Search results
 */
async function searchDuckDuckGo(query, numResults = 5) {
  try {
    console.log(`🔍 Searching DuckDuckGo for: ${query}`);

    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $(".result").each((index, element) => {
      if (results.length >= numResults) return false;

      const title = $(element).find(".result__a").text();
      const link = $(element).find(".result__url").attr("href");
      const snippet = $(element).find(".result__snippet").text();

      if (title && link) {
        results.push({
          title,
          url: link,
          snippet,
          index: index + 1,
        });
      }
    });

    console.log(`✅ Found ${results.length} results from DuckDuckGo`);
    return results;
  } catch (error) {
    console.error("❌ DuckDuckGo search error:", error.message);
    return [];
  }
}

/**
 * Fetch and extract content from a URL
 * @param {string} url - URL to fetch
 * @returns {Promise<Object>} Extracted content
 */
async function fetchURL(url) {
  try {
    console.log(`📥 Fetching URL: ${url}`);

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);

    // Remove script and style tags
    $("script, style, nav, footer, header, aside, iframe").remove();

    // Extract title
    const title = $("title").text() || $("h1").first().text() || "No title";

    // Extract meta description
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    // Extract main content
    let content = "";

    // Try common content containers
    const contentSelectors = [
      "article",
      'main',
      '[role="main"]',
      ".content",
      ".post-content",
      ".article-content",
      "#content",
      ".entry-content",
      "body",
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    // Clean up content
    content = content
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim()
      .substring(0, 10000); // Limit to 10k chars

    // Extract links
    const links = [];
    $("a[href]").each((index, element) => {
      if (links.length >= 10) return false;
      const href = $(element).attr("href");
      const text = $(element).text().trim();
      if (href && text && href.startsWith("http")) {
        links.push({ text, url: href });
      }
    });

    console.log(`✅ Extracted content from ${url}`);

    return {
      url,
      title: title.trim(),
      description: description.trim(),
      content: content,
      links,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ URL fetch error:", error.message);
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
}

/**
 * Search and summarize (get answer from web)
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results with content
 */
async function searchAndGetContent(query) {
  try {
    // Search first
    const results = await searchGoogle(query, 3);

    if (results.length === 0) {
      return {
        query,
        results: [],
        content: null,
        error: "No results found",
      };
    }

    // Try to fetch content from first result
    let content = null;
    for (const result of results) {
      try {
        content = await fetchURL(result.url);
        break; // Success, stop trying
      } catch (error) {
        console.log(`Failed to fetch ${result.url}, trying next...`);
        continue;
      }
    }

    return {
      query,
      results,
      content,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Search and get content error:", error.message);
    throw error;
  }
}

/**
 * Get current news headlines
 * @param {string} topic - News topic (optional)
 * @returns {Promise<Array>} News articles
 */
async function getNews(topic = "latest") {
  try {
    console.log(`📰 Fetching news: ${topic}`);

    const query = topic === "latest" ? "latest news" : `${topic} news`;
    const results = await searchGoogle(query, 10);

    // Filter for news sites
    const newsResults = results.filter((r) => {
      const url = r.url.toLowerCase();
      return (
        url.includes("news") ||
        url.includes("bbc") ||
        url.includes("cnn") ||
        url.includes("reuters") ||
        url.includes("detik") ||
        url.includes("kompas") ||
        url.includes("tempo")
      );
    });

    return newsResults;
  } catch (error) {
    console.error("❌ News fetch error:", error.message);
    return [];
  }
}

/**
 * Get weather information
 * @param {string} location - Location name
 * @returns {Promise<Object>} Weather data
 */
async function getWeather(location) {
  try {
    console.log(`🌤️ Getting weather for: ${location}`);

    const query = `weather ${location}`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Extract weather info from Google
    const temp = $("#wob_tm").text() || "N/A";
    const condition = $("#wob_dc").text() || "N/A";
    const precipitation = $("#wob_pp").text() || "N/A";
    const humidity = $("#wob_hm").text() || "N/A";
    const wind = $("#wob_ws").text() || "N/A";

    return {
      location,
      temperature: temp + "°C",
      condition,
      precipitation,
      humidity,
      wind,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Weather fetch error:", error.message);
    return {
      location,
      error: "Weather data not available",
    };
  }
}

/**
 * Get current time for a location
 * @param {string} location - Location/timezone
 * @returns {Promise<Object>} Time info
 */
async function getTimeInLocation(location) {
  try {
    console.log(`🕐 Getting time for: ${location}`);

    const query = `current time in ${location}`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Extract time from Google
    const time = $(".vk_bk").text() || $(".vk_gy").text() || "N/A";
    const date = $(".vk_gy").text() || "N/A";

    return {
      location,
      time,
      date,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Time fetch error:", error.message);
    return {
      location,
      error: "Time data not available",
    };
  }
}

/**
 * Get stock/crypto price
 * @param {string} symbol - Stock/crypto symbol
 * @returns {Promise<Object>} Price info
 */
async function getPrice(symbol) {
  try {
    console.log(`💰 Getting price for: ${symbol}`);

    const query = `${symbol} price`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Try to extract price
    const price =
      $(".pclqee").text() ||
      $(".YMlKec").first().text() ||
      $('[data-attrid="Price"]').text() ||
      "N/A";

    const change = $(".NydbP").text() || "N/A";

    return {
      symbol,
      price,
      change,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Price fetch error:", error.message);
    return {
      symbol,
      error: "Price data not available",
    };
  }
}

/**
 * Get YouTube video info
 * @param {string} url - YouTube URL
 * @returns {Promise<Object>} Video info
 */
async function getYouTubeInfo(url) {
  try {
    console.log(`🎥 Getting YouTube info: ${url}`);

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    const title = $('meta[property="og:title"]').attr("content") || "N/A";
    const description = $('meta[property="og:description"]').attr("content") || "N/A";
    const thumbnail = $('meta[property="og:image"]').attr("content") || "";

    return {
      url,
      title,
      description,
      thumbnail,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ YouTube info error:", error.message);
    return {
      url,
      error: "Could not fetch video info",
    };
  }
}

/**
 * Generic web search and extract answer
 * @param {string} question - Question to search
 * @returns {Promise<string>} Extracted answer
 */
async function findAnswer(question) {
  try {
    const data = await searchAndGetContent(question);

    if (!data.content) {
      return `Searched for "${question}" but couldn't access the content. Here are the top results:\n\n${data.results
        .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`)
        .join("\n\n")}`;
    }

    // Return search results + content summary
    const summary = data.content.content.substring(0, 1000);
    return `🔍 Search results for: "${question}"\n\n📄 From: ${data.content.title}\n🔗 ${data.content.url}\n\n${summary}...\n\nOther results:\n${data.results
      .slice(1)
      .map((r, i) => `${i + 2}. ${r.title}`)
      .join("\n")}`;
  } catch (error) {
    console.error("❌ Find answer error:", error.message);
    throw error;
  }
}

module.exports = {
  searchGoogle,
  searchDuckDuckGo,
  fetchURL,
  searchAndGetContent,
  getNews,
  getWeather,
  getTimeInLocation,
  getPrice,
  getYouTubeInfo,
  findAnswer,
};
