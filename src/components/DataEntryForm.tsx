import React, { useState, useEffect } from 'react';
import { ExamEntry } from '../types';
import { Save, X, Info, Calculator, Check, AlertTriangle } from 'lucide-react';

interface DataEntryFormProps {
  initialEntry?: ExamEntry | null;
  communes: string[];
  onSave: (entry: ExamEntry) => void;
  onCancel: () => void;
}

export default function DataEntryForm({
  initialEntry,
  communes,
  onSave,
  onCancel,
}: DataEntryFormProps) {
  const [commune, setCommune] = useState(initialEntry?.commune || communes[0] || 'Xã Đảo Long Phú Thuận');
  const [isCustomCommune, setIsCustomCommune] = useState(false);
  const [customCommune, setCustomCommune] = useState('');

  const [location, setLocation] = useState(initialEntry?.location || '');
  const [date, setDate] = useState(initialEntry?.date || new Date().toISOString().split('T')[0]);
  const [target, setTarget] = useState<string>(initialEntry?.target !== null && initialEntry?.target !== undefined ? initialEntry.target.toString() : '');
  const [totalExamined, setTotalExamined] = useState<number>(initialEntry?.totalExamined || 0);
  
  const [age0to6, setAge0to6] = useState<number>(initialEntry?.age0to6 || 0);
  const [age6to18, setAge6to18] = useState<number>(initialEntry?.age6to18 || 0);
  const [age18to60_community, setAge18to60_community] = useState<number>(initialEntry?.age18to60_community || 0);
  const [age18to60_worker, setAge18to60_worker] = useState<number>(initialEntry?.age18to60_worker || 0);
  const [age18to60_officer, setAge18to60_officer] = useState<number>(initialEntry?.age18to60_officer || 0);
  const [ageAbove60, setAgeAbove60] = useState<number>(initialEntry?.ageAbove60 || 0);
  
  const [notes, setNotes] = useState(initialEntry?.notes || '');
  const [status, setStatus] = useState<'Hoạt động' | 'Đã hủy'>(initialEntry?.status || 'Hoạt động');

  const [autoSum, setAutoSum] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  // Calculate sum of age groups
  const sumOfAgeGroups = age0to6 + age6to18 + age18to60_community + age18to60_worker + age18to60_officer + ageAbove60;

  // Auto update total if autoSum is active
  useEffect(() => {
    if (autoSum) {
      setTotalExamined(sumOfAgeGroups);
    }
  }, [sumOfAgeGroups, autoSum]);

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (!location.trim()) {
      validationErrors.push('Vui lòng nhập tên địa điểm/đoàn khám.');
    }
    if (!date) {
      validationErrors.push('Vui lòng chọn ngày.');
    }

    const finalCommune = isCustomCommune ? customCommune.trim() : commune;
    if (isCustomCommune && !customCommune.trim()) {
      validationErrors.push('Vui lòng nhập tên xã/đơn vị mới.');
    }

    const numTarget = target === '' ? null : Number(target);
    if (numTarget !== null && isNaN(numTarget)) {
      validationErrors.push('Chỉ tiêu phải là một số hợp lệ.');
    }

    if (!autoSum && totalExamined !== sumOfAgeGroups) {
      // Just a warning or strict? Let's make it a warning they can confirm, or just list it
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const entry: ExamEntry = {
      id: initialEntry?.id || Math.random().toString(36).substring(2, 9),
      stt: initialEntry?.stt || '', // App.tsx can compute/assign STT
      commune: finalCommune,
      location: location.trim(),
      date,
      target: numTarget,
      totalExamined: autoSum ? sumOfAgeGroups : totalExamined,
      age0to6,
      age6to18,
      age18to60_community,
      age18to60_worker,
      age18to60_officer,
      ageAbove60,
      notes: notes.trim(),
      status,
    };

    onSave(entry);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden animate-fade-in" id="data-entry-form">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between text-white">
        <div>
          <h3 className="font-bold text-base md:text-lg">
            {initialEntry ? 'Cập nhật số liệu khám' : 'Thêm đợt khám mới'}
          </h3>
          <p className="text-xs text-emerald-100/80">Nhập đầy đủ thông tin chi tiết và cơ cấu độ tuổi</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white"
          id="btn-cancel-top"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errors.length > 0 && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl space-y-1 text-sm">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Có lỗi xảy ra:
            </p>
            <ul className="list-disc list-inside text-xs pl-1 space-y-0.5">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Commune selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Xã / Đơn vị quản lý <span className="text-rose-500">*</span></label>
            {!isCustomCommune ? (
              <div className="flex gap-2">
                <select
                  value={commune}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomCommune(true);
                    } else {
                      setCommune(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {communes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__custom__">+ Thêm xã/đơn vị mới...</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập tên đơn vị/xã mới..."
                  value={customCommune}
                  onChange={(e) => setCustomCommune(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomCommune(false)}
                  className="text-xs px-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Tên đoàn / Địa điểm khám <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="VD: Trường Tiểu học Long Thuận 4"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Ngày khám <span className="text-rose-500">*</span></label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Target / Plan quota */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Chỉ tiêu kế hoạch đề ra (Nếu có)</label>
            <input
              type="number"
              placeholder="Nhập số lượng chỉ tiêu đề ra"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              min="0"
            />
          </div>
        </div>

        {/* Section: Age categories breakdown */}
        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-emerald-600" />
                Cơ cấu nhóm tuổi & đối tượng khám
              </h4>
              <p className="text-2xs text-slate-400">Vui lòng phân bổ số lượng khám vào các nhóm dưới đây</p>
            </div>

            {/* Checkbox autoSum */}
            <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={autoSum}
                onChange={(e) => setAutoSum(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              Tự động cộng dồn tổng số
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 0 to 6 */}
            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1.5">
              <span className="text-2xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full inline-block">Trẻ em</span>
              <label className="text-xs font-medium text-slate-600 block">Dưới 6 tuổi (0 - &lt;6)</label>
              <input
                type="number"
                value={age0to6}
                onChange={(e) => setAge0to6(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                min="0"
              />
            </div>

            {/* 6 to 18 */}
            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1.5">
              <span className="text-2xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">Học sinh</span>
              <label className="text-xs font-medium text-slate-600 block">6 - &lt;18 tuổi</label>
              <input
                type="number"
                value={age6to18}
                onChange={(e) => setAge6to18(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                min="0"
              />
            </div>

            {/* 18 to 60: Community */}
            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1.5">
              <span className="text-2xs font-bold text-lime-600 bg-lime-50 px-2 py-0.5 rounded-full inline-block">18-60 tuổi</span>
              <label className="text-xs font-medium text-slate-600 block">Cộng đồng</label>
              <input
                type="number"
                value={age18to60_community}
                onChange={(e) => setAge18to60_community(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-lime-500"
                min="0"
              />
            </div>

            {/* 18 to 60: Worker */}
            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1.5">
              <span className="text-2xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full inline-block">18-60 tuổi</span>
              <label className="text-xs font-medium text-slate-600 block">Lao động, Công ty, Doanh nghiệp</label>
              <input
                type="number"
                value={age18to60_worker}
                onChange={(e) => setAge18to60_worker(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                min="0"
              />
            </div>

            {/* 18 to 60: Officer */}
            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1.5">
              <span className="text-2xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">18-60 tuổi</span>
              <label className="text-xs font-medium text-slate-600 block">Cán bộ công chức</label>
              <input
                type="number"
                value={age18to60_officer}
                onChange={(e) => setAge18to60_officer(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                min="0"
              />
            </div>

            {/* Above 60 */}
            <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1.5">
              <span className="text-2xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full inline-block">Người già</span>
              <label className="text-xs font-medium text-slate-600 block">60 tuổi trở lên (≥60)</label>
              <input
                type="number"
                value={ageAbove60}
                onChange={(e) => setAgeAbove60(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                min="0"
              />
            </div>
          </div>

          {/* Validation of Sum */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Cơ cấu tổng cộng:</span>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                {sumOfAgeGroups.toLocaleString()} người
              </span>
            </div>

            <div className="space-y-1 sm:w-1/2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Tổng số đã khám thực tế</span>
                {autoSum && <span className="text-2xs text-emerald-600 font-medium">(Tự động bằng tổng các nhóm)</span>}
              </label>
              <input
                type="number"
                value={totalExamined}
                onChange={(e) => setTotalExamined(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={autoSum}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${
                  autoSum 
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-medium' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500'
                }`}
                min="0"
              />
              {!autoSum && totalExamined !== sumOfAgeGroups && (
                <p className="text-2xs text-amber-600 font-medium flex items-center gap-1 mt-1">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  Lưu ý: Tổng số nhập tay ({totalExamined}) lệch so với tổng các nhóm tuổi ({sumOfAgeGroups}).
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Ghi chú thêm</label>
            <textarea
              placeholder="VD: Giáo viên tham gia phụ trợ, hoặc bổ sung các ca mới..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-20 resize-none"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">Trạng thái đợt khám</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('Hoạt động')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  status === 'Hoạt động'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ring-2 ring-emerald-500/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Check className={`h-4 w-4 ${status === 'Hoạt động' ? 'opacity-100' : 'opacity-0'}`} />
                Hoạt động
              </button>

              <button
                type="button"
                onClick={() => setStatus('Đã hủy')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  status === 'Đã hủy'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-500/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Check className={`h-4 w-4 ${status === 'Đã hủy' ? 'opacity-100' : 'opacity-0'}`} />
                Đã hủy / Tạm dừng
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            id="btn-cancel-bottom"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow transition-all"
            id="btn-save-submit"
          >
            <Save className="h-4 w-4" />
            {initialEntry ? 'Cập nhật số liệu' : 'Lưu đợt khám'}
          </button>
        </div>
      </form>
    </div>
  );
}
