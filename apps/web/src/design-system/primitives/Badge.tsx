import type { HTMLAttributes } from "react";
import "./primitives.css";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	tone?: BadgeTone;
}

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function Badge({
	children,
	className,
	tone = "neutral",
	...props
}: BadgeProps) {
	return (
		<span className={cx("ds-badge", `ds-badge--${tone}`, className)} {...props}>
			{children}
		</span>
	);
}
