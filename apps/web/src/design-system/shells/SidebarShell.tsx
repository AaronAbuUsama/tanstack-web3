import "./shells.css";

export interface SidebarNavItem {
	active?: boolean;
	badge?: string;
	href?: string;
	icon: string;
	id: string;
	label: string;
}

export interface SidebarNavSection {
	id: string;
	items: SidebarNavItem[];
	label: string;
}

export interface SidebarShellProps {
	fundActionLabel?: string;
	navSections: SidebarNavSection[];
	onFundAction?: () => void;
	safeAddress: string;
	safeBalanceLabel: string;
	safeUnitLabel?: string;
	thresholdLabel: string;
}

export function SidebarShell({
	fundActionLabel = "Fund Safe",
	navSections,
	onFundAction,
	safeAddress,
	safeBalanceLabel,
	safeUnitLabel = "ETH",
	thresholdLabel,
}: SidebarShellProps) {
	return (
		<aside className="ds-shell-sidebar">
			<div className="ds-shell-sidebar__identity">
				<span className="ds-shell-sidebar__identity-label">Safe wallet</span>
				<code className="ds-shell-sidebar__address">{safeAddress}</code>
				<p className="ds-shell-sidebar__balance">
					{safeBalanceLabel}
					<span className="ds-shell-sidebar__balance-unit">
						{safeUnitLabel}
					</span>
				</p>
				<span className="ds-shell-sidebar__threshold">{thresholdLabel}</span>
			</div>

			<nav className="ds-shell-sidebar__nav">
				{navSections.map((section) => (
					<section className="ds-shell-sidebar__section" key={section.id}>
						<h3 className="ds-shell-sidebar__section-label">{section.label}</h3>
						{section.items.map((item) => (
							<a
								aria-current={item.active ? "page" : undefined}
								className={`ds-shell-sidebar__item ${item.active ? "is-active" : ""}`}
								href={item.href ?? "#"}
								key={item.id}
							>
								<span className="ds-shell-sidebar__item-icon" aria-hidden>
									{item.icon}
								</span>
								<span>{item.label}</span>
								{item.badge ? (
									<span className="ds-shell-sidebar__item-badge">
										{item.badge}
									</span>
								) : null}
							</a>
						))}
					</section>
				))}
			</nav>

			<footer className="ds-shell-sidebar__footer">
				<button
					className="ds-shell-sidebar__fund-btn"
					onClick={onFundAction}
					type="button"
				>
					{fundActionLabel}
				</button>
			</footer>
		</aside>
	);
}
