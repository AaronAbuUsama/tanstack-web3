import type { ActivityListItem } from "../fixtures/command-center";
import { PanelShell } from "../shells";
import "./patterns.css";

export interface ActivityListProps {
	entries: ActivityListItem[];
}

function iconForDirection(direction: ActivityListItem["direction"]) {
	if (direction === "incoming") return "↓";
	if (direction === "config") return "⚙";
	return "↑";
}

export function ActivityList({ entries }: ActivityListProps) {
	return (
		<PanelShell tagLabel="activity" title="Recent Activity">
			<div className="ds-pattern-activity">
				{entries.map((entry) => (
					<div className="ds-pattern-activity__row" key={entry.id}>
						<span
							aria-hidden
							className={`ds-pattern-activity__icon ${entry.direction === "incoming" ? "is-incoming" : entry.direction === "config" ? "is-config" : "is-outgoing"}`}
						>
							{iconForDirection(entry.direction)}
						</span>
						<div className="ds-pattern-activity__details">
							<span className="ds-pattern-activity__title">{entry.title}</span>
							<span className="ds-pattern-activity__meta">{entry.meta}</span>
						</div>
						<span className="ds-pattern-activity__amount">
							{entry.amountLabel}
						</span>
					</div>
				))}
			</div>
		</PanelShell>
	);
}
