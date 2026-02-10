import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import "./primitives.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
}

export function Input({ className, id, label, ...props }: InputProps) {
	const generatedId = useId();
	const controlId = id ?? generatedId;

	return (
		<div className="ds-primitive-field">
			<label className="ds-primitive-label" htmlFor={controlId}>
				{label}
			</label>
			<input
				className={`ds-primitive-input ${className ?? ""}`}
				id={controlId}
				{...props}
			/>
		</div>
	);
}
