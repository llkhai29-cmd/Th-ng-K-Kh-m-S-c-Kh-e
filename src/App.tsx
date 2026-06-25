import React, { useState, useEffect, useMemo } from 'react';
import { defaultExamEntries } from './data/defaultData';
import { ExamEntry } from './types';
import { exportToExcel, importFromExcel } from './utils/excel';
import StatsDashboard from './components/StatsDashboard';
import DataEntryForm from './components/DataEntryForm';
import DataTable from './components/DataTable';
import { 
  HeartPulse, 
  Database, 
  User, 
  Clock, 
  Plus, 
  BarChart2, 
  TableProperties, 
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'medical_exam_entries_v1';

export default function App() {
  const [entries, setEntries] = useState<ExamEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'table' | 'charts'>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExamEntry | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Load entries from localStorage or default
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        setEntries(defaultExamEntries);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultExamEntries));
      }
    } catch (e) {
      console.error('Failed to load localStorage entries', e);
      setEntries(defaultExamEntries);
    }
  }, []);

  // Save entries helper
  const saveEntries = (newEntries: ExamEntry[]) => {
    setEntries(newEntries);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newEntries));
    } catch (e) {
      console.error('Failed to save entries to localStorage', e);
      showToast('Không thể lưu dữ liệu vào trình duyệt. Dung lượng lưu trữ đầy!', 'error');
    }
  };

  // Extract unique communes list
  const communes = useMemo(() => {
    const list = entries.map((e) => e.commune).filter((v, i, a) => a.indexOf(v) === i);
    // Sort so standard ones are first
    const defaults = ["Xã Đảo Long Phú Thuận", "Xã Thường Phước", "Xã Đảo Long Khánh", "TTYT KV Hồng Ngự 2"];
    const others = list.filter(c => !defaults.includes(c)).sort();
    return [...defaults.filter(d => list.includes(d)), ...others];
  }, [entries]);

  // Toast notifier
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Add / Edit handlers
  const handleSaveEntry = (entry: ExamEntry) => {
    let updatedEntries = [...entries];
    
    if (editingEntry) {
      // Editing
      updatedEntries = entries.map((e) => (e.id === entry.id ? entry : e));
      showToast(`Đã cập nhật số liệu tại: ${entry.location}`, 'success');
    } else {
      // Adding new. Let's calculate proper STT for this commune
      const communeEntries = entries.filter((e) => e.commune === entry.commune);
      const nextStt = (communeEntries.length + 1).toString();
      entry.stt = nextStt;
      updatedEntries.push(entry);
      showToast(`Đã thêm đợt khám mới tại: ${entry.location}`, 'success');
    }

    saveEntries(updatedEntries);
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (id: string) => {
    const targetEntry = entries.find(e => e.id === id);
    if (!targetEntry) return;

    if (window.confirm(`Bạn có chắc chắn muốn xóa số liệu tại: "${targetEntry.location}"?`)) {
      const updated = entries.filter((e) => e.id !== id);
      // Recalculate STTs for that commune to keep sequence clean
      const commune = targetEntry.commune;
      let counter = 1;
      const finalUpdated = updated.map((e) => {
        if (e.commune === commune) {
          return { ...e, stt: (counter++).toString() };
        }
        return e;
      });

      saveEntries(finalUpdated);
      showToast(`Đã xóa số liệu tại: ${targetEntry.location}`, 'info');
    }
  };

  const handleEditTrigger = (entry: ExamEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleAddNewTrigger = () => {
    setEditingEntry(null);
    setIsFormOpen(true);
  };

  // Excel Export
  const handleExportExcel = () => {
    try {
      exportToExcel(entries);
      showToast('Đã xuất file Excel thành công!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Lỗi xuất file Excel!', 'error');
    }
  };

  // Excel Import
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importFromExcel(file);
      if (imported.length === 0) {
        showToast('Không tìm thấy dữ liệu hợp lệ trong file Excel!', 'error');
        return;
      }

      // Merge entries
      const updatedEntries = [...entries];
      let addedCount = 0;
      let updatedCount = 0;

      imported.forEach((item) => {
        if (!item.location || !item.commune) return;

        // Try to match existing entry by commune, location and date
        const matchIdx = updatedEntries.findIndex(
          (e) => 
            e.commune.toLowerCase() === item.commune?.toLowerCase() &&
            e.location.toLowerCase() === item.location?.toLowerCase() &&
            e.date === item.date
        );

        const merged: ExamEntry = {
          id: matchIdx !== -1 ? updatedEntries[matchIdx].id : Math.random().toString(36).substring(2, 9),
          stt: item.stt || (matchIdx !== -1 ? updatedEntries[matchIdx].stt : ''),
          commune: item.commune,
          location: item.location,
          date: item.date || new Date().toISOString().split('T')[0],
          target: item.target !== undefined ? item.target : null,
          totalExamined: item.totalExamined || 0,
          age0to6: item.age0to6 || 0,
          age6to18: item.age6to18 || 0,
          age18to60_community: item.age18to60_community || 0,
          age18to60_worker: item.age18to60_worker || 0,
          age18to60_officer: item.age18to60_officer || 0,
          ageAbove60: item.ageAbove60 || 0,
          notes: item.notes || '',
          status: item.status || 'Hoạt động',
        };

        if (matchIdx !== -1) {
          updatedEntries[matchIdx] = merged;
          updatedCount++;
        } else {
          // Compute correct STT
          const count = updatedEntries.filter(x => x.commune === merged.commune).length;
          merged.stt = (count + 1).toString();
          updatedEntries.push(merged);
          addedCount++;
        }
      });

      saveEntries(updatedEntries);
      showToast(`Đã nhập xong: thêm mới ${addedCount} hàng, cập nhật ${updatedCount} hàng`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra lại định dạng file!', 'error');
    } finally {
      e.target.value = ''; // clear input
    }
  };

  // Reset database to original values
  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn ĐẶT LẠI dữ liệu về ban đầu? Tất cả các thay đổi tự thêm sẽ bị xóa.')) {
      saveEntries(defaultExamEntries);
      showToast('Đã khôi phục dữ liệu gốc ban đầu thành công!', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans antialiased text-zinc-900 flex flex-col md:flex-row">
      {/* Alert / Notification banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-fade-in">
          <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-zinc-50 border-zinc-200 text-zinc-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Database className="h-5 w-5 text-zinc-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col shrink-0">
        <div className="p-6 md:p-8 flex items-center justify-between md:block">
          <div className="flex items-center space-x-3 text-emerald-600">
            <HeartPulse className="w-8 h-8 shrink-0" />
            <span className="font-bold text-xl tracking-tight text-zinc-800">DATAFLOW</span>
          </div>
          <span className="md:hidden inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-3xs font-semibold px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider">
            Sở Y Tế
          </span>
        </div>

        <nav className="flex-row md:flex-col flex px-4 pb-4 md:pb-0 space-x-2 md:space-x-0 md:space-y-1 flex-1 md:overflow-y-auto">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-lg font-medium text-xs md:text-sm transition-all ${
              activeTab === 'table'
                ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <TableProperties className="w-4 h-4 shrink-0" />
            <span>Số liệu chi tiết</span>
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start space-x-3 px-4 py-3 rounded-lg font-medium text-xs md:text-sm transition-all ${
              activeTab === 'charts'
                ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <BarChart2 className="w-4 h-4 shrink-0" />
            <span>Biểu đồ trực quan</span>
          </button>
        </nav>

        {/* Sidebar Actions */}
        <div className="hidden md:block p-6 space-y-2 border-t border-zinc-100 bg-zinc-50/50">
          <button
            onClick={handleAddNewTrigger}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 font-medium text-xs transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm đợt khám</span>
          </button>
          
          <button
            onClick={handleExportExcel}
            className="w-full flex items-center justify-center space-x-2 bg-white text-zinc-700 border border-zinc-200 py-2.5 rounded-lg hover:bg-zinc-50 font-medium text-xs transition-all cursor-pointer"
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={handleResetData}
            className="w-full flex items-center justify-center space-x-2 bg-transparent text-zinc-400 hover:text-zinc-600 py-2 rounded-lg font-medium text-[11px] transition-all cursor-pointer"
            title="Khôi phục số liệu gốc ban đầu"
          >
            <span>Đặt lại dữ liệu gốc</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Header */}
        <header className="min-h-20 bg-white border-b border-zinc-200 px-6 md:px-10 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-800 tracking-tight">Thống kê &amp; Nhập liệu</h1>
            <p className="text-xs text-zinc-500 font-medium">Chiến dịch khám sức khỏe Hồng Ngự 2</p>
          </div>
          <div className="flex items-center space-x-6 self-stretch sm:self-auto justify-between sm:justify-end">
            <span className="text-zinc-400 font-medium text-xs md:text-sm">25 Tháng 6, 2026</span>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <span className="block text-2xs font-bold text-zinc-700">llkhai29@gmail.com</span>
                <span className="block text-3xs text-emerald-600 font-semibold">Sở Y Tế</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-100 border-2 border-white shadow-xs flex items-center justify-center font-bold text-zinc-600 text-sm">
                LY
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Panels */}
        <div className="p-6 md:p-10 space-y-8 flex-1">
          {/* Quick Stats Strip */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-5 md:p-6 rounded-xl border border-zinc-200 shadow-xs">
              <p className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider">Tổng đợt khám</p>
              <p className="text-2xl md:text-3xl font-bold text-zinc-800 mt-1">{entries.length}</p>
              <div className="mt-2 text-3xs text-emerald-600 font-bold">Hoạt động ổn định</div>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-xl border border-zinc-200 shadow-xs">
              <p className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider">Tổng người khám</p>
              <p className="text-2xl md:text-3xl font-bold text-zinc-800 mt-1">
                {entries.reduce((acc, curr) => acc + (curr.status === 'Hoạt động' ? curr.totalExamined : 0), 0).toLocaleString()}
              </p>
              <div className="mt-2 text-3xs text-zinc-400 font-medium">Cập nhật thời gian thực</div>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-xl border border-zinc-200 shadow-xs">
              <p className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider">Tổng chỉ tiêu</p>
              <p className="text-2xl md:text-3xl font-bold text-zinc-800 mt-1">
                {(() => {
                  const activeTargets = entries
                    .filter((e) => e.status === 'Hoạt động' && e.target !== null)
                    .map((e) => e.target as number);
                  const uniqueTargets = Array.from(new Set(activeTargets)) as number[];
                  return uniqueTargets.reduce((sum: number, val: number) => sum + val, 0).toLocaleString();
                })()}
              </p>
              <div className="mt-2 text-3xs text-emerald-600 font-bold">Tiến độ tốt</div>
            </div>
            <div className="bg-white p-5 md:p-6 rounded-xl border border-zinc-200 shadow-xs">
              <p className="text-2xs font-semibold text-zinc-400 uppercase tracking-wider">Tỷ lệ hoàn thành</p>
              <p className="text-2xl md:text-3xl font-bold text-zinc-800 mt-1">
                {(() => {
                  const activeTargets = entries
                    .filter((e) => e.status === 'Hoạt động' && e.target !== null)
                    .map((e) => e.target as number);
                  const uniqueTargets = Array.from(new Set(activeTargets)) as number[];
                  const target = uniqueTargets.reduce((sum: number, val: number) => sum + val, 0);
                  const examined = entries.reduce((acc, curr) => acc + (curr.status === 'Hoạt động' ? curr.totalExamined : 0), 0);
                  return target ? Math.round((examined / target) * 100) : 0;
                })()}%
              </p>
              <div className="mt-2 text-3xs text-emerald-600 font-bold">Đạt mục tiêu đề ra</div>
            </div>
          </section>

          {/* Active Tab Content */}
          <div className="animate-fade-in">
            {activeTab === 'table' ? (
              <DataTable
                entries={entries}
                communes={communes}
                onEdit={handleEditTrigger}
                onDelete={handleDeleteEntry}
                onAddNew={handleAddNewTrigger}
                onExport={handleExportExcel}
                onImport={handleImportExcel}
                onReset={handleResetData}
              />
            ) : (
              <StatsDashboard entries={entries} />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-zinc-200 py-6 px-6 md:px-10 text-zinc-400 text-xs mt-auto shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 Sở Y Tế Hồng Ngự 2. Đã bảo lưu mọi quyền.</p>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 text-2xs bg-zinc-50 text-zinc-500 border border-zinc-200 px-2.5 py-1 rounded-md font-mono">
                <Database className="h-3 w-3" /> Offline Local Storage Active
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* Overlay Modal for Data Entry Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
            <DataEntryForm
              initialEntry={editingEntry}
              communes={communes}
              onSave={handleSaveEntry}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingEntry(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
