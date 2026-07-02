const { test, expect } = require('@playwright/test');

const MODULES = [
  { name: 'Attendance', path: 'attendance' },
  { name: 'Fees', path: 'fees' },
  { name: 'Academics', path: 'academics' },
  { name: 'Communication', path: 'communication' },
  { name: 'Transport', path: 'transport' },
  { name: 'Library', path: 'library' },
  { name: 'Reports', path: 'reports' },
  { name: 'Inventory', path: 'inventory' },
];

test.describe('Module Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as school admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder*="school"], input[label*="School Code"]', 'ABS');
    await page.waitForTimeout(1500);
    const continueBtn = page.getByText('Continue');
    if (await continueBtn.isVisible()) await continueBtn.click();
    await page.waitForTimeout(500);
    await page.fill('input[type="email"], input[placeholder*="email"]', 'mk@gmail.com');
    await page.fill('input[type="password"], input[placeholder*="password"]', 'mk123456');
    await page.click('button[type="submit"], button:has-text("Sign In")');
    await page.waitForTimeout(3000);
  });

  for (const mod of MODULES) {
    test(`should navigate to ${mod.name} module`, async ({ page }) => {
      const link = page.getByText(mod.name, { exact: true }).first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `e2e-tests/screenshots/module-${mod.path}.png` });
      }
    });
  }
});
