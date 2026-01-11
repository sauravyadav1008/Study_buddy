import React, { useState } from "react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";

interface ExpandableListProps<T = string> {
  title: string;
  items: T[];
  initialVisibleCount?: number;
  className?: string;
  renderItem?: (item: T, index: number) => React.ReactNode;
}

function ExpandableList<T = string>({
  title,
  items,
  initialVisibleCount = 4,
  className,
  renderItem,
}: ExpandableListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const visibleItems = isExpanded ? items : items.slice(0, initialVisibleCount);
  const hasMore = items.length > initialVisibleCount;

  const defaultRender = (item: T, index: number) => (
    <Badge
      key={index}
      variant="secondary"
      className="bg-vibrant-blue/5 text-vibrant-blue border-vibrant-blue/10 text-[10px] py-1 px-3.5 rounded-full transition-all cursor-default hover:bg-vibrant-blue/10 font-black uppercase tracking-tight"
    >
      {String(item)}
    </Badge>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] px-0.5">
        {title}
      </h3>
      <div className={cn(renderItem ? "space-y-3" : "flex flex-wrap gap-2.5")}>
        {items.length > 0 ? (
          visibleItems.map((item, index) =>
            renderItem ? renderItem(item, index) : defaultRender(item, index)
          )
        ) : (
          <span className="text-[11px] text-slate-300 font-bold italic px-0.5">None discovered yet</span>
        )}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpand}
          className="px-2 py-1 h-auto font-black text-[10px] text-slate-400 hover:text-vibrant-blue hover:bg-vibrant-blue/5 rounded-lg transition-all"
        >
          {isExpanded ? "Collapse ▲" : `View ${items.length - initialVisibleCount} More ▼`}
        </Button>
      )}
    </div>
  );
}

export default ExpandableList;
