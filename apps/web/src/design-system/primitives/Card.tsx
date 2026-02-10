import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import "./primitives.css";

export type CardTone = "default" | "accent" | "muted";
export type CardElement = "article" | "section" | "div";

export interface CardProps extends ComponentPropsWithoutRef<"article"> {
	as?: CardElement;
	actions?: ReactNode;
	eyebrow?: ReactNode;
	title?: ReactNode;
	tone?: CardTone;
}

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function Card({
	as = "article",
	actions,
	children,
	className,
	eyebrow,
	title,
	tone = "default",
	...props
}: CardProps) {
	const Component = as as ElementType;

	return (
		<Component
			className={cx(
				"ds-card",
				tone === "accent" && "ds-card--accent",
				tone === "muted" && "ds-card--muted",
				className,
			)}
			{...props}
		>
			{eyebrow ? <p className="ds-card__eyebrow">{eyebrow}</p> : null}
			{title || actions ? (
				<header className="ds-card__header">
					{title ? <h3 className="ds-card__title">{title}</h3> : <span />}
					{actions}
				</header>
			) : null}
			<div className="ds-card__body">{children}</div>
		</Component>
	);
}
