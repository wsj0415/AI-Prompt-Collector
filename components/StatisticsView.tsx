
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import type { Prompt } from '../types';
import { Modality } from '../types';
import { CollectionIcon, SparklesIcon, HashtagIcon } from './icons';

interface StatisticsViewProps {
  prompts: Prompt[];
}

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#999">{`${value} Prompts`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#333" className="dark:fill-gray-300">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.FC<React.SVGProps<SVGSVGElement>> }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 flex items-center space-x-4">
        <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-full">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);


const StatisticsView: React.FC<StatisticsViewProps> = ({ prompts }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const { modalityData, themeData, totalPrompts, mostUsedModality, totalThemes } = useMemo(() => {
    // Memoize processed data to avoid re-calculation on every render.
    // The dependency array [prompts] ensures this logic runs only when the raw data changes.
    const modalityCounts = prompts.reduce((acc, prompt) => {
      acc[prompt.modality] = (acc[prompt.modality] || 0) + 1;
      return acc;
    }, {} as Record<Modality, number>);
    
    const themeCounts = prompts.reduce((acc, prompt) => {
        if (prompt.theme) {
            acc[prompt.theme] = (acc[prompt.theme] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const modalityData = Object.entries(modalityCounts).map(([name, value]) => ({ name, value }));
    const mostUsedModality = modalityData.length > 0 ? modalityData.sort((a,b) => b.value - a.value)[0].name : 'N/A';

    return {
        modalityData,
        themeData: Object.entries(themeCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10),
        totalPrompts: prompts.length,
        mostUsedModality,
        totalThemes: Object.keys(themeCounts).length
    };
  }, [prompts]);

  if (prompts.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400">
        <h2 className="text-2xl font-bold">No Data Available</h2>
        <p>Add some prompts to see your statistics.</p>
      </div>
    );
  }

  // FIX: The recharts type definitions are incorrect and do not recognize the valid `activeIndex` prop.
  // Spreading props from an 'any' object is a workaround to bypass the strict type check.
  const pieProps: any = {
    activeIndex,
    activeShape: renderActiveShape,
    data: modalityData,
    cx: "50%",
    cy: "50%",
    innerRadius: 80,
    outerRadius: 110,
    fill: "#059669",
    dataKey: "value",
    onMouseEnter: onPieEnter,
  };

  return (
    <div className="p-4 md:p-8 space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Prompts" value={totalPrompts} icon={CollectionIcon} />
          <StatCard title="Most Frequent Modality" value={mostUsedModality} icon={SparklesIcon} />
          <StatCard title="Total Unique Themes" value={totalThemes} icon={HashtagIcon} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="h-96">
          <h3 className="text-xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">Prompts by Modality</h3>
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie {...pieProps}>
                {modalityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-96">
          <h3 className="text-xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">Top 10 Themes</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={themeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}}/>
              <Tooltip
                animationDuration={0}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(2px)',
                  border: '1px solid #ccc',
                  color: '#333'
                }}
              />
              <Legend />
              <Bar dataKey="value" name="Prompt Count" fill="#10b981" cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;
