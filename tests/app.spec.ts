import { test, expect } from '@playwright/test';

test('has title and displays login screen initially', async ({ page }) => {
  await page.goto('/');

  // Check the title
  await expect(page).toHaveTitle(/My Google AI Studio App/i);

  // Check if the login screen is displayed by default (assuming unauthenticated)
  await expect(page.locator('h1')).toContainText('Strategy Lab');
  
  // Verify the Google Sign In button is visible
  const loginButton = page.locator('button', { hasText: 'Sign in with Google' });
  await expect(loginButton).toBeVisible();
});
