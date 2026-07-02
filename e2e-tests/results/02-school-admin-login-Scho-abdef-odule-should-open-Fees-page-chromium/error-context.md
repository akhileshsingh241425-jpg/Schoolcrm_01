# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-school-admin-login.spec.js >> School Admin - Fees Module >> should open Fees page
- Location: e2e-tests\02-school-admin-login.spec.js:67:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://93.127.194.235/login", waiting until "load"

```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | // Helper: Login as school admin
  4   | async function loginAsSchoolAdmin(page) {
> 5   |   await page.goto('/login');
      |              ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  6   |   await page.waitForTimeout(3000);
  7   | 
  8   |   // Step 1: Enter school code
  9   |   const codeInput = page.locator('input').first();
  10  |   await codeInput.fill('ABS');
  11  |   await page.waitForTimeout(2000);
  12  | 
  13  |   // Click Continue
  14  |   const continueBtn = page.locator('button', { hasText: /continue/i });
  15  |   if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  16  |     await continueBtn.click();
  17  |     await page.waitForTimeout(1000);
  18  |   }
  19  | 
  20  |   // Step 2: Fill credentials
  21  |   const emailInput = page.locator('input[type="email"]');
  22  |   await emailInput.waitFor({ timeout: 10000 });
  23  |   await emailInput.fill('mk@gmail.com');
  24  |   await page.locator('input[type="password"]').fill('mk123456');
  25  |   await page.locator('button[type="submit"]').click();
  26  |   await page.waitForTimeout(5000);
  27  | }
  28  | 
  29  | test.describe('School Admin Login', () => {
  30  |   test('should login as school admin with school code', async ({ page }) => {
  31  |     await loginAsSchoolAdmin(page);
  32  |     await page.screenshot({ path: 'e2e-tests/screenshots/10-school-admin-dashboard.png', fullPage: true });
  33  |     const url = page.url();
  34  |     console.log('School Admin URL:', url);
  35  |     expect(url).toContain('dashboard');
  36  |   });
  37  | });
  38  | 
  39  | test.describe('School Admin - Students Module', () => {
  40  |   test('should open Students page', async ({ page }) => {
  41  |     await loginAsSchoolAdmin(page);
  42  |     await page.locator('a, li, div, span', { hasText: /^Students$/i }).first().click();
  43  |     await page.waitForTimeout(3000);
  44  |     await page.screenshot({ path: 'e2e-tests/screenshots/11-students-page.png', fullPage: true });
  45  |   });
  46  | });
  47  | 
  48  | test.describe('School Admin - Staff Module', () => {
  49  |   test('should open Staff page', async ({ page }) => {
  50  |     await loginAsSchoolAdmin(page);
  51  |     await page.locator('a, li, div, span', { hasText: /^Staff$/i }).first().click();
  52  |     await page.waitForTimeout(3000);
  53  |     await page.screenshot({ path: 'e2e-tests/screenshots/12-staff-page.png', fullPage: true });
  54  |   });
  55  | });
  56  | 
  57  | test.describe('School Admin - Attendance Module', () => {
  58  |   test('should open Attendance page', async ({ page }) => {
  59  |     await loginAsSchoolAdmin(page);
  60  |     await page.locator('a, li, div, span', { hasText: /attendance/i }).first().click();
  61  |     await page.waitForTimeout(3000);
  62  |     await page.screenshot({ path: 'e2e-tests/screenshots/13-attendance-page.png', fullPage: true });
  63  |   });
  64  | });
  65  | 
  66  | test.describe('School Admin - Fees Module', () => {
  67  |   test('should open Fees page', async ({ page }) => {
  68  |     await loginAsSchoolAdmin(page);
  69  |     await page.locator('a, li, div, span', { hasText: /fees/i }).first().click();
  70  |     await page.waitForTimeout(3000);
  71  |     await page.screenshot({ path: 'e2e-tests/screenshots/14-fees-page.png', fullPage: true });
  72  |   });
  73  | });
  74  | 
  75  | test.describe('School Admin - Academics Module', () => {
  76  |   test('should open Academics page', async ({ page }) => {
  77  |     await loginAsSchoolAdmin(page);
  78  |     await page.locator('a, li, div, span', { hasText: /academics/i }).first().click();
  79  |     await page.waitForTimeout(3000);
  80  |     await page.screenshot({ path: 'e2e-tests/screenshots/15-academics-page.png', fullPage: true });
  81  |   });
  82  | });
  83  | 
  84  | test.describe('School Admin - Communication Module', () => {
  85  |   test('should open Communication page', async ({ page }) => {
  86  |     await loginAsSchoolAdmin(page);
  87  |     await page.locator('a, li, div, span', { hasText: /communication/i }).first().click();
  88  |     await page.waitForTimeout(3000);
  89  |     await page.screenshot({ path: 'e2e-tests/screenshots/16-communication-page.png', fullPage: true });
  90  |   });
  91  | });
  92  | 
  93  | test.describe('School Admin - Transport Module', () => {
  94  |   test('should open Transport page', async ({ page }) => {
  95  |     await loginAsSchoolAdmin(page);
  96  |     await page.locator('a, li, div, span', { hasText: /transport/i }).first().click();
  97  |     await page.waitForTimeout(3000);
  98  |     await page.screenshot({ path: 'e2e-tests/screenshots/17-transport-page.png', fullPage: true });
  99  |   });
  100 | });
  101 | 
  102 | test.describe('School Admin - Library Module', () => {
  103 |   test('should open Library page', async ({ page }) => {
  104 |     await loginAsSchoolAdmin(page);
  105 |     await page.locator('a, li, div, span', { hasText: /library/i }).first().click();
```