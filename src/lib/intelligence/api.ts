import { useMemo } from "react";
import { useDashboardData } from "@/lib/dashboard/api";
import { generatePriorities, generateSignals } from "./signals";
import { MAX_FEED_SIGNALS } from "./constants";
import type { IntelligenceSignal, Priority } from "./types";

export interface IntelligenceResult<T> {
  data: T;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
}

export function useIntelligenceSignals(limit = MAX_FEED_SIGNALS): IntelligenceResult<IntelligenceSignal[]> {
  const { metrics, isLoading, isError } = useDashboardData();
  const signals = useMemo(() => generateSignals(metrics).slice(0, limit), [metrics, limit]);
  return { data: signals, isLoading, isError, isEmpty: !isLoading && signals.length === 0 };
}

export function useTodaysPriorities(): IntelligenceResult<Priority[]> {
  const { metrics, isLoading, isError } = useDashboardData();
  const priorities = useMemo(() => generatePriorities(metrics), [metrics]);
  return { data: priorities, isLoading, isError, isEmpty: !isLoading && priorities.length === 0 };
}

export { useDashboardData };
