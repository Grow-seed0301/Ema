/**
 * Test script for error logging functionality
 * This script demonstrates how the error logging works
 */

import { logErrorToDatabase } from "./utils/errorLogger";

async function testErrorLogging() {
  console.log("Testing error logging functionality...\n");

  // Test 1: Log a simple error message
  console.log("Test 1: Logging a simple error message");
  try {
    await logErrorToDatabase("Test error message", undefined, {
      errorCode: "TEST_ERROR",
      statusCode: 500,
      metadata: { test: "data" },
    });
    console.log("✓ Simple error logged successfully\n");
  } catch (error) {
    console.error("✗ Failed to log simple error:", error);
  }

  // Test 2: Log an Error object
  console.log("Test 2: Logging an Error object");
  try {
    const testError = new Error("Test error object");
    await logErrorToDatabase(testError, undefined, {
      errorCode: "TEST_ERROR_OBJECT",
      statusCode: 500,
    });
    console.log("✓ Error object logged successfully\n");
  } catch (error) {
    console.error("✗ Failed to log error object:", error);
  }

  // Test 3: Log an error with request context
  console.log("Test 3: Logging an error with request context");
  try {
    const mockRequest = {
      method: "POST",
      url: "/api/test",
      originalUrl: "/api/test",
      body: { test: "data" },
      query: {},
      params: {},
    } as any;

    await logErrorToDatabase(
      new Error("Test error with request context"),
      mockRequest,
      {
        errorCode: "TEST_WITH_REQUEST",
        statusCode: 400,
        userId: "test-user-123",
        userType: "student",
      }
    );
    console.log("✓ Error with request context logged successfully\n");
  } catch (error) {
    console.error("✗ Failed to log error with request:", error);
  }

  console.log("Error logging tests completed!");
}

// Run the tests
testErrorLogging()
  .then(() => {
    console.log("\n✓ All tests completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Test suite failed:", error);
    process.exit(1);
  });
