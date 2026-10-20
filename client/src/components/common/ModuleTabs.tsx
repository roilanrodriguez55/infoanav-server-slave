import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PillTabs } from "@/components/common/PillTabs";

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
      <PillTabs className="self-start" tabs={tabs} value={active ?? ""} onChange={handleChange} />
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
