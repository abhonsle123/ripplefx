
import type { ReactNode } from "react";
import DashboardBackground from "./DashboardBackground";

interface DashboardContainerProps {
  children: ReactNode;
}

const DashboardContainer = ({ children }: DashboardContainerProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 relative overflow-hidden">
      <DashboardBackground />
      <div className="container px-4 pt-24 pb-20 relative z-10">
        <div className="space-y-8 animate-fadeIn">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardContainer;
