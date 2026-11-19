import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Play,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Lock,
  Edit2,
  Sparkles,
} from 'lucide-react';
import {
  useSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useRunScheduleNow,
  useDeleteSchedule,
  useModules,
} from '../api/hooks';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../stores/authStore';
import { Schedule } from '../types';

export const Schedules: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || (user?.role as string) === 'QA_LEAD';
  const { data, isLoading } = useSchedules();
  const { data: modulesData } = useModules();
  const schedules = data?.schedules || [];
  const modules = modulesData?.modules || [];

  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule();
  const runNowMutation = useRunScheduleNow();
  const deleteMutation = useDeleteSchedule();

  // Create state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [cronExpr, setCronExpr] = useState('0 2 * * *'); // 2 AM daily
  const [testCommand, setTestCommand] = useState('');
  const [branch, setBranch] = useState('main');
  const [emailRecipients, setEmailRecipients] = useState('');

  // Edit state
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editName, setEditName] = useState('');
  const [editModuleId, setEditModuleId] = useState('');
  const [editCronExpr, setEditCronExpr] = useState('');
  const [editTestCommand, setEditTestCommand] = useState('');
  const [editBranch, setEditBranch] = useState('main');
  const [editEmailRecipients, setEditEmailRecipients] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  const selectedModule = modules.find((m) => m.id === (moduleId || modules[0]?.id));
  const availableCommands = selectedModule?.testCommands || [];

  const selectedEditModule = modules.find((m) => m.id === (editModuleId || modules[0]?.id));
  const editAvailableCommands = selectedEditModule?.testCommands || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!moduleId && !modules[0])) return;

    await createMutation.mutateAsync({
      name,
      moduleId: moduleId || modules[0].id,
      cronExpr,
      testCommand: testCommand || availableCommands[0] || 'test',
      branch,
      emailRecipients: emailRecipients || undefined,
      isActive: true,
    });

    setIsModalOpen(false);
    setName('');
  };

  const handleStartEdit = (sch: Schedule) => {
    setEditingSchedule(sch);
    setEditName(sch.name);
    setEditModuleId(sch.moduleId);
    setEditCronExpr(sch.cronExpr);
    setEditTestCommand(sch.testCommand || '');
    setEditBranch(sch.branch || 'main');
    setEditEmailRecipients(sch.emailRecipients || '');
    setEditIsActive(sch.isActive);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule || !editName) return;

    await updateMutation.mutateAsync({
      id: editingSchedule.id,
      data: {
        name: editName,
        moduleId: editModuleId,
        cronExpr: editCronExpr,
        testCommand: editTestCommand || undefined,
        branch: editBranch,
        emailRecipients: editEmailRecipients || undefined,
        isActive: editIsActive,
      },
    });

    setEditingSchedule(null);
  };

  const handleRunNow = async (id: string) => {
    if (window.confirm('Trigger this scheduled build on Jenkins immediately?')) {
      await runNowMutation.mutateAsync(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const cronPresets = [
    { label: 'Every 2 Hours', value: '0 */2 * * *' },
    { label: 'Daily at 2 AM', value: '0 2 * * *' },
    { label: 'Daily at Midnight', value: '0 0 * * *' },
    { label: 'Weekly Sunday', value: '0 0 * * 0' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Automation Execution Schedules</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automate recurring Staging regression runs via dashboard cron & Jenkins pipeline
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-2 self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Schedule</span>
          </button>
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200 dark:border-slate-700"
            title="Read-Only users cannot create or modify schedules"
          >
            <Lock className="w-3 h-3" />
            <span>Read-Only Mode</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading schedules..." />
      ) : schedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((sch) => (
            <div
              key={sch.id}
              className="card p-5 flex flex-col justify-between border-slate-200 dark:border-slate-800 card-hover"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {sch.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      sch.isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {sch.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="space-y-2 my-4 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Module:</span>
                    <span className="truncate">{sch.module?.displayName || 'Unknown Module'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Cron: {sch.cronExpr}</span>
                  </div>

                  {sch.testCommand && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                      <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{sch.testCommand}</span>
                    </div>
                  )}

                  {sch.lastRunAt && (
                    <div className="text-[11px] text-slate-400">
                      Last triggered: {new Date(sch.lastRunAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {isAdmin ? (
                  <>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(sch)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit schedule parameters"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(sch.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRunNow(sch.id)}
                      disabled={runNowMutation.isPending}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-slate-600 dark:fill-slate-300" />
                      <span>Run Now</span>
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>View Only</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center text-slate-400">
          <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No Scheduled Executions
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Create recurring nightly or weekly regression triggers for Staging.
          </p>
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs py-2 px-3.5">
              Create First Schedule
            </button>
          )}
        </div>
      )}

      {/* --- CREATE SCHEDULE MODAL --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Automation Schedule"
        description="Configure a cron trigger that will dispatch the Staging pipeline on Jenkins"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Schedule Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nightly Event Module Regression"
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Module
            </label>
            <select
              value={moduleId || modules[0]?.id}
              onChange={(e) => {
                setModuleId(e.target.value);
                setTestCommand('');
              }}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Test Command
            </label>
            <select
              value={testCommand || availableCommands[0] || ''}
              onChange={(e) => setTestCommand(e.target.value)}
              className="w-full font-mono p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
            >
              {availableCommands.map((cmd) => (
                <option key={cmd} value={cmd}>
                  {cmd}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Cron Expression
              </label>
              <span className="text-[10px] text-slate-400">Quick Presets:</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {cronPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setCronExpr(preset.value)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    cronExpr === preset.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={cronExpr}
              onChange={(e) => setCronExpr(e.target.value)}
              placeholder="0 2 * * *"
              className="w-full font-mono p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notification Recipients (Optional)
            </label>
            <input
              type="text"
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
              placeholder="qa-team@saral.qa"
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary py-2 px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary py-2 px-4"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- EDIT SCHEDULE MODAL --- */}
      {editingSchedule && (
        <Modal
          isOpen={!!editingSchedule}
          onClose={() => setEditingSchedule(null)}
          title="Edit Automation Schedule"
          description="Update schedule configuration, cron expression, and execution parameters"
        >
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Schedule Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Module
              </label>
              <select
                value={editModuleId}
                onChange={(e) => {
                  setEditModuleId(e.target.value);
                  setEditTestCommand('');
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Test Command
              </label>
              <select
                value={editTestCommand || editAvailableCommands[0] || ''}
                onChange={(e) => setEditTestCommand(e.target.value)}
                className="w-full font-mono p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
              >
                {editAvailableCommands.map((cmd) => (
                  <option key={cmd} value={cmd}>
                    {cmd}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Cron Expression
                </label>
                <span className="text-[10px] text-slate-400">Quick Presets:</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {cronPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => setEditCronExpr(preset.value)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      editCronExpr === preset.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                required
                value={editCronExpr}
                onChange={(e) => setEditCronExpr(e.target.value)}
                className="w-full font-mono p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notification Recipients (Optional)
              </label>
              <input
                type="text"
                value={editEmailRecipients}
                onChange={(e) => setEditEmailRecipients(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="editIsActiveSchedule"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <label htmlFor="editIsActiveSchedule" className="font-semibold text-slate-700 dark:text-slate-300">
                Schedule Active (Dispatches automatically at scheduled times)
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="btn-secondary py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary py-2 px-4"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Schedule'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Schedules;
