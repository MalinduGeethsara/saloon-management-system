import React from "react";

export function Receipt({ data }: { data: any }) {
  return (
    <div className="hidden print:block w-[80mm] mx-auto p-4 text-black font-mono text-sm leading-tight">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold uppercase">LuxeBarber</h2>
        <p>123 Saloon Street, Downtown</p>
        <p>Tel: +1 234 567 890</p>
      </div>
      
      <div className="border-t border-b border-dashed py-2 my-2">
        <p>Date: {new Date().toLocaleDateString()}</p>
        <p>Receipt: #TX-9901</p>
        <p>Barber: {data?.barber || 'Mahesh Madushanka'}</p>
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex justify-between">
          <span>Haircut & Beard</span>
          <span>$40.00</span>
        </div>
        <div className="flex justify-between">
          <span>Beard Oil (Gold)</span>
          <span>$15.00</span>
        </div>
      </div>

      <div className="border-t border-dashed pt-2">
        <div className="flex justify-between font-bold text-lg">
          <span>TOTAL</span>
          <span>$55.00</span>
        </div>
        <p className="text-[10px] text-center mt-6 uppercase">Thank you for your visit!</p>
        <p className="text-[10px] text-center">No refund after service.</p>
      </div>
    </div>
  );
}