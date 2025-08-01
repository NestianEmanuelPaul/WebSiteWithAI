import { test, expect } from '@playwright/test';

test.describe('Database Connection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page with the database connection component
    await page.goto('http://localhost:3000'); // Update with your app's URL
    
    // Open the database connection dialog
    await page.click('button:has-text("Connect to Database")');
  });

  test('should connect a button to a database field', async ({ page }) => {
    // Mock the API response for schema
    await page.route('**/api/db/schema', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: {
            columns: [
              { name: 'id', type: 'integer', nullable: false, primary_key: true },
              { name: 'name', type: 'text', nullable: false },
              { name: 'email', type: 'text', nullable: true }
            ],
            foreign_keys: []
          }
        })
      });
    });

    // Mock the AI fix endpoint
    await page.route('**/api/ai/fix-code', async route => {
      const request = route.request();
      const postData = await request.postDataJSON();
      
      // Simple mock fix - in reality, this would call the actual AI service
      const fixedCode = postData.code.replace('error', '// Fixed: ' + postData.error);
      
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          fixedCode: fixedCode
        })
      });
    });

    // 1. Select a table
    await page.selectOption('select[aria-label="Table"]', { label: 'users' });
    
    // 2. Select a field
    await page.selectOption('select[aria-label="Field"]', { label: 'email' });
    
    // 3. Generate and test code
    await page.click('button:has-text("Generate & Test Code")');
    
    // 4. Wait for the code to be generated and tested
    const codeOutput = page.locator('.code-output');
    await expect(codeOutput).toBeVisible({ timeout: 30000 });
    
    // 5. Verify the generated code contains expected patterns
    const code = await codeOutput.textContent();
    expect(code).toContain('useState');
    expect(code).toContain('useEffect');
    expect(code).toContain('fetch');
    
    // 6. Verify success message is shown
    await expect(page.locator('text=Code passed all tests')).toBeVisible();
  });

  test('should show error when API fails', async ({ page }) => {
    // Mock a failed API response
    await page.route('**/api/db/schema', route => {
      return route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      });
    });

    // Try to generate code
    await page.click('button:has-text("Generate & Test Code")');
    
    // Verify error message is shown
    await expect(page.locator('text=Failed to load database schema')).toBeVisible();
  });
});
