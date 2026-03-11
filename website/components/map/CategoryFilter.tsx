"use client";

import { useRef, useEffect } from "react";

interface Category {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  color?: string;
}

interface CategoryFilterProps {
  categories: Category[];
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
}

export default function CategoryFilter({
  categories,
  activeFilters,
  onFilterChange,
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Enable horizontal drag scrolling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      el.style.cursor = "grabbing";
    };
    const onMouseLeave = () => {
      isDown = false;
      el.style.cursor = "grab";
    };
    const onMouseUp = () => {
      isDown = false;
      el.style.cursor = "grab";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mousemove", onMouseMove);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const handleToggle = (categoryId: string) => {
    if (activeFilters.includes(categoryId)) {
      onFilterChange(activeFilters.filter((id) => id !== categoryId));
    } else {
      onFilterChange([...activeFilters, categoryId]);
    }
  };

  const handleClearAll = () => {
    onFilterChange([]);
  };

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 py-3"
      style={{ cursor: "grab" }}
    >
      {/* All button */}
      <button
        onClick={handleClearAll}
        className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 border whitespace-nowrap ${
          activeFilters.length === 0
            ? "bg-[var(--c-primary)] text-[var(--c-text)] border-transparent"
            : "bg-transparent text-[var(--c-text-muted)] border-[var(--c-border)] hover:border-[var(--c-border)] hover:text-[var(--c-text)]"
        }`}
      >
        All
      </button>

      {categories.map((cat) => {
        const isActive = activeFilters.includes(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => handleToggle(cat.id)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-200 border whitespace-nowrap"
            style={
              isActive
                ? {
                    backgroundColor: cat.color || "var(--c-primary)",
                    color: "#ffffff",
                    borderColor: "transparent",
                  }
                : {
                    backgroundColor: "transparent",
                    color: cat.color || "var(--c-text-muted)",
                    borderColor: cat.color
                      ? `${cat.color}50`
                      : "var(--c-border)",
                  }
            }
          >
            {cat.emoji && <span className="text-sm">{cat.emoji}</span>}
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
