import { TopBar } from "@/components/TopBar";
import TaskGoneIllustration from "@/components/TaskGoneIllustration";

export default function TaskRemovedPage() {
  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="連結已失效" />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <TaskGoneIllustration />
        <p className="font-semibold text-gray-700 mt-4 mb-2">這個報名已無法使用！</p>
        <p className="text-sm text-gray-400 leading-relaxed">
          請向主辦人確認最新連結。
        </p>
      </div>
    </div>
  );
}
