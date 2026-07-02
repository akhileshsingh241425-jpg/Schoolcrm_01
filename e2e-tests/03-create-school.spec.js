const { test, expect } = require('@playwright/test');

test.describe('Create School Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super admin
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const superAdminBtn = page.getByText('Login as Super Admin');
    if (await superAdminBtn.isVisible()) await superAdminBtn.click();
    await page.waitForTimeout(500);
    await page.fill('input[type="email"], input[placeholder*="email"]', 'admin@schoolcrm.com');
    await page.fill('input[type="password"], input[placeholder*="password"]', 'superadmin123');
    await page.click('button[type="submit"], button:has-text("Sign In")');
    await page.waitForTimeout(3000);
  });

  test('should navigate to Create School page', async ({ page }) => {
    await page.click('text=Create School');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e-tests/screenshots/12-create-school-page.png' });
    await expect(page.getByText('Create New School')).toBeVisible();
  });

  test('should fill and submit school creation form', async ({ page }) => {
    await page.click('text=Create School');
    await page.waitForTimeout(2000);

    // Fill school info
    await page.fill('input[value=""], input:near(:text("School Name"))', 'Playwright Test School');
    await page.waitForTimeout(300);
    await page.fill('input:near(:text("School Email"))', 'playwright@test.com');
    await page.waitForTimeout(300);
    await page.fill('input:near(:text("Phone"))', '9999999999');
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'e2e-tests/screenshots/13-school-form-filled.png' });

    // Submit
    const saveBtn = page.getByRole('button', { name: /create|save|submit/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'e2e-tests/screenshots/14-school-created.png' });
    }
  });
});
