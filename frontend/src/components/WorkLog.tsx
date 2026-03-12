import type { WorkLog as WorkLogType } from '../api/client';

interface Props {
  worklogs: WorkLogType[];
}

export default function WorkLog({ worklogs }: Props) {
  if (worklogs.length === 0) {
    return <p className="text-sm text-gray-400">작업 로그가 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">작업 로그</h4>
      <div className="space-y-1.5">
        {worklogs.map((log, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="text-gray-400 shrink-0 font-mono text-xs pt-0.5">{log.date}</span>
            <div>
              <span className="text-gray-700">{log.content}</span>
              {log.related_docs && (
                <span className="text-gray-400 ml-1 text-xs">({log.related_docs})</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
