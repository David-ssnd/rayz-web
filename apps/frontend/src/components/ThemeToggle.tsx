'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

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
        className="rounded-full h-7 w-7 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <Monitor className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="light"
        aria-label="Light theme"
        size="sm"
        className="rounded-full h-7 w-7 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <Sun className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        aria-label="Dark theme"
        size="sm"
        className="rounded-full h-7 w-7 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <Moon className="h-3.5 w-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
