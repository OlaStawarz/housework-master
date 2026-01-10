import { type Page, type Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async verifyOverdueSectionVisible() {
    await expect(this.page.getByRole('heading', { name: /Zaległe/ })).toBeVisible();
  }

  async verifyUpcomingSectionVisible() {
    await expect(this.page.getByRole('heading', { name: /Nadchodzące/ })).toBeVisible();
  }

  async verifyTaskVisible(taskName: string) {
    await expect(this.page.getByText(taskName)).toBeVisible();
  }

  async completeTask(taskName: string) {   
    const taskCard = this.page.getByTestId(`task-card-${taskName}`).first();
    await taskCard.scrollIntoViewIfNeeded();
    
    const checkbox = taskCard.getByTestId('complete-task-checkbox');
    await expect(checkbox).toBeVisible();
    await checkbox.click();
    
    await expect(taskCard).toHaveClass(/opacity-50/);
  }

  async postponeTask(taskName: string) {
    const taskCard = this.page.getByTestId(`task-card-${taskName}`).first();
    await taskCard.scrollIntoViewIfNeeded();
    
    const postponeBtn = taskCard.getByTestId('postpone-task-button');
    await expect(postponeBtn).toBeVisible();

    await postponeBtn.click();
  }
}

