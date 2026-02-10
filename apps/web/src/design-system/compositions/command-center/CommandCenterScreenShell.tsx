import type { ReactNode } from "react";
import { SidebarNav } from "../../patterns";
import type { SidebarNavSection } from "../../shells";
import { StatusBarShell } from "../../shells";
import "./command-center.css";

export interface CommandCenterScreenShellProps {
	address?: string;
	chainLabel: string;
	children: ReactNode;
	embedded?: boolean;
	navSections: SidebarNavSection[];
	safeAddress: string;
	safeBalanceLabel: string;
	statusBalanceLabel: string;
	thresholdLabel: string;
	title: string;
	titleIcon?: string;
}

export function CommandCenterScreenShell({
	address,
	chainLabel,
	children,
	embedded = false,
	navSections,
	safeAddress,
	safeBalanceLabel,
	statusBalanceLabel,
	thresholdLabel,
	title,
	titleIcon = "◆",
}: CommandCenterScreenShellProps) {
	return (
		<section className={`ds-command-center ${embedded ? "is-embedded" : ""}`}>
			<StatusBarShell
				address={address}
				balanceLabel={statusBalanceLabel}
				chainLabel={chainLabel}
				connected
			/>
			<div className="ds-command-center__layout">
				<SidebarNav
					navSections={navSections}
					safeAddress={safeAddress}
					safeBalanceLabel={safeBalanceLabel}
					thresholdLabel={thresholdLabel}
				/>
				<main className="ds-command-center__main">
					<h2 className="ds-command-center__title">
						<span aria-hidden className="ds-command-center__title-icon">
							{titleIcon}
						</span>
						{title}
					</h2>
					<div className="ds-command-screen">{children}</div>
				</main>
			</div>
		</section>
	);
}
