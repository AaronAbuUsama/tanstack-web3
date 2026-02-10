import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./primitives.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	leadingIcon?: ReactNode;
	trailingIcon?: ReactNode;
}

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function Button({
	children,
	className,
	disabled,
	leadingIcon,
	loading = false,
	size = "md",
	trailingIcon,
	type = "button",
	variant = "primary",
	...props
}: ButtonProps) {
	const isDisabled = disabled || loading;
	return (
		<button
			aria-busy={loading}
			className={cx(
				"ds-button",
				`ds-button--${variant}`,
				`ds-button--${size}`,
				className,
			)}
			disabled={isDisabled}
			type={type}
			{...props}
		>
			{loading ? (
				<span aria-hidden className="ds-button__spinner" />
			) : (
				leadingIcon
			)}
			{children}
			{!loading ? trailingIcon : null}
		</button>
	);
}
