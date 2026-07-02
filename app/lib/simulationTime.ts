import type { SimulationClock } from "@/app/types/stock";

export type SimulationTimeSnapshot = {
  simulationDate: string;
  simulationTime: string;
  simulationDayLabel: string;
  ruleLabel: string;
  statusLabel: string;
};

export function createSimulationTimeSnapshot(clock: SimulationClock): SimulationTimeSnapshot {
  const simulationDateTime = parseDateTime(clock.simulationDateTime);
  const realHoursPerSimulationDay = clock.realSecondsPerSimulationDay / 3600;

  return {
    simulationDate: clock.simulationDate,
    simulationTime: formatTime(simulationDateTime),
    simulationDayLabel: clock.simulationDate,
    ruleLabel: `시뮬레이션 1일 = 실제 ${formatHours(realHoursPerSimulationDay)}시간`,
    statusLabel: clock.running && !clock.stale ? "진행 중" : "정지",
  };
}

function parseDateTime(value: string) {
  return new Date(value.includes("T") ? value : value.replace(" ", "T"));
}

function formatTime(value: Date) {
  return `${padTime(value.getHours())}:${padTime(value.getMinutes())}:${padTime(value.getSeconds())}`;
}

function formatHours(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function padTime(value: number) {
  return value.toString().padStart(2, "0");
}
