// Display labels only. Do not extend or coerce the frozen production event contract.
const labels: Record<string, string> = {
  QUESTION_VISIT: "进入题目",
  QUESTION_LEAVE: "离开题目",
  RETURN: "返回题目",
  WRITING: "书写",
  REVISION_CANDIDATE: "修改候选",
  PROCESS_END: "过程结束",
  ANSWER_SUBMIT: "合成结果提交",
};
export const eventLabel = (type: string) =>
  labels[type] ?? `未识别事件 (${type})`;
