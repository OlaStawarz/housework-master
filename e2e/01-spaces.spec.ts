import { test } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SpacesPage } from './pages/SpacesPage';

test.describe('Space Management', () => {
  let spaceName: string;
  let loginPage: LoginPage;
  let spacesPage: SpacesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    spacesPage = new SpacesPage(page);

    await loginPage.goto();
    await loginPage.loginWithDefaultUser();
  });

  test('should create a new space with tasks from template', async ({ page }) => {
    await spacesPage.goto();

    spaceName = `Kuchnia`;
    await spacesPage.createSpace(spaceName);
    
    // Dodaj zadania z szablonu
    await spacesPage.confirmTemplateTasks();
    
    // Weryfikacja na liście
    await spacesPage.verifySpaceVisible(spaceName);
  });

  test('should manage custom tasks in a space', async ({ page }) => {
    await spacesPage.goto();

    // Przejdź do szczegółów
    await spacesPage.openSpace(spaceName);

    // 1. Dodaj zadanie customowe
    const customTaskName = 'My Custom Task';
    await spacesPage.addCustomTask(customTaskName);

    // Weryfikacja dodania
    await spacesPage.verifyTaskVisible(customTaskName);

    // 2. Edytuj zadanie (cykliczność)
    await spacesPage.editTaskRecurrence(customTaskName);

    // 3. Usuń zadanie
    await spacesPage.deleteTask(customTaskName);

    await spacesPage.verifyTaskNotVisible(customTaskName);
  });
});
