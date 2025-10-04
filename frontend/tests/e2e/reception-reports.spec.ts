import { test, expect } from '@playwright/test'

test.describe('Admin Reception Reports', () => {
  test('filters and export CSV', async ({ page }) => {
    // Pré-auth: si l’app nécessite un login, on pourrait setter un token localStorage ici
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
    })

    // Aller sur la page rapports
    await page.goto('http://localhost:4444/admin/reception-reports')

    // Attendre le titre
    await expect(page.getByRole('heading', { name: 'Rapports de Réception' })).toBeVisible()

    // Sélectionner une catégorie si présente
    const categorySelect = page.locator('#category')
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 }).catch(() => {})
    }

    // Cliquer sur Exporter CSV
    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '📊 Exporter CSV' }).click()
    ])

    const filename = await download.suggestedFilename()
    expect(filename).toContain('rapport_reception')
  })
})


