import React from 'react';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useTheme } from './ThemeProvider';

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export const ThemePicker: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center space-x-2">
          <Palette className="w-4 h-4" />
          <span>Theme</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="focus-ring">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">Quick switch:</p>
          <div className="flex space-x-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  variant={theme === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(option.value as any)}
                  className="flex-1 focus-ring"
                >
                  <Icon className="w-3 h-3" />
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};