import React, { useState, useMemo } from 'react';
import { ExamEntry } from '../types';
import { 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Plus, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';

interface DataTableProps {
  entries: ExamEntry[];
  communes: string[];
  onEdit: (entry: ExamEntry) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
}

export default function DataTable({
  entries,
  communes,
  onEdit,
  onDelete,
  onAddNew,
  onExport,
  onImport,
  onReset,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch = 
        entry.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        entry.date.includes(searchTerm);

      const matchesCommune = selectedCommune === 'All' || entry.commune === selectedCommune;
      const matchesStatus = selectedStatus === 'All' || entry.status === selectedStatus;

      return matchesSearch && matchesCommune && matchesStatus;
    });
  }, [entries, searchTerm, selectedCommune, selectedStatus]);

  // Grouped entries by Commune
  const groupedEntries = useMemo(() => {
    const groups: Record<string, ExamEntry[]> = {};
    filteredEntries.forEach((entry) => {
      const comm = entry.commune || 'Khác';
      if (!groups[comm]) {
        groups[comm] = [];
      }
      groups[comm].push(entry);
    });

    // Ensure they are sorted inside groups by STT
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        const numA = parseInt(a.stt) || 999;
        const numB = parseInt(b.stt) || 999;
        return numA - numB;
      });
    });

    return groups;
  }, [filteredEntries]);

  // Calculate totals for filtered list
  const totals = useMemo(() => {
    let targetSum = 0;
    let examinedSum = 0;
    let age0to6Sum = 0;
    let age6to18Sum = 0;
    let age18to60_communitySum = 0;
    let age18to60_workerSum = 0;
    let age18to60_officerSum = 0;
    let ageAbove60Sum = 0;

    const activeTargets: number[] = [];

    filteredEntries.forEach((e) => {
      if (e.status === 'Hoạt động') {
        if (e.target !== null) {
          activeTargets.push(e.target);
        }
        examinedSum += e.totalExamined;
        age0to6Sum += e.age0to6;
        age6to18Sum += e.age6to18;
        age18to60_communitySum += e.age18to60_community;
        age18to60_workerSum += e.age18to60_worker;
        age18to60_officerSum += e.age18to60_officer;
        ageAbove60Sum += e.ageAbove60;
      }
    });

    const uniqueTargets = Array.from(new Set(activeTargets)) as number[];
    targetSum = uniqueTargets.reduce((sum: number, val: number) => sum + val, 0);

    const averageRatio = targetSum ? Math.round((examinedSum / targetSum) * 100) : 0;

    return {
      targetSum,
      examinedSum,
      age0to6Sum,
      age6to18Sum,
      age18to60_communitySum,
      age18to60_workerSum,
      age18to60_officerSum,
      ageAbove60Sum,
      averageRatio,
    };
  }, [filteredEntries]);

  const getStatusBadge = (status: string) => {
    if (status === 'Hoạt động') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Hoạt động
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        Đã hủy
      </span>
    );
  };

  const renderTableHeader = () => (
    <thead className="bg-slate-50 text-slate-700 text-2xs font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
      <tr>
        <th className="px-3 py-3 text-left w-12">STT</th>
        <th className="px-4 py-3 text-left min-w-44">Địa điểm / Đoàn khám</th>
        <th className="px-3 py-3 text-center w-24">Ngày</th>
        <th className="px-3 py-3 text-right w-20">Chỉ tiêu</th>
        <th className="px-3 py-3 text-right w-24 bg-emerald-50/50">Tổng khám</th>
        <th className="px-2 py-3 text-right w-16">0-&lt;6t</th>
        <th className="px-2 py-3 text-right w-16">6-&lt;18t</th>
        <th className="px-2 py-3 text-right w-20">18-60 (CĐ)</th>
        <th className="px-2 py-3 text-right w-20">18-60 (DN)</th>
        <th className="px-2 py-3 text-right w-20">18-60 (CB)</th>
        <th className="px-2 py-3 text-right w-16">≥60t</th>
        <th className="px-3 py-3 text-center w-20">Tỷ lệ</th>
        <th className="px-3 py-3 text-left min-w-28">Ghi chú</th>
        <th className="px-3 py-3 text-center w-28">Hành động</th>
      </tr>
    </thead>
  );

  const renderRow = (entry: ExamEntry, index: number, displayStt: string) => {
    const ratio = entry.target ? Math.round((entry.totalExamined / entry.target) * 100) : null;
    const isCancelled = entry.status === 'Đã hủy';

    return (
      <tr 
        key={entry.id} 
        className={`hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs ${
          isCancelled ? 'bg-rose-50/20 text-slate-400 line-through decoration-slate-300' : 'text-slate-700'
        }`}
      >
        <td className="px-3 py-3 font-semibold text-slate-500 text-center">{displayStt}</td>
        <td className="px-4 py-3 font-medium">
          <div className="flex flex-col">
            <span className={isCancelled ? 'text-slate-400' : 'text-slate-900 font-semibold'}>{entry.location}</span>
            <span className="text-3xs text-slate-400 font-normal mt-0.5">{entry.commune}</span>
          </div>
        </td>
        <td className="px-3 py-3 text-center text-slate-500 font-mono">
          {entry.date ? entry.date.split('-').reverse().join('/') : ''}
        </td>
        <td className="px-3 py-3 text-right font-semibold font-mono">
          {entry.target !== null ? entry.target.toLocaleString() : '-'}
        </td>
        <td className={`px-3 py-3 text-right font-bold font-mono bg-slate-50/20 ${isCancelled ? 'text-slate-400' : 'text-emerald-700 bg-emerald-50/20'}`}>
          {entry.totalExamined.toLocaleString()}
        </td>
        <td className="px-2 py-3 text-right font-mono text-slate-500">{entry.age0to6 || '-'}</td>
        <td className="px-2 py-3 text-right font-mono text-slate-500">{entry.age6to18 || '-'}</td>
        <td className="px-2 py-3 text-right font-mono text-slate-500">{entry.age18to60_community || '-'}</td>
        <td className="px-2 py-3 text-right font-mono text-slate-500">{entry.age18to60_worker || '-'}</td>
        <td className="px-2 py-3 text-right font-mono text-slate-500">{entry.age18to60_officer || '-'}</td>
        <td className="px-2 py-3 text-right font-mono text-slate-500">{entry.ageAbove60 || '-'}</td>
        <td className="px-3 py-3 text-center">
          {isCancelled ? (
            <span className="text-rose-400 font-semibold text-2xs uppercase">Đã hủy</span>
          ) : ratio !== null ? (
            <div className="flex flex-col items-center justify-center">
              <span className={`font-bold font-mono ${ratio >= 100 ? 'text-emerald-600' : ratio >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>
                {ratio}%
              </span>
              <div className="w-12 bg-slate-100 rounded-full h-1 overflow-hidden mt-1">
                <div 
                  className={`h-full rounded-full ${ratio >= 100 ? 'bg-emerald-500' : ratio >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                  style={{ width: `${Math.min(ratio, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </td>
        <td className="px-3 py-3 text-slate-500 max-w-44 truncate italic text-2xs" title={entry.notes}>
          {entry.notes || <span className="text-slate-300 font-normal">--</span>}
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => onEdit(entry)}
              className="p-1 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors"
              title="Chỉnh sửa dòng"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition-colors"
              title="Xóa dòng"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-fade-in" id="data-table">
      {/* Control Toolbar */}
      <div className="p-5 border-b border-zinc-200 bg-zinc-50/50 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-zinc-800 text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Bảng Số Liệu Chi Tiết
            </h3>
            <span className="bg-zinc-100 text-zinc-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-zinc-200/40">
              {filteredEntries.length} bản ghi
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode */}
            <div className="bg-zinc-100 p-1 rounded-lg flex items-center border border-zinc-200">
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'grouped'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Chia theo Xã
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'flat'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Danh sách phẳng
              </button>
            </div>

            {/* Quick Actions */}
            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm đợt khám
            </button>

            <button
              onClick={onExport}
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg transition-all"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              Xuất Excel
            </button>

            {/* Excel Import Label Button */}
            <label className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-all">
              <Upload className="h-3.5 w-3.5 text-indigo-500" />
              Nhập Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={onImport}
                className="hidden"
              />
            </label>

            <button
              onClick={onReset}
              className="flex items-center gap-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 font-medium text-xs p-2 rounded-lg transition-colors border border-dashed border-slate-200"
              title="Khôi phục số liệu gốc ban đầu"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Đặt lại gốc
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm địa điểm, ghi chú, ngày..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
            />
          </div>

          {/* Commune Filter */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">Tất cả Xã / Đơn vị</option>
              {communes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">Tất cả Trạng thái</option>
              <option value="Hoạt động">Đang hoạt động</option>
              <option value="Đã hủy">Đã hủy</option>
            </select>
          </div>

          <div className="flex items-center text-3xs text-slate-400 p-1 leading-tight border-l-2 border-emerald-500 bg-white rounded-r-lg">
            <span>
              💡 Dữ liệu nhóm tuổi và đối tượng: <strong>CĐ</strong> (Cộng đồng), <strong>DN</strong> (Doanh nghiệp), <strong>CB</strong> (Cán bộ).
            </span>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto max-h-[500px]">
        {filteredEntries.length > 0 ? (
          <table className="w-full border-collapse">
            {renderTableHeader()}
            
            {viewMode === 'grouped' ? (
              // Grouped Render
              Object.keys(groupedEntries).map((communeName, commIndex) => {
                const communeRows = groupedEntries[communeName];
                const activeCommRows = communeRows.filter(r => r.status === 'Hoạt động');

                // Compute Commune Group Totals
                const activeCommTargets = activeCommRows
                  .filter((e) => e.target !== null)
                  .map((e) => e.target as number);
                const uniqueCommTargets = Array.from(new Set(activeCommTargets)) as number[];
                const commTarget = uniqueCommTargets.reduce((sum: number, val: number) => sum + val, 0);
                const commExamined = activeCommRows.reduce((sum, e) => sum + e.totalExamined, 0);
                const commRatio = commTarget ? Math.round((commExamined / commTarget) * 100) : 0;

                const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
                const groupSymbol = romanNumerals[commIndex] || (commIndex + 1).toString();

                return (
                  <tbody key={communeName}>
                    {/* Group Header */}
                    <tr className="bg-slate-100/70 border-y border-slate-200 font-bold text-slate-800 text-xs">
                      <td className="px-3 py-2.5 text-center">{groupSymbol}</td>
                      <td className="px-4 py-2.5 text-left" colSpan={2}>
                        <span className="text-emerald-800 font-bold uppercase">{communeName}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{commTarget > 0 ? commTarget.toLocaleString() : '-'}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-800 bg-emerald-50/30">{commExamined.toLocaleString()}</td>
                      <td colSpan={6}></td>
                      <td className="px-3 py-2.5 text-center font-mono text-emerald-800">
                        {commTarget > 0 ? `${commRatio}%` : '0%'}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                    
                    {/* Group rows */}
                    {communeRows.map((entry, rowIndex) => 
                      renderRow(entry, rowIndex, entry.stt || (rowIndex + 1).toString())
                    )}
                  </tbody>
                );
              })
            ) : (
              // Flat Render
              <tbody>
                {filteredEntries.map((entry, idx) => 
                  renderRow(entry, idx, (idx + 1).toString())
                )}
              </tbody>
            )}

            {/* Total Footer Row */}
            <tfoot className="border-t-2 border-slate-300 bg-slate-900 text-white font-semibold text-xs sticky bottom-0">
              <tr>
                <td className="px-3 py-4 text-center font-bold">∑</td>
                <td className="px-4 py-4 text-left font-bold" colSpan={2}>TỔNG CỘNG HOẠT ĐỘNG</td>
                <td className="px-3 py-4 text-right font-bold font-mono text-amber-300">
                  {totals.targetSum.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-right font-bold font-mono text-emerald-400 bg-slate-800/60">
                  {totals.examinedSum.toLocaleString()}
                </td>
                <td className="px-2 py-4 text-right font-mono text-slate-300">{totals.age0to6Sum.toLocaleString()}</td>
                <td className="px-2 py-4 text-right font-mono text-slate-300">{totals.age6to18Sum.toLocaleString()}</td>
                <td className="px-2 py-4 text-right font-mono text-slate-300">{totals.age18to60_communitySum.toLocaleString()}</td>
                <td className="px-2 py-4 text-right font-mono text-slate-300">{totals.age18to60_workerSum.toLocaleString()}</td>
                <td className="px-2 py-4 text-right font-mono text-slate-300">{totals.age18to60_officerSum.toLocaleString()}</td>
                <td className="px-2 py-4 text-right font-mono text-slate-300">{totals.ageAbove60Sum.toLocaleString()}</td>
                <td className="px-3 py-4 text-center font-bold font-mono text-emerald-400">
                  {totals.targetSum > 0 ? `${totals.averageRatio}%` : '0%'}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="font-medium text-sm">Không tìm thấy bản ghi nào khớp với bộ lọc</p>
            <p className="text-xs">Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn xã khác</p>
          </div>
        )}
      </div>
    </div>
  );
}
