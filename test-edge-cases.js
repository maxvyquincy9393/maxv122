// Test edge cases dari production
require("dotenv").config();
const { detectIntent } = require("./utils/intent-detector");

console.log("🧪 Testing Edge Cases from Production...\n");
console.log("=".repeat(70));

const testCases = [
  // === SHOULD NOT BE REMINDER ===
  {
    input: "jam berapa sekarang",
    expected: "ai_chat",
    category: "Time Question (NOT reminder)",
    description: "Pertanyaan waktu, bukan reminder",
  },
  {
    input: "what time is it",
    expected: "ai_chat",
    category: "Time Question (NOT reminder)",
    description: "English time question",
  },
  {
    input: "pukul berapa sekarang",
    expected: "ai_chat",
    category: "Time Question (NOT reminder)",
    description: "Pertanyaan waktu Indonesia",
  },
  {
    input: "sekarang jam berapa",
    expected: "ai_chat",
    category: "Time Question (NOT reminder)",
    description: "Pertanyaan waktu variasi",
  },

  // === SHOULD BE REMINDER ===
  {
    input: "ingetin jam 2 tidur",
    expected: "reminder",
    category: "Valid Reminder",
    description: "Format singkat jam 2 (should parse as 02:00)",
  },
  {
    input: "jam 14.00 meeting",
    expected: "reminder",
    category: "Valid Reminder",
    description: "Natural language dengan task",
  },
  {
    input: "14.00 meeting dengan client",
    expected: "reminder",
    category: "Valid Reminder",
    description: "Hanya waktu + task",
  },
  {
    input: "pukul 15.30 jemput anak",
    expected: "reminder",
    category: "Valid Reminder",
    description: "Pukul format dengan task",
  },

  // === SHOULD BE LIST REMINDERS ===
  {
    input: ".listreminder",
    expected: "list_reminders",
    category: "List Reminder",
    description: "Command list reminder",
  },
  {
    input: "listreminder",
    expected: "list_reminders",
    category: "List Reminder",
    description: "List reminder tanpa prefix",
  },
  {
    input: "lihat reminder",
    expected: "list_reminders",
    category: "List Reminder",
    description: "Natural language list",
  },

  // === AI CHAT ===
  {
    input: "buatin rangkuman tentang jaringan komputer",
    expected: "ai_chat",
    category: "AI Chat",
    description: "Request AI response",
  },
  {
    input: "no carikan",
    expected: "ai_chat",
    category: "AI Chat",
    description: "Natural chat",
  },
  {
    input: "apa ini",
    expected: "ai_chat",
    category: "AI Chat (without file)",
    description: "Generic question without context",
  },

  // === IMAGE GENERATION ===
  {
    input: "img kucing oren",
    expected: "generate_image",
    category: "Image Generation",
    description: "Generate image command",
  },
  {
    input: "buatin gambar sunset",
    expected: "generate_image",
    category: "Image Generation",
    description: "Natural language image",
  },

  // === STICKER ===
  {
    input: "buatin sticker kelasss",
    expected: "sticker",
    category: "Sticker",
    description: "Sticker creation",
  },

  // === AMBIGUOUS CASES ===
  {
    input: "jam 2",
    expected: "ai_chat",
    category: "Ambiguous",
    description: "Hanya waktu tanpa task - should NOT be reminder",
  },
  {
    input: "besok",
    expected: "ai_chat",
    category: "Ambiguous",
    description: "Hanya kata besok - should NOT be reminder",
  },
];

let passCount = 0;
let failCount = 0;
let currentCategory = "";

testCases.forEach((test, index) => {
  const { input, expected, category, description } = test;

  // Print category header
  if (category !== currentCategory) {
    console.log("\n" + "=".repeat(70));
    console.log(`📂 ${category.toUpperCase()}`);
    console.log("=".repeat(70));
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
  console.log(`    Input:       "${input}"`);
  console.log(`    Description: ${description}`);
  console.log(`    Expected:    ${expected}`);
  console.log(`    Detected:    ${detected}`);
  console.log(`    Confidence:  ${intent.confidence}`);

  if (!passed) {
    console.log(`    ⚠️  MISMATCH!`);
    console.log(`    Params:`, JSON.stringify(intent.params, null, 2));
  }

  // Show time for valid reminders
  if (passed && detected === "reminder" && intent.params.time) {
    const time = intent.params.time;
    const hours = time.getHours();
    const minutes = time.getMinutes();
    console.log(
      `    Parsed Time: ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    );
    console.log(`    Task:        "${intent.params.task}"`);
  }
});

// Summary
console.log("\n" + "=".repeat(70));
console.log("📊 TEST SUMMARY");
console.log("=".repeat(70));
console.log(`Total Tests: ${testCases.length}`);
console.log(
  `✅ Passed: ${passCount} (${((passCount / testCases.length) * 100).toFixed(1)}%)`
);
console.log(
  `❌ Failed: ${failCount} (${((failCount / testCases.length) * 100).toFixed(1)}%)`
);

if (failCount === 0) {
  console.log("\n🎉 ALL TESTS PASSED! Bot ready for production!");
} else {
  console.log(`\n⚠️  ${failCount} test(s) failed. Review needed.`);
}

console.log("\n" + "=".repeat(70));

// Critical edge cases validation
console.log("\n\n" + "=".repeat(70));
console.log("🔍 CRITICAL VALIDATIONS");
console.log("=".repeat(70));

const criticalTests = [
  {
    input: "jam berapa sekarang",
    shouldNOTBe: "reminder",
    reason: "Pertanyaan waktu, bukan reminder",
  },
  {
    input: ".listreminder",
    shouldBe: "list_reminders",
    reason: "List command harus terdeteksi benar",
  },
  {
    input: "jam 14.00 meeting",
    shouldBe: "reminder",
    reason: "Natural reminder harus work",
  },
];

let criticalPass = 0;
criticalTests.forEach((test) => {
  const intent = detectIntent(test.input, {});
  let pass = false;

  if (test.shouldBe) {
    pass = intent.type === test.shouldBe;
    console.log(
      `\n${pass ? "✅" : "❌"} "${test.input}" → ${intent.type} (expected: ${test.shouldBe})`
    );
  } else if (test.shouldNOTBe) {
    pass = intent.type !== test.shouldNOTBe;
    console.log(
      `\n${pass ? "✅" : "❌"} "${test.input}" → ${intent.type} (should NOT be: ${test.shouldNOTBe})`
    );
  }

  console.log(`   Reason: ${test.reason}`);

  if (pass) criticalPass++;
});

console.log(
  `\n🎯 Critical Tests: ${criticalPass}/${criticalTests.length} passed`
);

console.log("\n" + "=".repeat(70));
console.log("✅ Edge case testing completed!");
console.log("=".repeat(70));
