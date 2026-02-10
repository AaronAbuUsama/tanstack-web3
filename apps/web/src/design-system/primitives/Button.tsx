import type { ButtonHTMLAttributes } from "react";
import "./primitives.css";

export type ButtonVariant =
	| "primary"
	| "danger"
	| "success"
	| "outline"
	| "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
}

export function Button({
	children,
	className,
	type = "button",
	variant = "primary",
	...props
}: ButtonProps) {
	return (
		<button
			className={`ds-primitive-btn ds-primitive-btn--${variant} ${className ?? ""}`}
			type={type}
			{...props}
		>
			{children}
		</button>
	);
}
