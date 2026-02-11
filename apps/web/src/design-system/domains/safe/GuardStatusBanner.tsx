import { Button } from "../../primitives";
import "./safe-domain.css";

export interface GuardStatusBannerProps {
	active: boolean;
	description: string;
	onDisable?: () => void;
	onEnable?: () => void;
	title: string;
}

export function GuardStatusBanner({
	active,
	description,
	onDisable,
	onEnable,
	title,
}: GuardStatusBannerProps) {
	const actionHandler = active ? onDisable : onEnable;

	return (
		<section
			className={`ds-safe-guard-banner ${active ? "is-active" : "is-inactive"}`}
		>
			<span aria-hidden className="ds-safe-guard-banner__icon">
				🛡
			</span>
			<div className="ds-safe-guard-banner__content">
				<h3 className="ds-safe-guard-banner__title">{title}</h3>
				<p className="ds-safe-guard-banner__description">{description}</p>
			</div>
			{actionHandler ? (
				<div className="ds-safe-guard-banner__actions">
					{active ? (
						<Button onClick={actionHandler} variant="danger">
							Disable
						</Button>
					) : (
						<Button onClick={actionHandler} variant="success">
							Enable
						</Button>
					)}
				</div>
			) : null}
		</section>
	);
}
