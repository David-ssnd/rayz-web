'use client';

import * as React from 'react';
import { Monitor, MoonStar, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  // Only render after mounting to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same dimensions during SSR
    return <div className="bg-background border rounded-full p-0.5 h-8 w-[88px]" />;
  }

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(value) => {
        if (value) setTheme(value);
      }}
      className="bg-background border rounded-full p-0.5"
    >
      <ToggleGroupItem
        value="system"
        aria-label="System theme"
        size="sm"
        className="rounded-full h-6 w-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <Monitor className="h-3 w-3" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="light"
        aria-label="Light theme"
        size="sm"
        className="rounded-full h-6 w-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <Sun className="h-3 w-3" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        aria-label="Dark theme"
        size="sm"
        className="rounded-full h-6 w-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <MoonStar className="h-3 w-3" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
