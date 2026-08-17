export type CallLogType = "audio" | "video";

export type CallOutcome = "completed" | "missed" | "declined" | "cancelled" | "unavailable";

export interface ICallMessageContent {
  callType: CallLogType;
  outcome: CallOutcome;
  durationSeconds: number;
  callerId: string;
  endedBy?: string;
}

export function buildCallMessageContent(payload: ICallMessageContent): string {
  return JSON.stringify({
    callType: payload.callType,
    outcome: payload.outcome,
    durationSeconds: Math.max(0, Math.floor(payload.durationSeconds)),
    callerId: payload.callerId,
    endedBy: payload.endedBy,
  });
}

export function parseCallMessageContent(raw: string): ICallMessageContent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid call message content");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid call message content");
  }
  const o = parsed as Record<string, unknown>;
  const callType = o.callType;
  const outcome = o.outcome;
  if (callType !== "audio" && callType !== "video") {
    throw new Error("Invalid call type in call message");
  }
  if (
    outcome !== "completed" &&
    outcome !== "missed" &&
    outcome !== "declined" &&
    outcome !== "cancelled" &&
    outcome !== "unavailable"
  ) {
    throw new Error("Invalid call outcome in call message");
  }
  const durationSeconds =
    typeof o.durationSeconds === "number" && Number.isFinite(o.durationSeconds)
      ? Math.max(0, Math.floor(o.durationSeconds))
      : 0;
  if (typeof o.callerId !== "string" || !o.callerId.trim()) {
    throw new Error("Invalid callerId in call message");
  }
  return {
    callType,
    outcome,
    durationSeconds,
    callerId: o.callerId.trim(),
    endedBy: typeof o.endedBy === "string" ? o.endedBy : undefined,
  };
}
