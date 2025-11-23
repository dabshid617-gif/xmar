import { Button } from "@/components/ui/button";
import { LayoutGrid, Coffee, Cookie, ShoppingBasket, Smartphone, Home } from "lucide-react";

interface CategorySidebarProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const categoryIcons = {
  LayoutGrid,
  Coffee,
  Cookie,
  ShoppingBasket,
  Smartphone,
  Home,
};

export const CategorySidebar = ({ categories, selectedCategory, onSelectCategory }: CategorySidebarProps) => {
  const allCategories = ["all", ...categories];

  return (
    <aside className="bg-pos-sidebar flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-pos-sidebar-foreground font-semibold text-lg">Categories</h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {allCategories.map((category) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons] || LayoutGrid;
          const isSelected = selectedCategory === category;
          return (
            <Button
              key={category}
              variant={isSelected ? "default" : "ghost"}
              className={`w-full justify-start text-base ${isSelected ? "bg-primary text-primary-foreground" : "text-pos-sidebar-foreground"}`}
              onClick={() => onSelectCategory(category)}
            >
              <Icon className="mr-3 h-5 w-5" />
              {category === "all" ? "All Products" : category}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
};
