const { test, expect } = require('@playwright/test');

// Helper: Login as school admin
async function loginAsSchoolAdmin(page) {
  await page.goto('/login');
  await page.waitForTimeout(3000);

  // Step 1: Enter school code
  const codeInput = page.locator('input').first();
  await codeInput.fill('ABS');
  await page.waitForTimeout(2000);

  // Click Continue
  const continueBtn = page.locator('button', { hasText: /continue/i });
  if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await continueBtn.click();
    await page.waitForTimeout(1000);
  }

  // Step 2: Fill credentials
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ timeout: 10000 });
  await emailInput.fill('mk@gmail.com');
  await page.locator('input[type="password"]').fill('mk123456');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(5000);
}

test.describe('School Admin Login', () => {
  test('should login as school admin with school code', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.screenshot({ path: 'e2e-tests/screenshots/10-school-admin-dashboard.png', fullPage: true });
    const url = page.url();
    console.log('School Admin URL:', url);
    expect(url).toContain('dashboard');
  });
});

test.describe('School Admin - Students Module', () => {
  test('should open Students page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /^Students$/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/11-students-page.png', fullPage: true });
  });
});

test.describe('School Admin - Staff Module', () => {
  test('should open Staff page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /^Staff$/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/12-staff-page.png', fullPage: true });
  });
});

test.describe('School Admin - Attendance Module', () => {
  test('should open Attendance page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /attendance/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/13-attendance-page.png', fullPage: true });
  });
});

test.describe('School Admin - Fees Module', () => {
  test('should open Fees page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /fees/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/14-fees-page.png', fullPage: true });
  });
});

test.describe('School Admin - Academics Module', () => {
  test('should open Academics page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /academics/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/15-academics-page.png', fullPage: true });
  });
});

test.describe('School Admin - Communication Module', () => {
  test('should open Communication page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /communication/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/16-communication-page.png', fullPage: true });
  });
});

test.describe('School Admin - Transport Module', () => {
  test('should open Transport page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /transport/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/17-transport-page.png', fullPage: true });
  });
});

test.describe('School Admin - Library Module', () => {
  test('should open Library page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /library/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/18-library-page.png', fullPage: true });
  });
});

test.describe('School Admin - Inventory Module', () => {
  test('should open Inventory page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /inventory/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/19-inventory-page.png', fullPage: true });
  });
});

test.describe('School Admin - Reports Module', () => {
  test('should open Reports page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /reports/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/20-reports-page.png', fullPage: true });
  });
});

test.describe('School Admin - Settings', () => {
  test('should open Settings page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /^Settings$/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/21-settings-page.png', fullPage: true });
  });
});

test.describe('School Admin - Hostel Module', () => {
  test('should open Hostel page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /hostel/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/22-hostel-page.png', fullPage: true });
  });
});

test.describe('School Admin - Canteen Module', () => {
  test('should open Canteen page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /canteen/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/23-canteen-page.png', fullPage: true });
  });
});

test.describe('School Admin - Sports Module', () => {
  test('should open Sports page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /sports/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/24-sports-page.png', fullPage: true });
  });
});

test.describe('School Admin - Health Module', () => {
  test('should open Health page', async ({ page }) => {
    await loginAsSchoolAdmin(page);
    await page.locator('a, li, div, span', { hasText: /health/i }).first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/25-health-page.png', fullPage: true });
  });
});
