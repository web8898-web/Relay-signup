export function validateTaskDatesAndTitle(task) {
  if (typeof task.title !== 'string' || !task.title.trim()) throw new Error('請輸入任務標題');
  for (const value of [task.start_date, task.end_date]) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('請填寫有效日期');
  }
  if (task.start_date > task.end_date) throw new Error('結束日期不能早於開始日期');
}
