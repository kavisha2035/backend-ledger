import React, { useState } from "react";

const SpendingChart = () => {
  const [timeframe, setTimeframe] = useState("Weekly");

  const weeklyData = [
    { day: "Mon", value: 1200 },
    { day: "Tue", value: 2400 },
    { day: "Wed", value: 1800 },
    { day: "Thu", value: 3200 },
    { day: "Fri", value: 2900 },
    { day: "Sat", value: 4100 },
    { day: "Sun", value: 1500 },
  ];

  const monthlyData = [
    { day: "Jan", value: 12000 },
    { day: "Feb", value: 18500 },
    { day: "Mar", value: 15000 },
    { day: "Apr", value: 22000 },
    { day: "May", value: 29000 },
    { day: "Jun", value: 26000 },
  ];

  const data = timeframe === "Weekly" ? weeklyData : monthlyData;
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-800">Spending overview</h3>
          <p className="text-xs text-slate-400">Visual chart of account outflow</p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>

      {/* SVG Bar Chart */}
      <div className="w-full h-48 flex items-end justify-between px-2 pt-4 relative">
        {/* Y-axis gridlines */}
        <div className="absolute left-0 right-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
          <div className="w-full border-t border-dashed border-slate-100"></div>
          <div className="w-full border-t border-dashed border-slate-100"></div>
          <div className="w-full border-t border-dashed border-slate-100"></div>
        </div>

        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={item.day} className="flex-1 flex flex-col items-center group z-10 mx-1">
              {/* Tooltip on hover */}
              <div className="absolute bottom-20 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mb-1 font-mono">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0
                }).format(item.value)}
              </div>
              
              {/* Bar */}
              <div className="w-8 sm:w-10 bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-32 relative">
                <div 
                  style={{ height: `${percentage}%` }}
                  className="w-full bg-blue-500 rounded-t-lg group-hover:bg-blue-600 transition-smooth origin-bottom"
                ></div>
              </div>
              
              {/* Label */}
              <span className="text-[10px] text-slate-400 font-semibold mt-2">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpendingChart;
