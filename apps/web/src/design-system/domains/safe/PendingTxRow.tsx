import { Badge, Button } from "../../primitives";
import "./safe-domain.css";

export type PendingTxVisualState = "pending" | "ready" | "executed";

export interface PendingTxRowProps {
	confirmations: number;
	idLabel: string;
	onAction?: () => void;
	state: PendingTxVisualState;
	threshold: number;
	toLabel: string;
	valueLabel: string;
}

function actionLabelForState(state: PendingTxVisualState) {
	if (state === "ready") return "Execute";
	if (state === "executed") return "Executed";
	return "Sign";
}

function badgeVariantForState(state: PendingTxVisualState) {
	if (state === "ready") return "header";
	if (state === "executed") return "inverse";
	return "nav";
}

export function PendingTxRow({
	confirmations,
	idLabel,
	onAction,
	state,
	threshold,
	toLabel,
	valueLabel,
}: PendingTxRowProps) {
	const dots = Array.from({ length: threshold }, (_, index) => ({
		id: `${idLabel}-${threshold}-${confirmations}-${index < confirmations ? "signed" : "unsigned"}-${index}`,
		signed: index < confirmations,
	}));
	const actionLabel = actionLabelForState(state);
	const actionDisabled = state === "pending" && !onAction;

	return (
		<div className="ds-safe-pending-row">
			<span className="ds-safe-pending-row__id">{idLabel}</span>
			<div className="ds-safe-pending-row__details">
				<span className="ds-safe-pending-row__to">{toLabel}</span>
				<span className="ds-safe-pending-row__value">{valueLabel}</span>
			</div>
			<div className="ds-safe-pending-row__sigs">
				{dots.map((dot) => (
					<span
						aria-hidden
						className={`ds-safe-pending-row__sig-dot ${dot.signed ? "is-signed" : "is-unsigned"}`}
						key={dot.id}
					/>
				))}
			</div>
			<div className="ds-safe-pending-row__state">
				{state === "executed" ? (
					<Badge variant={badgeVariantForState(state)}>executed</Badge>
				) : (
					<Button
						disabled={actionDisabled}
						onClick={onAction}
						variant={state === "ready" ? "success" : "outline"}
					>
						{actionLabel}
					</Button>
				)}
			</div>
		</div>
	);
}
