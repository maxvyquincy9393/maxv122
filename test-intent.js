// Test script untuk intent detector - Comprehensive Test
require("dotenv").config();
const { detectIntent } = require("./utils/intent-detector");

console.log("🧪 Testing Intent Detector - All Commands...\n");
console.log("=".repeat(60));

// Test cases untuk semua command
const testCases = [
  // === REMINDER MANAGEMENT ===
  {
    input: ".listreminder",
    expected: "list_reminders",
    category: "Reminder Management",
  },
  {
    input: "list reminder",
    expected: "list_reminders",
    category: "Reminder Management",
  },
  {
    input: "lihat reminder",
    expected: "list_reminders",
    category: "Reminder Management",
  },
  {
    input: "daftar reminder",
    expected: "list_reminders",
    category: "Reminder Management",
  },
  {
    input: ".delreminder 2",
    expected: "delete_reminder",
    category: "Reminder Management",
  },
  {
    input: ".delreminder semua",
    expected: "delete_reminder",
    category: "Reminder Management",
  },
  {
    input: "hapus reminder 1",
    expected: "delete_reminder",
    category: "Reminder Management",
  },
  {
    input: ".editreminder 1 'task baru'",
    expected: "edit_reminder",
    category: "Reminder Management",
  },

  // === REMINDER CREATE ===
  {
    input: ".ingetin jam 14:00 meeting",
    expected: "reminder",
    category: "Create Reminder",
  },
  {
    input: "ingetin setiap 30 menit minum",
    expected: "reminder",
    category: "Create Reminder",
  },
  {
    input: ".ingetin setiap 2 jam break",
    expected: "reminder",
    category: "Create Reminder",
  },
  {
    input: "ingetin setiap hari jam 06:00 olahraga",
    expected: "reminder",
    category: "Create Reminder",
  },

  // === IMAGE GENERATION ===
  {
    input: ".img kucing lucu",
    expected: "generate_image",
    category: "Image Generation",
  },
  {
    input: "buatin gambar sunset",
    expected: "generate_image",
    category: "Image Generation",
  },
  {
    input: "generate image robot futuristik",
    expected: "generate_image",
    category: "Image Generation",
  },
  {
    input: ".gambarkan pemandangan gunung",
    expected: "generate_image",
    category: "Image Generation",
  },

  // === TRANSLATION ===
  {
    input: ".translate ke english 'halo dunia'",
    expected: "translate",
    category: "Translation",
  },
  {
    input: "terjemahkan ke indonesia 'hello world'",
    expected: "translate",
    category: "Translation",
  },

  // === STICKER ===
  { input: ".jadiin stiker", expected: "sticker", category: "Sticker" },
  { input: "buatin stiker 'MANTAP'", expected: "sticker", category: "Sticker" },

  // === AI CHAT ===
  { input: ".apa itu AI?", expected: "ai_chat", category: "AI Chat" },
  {
    input: "jelaskan tentang blockchain",
    expected: "ai_chat",
    category: "AI Chat",
  },
  { input: ".siapa kamu?", expected: "ai_chat", category: "AI Chat" },
  {
    input: "kamu dibuat oleh siapa?",
    expected: "ai_chat",
    category: "AI Chat",
  },
];

let passCount = 0;
let failCount = 0;
let currentCategory = "";

testCases.forEach((test, index) => {
  const { input, expected, category } = test;

  // Print category header
  if (category !== currentCategory) {
    console.log("\n" + "=".repeat(60));
    console.log(`📂 ${category.toUpperCase()}`);
    console.log("=".repeat(60));
    currentCategory = category;
  }

  // Detect intent
  const intent = detectIntent(input, {});
  const detected = intent.type;
  const passed = detected === expected;

  // Update counters
  if (passed) {
    passCount++;
  } else {
    failCount++;
  }

  // Print result
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`\n[${index + 1}] ${status}`);
  console.log(`    Input:    "${input}"`);
  console.log(`    Expected: ${expected}`);
  console.log(`    Detected: ${detected}`);
  console.log(`    Confidence: ${intent.confidence}`);

  if (!passed) {
    console.log(`    ⚠️  MISMATCH!`);
  }

  // Show params for important commands
  if (
    ["generate_image", "delete_reminder", "edit_reminder"].includes(detected)
  ) {
    console.log(`    Params:`, JSON.stringify(intent.params, null, 6));
  }
});

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 TEST SUMMARY");
console.log("=".repeat(60));
console.log(`Total Tests: ${testCases.length}`);
console.log(
  `✅ Passed: ${passCount} (${((passCount / testCases.length) * 100).toFixed(1)}%)`,
);
console.log(
  `❌ Failed: ${failCount} (${((failCount / testCases.length) * 100).toFixed(1)}%)`,
);

if (failCount === 0) {
  console.log("\n🎉 ALL TESTS PASSED! Intent detector working perfectly!");
} else {
  console.log(
    `\n⚠️  ${failCount} test(s) failed. Please review the results above.`,
  );
}

console.log("\n" + "=".repeat(60));
console.log("✅ Test completed!");
console.log("=".repeat(60));
