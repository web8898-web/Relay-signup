import { getVisibleCategories, getCategorySelectionMode, isHeadcountUnit, isQueueTask, todayStr } from './utils';

export function signupName(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('請輸入姓名');
  return value.trim().slice(0, 60);
}

export function assertRegistrationOpen(task) {
  const today = todayStr();
  if (task.start_date > today) throw new Error('此任務尚未開始');
  if (task.end_date < today) throw new Error('此任務已截止，無法再接龍');
}

export function signupCategories(task, values) {
  if (isQueueTask(task)) return [];
  const available = getVisibleCategories(task.categories);
  const selected = [...new Set(Array.isArray(values) ? values.filter(c => available.includes(c)) : [])];
  const mode = getCategorySelectionMode(task);
  const marker = mode === 'single' ? '__relay_category_single__' : '__relay_category_multiple__';
  const required = (task.categories || []).filter(c => c === marker).length >= 2;
  if (mode === 'single' && selected.length > 1) throw new Error('此任務的類別只能選擇一個');
  if (available.length && !selected.length && (required || (task.quantity_unit && !isHeadcountUnit(task.quantity_unit)))) throw new Error('請至少選擇一個分類');
  return selected;
}

function integer(value, minimum, unit) {
  const n = typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value)) ? Number(value) : NaN;
  if (!Number.isSafeInteger(n) || n < minimum || n > 2147483646) throw new Error(`請填寫有效的整數數量（${unit}）`);
  return n;
}

export function signupValues(task, body, { editing = false } = {}) {
  const name = signupName(body.name);
  const categories = signupCategories(task, body.categories);
  const values = { name, note: String(body.note || '').slice(0, 500), categories, quantity: null, category_quantities: {} };
  if (isQueueTask(task)) return { ...values, note: '' };
  if (!task.quantity_unit) return values;
  const headcount = isHeadcountUnit(task.quantity_unit);
  if (categories.length) {
    let total = 0;
    for (const cat of categories) {
      const n = integer(body.category_quantities?.[cat], 1, task.quantity_unit);
      values.category_quantities[cat] = n;
      total += n;
    }
    values.quantity = integer(total, 1, task.quantity_unit) + (headcount ? 1 : 0);
  } else if (getVisibleCategories(task.categories).length && headcount) {
    values.quantity = 1;
  } else {
    // Create asks for companions; the existing edit control displays the stored total.
    const extras = headcount && !editing;
    values.quantity = integer(body.quantity, extras ? 0 : 1, task.quantity_unit) + (extras ? 1 : 0);
  }
  return values;
}
