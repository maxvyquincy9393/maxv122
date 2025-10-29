// Test script untuk reminder parser
require("dotenv").config();
const { detectIntent } = require("./utils/intent-detector");

console.log("🧪 Testing Reminder Parser - Multiple Formats...\n");
console.log("=".repeat(70));

const testCases = [
  // Format dengan titik
  {
    input: ".ingetin jam 14.00 meeting",
    expectedType: "reminder",
    description: "Format 14.00 (titik)",
  },
  {
    input: "ingetin jam 14.30 makan siang",
    expectedType: "reminder",
    description: "Format 14.30 (titik)",
  },
  {
    input: "jam 09.00 sarapan",
    expectedType: "reminder",
    description: "Natural - jam 09.00",
  },

  // Format dengan colon
  {
    input: ".ingetin jam 14:00 meeting",
    expectedType: "reminder",
    description: "Format 14:00 (colon)",
  },
  {
    input: "ingetin jam 14:30 makan siang",
    expectedType: "reminder",
    description: "Format 14:30 (colon)",
  },

  // Natural language tanpa .ingetin
  {
    input: "jam 15.00 ada meeting penting",
    expectedType: "reminder",
    description: "Natural language - jam 15.00",
  },
  {
    input: "pukul 16.30 jemput anak",
    expectedType: "reminder",
    description: "Natural language - pukul 16.30",
  },
  {
    input: "14.00 meeting dengan client",
    expectedType: "reminder",
    description: "Hanya waktu - 14.00",
  },
  {
    input: "besok jam 09.00 olahraga",
    expectedType: "reminder",
    description: "Besok + waktu",
  },

  // Recurring dengan natural language
  {
    input: "setiap 30 menit minum air",
    expectedType: "reminder",
    description: "Recurring - setiap 30 menit",
  },
  {
    input: "setiap 2 jam break",
    expectedType: "reminder",
    description: "Recurring - setiap 2 jam",
  },
  {
    input: "setiap hari jam 06.00 olahraga",
    expectedType: "reminder",
    description: "Recurring - setiap hari",
  },

  // Edge cases
  {
    input: "ingatkan aku jam 20.00 tidur",
    expectedType: "reminder",
    description: "Keyword 'ingatkan'",
  },
  {
    input: "set reminder jam 08.00 bangun",
    expectedType: "reminder",
    description: "English 'set reminder'",
  },
  {
    input: "atur alarm jam 07.30 pagi",
    expectedType: "reminder",
    description: "Keyword 'atur alarm'",
  },
];

let passCount = 0;
let failCount = 0;

testCases.forEach((test, index) => {
  const { input, expectedType, description } = test;

  // Detect intent
  const intent = detectIntent(input, {});
  const detected = intent.type;
  const passed = detected === expectedType;

  // Update counters
  if (passed) {
    passCount++;
  } else {
    failCount++;
  }

  // Print result
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`\n[${index + 1}] ${status} - ${description}`);
  console.log(`    Input:    "${input}"`);
  console.log(`    Expected: ${expectedType}`);
  console.log(`    Detected: ${detected}`);

  if (passed && detected === "reminder") {
    // Show parsed time and task
    const { time, task, recurring, recurringType, interval } = intent.params;

    if (time) {
      const hours = time.getHours();
      const minutes = time.getMinutes();
      console.log(
        `    Time:     ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
      );
    }

    if (recurring) {
      console.log(`    Recurring: ${recurringType} (${interval})`);
    }

    console.log(`    Task:     "${task}"`);
  }

  if (!passed) {
    console.log(`    ⚠️  MISMATCH!`);
  }
});

// Summary
console.log("\n" + "=".repeat(70));
console.log("📊 TEST SUMMARY");
console.log("=".repeat(70));
console.log(`Total Tests: ${testCases.length}`);
console.log(
  `✅ Passed: ${passCount} (${((passCount / testCases.length) * 100).toFixed(1)}%)`,
);
console.log(
  `❌ Failed: ${failCount} (${((failCount / testCases.length) * 100).toFixed(1)}%)`,
);

if (failCount === 0) {
  console.log("\n🎉 ALL TESTS PASSED! Reminder parser working perfectly!");
} else {
  console.log(
    `\n⚠️  ${failCount} test(s) failed. Please review the results above.`,
  );
}

console.log("\n" + "=".repeat(70));
console.log("✅ Test completed!");
console.log("=".repeat(70));

// Additional validation tests
console.log("\n\n" + "=".repeat(70));
console.log("🔍 DETAILED VALIDATION");
console.log("=".repeat(70));

const validationTests = [
  ".ingetin jam 14.00 meeting",
  "jam 15.30 ada meeting",
  "setiap 30 menit minum air",
];

validationTests.forEach((input) => {
  console.log(`\nInput: "${input}"`);
  const intent = detectIntent(input, {});
  console.log(`Intent: ${intent.type}`);
  console.log(`Params:`, JSON.stringify(intent.params, null, 2));
});

console.log("\n" + "=".repeat(70));
