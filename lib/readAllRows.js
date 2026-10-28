// A fresh, deterministically ordered query per page avoids the API's default
// row cap. Never return a partial list if a later page fails.
export async function readAllRows(query) {
  const rows = [];
  const size = 500;
  for (let offset = 0; ; offset += size) {
    const { data, error } = await query().range(offset, offset + size - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < size) return rows;
  }
}
