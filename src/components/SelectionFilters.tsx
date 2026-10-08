import type { ReturnTypeSelection } from "./selectionTypes";
import { Presentation } from "lucide-react";
export function SelectionFilters({
  selection,
}: {
  selection: ReturnTypeSelection;
}) {
  return (
    <>
      <label className="filter">
        <Presentation size={16} />
        <select
          aria-label="选择班级"
          value={selection.classId}
          onChange={(e) => selection.setClassId(e.target.value)}
        >
          <option value="">选择班级</option>
          {selection.classes.data?.items.map((c) => (
            <option key={c.class_id} value={c.class_id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="filter">
        <Presentation size={16} />
        <select
          aria-label="选择课堂"
          value={selection.sessionId}
          onChange={(e) => selection.setSessionId(e.target.value)}
          disabled={!selection.classId}
        >
          <option value="">选择课堂</option>
          {selection.sessions.data?.items.map((s) => (
            <option key={s.session_id} value={s.session_id}>
              {s.lesson_title}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
