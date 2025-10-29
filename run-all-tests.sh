#!/bin/bash

# MAXVY Bot - Run All Tests Script
# Version: 3.1.2

echo "🧪 MAXVY Bot - Running All Automated Tests"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_file=$1
    local test_name=$2

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔍 Running: $test_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ -f "$test_file" ]; then
        if node "$test_file"; then
            echo -e "${GREEN}✅ $test_name - PASSED${NC}"
            ((PASSED_TESTS++))
        else
            echo -e "${RED}❌ $test_name - FAILED${NC}"
            ((FAILED_TESTS++))
        fi
        ((TOTAL_TESTS++))
    else
        echo -e "${YELLOW}⚠️  $test_file not found - SKIPPED${NC}"
    fi
}

# Start testing
echo "📋 Starting test suite..."
echo ""

# Test 1: Intent Detection
run_test "test-intent.js" "Intent Detection Test"

# Test 2: Reminder Parser
run_test "test-reminder-parser.js" "Reminder Parser Test"

# Test 3: Edge Cases
run_test "test-edge-cases.js" "Edge Cases Test"

# Summary
echo ""
echo "=========================================="
echo "📊 TEST SUMMARY"
echo "=========================================="
echo ""
echo "Total Tests Run: $TOTAL_TESTS"
echo -e "${GREEN}✅ Passed: $PASSED_TESTS${NC}"
echo -e "${RED}❌ Failed: $FAILED_TESTS${NC}"
echo ""

# Calculate percentage
if [ $TOTAL_TESTS -gt 0 ]; then
    PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "Success Rate: $PERCENTAGE%"
    echo ""

    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! Bot is ready for production!${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  Some tests failed. Please review the results above.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  No tests were run. Please check test files exist.${NC}"
    exit 1
fi
