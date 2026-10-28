export function queueWaitDuration(createdAt, language = 'zh', now = Date.now()) {
  const elapsed = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  const minutes = Number.isFinite(elapsed) ? elapsed : 0;
  const hours = Math.floor(minutes / 60);
  if (language === 'en') return hours ? `${hours} hr ${minutes % 60} min` : `${minutes} min`;
  return hours ? `已等待 ${hours} 小時 ${minutes % 60} 分鐘` : `已等待 ${minutes} 分鐘`;
}
