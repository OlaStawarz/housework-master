import { type Page, type Locator, expect } from '@playwright/test';

export class SpacesPage {
  readonly page: Page;
  readonly addSpaceButton: Locator;
  readonly spaceNameInput: Locator;
  readonly spaceTypeTrigger: Locator;
  readonly createSpaceSubmitButton: Locator;
  readonly addTasksSubmitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addSpaceButton = page.getByTestId('add-space-button');
    this.spaceNameInput = page.getByTestId('space-name-input');
    this.spaceTypeTrigger = page.getByTestId('space-type-select-trigger');
    this.createSpaceSubmitButton = page.getByTestId('create-space-submit-button');
    this.addTasksSubmitButton = page.getByTestId('add-tasks-submit-button');
  }

  async goto() {
    await this.page.goto('/spaces');
    await this.page.waitForLoadState('networkidle');
  }

  async createSpace(name: string) {
    // Check if we are on the spaces page, if not go there
    if (!this.page.url().includes('/spaces')) {
        await this.goto();
    }
    
    await this.addSpaceButton.first().click();
    await this.spaceNameInput.fill(name);
    
    await this.spaceTypeTrigger.click();
    // Select first type
    await this.page.locator('[data-testid^="space-type-item-"]').first().click();
    
    await this.createSpaceSubmitButton.click();
  }

  async confirmTemplateTasks() {
    await expect(this.addTasksSubmitButton).toBeVisible();
    await this.addTasksSubmitButton.click();
  }

  async verifySpaceVisible(name: string) {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async openSpace(name: string) {
    await this.page.getByText(name).click();
    await this.page.waitForURL(/\/spaces\//);
  }

  async addCustomTask(taskName: string) {
    const btn = this.page.getByRole('button', { name: 'Dodaj zadanie' }).filter({ hasText: 'Dodaj zadanie' });
    
    // Wait for either button to be visible. This handles loading states.
    await expect(btn).toBeVisible();
    
    await btn.click();

    await expect(this.page.getByRole('dialog', { name: 'Dodaj nowe zadanie' })).toBeVisible();
    await this.page.getByLabel('Nazwa zadania').fill(taskName);
    await this.page.getByRole('button', { name: 'Utwórz' }).click();
  }

  async verifyTaskVisible(taskName: string) {
    await expect(this.page.getByText(taskName)).toBeVisible();
  }

  async verifyTaskNotVisible(taskName: string) {
     // Use test id to ensure we are checking the card, not just text (which might be in a dialog or toast)
     await expect(this.page.getByTestId(`task-card-${taskName}`)).not.toBeVisible({ timeout: 10000 });
  }

  async editTaskRecurrence(taskName: string) {
    // Target the card container specifically using data-testid
    const taskCard = this.page.getByTestId(`task-card-${taskName}`).first();
    
    // Ensure card is visible and scrolled into view
    await expect(taskCard).toBeVisible();
    await taskCard.scrollIntoViewIfNeeded();
    
    const editBtn = taskCard.getByTestId('edit-task-button');
    // Ensure button is visible. If it's inside a hover group, we might need to hover the card first.
    // TaskCard implementation shows actions by default unless hideActions is true.
    // But let's hover just in case there are hover effects or it helps with visibility.
    await taskCard.hover();
    
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    
    await expect(this.page.getByRole('dialog', { name: /Edytuj cykliczność/ })).toBeVisible();
    await expect(this.page.getByLabel('Częstotliwość')).toBeVisible();
    await this.page.getByLabel('Częstotliwość').fill('10');
    await this.page.getByRole('button', { name: 'Zapisz' }).click();
  }

  async deleteTask(taskName: string) {
    const taskCard = this.page.getByTestId(`task-card-${taskName}`).first();
    
    // Ensure card is visible and scrolled into view
    await expect(taskCard).toBeVisible();
    await taskCard.scrollIntoViewIfNeeded();
    await taskCard.hover();

    const deleteBtn = taskCard.getByTestId('delete-task-button');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    
    // Wait for the dialog title or content to be visible
    const confirmButton = this.page.getByTestId('confirm-dialog-button');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
    
    // Wait for the dialog to disappear
    await expect(this.page.getByRole('dialog')).not.toBeVisible();
  }
}

