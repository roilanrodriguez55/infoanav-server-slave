import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ModuleTab {
  value: string;
  label: string;
  disabled?: boolean;
  badge?: ReactNode;
  content: ReactNode;
}

interface ModuleTabsProps {
  tabs: ModuleTab[];
  defaultValue?: string;
}

export function ModuleTabs({ tabs, defaultValue }: ModuleTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const active =
    tabs.find((tab) => tab.value === requested)?.value ??
    defaultValue ??
    tabs[0]?.value;

  const handleChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next);
  };

  return (
    <Tabs value={active} onValueChange={handleChange}>
      <TabsList className="flex h-auto w-full flex-wrap justify-start bg-blue-100 dark:bg-gray-700">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[disabled]:opacity-50 dark:text-gray-300"
          >
            {tab.label}
            {tab.badge}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
