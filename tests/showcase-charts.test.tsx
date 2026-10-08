import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import {
  ReturnRatioChart,
  RevisionCandidateChart,
  ProgressDivergencePanel,
} from "../src/components/showcase/ClassStateCharts";
import { calculateClassState } from "../src/mocks/calculations";
it("does not fabricate zero percentages for missing source events", () => {
  const state = calculateClassState([], ["Q05"], {
    start_ms: 840000,
    end_ms: 900000,
  });
  render(
    <>
      <ReturnRatioChart state={state} question="Q05" evidence={[]} />
      <RevisionCandidateChart state={state} question="Q05" evidence={[]} />
      <ProgressDivergencePanel state={state} />
    </>,
  );
  expect(screen.getAllByText("数据缺失")).toHaveLength(2);
  expect(screen.queryByText("0%")).toBeNull();
  expect(screen.getByText("不可计算")).toBeInTheDocument();
});
