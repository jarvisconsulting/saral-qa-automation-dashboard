export interface ParsedTestCase {
  name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration?: number;
  error?: string;
}

export interface ParsedTestMetrics {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  hasExecutionFailure: boolean;
  testResults: ParsedTestCase[];
}

export class LogParserService {
  parseLog(logText: string): ParsedTestMetrics {
    if (!logText) {
      return { passed: 0, failed: 0, skipped: 0, total: 0, hasExecutionFailure: false, testResults: [] };
    }

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let total = 0;
    const testResults: ParsedTestCase[] = [];

    // Check for execution failure markers in the log
    const hasExecutionFailure =
      logText.includes('WDIO FINISHED WITH EXIT CODE: 1') ||
      logText.includes('WDIO finished with exit code 1') ||
      logText.includes('BUILD FAILURE') ||
      logText.includes('Finished: FAILURE') ||
      /ERROR:\s+script returned exit code/i.test(logText);

    // 1. Mocha / WDIO summary: 'X passing (Ys)', 'Y failing', 'Z pending'
    const passingMatch = logText.match(/(\d+)\s+passing/);
    const failingMatch = logText.match(/(\d+)\s+failing/);
    const pendingMatch = logText.match(/(\d+)\s+pending/);

    if (passingMatch || failingMatch) {
      if (passingMatch) passed = parseInt(passingMatch[1]);
      if (failingMatch) failed = parseInt(failingMatch[1]);
      if (pendingMatch) skipped = parseInt(pendingMatch[1]);
      total = passed + failed + skipped;
    } else {
      // 2. Spec Files summary: Spec Files: X passed, Y failed, Z total
      const specMatch = logText.match(/Spec Files:\s*(\d+)\s+passed,\s*(\d+)\s+failed(?:,\s*(\d+)\s+skipped)?,\s*(\d+)\s+total/i);
      if (specMatch) {
        const specPassed = parseInt(specMatch[1]);
        const specFailed = parseInt(specMatch[2]);
        const specSkipped = specMatch[3] ? parseInt(specMatch[3]) : 0;

        const foundFailedMatch = logText.match(/Found\s+(\d+)\s+failed test\(s\)/i);
        if (foundFailedMatch) {
          failed = parseInt(foundFailedMatch[1]);
          passed = specPassed > 0 ? specPassed : 0;
        } else {
          passed = specPassed;
          failed = specFailed;
          skipped = specSkipped;
        }
        total = passed + failed + skipped;
      }
    }

    // 3. Playwright summary: 'X passed, Y failed, Z skipped'
    const pwMatch = logText.match(/(\d+)\s+passed(?:\s*\(.*?\))?(?:,\s*(\d+)\s+failed)?(?:,\s*(\d+)\s+skipped)?/);
    if (total === 0 && pwMatch) {
      passed = parseInt(pwMatch[1] || '0');
      failed = parseInt(pwMatch[2] || '0');
      skipped = parseInt(pwMatch[3] || '0');
      total = passed + failed + skipped;
    }

    // 4. Maven / TestNG summary: 'Tests run: X, Failures: Y, Errors: Z, Skipped: W'
    const mvnMatch = logText.match(/Tests run:\s*(\d+),\s*Failures:\s*(\d+),\s*Errors:\s*(\d+),\s*Skipped:\s*(\d+)/i);
    if (mvnMatch) {
      const run = parseInt(mvnMatch[1]);
      const failures = parseInt(mvnMatch[2]);
      const errors = parseInt(mvnMatch[3]);
      const skip = parseInt(mvnMatch[4]);
      failed = failures + errors;
      skipped = skip;
      passed = Math.max(0, run - failed - skipped);
      total = run;
    }

    // 5. Cucumber summary
    const cucumberMatch = logText.match(/(\d+)\s+scenarios?\s*\((?:(\d+)\s+passed)?(?:,\s*(\d+)\s+failed)?\)/i);
    if (total === 0 && cucumberMatch) {
      const scenTotal = parseInt(cucumberMatch[1]);
      const scenPassed = parseInt(cucumberMatch[2] || '0');
      const scenFailed = parseInt(cucumberMatch[3] || '0');
      total = scenTotal;
      passed = scenPassed;
      failed = scenFailed;
    }

    // If still 0 tests but execution clearly failed, ensure at least 1 failed test is registered
    if (total === 0 && hasExecutionFailure) {
      failed = 1;
      total = 1;
    }

    // 6. Extract test cases line-by-line
    const lines = logText.split(/\r?\n/);
    const seen = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Mocha failure headline: e.g. "[chrome ... #0-0] 1) Suite Name test name"
      const failureMatch = line.match(/^(?:\[[^\]]+\]\s+)?\s*(\d+)\)\s+(.+)$/);
      if (failureMatch) {
        const testName = failureMatch[2].trim();
        if (!seen.has(testName) && testName.length > 3) {
          seen.add(testName);
          let errorMsg = 'Assertion failure';
          for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
            const nextL = lines[j].replace(/\[[^\]]+\]/g, '').trim();
            if (nextL.length > 5 && !nextL.startsWith('at ') && !nextL.match(/^\d+\)/)) {
              errorMsg = nextL;
              break;
            }
          }
          testResults.push({
            name: testName,
            status: 'FAILED',
            error: errorMsg.slice(0, 300),
          });
        }
      }

      // Passed test headline: e.g. "[chrome ... #0-0]    ✓ test name"
      const passMatch = line.match(/^(?:\[[^\]]+\]\s+)?\s*(?:✓|✔)\s+(.+)$/);
      if (passMatch) {
        const testName = passMatch[1].trim();
        if (!seen.has(testName) && testName.length > 3) {
          seen.add(testName);
          testResults.push({
            name: testName,
            status: 'PASSED',
          });
        }
      }
    }

    // Fallback if no individual test items were parsed but numbers exist
    if (testResults.length === 0 && total > 0) {
      for (let i = 1; i <= failed; i++) {
        testResults.push({
          name: `Automation Test Failure #${i}`,
          status: 'FAILED',
          error: 'Test step execution failure detected in logs',
        });
      }
      for (let i = 1; i <= passed; i++) {
        testResults.push({
          name: `Automation Test #${i}`,
          status: 'PASSED',
        });
      }
      for (let i = 1; i <= skipped; i++) {
        testResults.push({
          name: `Skipped Test #${i}`,
          status: 'SKIPPED',
        });
      }
    }

    return { passed, failed, skipped, total, hasExecutionFailure, testResults };
  }
}

export const logParserService = new LogParserService();
export default logParserService;

