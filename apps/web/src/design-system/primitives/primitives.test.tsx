import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Input } from "./Input";

describe("reference primitives", () => {
	it("renders button reference variants and disabled state", () => {
		const { rerender } = render(<Button variant="primary">Approve</Button>);
		expect(screen.getByRole("button", { name: "Approve" })).toHaveClass(
			"ds-primitive-btn",
			"ds-primitive-btn--primary",
		);

		rerender(<Button variant="danger">Delete</Button>);
		expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
			"ds-primitive-btn--danger",
		);

		rerender(<Button disabled>Disabled</Button>);
		expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
	});

	it("renders badge with layout-1 tag semantics", () => {
		render(<Badge variant="header">overview</Badge>);
		const badge = screen.getByText("overview");
		expect(badge.tagName).toBe("SPAN");
		expect(badge).toHaveClass(
			"ds-primitive-badge",
			"ds-primitive-badge--header",
		);
	});

	it("renders input with label and mono styling hook", () => {
		render(<Input label="Recipient" placeholder="0x..." />);
		expect(screen.getByLabelText("Recipient")).toHaveClass(
			"ds-primitive-input",
		);
		expect(screen.getByPlaceholderText("0x...")).toHaveAttribute(
			"placeholder",
			"0x...",
		);
	});
});
