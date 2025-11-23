import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Laptop } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const next = () => {
    const order = ["system", "light", "dark"];
    const idx = order.indexOf(theme || "system");
    const nxt = order[(idx + 1) % order.length];
    setTheme(nxt);
  };

  const Icon = resolvedTheme === "dark" ? Moon : resolvedTheme === "light" ? Sun : Laptop;

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={next}>
      <Icon className="h-5 w-5" />
    </Button>
  );
}

