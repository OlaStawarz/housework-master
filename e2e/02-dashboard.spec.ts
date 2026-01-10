import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Dashboard', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  // Setup mocks before each test
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // // Mock check for spaces (return true so we don't see onboarding)
    // await page.route('**/api/spaces?limit=1', async route => {
    //   await route.fulfill({
    //     json: {
    //       data: [{ id: 'space-1', name: 'Test Space' }],
    //       meta: { total: 1 }
    //     }
    //   });
    // });

    // Mock dashboard tasks
    await page.route('**/api/dashboard/tasks*', async route => {
      const url = new URL(route.request().url());
      const section = url.searchParams.get('section');
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (section === 'overdue') {
        await route.fulfill({
          json: {
            data: [
              {
                id: 'task-overdue-1',
                name: 'Zaległe Zadanie',
                due_date: yesterday.toISOString(),
                recurrence_unit: 'days',
                recurrence_value: 1,
                postponement_count: 0,
                space: { id: 'space-1', name: 'Kuchnia' }
              }
            ],
            pagination: { total: 1 }
          }
        });
      } else if (section === 'upcoming') {
        await route.fulfill({
          json: {
            data: [
              {
                id: 'task-upcoming-1',
                name: 'Nadchodzące Zadanie',
                due_date: tomorrow.toISOString(),
                recurrence_unit: 'days',
                recurrence_value: 1,
                postponement_count: 0,
                space: { id: 'space-1', name: 'Kuchnia' }
              }
            ],
            pagination: { total: 1 }
          }
        });
      } else {
        await route.fulfill({ json: { data: [], pagination: { total: 0 } } });
      }
    });

    await loginPage.goto();
    await loginPage.loginWithDefaultUser();
  });

  test('should display overdue and upcoming tasks', async () => {
    await dashboardPage.verifyOverdueSectionVisible();
    await dashboardPage.verifyTaskVisible('Zaległe Zadanie');
    
    await dashboardPage.verifyUpcomingSectionVisible();
    await dashboardPage.verifyTaskVisible('Nadchodzące Zadanie');
  });

  test('should allow completing a task', async () => {
    // Wait for the task to be rendered first
    await dashboardPage.verifyTaskVisible('Nadchodzące Zadanie');

    await dashboardPage.completeTask('Nadchodzące Zadanie');
  });

  test('should allow postponing an overdue task', async ({ page }) => {
    // Wait for the task to be rendered first
    await dashboardPage.verifyTaskVisible('Zaległe Zadanie');

    const postponeRequest = page.waitForRequest(req => 
      req.url().includes('/postpone') && req.method() === 'POST'
    );
    
    await dashboardPage.postponeTask('Zaległe Zadanie');
    
    const request = await postponeRequest;
    expect(request.url()).toContain('task-overdue-1');
  });
});
