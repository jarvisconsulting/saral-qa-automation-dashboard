import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Download, Search, ArrowDown, Pause, Play } from 'lucide-react';

interface LiveLogViewerProps {
  logs: string | string[];
  isRunning?: boolean;
  onClear?: () => void;
  title?: string;
}

export const LiveLogViewer: React.FC<LiveLogViewerProps> = ({
  logs,
  isRunning = false,
  title = 'Console Output Stream',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const rawLines = Array.isArray(logs) ? logs : (logs || '').split('\n');

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [rawLines.length, autoScroll]);

  const filteredLines = searchTerm
    ? rawLines.filter((l) => l.toLowerCase().includes(searchTerm.toLowerCase()))
    : rawLines;

  const downloadLogs = () => {
    const text = rawLines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saral-execution-logs-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLineClass = (line: string) => {
    if (line.includes('ERROR') || line.includes('FAILED') || line.includes('✗') || line.includes('Failures:')) {
      return 'text-red-400 font-semibold bg-red-950/20';
    }
    if (line.includes('WARN') || line.includes('SKIPPED') || line.includes('⊘')) {
      return 'text-amber-400';
    }
    if (line.includes('PASSED') || line.includes('✓') || line.includes('BUILD SUCCESS')) {
      return 'text-emerald-400 font-semibold';
    }
    if (line.includes('===')) {
      return 'text-blue-400 font-bold';
    }
    return 'text-slate-300';
  };

  return (
    <div className="card overflow-hidden bg-slate-950 border-slate-800 text-slate-100 flex flex-col h-[520px]">
      {/* Log Header Controls */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">{title}</span>
          {isRunning && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Auto scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              autoScroll
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={autoScroll ? 'Pause auto-scroll' : 'Resume auto-scroll'}
          >
            {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Download */}
          <button
            onClick={downloadLogs}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Download full log"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Body */}
      <div
        ref={containerRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto leading-relaxed select-text space-y-0.5"
      >
        {filteredLines.length > 0 ? (
          filteredLines.map((line, idx) => (
            <div key={idx} className={`px-1 py-0.5 rounded ${getLineClass(line)}`}>
              {line}
            </div>
          ))
        ) : (
          <div className="text-slate-500 text-center py-20 italic">
            Waiting for Jenkins pipeline console output...
          </div>
        )}
      </div>
    </div>
  );
};
