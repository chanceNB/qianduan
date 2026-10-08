import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { teacherApi } from "../api/teacher";
import { useResource } from "./useResource";
export function useClassroomSelection() {
  const [params] = useSearchParams();
  const [classId, setClassId] = useState("");
  const [sessionId, setSessionId] = useState(params.get("session") ?? "");
  const classes = useResource(() => teacherApi.classes(), []);
  const overview = useResource(
    () => (sessionId ? teacherApi.overview(sessionId) : Promise.resolve(null)),
    [sessionId],
  );
  const activeClass = classId || overview.data?.session.class_id || "";
  const sessions = useResource(
    () =>
      activeClass ? teacherApi.sessions(activeClass) : Promise.resolve(null),
    [activeClass],
  );
  return {
    classId: activeClass,
    sessionId,
    classes,
    sessions,
    overview,
    setClassId: (id: string) => {
      setClassId(id);
      setSessionId("");
    },
    setSessionId,
  };
}
