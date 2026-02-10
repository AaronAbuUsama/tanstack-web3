import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";
import { Input } from "./Input";

describe("design-system primitives", () => {
	it("renders button variants and respects disabled/loading states", () => {
		const { rerender } = render(<Button variant="primary">Execute</Button>);
		const button = screen.getByRole("button", { name: "Execute" });
		expect(button).toHaveClass("ds-button", "ds-button--primary");
		expect(button).not.toBeDisabled();

		rerender(<Button variant="secondary">Confirm</Button>);
		expect(screen.getByRole("button", { name: "Confirm" })).toHaveClass(
			"ds-button--secondary",
		);

		rerender(<Button loading>Submitting</Button>);
		expect(screen.getByRole("button", { name: "Submitting" })).toBeDisabled();
	});

	it("applies input focus and error state classes", () => {
		const { container } = render(
			<Input
				label="Safe address"
				error="Invalid address"
				placeholder="0x..."
			/>,
		);

		const wrapper = container.querySelector(".ds-input-field");
		const input = screen.getByPlaceholderText("0x...");
		expect(wrapper).toHaveClass("is-invalid");
		expect(input).toHaveAttribute("aria-invalid", "true");

		fireEvent.focus(input);
		expect(wrapper).toHaveClass("is-focused");

		fireEvent.blur(input);
		expect(wrapper).not.toHaveClass("is-focused");
	});

	it("renders card and badge semantic structure", () => {
		render(
			<Card title="Queue health">
				<Badge tone="success">ready</Badge>
			</Card>,
		);

		expect(screen.getByRole("article")).toBeInTheDocument();
		const badge = screen.getByText("ready");
		expect(badge.tagName).toBe("SPAN");
		expect(badge).toHaveClass("ds-badge", "ds-badge--success");
	});
});
