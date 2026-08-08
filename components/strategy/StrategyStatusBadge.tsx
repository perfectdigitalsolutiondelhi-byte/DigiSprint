import type { StrategyStatus } from "../../lib/marketing-strategy/types";
export function StrategyStatusBadge({ status }: { status: StrategyStatus }) { return <span className={`strategy-status ${status}`}>{status}</span> }
