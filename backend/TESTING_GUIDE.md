# Patient Passport - Testing Guide

## Overview

This guide explains the testing strategy for the Patient Passport backend system, how tests are structured, and how to run them.

## Test Structure

### Testing Framework
- **Framework**: Jest v29.7.0
- **TypeScript Support**: ts-jest v29.1.1
- **Test Environment**: Node.js

### Configuration
Tests are configured in `jest.config.cjs`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'  // Path alias support
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- observationAccessControl

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test by name
npm test -- --testNamePattern="should validate"
```

## Test Files

### 1. Observation Access Control Tests
**File**: `src/utils/__tests__/observationAccessControl.test.ts`

**Purpose**: Tests time-based edit rules and permission systems for medical observations.

**Coverage**: 10/10 tests passing ✅

**Key Test Categories**:

#### A. Time-Based Access Rules
Tests the 3-hour observation edit lock system:

```typescript
// Legacy records (no syncDate) - always editable
test('should allow editing legacy observation without syncDate')

// Recent observations (<2 hours) - editable by any doctor  
test('should allow edit for observation less than 2 hours old')

// 2-3 hour window - editable only by authorized doctors
test('should allow edit for authorized doctor in 2-3 hour window')

// >3 hours - locked for everyone
test('should deny edit for observation older than 3 hours')
```

**Business Rules Tested**:
- ✅ Observations <2 hours old: ANY doctor can edit
- ✅ Observations 2-3 hours old: Only creator OR explicitly authorized doctors can edit
- ✅ Observations >3 hours old: LOCKED (no edits allowed)
- ✅ Legacy records (no syncDate): Always editable

#### B. Permission System
Tests doctor authorization for editing observations:

```typescript
// Test editableBy array
test('should allow edit when doctor is in editableBy array')

// Test creator permissions
test('should allow edit when doctor is the creator')

// Test permission denial
test('should deny edit when doctor has no permissions')
```

#### C. Medication Status Updates
Tests automatic medication status transitions:

```typescript
test('should update medication status based on time')
```

**Medication Rules**:
- Observations <2 hours old → Medications marked as "Active"
- Observations >2 hours old → Medications marked as "Past"

### 2. Emergency Access Controller Tests
**File**: `src/controllers/__tests__/emergencyAccessController.test.ts`

**Purpose**: Tests emergency break-glass access system for patient records.

**Coverage**: 3/3 tests passing ✅

**Key Test Categories**:

#### A. Input Validation
Tests request parameter validation before processing:

```typescript
// Justification length validation
test('should validate minimum justification length (20 chars)')
test('should validate maximum justification length (500 chars)')

// Role-based access control
test('should enforce doctor-only access')
```

**Validation Rules Tested**:
- ✅ Justification must be at least 20 characters
- ✅ Justification cannot exceed 500 characters  
- ✅ Only users with role="doctor" can request emergency access

## How Tests Work

### 1. Mocking Strategy

Tests use Jest's mocking system to isolate code and avoid database dependencies:

```typescript
// Mock Mongoose models
jest.mock('@/models/Patient');
jest.mock('@/models/Doctor');
jest.mock('@/models/EmergencyOverride');

// Mock external services
jest.mock('@/services/simpleEmailService');
```

### 2. Test Setup Pattern

Each test file follows this pattern:

```typescript
describe('Feature Name', () => {
  // Setup variables
  let mockReq, mockRes, mockNext;
  
  // Run before each test
  beforeEach(() => {
    // Reset mocks
    // Create fresh mock objects
    // Set up default mock implementations
  });
  
  // Clean up after each test
  afterEach(() => {
    // Restore timers, clean up resources
  });
  
  // Individual tests
  test('should do something', async () => {
    // Arrange: Set up test conditions
    // Act: Call the function being tested
    // Assert: Verify the results
  });
});
```

### 3. Time-Based Testing

For time-sensitive features (like the 3-hour lock), tests use fake timers:

```typescript
beforeEach(() => {
  jest.useFakeTimers();  // Use fake time
  jest.setSystemTime(new Date('2025-11-18T19:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();  // Restore real time
});

// In test
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
```

### 4. Assertion Patterns

Common assertion patterns used:

```typescript
// Exact match
expect(result).toBe(true);
expect(error.message).toBe('Patient not found');

// Object matching
expect(mockFunction).toHaveBeenCalledWith(
  expect.objectContaining({
    user: 'user123',
    action: 'view'
  })
);

// String matching
expect(error.message).toContain('emergency access');
expect(justification).toMatch(/patient.*emergency/i);

// Type checking
expect(result).toBeInstanceOf(Error);
expect(value).toBeGreaterThan(0);
```

## Test Coverage Summary

| Component | Tests | Passing | Coverage |
|-----------|-------|---------|----------|
| Observation Access Control | 10 | 10 ✅ | 100% |
| Emergency Access Input Validation | 3 | 3 ✅ | 100% |
| **Total** | **13** | **13 ✅** | **100%** |

## Critical Business Logic Tested

### ✅ Fully Tested
1. **3-Hour Observation Edit Lock**
   - Time-based access rules
   - Legacy record handling
   - Permission system (creator, editableBy)

2. **Medication Status Management**
   - Automatic Active/Past transitions
   - Time-based status updates
   - Database save verification

3. **Emergency Access Security**
   - Input validation (justification length)
   - Role-based access control (doctors only)
   - Request parameter validation

### 📋 Recommended Additional Testing

For comprehensive coverage, consider adding:

1. **Integration Tests** (using Supertest)
   - Full HTTP request/response cycle
   - Database operations
   - Error handling middleware
   - Authentication flow

2. **End-to-End Tests**
   - Complete user workflows
   - Multi-step processes
   - Real database interactions

## Writing New Tests

### Example: Adding a New Test

```typescript
import { functionToTest } from '../myModule';

describe('My Feature', () => {
  test('should handle valid input correctly', async () => {
    // Arrange: Set up test data
    const input = {
      patientId: 'patient123',
      data: 'test data'
    };
    
    // Act: Call the function
    const result = await functionToTest(input);
    
    // Assert: Verify the outcome
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
  
  test('should throw error for invalid input', async () => {
    // Arrange
    const invalidInput = { patientId: null };
    
    // Act & Assert
    await expect(functionToTest(invalidInput))
      .rejects
      .toThrow('Patient ID is required');
  });
});
```

### Best Practices

1. **Use Descriptive Test Names**
   ```typescript
   ✅ test('should deny access when observation is older than 3 hours')
   ❌ test('test observation access')
   ```

2. **Follow AAA Pattern**
   - **Arrange**: Set up test conditions
   - **Act**: Execute the code being tested
   - **Assert**: Verify the results

3. **Test One Thing Per Test**
   ```typescript
   ✅ test('should validate minimum length')
   ✅ test('should validate maximum length')
   ❌ test('should validate all input fields')  // Too broad
   ```

4. **Use Meaningful Mock Data**
   ```typescript
   ✅ const mockPatient = { _id: 'patient123', name: 'John Doe' };
   ❌ const mockPatient = { a: 'x', b: 'y' };
   ```

5. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
     jest.useRealTimers();
   });
   ```

## Troubleshooting

### Common Issues

#### 1. Path Alias Errors
**Problem**: `Cannot find module '@/models/Patient'`

**Solution**: Ensure `jest.config.cjs` has moduleNameMapper:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1'
}
```

#### 2. TypeScript Compilation Errors
**Problem**: TypeScript errors in test files

**Solution**: Update `tsconfig.json` to include test files:
```json
{
  "include": ["src/**/*", "src/**/__tests__/*"]
}
```

#### 3. Async Test Timeouts
**Problem**: Test times out waiting for async operation

**Solution**: Return or await promises:
```typescript
// ✅ Correct
test('should work', async () => {
  await asyncFunction();
});

// ❌ Wrong
test('should work', () => {
  asyncFunction();  // Not awaited!
});
```

#### 4. Mock Not Working
**Problem**: Mock function not being called

**Solution**: Verify mock setup:
```typescript
// Clear previous calls
jest.clearAllMocks();

// Set up mock implementation
(MyModel.find as jest.Mock).mockResolvedValue([]);

// Verify it was called
expect(MyModel.find).toHaveBeenCalled();
```

## Continuous Integration

Tests run automatically on:
- Every commit
- Pull requests
- Before deployment

**CI Configuration** (example for GitHub Actions):
```yaml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing/)

## Contact & Support

For questions about tests:
1. Check this guide first
2. Review existing test files for examples
3. Consult Jest documentation
4. Ask the development team

---

**Last Updated**: November 18, 2025  
**Version**: 1.0.0
