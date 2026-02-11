import type { ReactNode } from "react";
import "./shells.css";

export interface StatusBarShellProps {
	address?: string;
	balanceLabel?: string;
	chainLabel: string;
	connected?: boolean;
	onDisconnect?: () => void;
	walletControls?: ReactNode;
}

export function StatusBarShell({
	address,
	balanceLabel = "0.00 ETH",
	chainLabel,
	connected = false,
	onDisconnect,
	walletControls,
}: StatusBarShellProps) {
	return (
		<header className="ds-shell-statusbar">
			<div
				className="ds-shell-statusbar__chain-region"
				data-testid="status-bar-chain-region"
			>
				<span className="ds-shell-statusbar__chain-badge">{chainLabel}</span>
			</div>

			<div
				className="ds-shell-statusbar__wallet-region"
				data-testid="status-bar-wallet-region"
			>
				{walletControls ? (
					walletControls
				) : connected ? (
					<>
						<span className="ds-shell-statusbar__balance-pill">
							{balanceLabel}
						</span>
						{address ? (
							<span className="ds-shell-statusbar__address">{address}</span>
						) : null}
						<button
							className="ds-shell-statusbar__disconnect"
							onClick={onDisconnect}
							type="button"
						>
							Disconnect
						</button>
					</>
				) : (
					<span className="ds-shell-statusbar__address">Not connected</span>
				)}
			</div>
		</header>
	);
}
