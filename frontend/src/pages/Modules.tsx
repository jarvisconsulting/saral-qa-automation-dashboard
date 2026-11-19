import React, { useState } from 'react';
import {
  Boxes,
  Play,
  Terminal,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Search,
  ExternalLink,
  RefreshCw,
  FileCode,
  Tag,
  Calendar,
  Lock,
  GitBranch,
  Shield,
  Eye,
} from 'lucide-react';
import { useModules, useAllTestCases, useModuleTestCases, useSyncGitHub } from '../api/hooks';
import { TriggerModal } from '../components/executions/TriggerModal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../stores/authStore';
import { AutomationModule, TestCase } from '../types';

export const Modules: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || (user?.role as string) === 'QA_LEAD';

  const { data, isLoading } = useModules();
  const modules = data?.modules || [];

  const { data: testCasesData, isLoading: isTestCasesLoading } = useAllTestCases();
  const allTestCases = testCasesData?.testCases || [];

  const syncGitHubMutation = useSyncGitHub();

  const [activeTab, setActiveTab] = useState<'MODULES' | 'TEST_CASES'>('MODULES');
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'WEB' | 'MOBILE' | 'API'>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');
  const [selectedModuleIdForTrigger, setSelectedModuleIdForTrigger] = useState<string | null>(null);

  // Modal for inspecting specific module test cases
  const [inspectingModule, setInspectingModule] = useState<AutomationModule | null>(null);
  const { data: moduleCasesData } = useModuleTestCases(inspectingModule?.id || '');
  const inspectingCases = moduleCasesData?.testCases || [];

  // Filter modules
  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.framework.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = platformFilter === 'ALL' || m.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  // Filter test cases
  const filteredTestCases = allTestCases.filter((tc) => {
    const matchesSearch =
      tc.title.toLowerCase().includes(search.toLowerCase()) ||
      (tc.description && tc.description.toLowerCase().includes(search.toLowerCase())) ||
      tc.filePath.toLowerCase().includes(search.toLowerCase()) ||
      (tc.testIdentifier && tc.testIdentifier.toLowerCase().includes(search.toLowerCase())) ||
      (tc.module?.displayName && tc.module.displayName.toLowerCase().includes(search.toLowerCase()));

    const matchesPlatform =
      platformFilter === 'ALL' || (tc.module?.platform === platformFilter);

    const matchesTag =
      tagFilter === 'ALL' || tc.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase());

    return matchesSearch && matchesPlatform && matchesTag;
  });

  // Extract all unique tags
  const allUniqueTags = Array.from(
    new Set(allTestCases.flatMap((tc) => tc.tags || []))
  ).slice(0, 10);

  const handleManualSync = async () => {
    try {
      const res = await syncGitHubMutation.mutateAsync('main');
      alert(`Repository Synchronized!\nDiscovered: ${res.result?.totalDiscovered} test cases\nUpdated: ${res.result?.updated}\nNew Modules: ${res.result?.modulesDiscovered}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Synchronization failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <span>Automation Modules & Dynamic Test Cases</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-slate-400" />
            <span>Synchronized with <code>saral-automation</code> repository • Environment: Staging</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isAdmin ? (
            <button
              onClick={handleManualSync}
              disabled={syncGitHubMutation.isPending}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              title="Scan connected GitHub repository for newly committed test scripts"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${syncGitHubMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{syncGitHubMutation.isPending ? 'Syncing...' : 'Sync Repository'}</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200 dark:border-slate-700"
              title="Read-Only users cannot trigger repository synchronization"
            >
              <Eye className="w-3 h-3" />
              <span>Read-Only Mode</span>
            </div>
          )}

          {isAdmin ? (
            <button
              onClick={() => setSelectedModuleIdForTrigger(modules[0]?.id || '')}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Suite</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200 dark:border-slate-700"
              title="Read-Only users cannot execute test suites"
            >
              <Lock className="w-3 h-3" />
              <span>Execution Disabled</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Switcher: Modules vs Dynamic Test Cases */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('MODULES')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'MODULES'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Automation Modules</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            {modules.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('TEST_CASES')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === 'TEST_CASES'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Repository Dynamic Test Cases</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {allTestCases.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                activeTab === 'MODULES'
                  ? 'Search modules, frameworks...'
                  : 'Search test cases, file paths, tags...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['ALL', 'WEB', 'MOBILE', 'API'] as const).map((plt) => (
              <button
                key={plt}
                onClick={() => setPlatformFilter(plt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  platformFilter === plt
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {plt === 'ALL' ? 'All Platforms' : plt}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Quick Filters for Test Cases Tab */}
        {activeTab === 'TEST_CASES' && allUniqueTags.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>Tags:</span>
            </span>
            <button
              onClick={() => setTagFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                tagFilter === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All Tags
            </button>
            {allUniqueTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  tagFilter === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- TAB 1: MODULES VIEW --- */}
      {activeTab === 'MODULES' && (
        <>
          {isLoading ? (
            <LoadingSpinner text="Scanning modules from automation repository..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.map((mod) => (
                <div
                  key={mod.id}
                  className="card p-5 card-hover flex flex-col justify-between border-slate-200 dark:border-slate-800"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                          {mod.platform} • {mod.framework}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">
                          {mod.displayName}
                        </h3>
                      </div>
                      <StatusBadge status={mod.lastStatus || 'never'} showIcon={false} />
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                      {mod.description || 'Automation suite for validating core workflows.'}
                    </p>

                    {/* Discovered Test Cases Badge */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 mb-3 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-semibold">
                          <FileCode className="w-3.5 h-3.5 text-blue-600" />
                          <span>Repo Test Cases</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Unique automation scripts</span>
                      </div>
                      <span className="font-bold text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[11px]">
                        {mod.discoveredCasesCount || 0} Scripts
                      </span>
                    </div>

                    {/* Staging Metrics */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-center mb-4">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold" title="Historical verification pass rate">
                          Pass Rate
                        </span>
                        <span className="font-bold text-sm text-emerald-600">
                          {mod.passRate !== undefined ? `${mod.passRate}%` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold" title="Total cumulative tests verified across all historical build runs">
                          Tests Executed
                        </span>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {mod.totalTests ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold" title="Average duration per execution run">
                          Avg Time
                        </span>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {mod.avgDuration ? `${mod.avgDuration}s` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setInspectingModule(mod)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Test Cases</span>
                    </button>

                    {isAdmin ? (
                      <button
                        onClick={() => setSelectedModuleIdForTrigger(mod.id)}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Execute</span>
                      </button>
                    ) : (
                      <span
                        className="text-[11px] text-slate-400 flex items-center gap-1 cursor-not-allowed"
                        title="Read-Only users cannot execute"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Read-Only</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- TAB 2: DYNAMIC TEST CASES VIEW (Populated directly from GitHub) --- */}
      {activeTab === 'TEST_CASES' && (
        <>
          {isTestCasesLoading ? (
            <LoadingSpinner text="Loading repository test cases..." />
          ) : filteredTestCases.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 space-y-3">
              <FileCode className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No Test Cases Found</h3>
              <p className="text-xs max-w-sm mx-auto">
                No automated test cases matched your filter. Click "Sync Repository" to discover newly committed test scripts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTestCases.map((tc) => (
                <div
                  key={tc.id}
                  className="card p-4 card-hover flex flex-col justify-between border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Module Name & Framework Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate max-w-[180px]">
                        {tc.module?.displayName || 'Saral Automation'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                        {tc.framework}
                      </span>
                    </div>

                    {/* Test Title & Identifier */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {tc.testIdentifier && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {tc.testIdentifier}
                          </span>
                        )}
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                          {tc.title}
                        </h4>
                      </div>
                      {tc.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {tc.description}
                        </p>
                      )}
                    </div>

                    {/* Repository File Path */}
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 overflow-hidden">
                      <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={tc.filePath}>
                        {tc.filePath}
                      </span>
                    </div>

                    {/* Tags List */}
                    <div className="flex flex-wrap gap-1">
                      {tc.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active in Repo</span>
                    </span>

                    <span className="flex items-center gap-1" title="Last Synchronized">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(tc.lastSyncedAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- MODAL: INSPECT SPECIFIC MODULE TEST CASES --- */}
      {inspectingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="card w-full max-w-3xl max-h-[85vh] p-6 bg-white dark:bg-slate-900 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {inspectingModule.platform} • {inspectingModule.framework}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {inspectingModule.displayName} – Dynamic Test Cases
                </h3>
              </div>
              <button
                onClick={() => setInspectingModule(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Discovered from repository folder: <code>{inspectingModule.repoPath}</code>
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {inspectingCases.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No automated test cases found for this module yet. Run "Sync Repository" to index.
                </div>
              ) : (
                inspectingCases.map((tc) => (
                  <div
                    key={tc.id}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {tc.testIdentifier && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {tc.testIdentifier}
                          </span>
                        )}
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {tc.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {tc.framework}
                      </span>
                    </div>

                    {tc.description && (
                      <p className="text-xs text-slate-500 leading-relaxed">{tc.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                        <Terminal className="w-3 h-3 text-slate-400" />
                        <span>{tc.filePath}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {tc.tags?.map((t) => (
                          <span
                            key={t}
                            className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingModule(null)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Modal for Admin execution */}
      {selectedModuleIdForTrigger && (
        <TriggerModal
          isOpen={!!selectedModuleIdForTrigger}
          onClose={() => setSelectedModuleIdForTrigger(null)}
          defaultModuleId={selectedModuleIdForTrigger}
        />
      )}
    </div>
  );
};

export default Modules;
