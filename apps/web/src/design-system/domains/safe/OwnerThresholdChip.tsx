import "./safe-domain.css";

export interface OwnerThresholdChipProps {
	ownersLabel?: string;
	valueLabel: string;
}

export function OwnerThresholdChip({
	ownersLabel = "Threshold",
	valueLabel,
}: OwnerThresholdChipProps) {
	return (
		<div className="ds-safe-owner-threshold-chip">
			<span className="ds-safe-owner-threshold-chip__label">{ownersLabel}</span>
			<span className="ds-safe-owner-threshold-chip__value">{valueLabel}</span>
		</div>
	);
}
