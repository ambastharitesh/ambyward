import type { ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="min-h-[100dvh] bg-background-default flex justify-center">
      <div className="relative w-full max-w-md min-h-[100dvh] h-[100dvh] bg-background-paper shadow-xl border border-gray-200 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
