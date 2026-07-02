const { test, expect } = require('@playwright/test');

test.describe('Super Admin Login & Dashboard', () => {
  test('should login as super admin without school code', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/01-login-page.png', fullPage: true });

    // Click "Login as Super Admin" button (outlined button at bottom)
    const superAdminBtn = page.locator('button', { hasText: /super admin/i });
    await superAdminBtn.waitFor({ timeout: 10000 });
    await superAdminBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e-tests/screenshots/02-step2-form.png', fullPage: true });

    // Fill email and password
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ timeout: 5000 });
    await emailInput.fill('admin@schoolcrm.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('superadmin123');
    await page.screenshot({ path: 'e2e-tests/screenshots/03-credentials-filled.png', fullPage: true });

    // Click Sign In
    const signInBtn = page.locator('button[type="submit"]');
    await signInBtn.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'e2e-tests/screenshots/04-after-login.png', fullPage: true });

    // Verify we are on super admin panel
    const url = page.url();
    console.log('Current URL:', url);
    expect(url).toContain('super-admin');
  });

  test('should see schools list', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForTimeout(3000);
    const superAdminBtn = page.locator('button', { hasText: /super admin/i });
    await superAdminBtn.waitFor({ timeout: 10000 });
    await superAdminBtn.click();
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"]').fill('admin@schoolcrm.com');
    await page.locator('input[type="password"]').fill('superadmin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Go to All Schools
    const schoolsLink = page.locator('a, li, div', { hasText: /all schools/i }).first();
    await schoolsLink.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/05-schools-list.png', fullPage: true });
  });

  test('should navigate to Manage Users', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForTimeout(3000);
    const superAdminBtn = page.locator('button', { hasText: /super admin/i });
    await superAdminBtn.waitFor({ timeout: 10000 });
    await superAdminBtn.click();
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"]').fill('admin@schoolcrm.com');
    await page.locator('input[type="password"]').fill('superadmin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Navigate to Manage Users
    const usersLink = page.locator('a, li, div', { hasText: /manage users/i }).first();
    await usersLink.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/06-manage-users.png', fullPage: true });
  });

  test('should navigate to Subscriptions', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForTimeout(3000);
    const superAdminBtn = page.locator('button', { hasText: /super admin/i });
    await superAdminBtn.waitFor({ timeout: 10000 });
    await superAdminBtn.click();
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"]').fill('admin@schoolcrm.com');
    await page.locator('input[type="password"]').fill('superadmin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Navigate to Subscriptions
    const subLink = page.locator('a, li, div', { hasText: /subscription/i }).first();
    await subLink.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/07-subscriptions.png', fullPage: true });
  });

  test('should navigate to Audit Logs', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForTimeout(3000);
    const superAdminBtn = page.locator('button', { hasText: /super admin/i });
    await superAdminBtn.waitFor({ timeout: 10000 });
    await superAdminBtn.click();
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"]').fill('admin@schoolcrm.com');
    await page.locator('input[type="password"]').fill('superadmin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Navigate to Audit Logs
    const auditLink = page.locator('a, li, div', { hasText: /audit/i }).first();
    await auditLink.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e-tests/screenshots/08-audit-logs.png', fullPage: true });
  });
});
