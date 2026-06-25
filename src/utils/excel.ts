import * as XLSX from 'xlsx';
import { ExamEntry } from '../types';

export function exportToExcel(entries: ExamEntry[]): void {
  // Sort by commune and stt
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.commune !== b.commune) {
      return a.commune.localeCompare(b.commune);
    }
    const numA = parseInt(a.stt) || 999;
    const numB = parseInt(b.stt) || 999;
    return numA - numB;
  });

  const header = [
    'STT',
    'Địa điểm / Đoàn khám',
    'Ngày',
    'Chỉ tiêu',
    'Tổng số đã khám',
    '0 - <6 tuổi',
    '6 tuổi - < 18 tuổi',
    'đủ 18 - dưới 60 (Cộng đồng)',
    'đủ 18 - dưới 60 (Lao động/Doanh nghiệp)',
    'đủ 18 - dưới 60 (Cán bộ công chức)',
    '60 tuổi trở lên',
    'Ghi chú',
    'Trạng thái',
    'Tỷ lệ (%)'
  ];

  const rows = sortedEntries.map((entry, index) => {
    const ratio = entry.target ? Math.round((entry.totalExamined / entry.target) * 100) : 0;
    return [
      entry.stt || (index + 1).toString(),
      entry.location,
      entry.date,
      entry.target ?? '',
      entry.totalExamined,
      entry.age0to6,
      entry.age6to18,
      entry.age18to60_community,
      entry.age18to60_worker,
      entry.age18to60_officer,
      entry.ageAbove60,
      entry.notes,
      entry.status,
      entry.target ? `${ratio}%` : ''
    ];
  });

  // Calculate totals
  const totalTarget = entries.reduce((sum, e) => sum + (e.target || 0), 0);
  const totalExamined = entries.reduce((sum, e) => sum + e.totalExamined, 0);
  const total0to6 = entries.reduce((sum, e) => sum + e.age0to6, 0);
  const total6to18 = entries.reduce((sum, e) => sum + e.age6to18, 0);
  const total18to60_community = entries.reduce((sum, e) => sum + e.age18to60_community, 0);
  const total18to60_worker = entries.reduce((sum, e) => sum + e.age18to60_worker, 0);
  const total18to60_officer = entries.reduce((sum, e) => sum + e.age18to60_officer, 0);
  const totalAbove60 = entries.reduce((sum, e) => sum + e.ageAbove60, 0);
  const overallRatio = totalTarget ? Math.round((totalExamined / totalTarget) * 100) : 0;

  rows.push([
    'TỔNG',
    'TẤT CẢ ĐOÀN KHÁM',
    '',
    totalTarget,
    totalExamined,
    total0to6,
    total6to18,
    total18to60_community,
    total18to60_worker,
    total18to60_officer,
    totalAbove60,
    '',
    '',
    totalTarget ? `${overallRatio}%` : ''
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Thống kê khám sức khỏe');

  // Adjust column widths
  const max_cols = header.map((h, i) => {
    let max_len = h.length;
    rows.forEach(r => {
      const val = r[i] ? r[i].toString() : '';
      if (val.length > max_len) max_len = val.length;
    });
    return { wch: Math.min(max_len + 2, 40) };
  });
  worksheet['!cols'] = max_cols;

  XLSX.writeFile(workbook, `Thong_Ke_Kham_Suc_Khoe_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function importFromExcel(file: File): Promise<Partial<ExamEntry>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          resolve([]);
          return;
        }

        const entries: Partial<ExamEntry>[] = [];
        const rows = jsonData.slice(1); // skip header

        rows.forEach((row) => {
          if (!row[1] || row[0] === 'TỔNG') return; // Skip empty rows or totals row

          const targetVal = row[3] !== undefined && row[3] !== '' ? Number(row[3]) : null;
          const statusStr = row[12] === 'Đã hủy' ? 'Đã hủy' : 'Hoạt động';

          entries.push({
            stt: row[0]?.toString() || '',
            location: row[1]?.toString() || '',
            date: row[2]?.toString() || new Date().toISOString().split('T')[0],
            target: isNaN(Number(targetVal)) ? null : targetVal,
            totalExamined: Number(row[4]) || 0,
            age0to6: Number(row[5]) || 0,
            age6to18: Number(row[6]) || 0,
            age18to60_community: Number(row[7]) || 0,
            age18to60_worker: Number(row[8]) || 0,
            age18to60_officer: Number(row[9]) || 0,
            ageAbove60: Number(row[10]) || 0,
            notes: row[11]?.toString() || '',
            status: statusStr,
          });
        });

        resolve(entries);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
