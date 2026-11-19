import React, { useState } from 'react';
import { Play, AlertCircle, Info, Smartphone, Globe, Layers } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useModules, useTriggerExecution } from '../../api/hooks';

interface TriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultModuleId?: string;
}

export const TriggerModal: React.FC<TriggerModalProps> = ({
  isOpen,
  onClose,
  defaultModuleId,
}) => {
  const { data: modulesData } = useModules();
  const triggerMutation = useTriggerExecution();

  const modules = modulesData?.modules || [];
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    defaultModuleId || (modules[0]?.id ?? '')
  );
  const [branch, setBranch] = useState('main');
  const [testCommand, setTestCommand] = useState('');
  const [androidDeviceType, setAndroidDeviceType] = useState<'virtual' | 'real'>('virtual');
  const [emulatorName, setEmulatorName] = useState('DEVICE-ANDROID-9');
  const [webTags, setWebTags] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentModule = modules.find(
    (m) => m.id === (selectedModuleId || defaultModuleId || modules[0]?.id)
  );

  const availableCommands = currentModule?.testCommands || [];
  const isMobileCommand =
    testCommand.includes('android') || testCommand.includes('web-androidapp');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedModuleId && !defaultModuleId) {
      setErrorMsg('Please select an automation module');
      return;
    }

    try {
      await triggerMutation.mutateAsync({
        moduleId: selectedModuleId || defaultModuleId || modules[0].id,
        testCommand: testCommand || availableCommands[0] || 'test',
        branch,
        androidDeviceType: isMobileCommand ? androidDeviceType : undefined,
        emulatorName: isMobileCommand && androidDeviceType === 'virtual' ? emulatorName : undefined,
        webTags: webTags.trim() || undefined,
        emailRecipients: emailRecipients.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to trigger Jenkins execution');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trigger Jenkins Automation Pipeline"
      description="Configure and dispatch an execution on the Jenkins Linux VM"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Environment Alert constraint */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-700 dark:text-blue-300">
          <Info className="w-4 h-4 shrink-0 text-blue-500" />
          <span>
            <strong>Environment Constraint:</strong> Automation coverage currently available for{' '}
            <strong>Staging environment only</strong> (<code>https://zila-staging.ccdms.in</code>).
          </span>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Module Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Automation Module
          </label>
          <select
            value={selectedModuleId || defaultModuleId || ''}
            onChange={(e) => {
              setSelectedModuleId(e.target.value);
              setTestCommand('');
            }}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName} ({m.framework} - {m.platform})
              </option>
            ))}
          </select>
        </div>

        {/* Test Command selection from actual module scripts */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Test Command (npm script)
          </label>
          <select
            value={testCommand || availableCommands[0] || ''}
            onChange={(e) => setTestCommand(e.target.value)}
            className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {availableCommands.map((cmd) => (
              <option key={cmd} value={cmd}>
                {cmd}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">
            Commands verified from {currentModule?.repoPath}/package.json & Jenkinsfile
          </p>
        </div>

        {/* Git Branch */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Git Branch
          </label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        {/* Conditional Mobile Execution Parameters */}
        {isMobileCommand && (
          <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
              <Smartphone className="w-4 h-4" />
              <span>Android Execution Parameters</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Device Type
                </label>
                <select
                  value={androidDeviceType}
                  onChange={(e) => setAndroidDeviceType(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="virtual">Virtual (AVD Emulator)</option>
                  <option value="real">Real Device</option>
                </select>
              </div>

              {androidDeviceType === 'virtual' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    AVD Emulator Name
                  </label>
                  <select
                    value={emulatorName}
                    onChange={(e) => setEmulatorName(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  >
                    {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((num) => (
                      <option key={num} value={`DEVICE-ANDROID-${num}`}>
                        DEVICE-ANDROID-{num}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optional Web tags / grep */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {currentModule?.framework === 'SELENIUM' || currentModule?.jenkinsJobName === 'Saral_Web_Automation'
                ? 'Cucumber Tag'
                : 'Web Tags / Spec Grep Expression (Optional)'}
            </label>
            {(currentModule?.framework === 'SELENIUM' || currentModule?.jenkinsJobName === 'Saral_Web_Automation') && (
              <span className="text-[10px] text-slate-400 font-mono">CUCUMBER_TAGS</span>
            )}
          </div>
          <input
            type="text"
            value={webTags}
            onChange={(e) => setWebTags(e.target.value)}
            placeholder={
              currentModule?.framework === 'SELENIUM' || currentModule?.jenkinsJobName === 'Saral_Web_Automation'
                ? 'e.g. Smoke or Regression or Login'
                : 'e.g. @smoke or test/ui/specs/web/EventCreate.spec.ts'
            }
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
          />
          {(currentModule?.framework === 'SELENIUM' || currentModule?.jenkinsJobName === 'Saral_Web_Automation') && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 self-center mr-1">Quick Select:</span>
              {['Smoke', 'Regression', 'Login', 'WithValidNumber', 'DynamicCampaignsCreation'].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setWebTags(tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                    webTags === tag
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  @{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Optional Email Notification */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notification Email(s) (Optional)
          </label>
          <input
            type="text"
            value={emailRecipients}
            onChange={(e) => setEmailRecipients(e.target.value)}
            placeholder="qa-team@saral.qa, dev-lead@saral.qa"
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-3.5"
            disabled={triggerMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
            disabled={triggerMutation.isPending}
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{triggerMutation.isPending ? 'Submitting to Jenkins...' : 'Dispatch Build'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
