import type { HTMLAttributes } from "react";
import "./primitives.css";

export type BadgeVariant = "header" | "nav" | "inverse";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: BadgeVariant;
}

export function Badge({
	children,
	className,
	variant = "header",
	...props
}: BadgeProps) {
	return (
		<span
			className={`ds-primitive-badge ds-primitive-badge--${variant} ${className ?? ""}`}
			{...props}
		>
			{children}
		</span>
	);
}
