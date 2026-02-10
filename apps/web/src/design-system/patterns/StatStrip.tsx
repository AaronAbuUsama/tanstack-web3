import type { StatStripItem } from "../fixtures/command-center";
import "./patterns.css";

export interface StatStripProps {
	items: StatStripItem[];
}

export function StatStrip({ items }: StatStripProps) {
	return (
		<section className="ds-pattern-stat-strip">
			{items.map((item) => (
				<article
					className="ds-pattern-stat-strip__item"
					key={item.id}
					style={
						item.backgroundToken
							? { background: item.backgroundToken }
							: undefined
					}
				>
					<span className="ds-pattern-stat-strip__label">{item.label}</span>
					<span className="ds-pattern-stat-strip__value">{item.value}</span>
					<span className="ds-pattern-stat-strip__sub">{item.subLabel}</span>
				</article>
			))}
		</section>
	);
}
