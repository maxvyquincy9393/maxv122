// === REAL-TIME DATA API SERVICE ===
// Provides real-time information like time, weather, news, etc.

const axios = require("axios");
const moment = require("moment");

/**
 * Get current time for Indonesia timezone
 * @param {string} timezone - Timezone (WIB/WITA/WIT)
 * @returns {Object} Time information
 */
function getCurrentTime(timezone = "WIB") {
  // Use local system time (moment without timezone)
  const now = moment();

  // Add offset based on timezone
  const offsets = {
    WIB: 7, // UTC+7
    WITA: 8, // UTC+8
    WIT: 9, // UTC+9
  };

  const offset = offsets[timezone.toUpperCase()] || offsets.WIB;
  const adjustedTime = moment().utcOffset(offset);

  return {
    time: adjustedTime.format("HH:mm:ss"),
    date: adjustedTime.format("DD MMMM YYYY"),
    day: adjustedTime.format("dddd"),
    timezone: timezone.toUpperCase(),
    full: adjustedTime.format("dddd, DD MMMM YYYY - HH:mm:ss"),
    timestamp: adjustedTime.unix(),
    iso: adjustedTime.toISOString(),
  };
}

/**
 * Get current time in natural language
 * @param {string} timezone - Timezone
 * @returns {string} Natural language time
 */
function getCurrentTimeNatural(timezone = "WIB") {
  const timeInfo = getCurrentTime(timezone);
  const hour = parseInt(timeInfo.time.split(":")[0]);

  let greeting = "";
  if (hour >= 5 && hour < 11) {
    greeting = "pagi";
  } else if (hour >= 11 && hour < 15) {
    greeting = "siang";
  } else if (hour >= 15 && hour < 18) {
    greeting = "sore";
  } else {
    greeting = "malam";
  }

  return `🕐 Sekarang jam *${timeInfo.time}* ${timeInfo.timezone} (${timeInfo.day}, ${timeInfo.date}).\n\nSelamat ${greeting}! 😊`;
}

/**
 * Get weather information (placeholder - needs API key)
 * @param {string} location - Location name
 * @returns {Promise<string>} Weather info
 */
async function getWeather(location = "Jakarta") {
  try {
    // Note: This is a placeholder. For real implementation, use:
    // - OpenWeatherMap API (free tier available)
    // - WeatherAPI.com (free tier available)
    // - BMKG API (Indonesia official weather)

    return `☁️ Informasi cuaca untuk ${location}:\n\nMaaf, fitur cuaca belum tersedia. Saya perlu API key untuk mengakses data cuaca real-time.\n\n💡 Untuk mengaktifkan:\n1. Daftar di openweathermap.org\n2. Dapatkan API key gratis\n3. Tambahkan WEATHER_API_KEY ke .env\n\nSementara itu, cek cuaca di: https://weather.com`;
  } catch (error) {
    return `❌ Tidak bisa mengakses data cuaca: ${error.message}`;
  }
}

/**
 * Get latest news headlines (placeholder)
 * @param {string} topic - News topic
 * @returns {Promise<string>} News headlines
 */
async function getNews(topic = "technology") {
  try {
    // Note: For real implementation, use:
    // - NewsAPI.org (free tier available)
    // - Google News RSS
    // - News aggregator APIs

    return `📰 Berita terbaru tentang "${topic}":\n\nMaaf, fitur berita belum tersedia. Saya perlu API key untuk mengakses berita real-time.\n\n💡 Untuk mengaktifkan:\n1. Daftar di newsapi.org\n2. Dapatkan API key gratis\n3. Tambahkan NEWS_API_KEY ke .env\n\nSementara itu, cek berita di Google News.`;
  } catch (error) {
    return `❌ Tidak bisa mengakses berita: ${error.message}`;
  }
}

/**
 * Get cryptocurrency price (placeholder)
 * @param {string} crypto - Crypto symbol (BTC, ETH, etc)
 * @returns {Promise<string>} Crypto price
 */
async function getCryptoPrice(crypto = "BTC") {
  try {
    // For real implementation, use:
    // - CoinGecko API (free, no key needed!)
    // - CoinMarketCap API
    // - Binance API

    // Example with CoinGecko (this actually works without API key!)
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${getCryptoId(crypto)}&vs_currencies=usd,idr`,
      { timeout: 5000 },
    );

    const cryptoId = getCryptoId(crypto);
    const data = response.data[cryptoId];

    if (data) {
      return (
        `💰 *${crypto.toUpperCase()} Price:*\n\n` +
        `🇺🇸 USD: $${data.usd.toLocaleString()}\n` +
        `🇮🇩 IDR: Rp ${data.idr.toLocaleString()}\n\n` +
        `_Data dari CoinGecko_`
      );
    } else {
      return `❌ Crypto ${crypto.toUpperCase()} tidak ditemukan.`;
    }
  } catch (error) {
    return `❌ Tidak bisa mengakses harga crypto: ${error.message}\n\n💡 Cek langsung di: https://coinmarketcap.com`;
  }
}

/**
 * Convert crypto symbol to CoinGecko ID
 * @param {string} symbol - Crypto symbol
 * @returns {string} CoinGecko ID
 */
function getCryptoId(symbol) {
  const mapping = {
    BTC: "bitcoin",
    ETH: "ethereum",
    BNB: "binancecoin",
    XRP: "ripple",
    ADA: "cardano",
    SOL: "solana",
    DOT: "polkadot",
    DOGE: "dogecoin",
    MATIC: "matic-network",
    SHIB: "shiba-inu",
  };

  return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
}

/**
 * Get exchange rate (placeholder)
 * @param {string} from - From currency
 * @param {string} to - To currency
 * @returns {Promise<string>} Exchange rate
 */
async function getExchangeRate(from = "USD", to = "IDR") {
  try {
    // For real implementation, use:
    // - exchangerate-api.com (free tier)
    // - fixer.io
    // - Bank Indonesia API

    return `💱 Kurs ${from}/${to}:\n\nMaaf, fitur kurs mata uang belum tersedia.\n\n💡 Cek kurs di: https://wise.com/gb/currency-converter/${from.toLowerCase()}-to-${to.toLowerCase()}`;
  } catch (error) {
    return `❌ Tidak bisa mengakses kurs: ${error.message}`;
  }
}

/**
 * Handle real-time data requests
 * @param {Object} params - Request parameters
 * @returns {Promise<string>} Real-time data response
 */
async function handleRealtimeRequest(params) {
  const { type, query, location } = params;

  try {
    switch (type) {
      case "time":
        // Handle time questions
        const timezone = detectTimezone(query);
        return getCurrentTimeNatural(timezone);

      case "weather":
        return await getWeather(location || "Jakarta");

      case "news":
        const topic = extractTopic(query);
        return await getNews(topic);

      case "crypto":
        const crypto = extractCrypto(query);
        return await getCryptoPrice(crypto);

      case "exchange":
        const { from, to } = extractCurrencies(query);
        return await getExchangeRate(from, to);

      default:
        // Generic real-time query
        return await generateRealtimeResponse(query);
    }
  } catch (error) {
    console.error("❌ Real-time request error:", error.message);
    return `❌ Maaf, saya tidak bisa mengakses data real-time untuk: ${query}\n\nSilakan coba lagi atau tanyakan hal lain! 😊`;
  }
}

/**
 * Detect timezone from query
 * @param {string} query - User query
 * @returns {string} Timezone
 */
function detectTimezone(query) {
  if (query.includes("wita")) return "WITA";
  if (query.includes("wit")) return "WIT";
  return "WIB"; // Default Indonesia Western Time
}

/**
 * Extract topic from news query
 * @param {string} query - User query
 * @returns {string} Topic
 */
function extractTopic(query) {
  // Remove common words
  const cleaned = query
    .replace(/berita|news|latest|terbaru|tentang|about/gi, "")
    .trim();

  return cleaned || "teknologi";
}

/**
 * Extract crypto symbol from query
 * @param {string} query - User query
 * @returns {string} Crypto symbol
 */
function extractCrypto(query) {
  const symbols = [
    "BTC",
    "ETH",
    "BNB",
    "XRP",
    "ADA",
    "SOL",
    "DOT",
    "DOGE",
    "MATIC",
    "SHIB",
  ];
  const upperQuery = query.toUpperCase();

  for (const symbol of symbols) {
    if (upperQuery.includes(symbol)) {
      return symbol;
    }
  }

  // Check for full names
  if (upperQuery.includes("BITCOIN")) return "BTC";
  if (upperQuery.includes("ETHEREUM")) return "ETH";
  if (upperQuery.includes("BINANCE")) return "BNB";
  if (upperQuery.includes("CARDANO")) return "ADA";
  if (upperQuery.includes("SOLANA")) return "SOL";

  return "BTC"; // Default to Bitcoin
}

/**
 * Extract currencies from exchange query
 * @param {string} query - User query
 * @returns {Object} From and To currencies
 */
function extractCurrencies(query) {
  const currencies = ["USD", "IDR", "EUR", "GBP", "JPY", "SGD", "MYR"];
  const found = [];

  for (const curr of currencies) {
    if (query.toUpperCase().includes(curr)) {
      found.push(curr);
    }
  }

  return {
    from: found[0] || "USD",
    to: found[1] || "IDR",
  };
}

/**
 * Generate response for generic real-time queries
 * @param {string} query - User query
 * @returns {Promise<string>} Response
 */
async function generateRealtimeResponse(query) {
  // For queries we can't handle, be honest
  return `🤔 Untuk informasi real-time tentang "${query}", saya belum bisa mengaksesnya langsung.\n\n💡 Yang bisa saya lakukan:\n• Jam berapa sekarang\n• Harga crypto (Bitcoin, Ethereum, dll)\n\nUntuk info lainnya, mungkin lebih baik cek langsung di Google ya! 😊`;
}

/**
 * Get API availability status
 * @returns {Object} Status of each API
 */
function getApiStatus() {
  return {
    time: "✅ Available (built-in)",
    crypto: "✅ Available (CoinGecko)",
    weather: "⚠️ Needs API key (WEATHER_API_KEY)",
    news: "⚠️ Needs API key (NEWS_API_KEY)",
    exchange: "⚠️ Needs API key (EXCHANGE_API_KEY)",
  };
}

module.exports = {
  getCurrentTime,
  getCurrentTimeNatural,
  getWeather,
  getNews,
  getCryptoPrice,
  getExchangeRate,
  handleRealtimeRequest,
  getApiStatus,
};
