import type { ReactNode } from "react";
import "./shells.css";

export interface PanelShellProps {
	actions?: ReactNode;
	children: ReactNode;
	tagLabel?: string;
	title: string;
}

export function PanelShell({
	actions,
	children,
	tagLabel,
	title,
}: PanelShellProps) {
	return (
		<section className="ds-shell-panel">
			<header className="ds-shell-panel__header">
				<div className="ds-shell-panel__title-wrap">
					<h2 className="ds-shell-panel__title">{title}</h2>
					{tagLabel ? (
						<span className="ds-shell-panel__tag">{tagLabel}</span>
					) : null}
				</div>
				{actions ? (
					<div
						className="ds-shell-panel__actions"
						data-testid="panel-shell-actions"
					>
						{actions}
					</div>
				) : null}
			</header>
			<div className="ds-shell-panel__body">{children}</div>
		</section>
	);
}
