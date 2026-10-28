export async function readSignupSnapshot(supabase, taskIds) {
  if (!taskIds.length) return [];
  const { data, error } = await supabase.rpc('signup_list_snapshot', { p_task_ids: taskIds });
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('Invalid signup snapshot');
  return data;
}
