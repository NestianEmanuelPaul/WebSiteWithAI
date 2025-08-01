interface TestResult {
  success: boolean;
  error?: string;
  output?: string;
}

export class CodeTestingService {
  private maxAttempts: number;
  private baseUrl: string;

  constructor(maxAttempts: number = 5, baseUrl: string = '') {
    this.maxAttempts = maxAttempts;
    this.baseUrl = baseUrl;
  }

  async testAndFixCode(
    code: string,
    testFn: (code: string) => Promise<TestResult>,
    onProgress?: (attempt: number, result: TestResult) => void
  ): Promise<{ 
    code: string; 
    success: boolean; 
    attempts: number;
    error?: string;
    results: TestResult[];
  }> {
    let currentCode = code;
    let attempt = 0;
    const results: TestResult[] = [];

    while (attempt < this.maxAttempts) {
      attempt++;
      console.log(`Test attempt ${attempt}...`);

      const result = await testFn(currentCode);
      results.push(result);
      
      // Report progress
      if (onProgress) {
        onProgress(attempt, result);
      }
      
      if (result.success) {
        return { 
          code: currentCode, 
          success: true, 
          attempts: attempt,
          results
        };
      }

      console.log('Test failed, attempting to fix...', result.error);

      try {
        const fixedCode = await this.generateFix(currentCode, result.error || '');
        
        if (fixedCode === currentCode) {
          console.log('No more fixes available');
          break;
        }
        
        currentCode = fixedCode;
      } catch (error) {
        console.error('Error generating fix:', error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error during fix generation',
          output: 'Failed to generate fix'
        });
        break;
      }
    }

    return { 
      code: currentCode, 
      success: false, 
      attempts: this.maxAttempts,
      error: results[results.length - 1]?.error || 'Max attempts reached',
      results
    };
  }

  private async generateFix(code: string, error: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/fix-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          error: error || 'Unknown error occurred' 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const { fixedCode } = await response.json();
      
      if (!fixedCode) {
        throw new Error('No fixed code returned from API');
      }
      
      return fixedCode;
    } catch (error) {
      console.error('Error in generateFix:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }
}
