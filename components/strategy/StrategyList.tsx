export function StrategyList({ items }: { items: string[] }) { return <ul className="strategy-list">{items.map((item)=><li key={item}><span>✓</span>{item}</li>)}</ul> }
