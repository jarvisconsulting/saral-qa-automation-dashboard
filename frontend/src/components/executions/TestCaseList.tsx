import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { TestResult } from '../../types';

interface TestCaseListProps {
  testResults: TestResult[];
}

export const TestCaseList: React.FC<TestCaseListProps> = ({ testResults }) => {
  if (!testResults || testResults.length === 0) {
    return (
      <div className="card p-8 text-center text-xs text-slate-400 italic">
        No individual test case results reported for this execution yet.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
          Executed Test Cases ({testResults.length})
        </h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {testResults.map((tc) => {
          const isPassed = tc.status === 'PASSED';
          const isFailed = tc.status === 'FAILED';
          return (
            <div key={tc.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                  {isFailed && <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  {!isPassed && !isFailed && <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                  <div>
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      {tc.name}
                    </span>
                    {tc.suite && (
                      <p className="text-[11px] text-slate-400 mt-0.5">Suite: {tc.suite}</p>
                    )}
                  </div>
                </div>
                {tc.duration && (
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {(tc.duration / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              {isFailed && tc.error && (
                <div className="mt-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs">
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Error Output:</span>
                  </div>
                  <pre className="font-mono text-[11px] text-red-700 dark:text-red-300 whitespace-pre-wrap overflow-x-auto">
                    {tc.error}
                  </pre>
                  {tc.stackTrace && (
                    <pre className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-red-200 dark:border-red-900/40 whitespace-pre-wrap">
                      {tc.stackTrace}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
