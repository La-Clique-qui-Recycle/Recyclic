import { test, expect } from '@playwright/test';

test.describe('E2E: Workflow de modification du profil utilisateur', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Mettre en place une connexion via l'API pour éviter de dépendre de l'UI
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('devrait permettre à un admin de modifier un profil et de voir les changements', async ({ page }) => {
    await page.goto('/admin/users');

    // Attendre que la table des utilisateurs soit chargée
    await expect(page.locator('table')).toBeVisible();

    // Cliquer sur le premier utilisateur de la liste (ne pas dépendre d'un utilisateur spécifique)
    await page.locator('table tbody tr:first-child').click();

    // Cliquer sur le bouton "Modifier le profil"
    await page.click('button:has-text("Modifier le profil")');

    // Attendre que la modale soit visible
    await expect(page.locator('.mantine-Modal-modal')).toBeVisible();

    // Modifier les champs
    const firstNameInput = page.locator('input[name="first_name"]');
    const newFirstName = `FirstName-${Date.now()}`;
    await firstNameInput.fill(newFirstName);

    const usernameInput = page.locator('input[name="username"]');
    const newUsername = `username-${Date.now()}`;
    await usernameInput.fill(newUsername);

    // Cliquer sur "Sauvegarder"
    await page.click('button:has-text("Sauvegarder")');

    // Attendre que la modale se ferme
    await expect(page.locator('.mantine-Modal-modal')).not.toBeVisible();

    // Recharger la page pour s'assurer que les données sont persistantes
    await page.reload();

    // Vérifier que les nouvelles informations sont affichées
    await expect(page.locator(`text=${newFirstName}`)).toBeVisible();
    await expect(page.locator(`text=@${newUsername}`)).toBeVisible();
  });
});
