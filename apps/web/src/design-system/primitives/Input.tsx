import type { FocusEventHandler, InputHTMLAttributes, ReactNode } from "react";
import { useId, useState } from "react";
import "./primitives.css";

export interface InputProps
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
	error?: string;
	forceFocus?: boolean;
	hint?: string;
	label?: string;
	leading?: ReactNode;
	trailing?: ReactNode;
}

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function Input({
	className,
	disabled,
	error,
	forceFocus = false,
	hint,
	id,
	label,
	leading,
	onBlur,
	onFocus,
	trailing,
	...props
}: InputProps) {
	const generatedId = useId();
	const inputId = id ?? generatedId;
	const [isFocused, setIsFocused] = useState(false);
	const hasError = Boolean(error);
	const isFocusVisible = forceFocus || isFocused;

	const handleFocus: FocusEventHandler<HTMLInputElement> = (event) => {
		setIsFocused(true);
		onFocus?.(event);
	};

	const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
		setIsFocused(false);
		onBlur?.(event);
	};

	return (
		<div className={cx("ds-input-root", className)}>
			{label ? (
				<label className="ds-input-label" htmlFor={inputId}>
					{label}
				</label>
			) : null}
			<div
				className={cx(
					"ds-input-field",
					isFocusVisible && "is-focused",
					hasError && "is-invalid",
					disabled && "is-disabled",
				)}
			>
				{leading}
				<input
					aria-invalid={hasError}
					className="ds-input-control"
					disabled={disabled}
					id={inputId}
					onBlur={handleBlur}
					onFocus={handleFocus}
					{...props}
				/>
				{trailing}
			</div>
			{error ? (
				<p className="ds-input-note is-invalid">{error}</p>
			) : hint ? (
				<p className="ds-input-note">{hint}</p>
			) : null}
		</div>
	);
}
