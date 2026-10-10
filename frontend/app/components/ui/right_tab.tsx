"use client";

import { useState } from "react";

interface RightTabProps {
  children: React.ReactNode;
}

export default function RightTab({ children }: RightTabProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-0 top-0 z-50 h-screen pointer-events-none">
  
    <div
      className={`fixed right-0 top-0 h-full w-80 max-w-[60%] pointer-events-auto bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-gray-800 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 w-12 rounded-l-md bg-[#3d3461] px-3 py-6 text-white shadow-lg hover:bg-[#30294d] transition-all duration-300 ease-in-out"
      >
        {isOpen ? "→" : "←"}
      </button>

      <div className="h-full overflow-y-auto">
        {children}
      </div>
    </div>

  </div>

  );
}
