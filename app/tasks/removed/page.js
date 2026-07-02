import { TopBar } from "@/components/TopBar";
import TaskGoneIllustration from "@/components/TaskGoneIllustration";

export default function TaskRemovedPage() {
  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="找不到任務" />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <TaskGoneIllustration />
        <p className="font-semibold text-gray-700 mt-4 mb-2">找不到這個任務</p>
        <p className="text-sm text-gray-400 leading-relaxed">
          這個任務可能已經被主辦人刪除，或分享連結已經失效。
        </p>
      </div>
    </div>
  );
}
