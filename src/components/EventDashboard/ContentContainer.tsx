
import { ReactNode } from "react";

interface ContentContainerProps {
  children: ReactNode;
}

const ContentContainer = ({ children }: ContentContainerProps) => {
  return (
    <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-accent/10 shadow-md">
      {children}
    </div>
  );
};

export default ContentContainer;
