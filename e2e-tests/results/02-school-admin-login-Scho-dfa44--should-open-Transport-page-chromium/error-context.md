# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-school-admin-login.spec.js >> School Admin - Transport Module >> should open Transport page
- Location: e2e-tests\02-school-admin-login.spec.js:94:3

# Error details

```
Test timeout of 120000ms exceeded.
```

```
TimeoutError: locator.fill: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('input').first()

```

```
Tearing down "context" exceeded the test timeout of 120000ms.
```