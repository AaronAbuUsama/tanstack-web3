import type { MouseEvent, ReactNode } from "react";
import { SidebarNav } from "../../patterns";
import type { SidebarNavSection } from "../../shells";
import { StatusBarShell } from "../../shells";
import { useSafe } from "../../../safe/core/use-safe";
import "./command-center.css";

export interface CommandCenterScreenShellProps {
	address?: string;
	chainLabel: string;
	children: ReactNode;
	connected?: boolean;
	embedded?: boolean;
	navSections: SidebarNavSection[];
	onDisconnect?: () => void;
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
	connected = true,
	embedded = false,
	navSections,
	onDisconnect,
	safeAddress,
	safeBalanceLabel,
	statusBalanceLabel,
	thresholdLabel,
	title,
	titleIcon = "◆",
}: CommandCenterScreenShellProps) {
	const safe = useSafe();
	const disconnectHandler = onDisconnect ?? safe.disconnectSafe;
	const handleSidebarNavigation = (event: MouseEvent<HTMLElement>) => {
		if (event.defaultPrevented || event.button !== 0) return;
		if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;

		const target = event.target as HTMLElement;
		const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
		if (!anchor) return;
		const href = anchor.getAttribute("href");
		if (!href || !href.startsWith("/safe")) return;

		event.preventDefault();
		const nextUrl = new URL(href, window.location.origin);
		window.history.pushState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
		window.dispatchEvent(new PopStateEvent("popstate"));
	};

	return (
		<section
			className={`ds-command-center ${embedded ? "is-embedded" : ""}`}
			onClick={handleSidebarNavigation}
		>
			<StatusBarShell
				address={address}
				balanceLabel={statusBalanceLabel}
				chainLabel={chainLabel}
				connected={connected}
				onDisconnect={disconnectHandler}
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
