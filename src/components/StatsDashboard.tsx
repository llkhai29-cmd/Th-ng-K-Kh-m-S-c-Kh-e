import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { ExamEntry } from '../types';
import { 
  Users, 
  Activity, 
  Target, 
  Percent, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar,
  Layers
} from 'lucide-react';

interface StatsDashboardProps {
  entries: ExamEntry[];
}

export default function StatsDashboard({ entries }: StatsDashboardProps) {
  // Filter active entries for statistics
  const activeEntries = useMemo(() => entries.filter((e) => e.status === 'Hoạt động'), [entries]);

  // KPI Calculations
  const stats = useMemo(() => {
    const activeTargets = activeEntries
      .filter((e) => e.target !== null)
      .map((e) => e.target as number);
    const uniqueTargets = Array.from(new Set(activeTargets)) as number[];
    const totalTarget = uniqueTargets.reduce((sum: number, val: number) => sum + val, 0);

    const totalExamined = activeEntries.reduce((sum, e) => sum + e.totalExamined, 0);
    const completionRate = totalTarget ? Math.round((totalExamined / totalTarget) * 100) : 0;
    
    // Ages
    const age0to6 = activeEntries.reduce((sum, e) => sum + e.age0to6, 0);
    const age6to18 = activeEntries.reduce((sum, e) => sum + e.age6to18, 0);
    const age18to60 = activeEntries.reduce((sum, e) => sum + e.age18to60_community + e.age18to60_worker + e.age18to60_officer, 0);
    const ageAbove60 = activeEntries.reduce((sum, e) => sum + e.ageAbove60, 0);

    // Splits for 18-60
    const comm18 = activeEntries.reduce((sum, e) => sum + e.age18to60_community, 0);
    const worker18 = activeEntries.reduce((sum, e) => sum + e.age18to60_worker, 0);
    const officer18 = activeEntries.reduce((sum, e) => sum + e.age18to60_officer, 0);

    const cancelledCount = entries.filter((e) => e.status === 'Đã hủy').length;

    return {
      totalTarget,
      totalExamined,
      completionRate,
      age0to6,
      age6to18,
      age18to60,
      ageAbove60,
      comm18,
      worker18,
      officer18,
      totalLocations: entries.length,
      activeLocationsCount: activeEntries.length,
      cancelledCount,
    };
  }, [entries, activeEntries]);

  // Chart 1: Communes Performance (Target vs Examined)
  const communeChartData = useMemo(() => {
    const map: Record<string, { name: string; targets: number[]; đãKhám: number }> = {};
    activeEntries.forEach((entry) => {
      const comm = entry.commune || 'Khác';
      if (!map[comm]) {
        map[comm] = { name: comm, targets: [], đãKhám: 0 };
      }
      if (entry.target !== null) {
        map[comm].targets.push(entry.target);
      }
      map[comm].đãKhám += entry.totalExamined;
    });

    return Object.values(map).map((item) => {
      const uniqueTargets = Array.from(new Set(item.targets));
      const chỉTiêu = uniqueTargets.reduce((sum, val) => sum + val, 0);
      return {
        name: item.name,
        chỉTiêu,
        đãKhám: item.đãKhám,
      };
    });
  }, [activeEntries]);

  // Chart 2: Age Demographics
  const agePieData = useMemo(() => {
    return [
      { name: '0 - <6 tuổi', value: stats.age0to6, color: '#0ea5e9' }, // sky-500
      { name: '6 - <18 tuổi', value: stats.age6to18, color: '#10b981' }, // emerald-500
      { name: '18 - <60 tuổi', value: stats.age18to60, color: '#f59e0b' }, // amber-500
      { name: '≥60 tuổi', value: stats.ageAbove60, color: '#ef4444' }, // red-500
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Chart 3: Detailed 18-60 cohort split
  const adultCohortPieData = useMemo(() => {
    return [
      { name: 'Cộng đồng', value: stats.comm18, color: '#84cc16' }, // lime-500
      { name: 'Lao động / Doanh nghiệp', value: stats.worker18, color: '#06b6d4' }, // cyan-500
      { name: 'Cán bộ công chức', value: stats.officer18, color: '#6366f1' }, // indigo-500
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Chart 4: Daily progress (Time trend)
  const dateTrendData = useMemo(() => {
    const map: Record<string, { date: string; formattedDate: string; đãKhám: number }> = {};
    activeEntries.forEach((entry) => {
      const dStr = entry.date;
      if (!dStr) return;
      if (!map[dStr]) {
        // Format to DD/MM
        const parts = dStr.split('-');
        const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dStr;
        map[dStr] = { date: dStr, formattedDate: formatted, đãKhám: 0 };
      }
      map[dStr].đãKhám += entry.totalExamined;
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [activeEntries]);

  return (
    <div className="space-y-6" id="stats-dashboard">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Examined */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng đã khám</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalExamined.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Người dân đã thực hiện khám</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Quota Targets */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chỉ tiêu đề ra</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalTarget.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Mục tiêu kế hoạch tổng cộng</p>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg">
            <Target className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Completion Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tỷ lệ hoàn thành</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.completionRate}%</p>
            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(stats.completionRate, 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-lg">
            <Percent className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Operation Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Số đợt khám</p>
            <p className="text-2xl font-bold text-slate-900">
              {stats.activeLocationsCount} <span className="text-xs font-normal text-slate-400">/ {stats.totalLocations}</span>
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              {stats.activeLocationsCount} hoạt động
              {stats.cancelledCount > 0 && (
                <span className="text-rose-500 ml-1">({stats.cancelledCount} đã hủy)</span>
              )}
            </p>
          </div>
          <div className="bg-slate-50 text-slate-600 p-3 rounded-lg">
            <Layers className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Commune Target vs Examined */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm md:text-base flex items-center gap-2">
              <Layers className="w-4 w-4 text-emerald-600" />
              Chỉ tiêu và Thực tế khám theo Đơn vị hành chính
            </h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={communeChartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #f1f5f9' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="chỉTiêu" name="Chỉ tiêu kế hoạch" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="đãKhám" name="Tổng số đã khám" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily progress trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm md:text-base flex items-center gap-2">
              <Calendar className="w-4 w-4 text-emerald-600" />
              Tiến độ khám theo Ngày (Số lượt khám hàng ngày)
            </h3>
          </div>
          <div className="h-80 w-full">
            {dateTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dateTrendData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #f1f5f9' }}
                  />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Line 
                    type="monotone" 
                    dataKey="đãKhám" 
                    name="Số ca đã khám" 
                    stroke="#0ea5e9" 
                    strokeWidth={2.5} 
                    activeDot={{ r: 6 }} 
                    dot={{ strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Chưa có dữ liệu thời gian để hiển thị xu hướng
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Age Demographic Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm md:text-base flex items-center gap-2">
            <Users className="w-4 w-4 text-emerald-600" />
            Cơ cấu độ tuổi người tham gia khám
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-60 w-full">
              {agePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={agePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {agePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} người`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Chưa có dữ liệu độ tuổi
                </div>
              )}
            </div>
            <div className="space-y-3">
              {agePieData.map((item, index) => {
                const percentage = stats.totalExamined ? Math.round((item.value / stats.totalExamined) * 100) : 0;
                return (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium text-slate-600">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800">{item.value.toLocaleString()} ca</span>
                      <span className="text-2xs text-slate-400 block">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 4: Segment of 18-60 years old */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 text-sm md:text-base flex items-center gap-2">
            <Users className="w-4 w-4 text-cyan-600" />
            Cơ cấu nhóm tuổi 18 - dưới 60 theo Đối tượng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-60 w-full">
              {adultCohortPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adultCohortPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={80}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {adultCohortPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} người`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Chưa có dữ liệu nhóm tuổi 18-60
                </div>
              )}
            </div>
            <div className="space-y-3">
              {adultCohortPieData.map((item, index) => {
                const totalAdults = stats.comm18 + stats.worker18 + stats.officer18;
                const percentage = totalAdults ? Math.round((item.value / totalAdults) * 100) : 0;
                return (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium text-slate-600">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800">{item.value.toLocaleString()} ca</span>
                      <span className="text-2xs text-slate-400 block">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
