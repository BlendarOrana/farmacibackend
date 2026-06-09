import React from "react";

export default function IphoneMockup({ children }) {
  return (
    <div className="relative w-[320px] h-[660px] bg-black rounded-[50px] p-[10px] flex-shrink-0 shadow-2xl">
      {/* Ekrani i brendshem */}
      <div className="relative w-full h-full bg-[#fcee0d] rounded-[38px] overflow-hidden">
        
        {/* Imazhi i sfondit (Erresuar pak per te nxjerre ne pah tekstin e bardhe) */}
        <div className="absolute inset-0 bg-[url('/hunters.webp')] bg-contain bg-center bg-no-repeat z-0"></div>
        
        {/* Dynamic Island */}
        <div className="absolute top-2.5 inset-x-0 flex justify-center z-50">
          <div className="w-[105px] h-[30px] bg-black rounded-full shadow-sm"></div>
        </div>

        {/* Permbajtja (Njoftim ose UI i Aplikacionit) */}
        {children}

        {/* Home Indicator */}
        <div className="absolute bottom-2 inset-x-0 flex justify-center z-50">
          <div className="w-[120px] h-1.5 bg-black/80 rounded-full shadow-sm"></div>
        </div>
      </div>
    </div>
  );
}