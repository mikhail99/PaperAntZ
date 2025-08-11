import { test, expect } from '@playwright/test'

const API_BASE = process.env.E2E_API_URL || 'http://localhost:8000/api/v1'

test('Semantic Search shows results and renders summary', async ({ page, request }) => {
  // 1) Seed a document group and a mission
  const groupId = 'e2e_group_1'
  await request.post(`${API_BASE}/document-groups`, { params: { name: groupId, description: 'e2e' } })
  const missionRes = await request.post(`${API_BASE}/idea-missions`, {
    data: { userId: 'e2e', title: 'E2E Mission', documentGroupId: groupId },
  })
  const missionJson = await missionRes.json()
  const missionId = missionJson.data.id as string

  // 2) Navigate and run Semantic Search via UI
  await page.goto(`/idea-mission/${missionId}`)
  await page.getByRole('tab', { name: 'Agent Chat' }).click()
  await expect(page.getByText('Semantic Search')).toBeVisible()
  await page.getByText('Semantic Search').click()
  // Let the chat UI mount after agent selection
  await page.waitForLoadState('networkidle')
  // Scope to the Agent Chat area to avoid hidden inputs elsewhere
  const chatRegion = page.locator('div:has-text("Agent Chat")').first().locator('..')
  const input = chatRegion.getByRole('textbox').first()
  await expect(input).toBeVisible({ timeout: 20000 })
  await input.fill('test')
  // Submit with Enter to avoid flakiness on icon-button selectors
  const resp = await Promise.all([
    page.waitForResponse(r => r.url().includes(`/idea-missions/${missionId}/agents/search/semantic/execute`) && r.status() === 200),
    input.press('Enter'),
  ]).then(values => values[0])
  const json = await resp.json()
  expect(Array.isArray(json.data.results)).toBeTruthy()
  // We allow zero length if collection is empty, but the UI message should be present
  await expect(page.getByText('Semantic Search Results')).toBeVisible()
})

test('Delete Idea Mission removes it', async ({ page, request }) => {
  const groupId = 'e2e_group_2'
  await request.post(`${API_BASE}/document-groups`, { params: { name: groupId, description: 'e2e' } })
  const missionRes = await request.post(`${API_BASE}/idea-missions`, {
    data: { userId: 'e2e', title: 'To Delete', documentGroupId: groupId },
  })
  const missionId = (await missionRes.json()).data.id as string

  await page.goto(`/idea-mission/${missionId}`)
  await page.getByRole('tab', { name: 'Overview' }).click()
  page.on('dialog', d => d.accept())
  await page.getByRole('button', { name: 'Delete Mission' }).click()
  // Confirm dialog; fall back to native confirm hook if needed
  // In headless, window.confirm returns true by default; if not, we can stub it.
  await page.waitForURL('**/research', { waitUntil: 'networkidle' })
})


