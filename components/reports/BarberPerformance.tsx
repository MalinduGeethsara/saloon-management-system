"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Star, Timer, TrendingUp } from "lucide-react";

interface BarberStats {
  name: string;
  avatarLetter: string;
  revenue: number;
  target: number;
  rating: number;
  avgTime: string;
}

const barberData: BarberStats[] = [
  { name: "Alex Rivers", avatarLetter: "A", revenue: 5680, target: 6000, rating: 4.9, avgTime: "35m" },
  { name: "Sam Wilson", avatarLetter: "S", revenue: 3420, target: 5000, rating: 4.7, avgTime: "42m" },
  { name: "Jordan Smith", avatarLetter: "J", revenue: 4100, target: 4500, rating: 4.8, avgTime: "38m" },
];

export function BarberPerformance() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {barberData.map((barber) => {
          const progress = (barber.revenue / barber.target) * 100;
          
          return (
            <Card key={barber.name} className="border-none shadow-sm hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#1A1A1B] text-[#C5A059] flex items-center justify-center font-bold">
                    {barber.avatarLetter}
                  </div>
                  <CardTitle className="text-sm font-bold">{barber.name}</CardTitle>
                </div>
                <TrendingUp size={16} className="text-emerald-500" />
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Revenue vs Target */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-500 font-bold uppercase tracking-widest">Revenue Target</span>
                    <span className="text-[#1A1A1B]">${barber.revenue} / ${barber.target}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#C5A059] transition-all duration-1000" 
                      style={{ width: `${Math.min(progress, 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold">{barber.rating}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Timer size={14} className="text-blue-500" />
                    <span className="text-xs font-bold">{barber.avgTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Efficiency Analysis */}
      <Card className="border-none shadow-sm bg-zinc-50">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Scissors size={16} /> Efficiency Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-500 leading-relaxed">
            Performance is calculated based on **Revenue generated** vs **Allocated shop hours**. 
            Alex Rivers currently leads with a **94% target completion rate**, while Sam Wilson shows 
            the highest customer retention but longer average service times.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}