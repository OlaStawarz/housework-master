import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.submitButton = page.getByTestId('login-submit-button');
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    // Check if we are already redirected to dashboard (e.g. existing session)
    if (this.page.url().includes('/dashboard')) {
        return;
    }
    
    // Check if inputs are visible
    if (await this.emailInput.isVisible()) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
        await this.page.waitForURL(/\/dashboard/, { timeout: 30000, waitUntil: 'domcontentloaded' });
    } else {
        // Fallback: check if we ended up on dashboard anyway
        await this.page.waitForURL(/\/dashboard/, { timeout: 10000, waitUntil: 'domcontentloaded' });
    }
  }

  async loginWithDefaultUser() {
    const email = process.env.E2E_USERNAME || 'testuser@example.com';
    const password = process.env.E2E_PASSWORD || 'testuser';
    await this.login(email, password);
  }
}

