import { useStreamContext } from "@/providers/Stream";
import { Message } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { getContentString } from "../utils";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { BranchSwitcher, CommandBar } from "./shared";

function EditableContent({
  value,
  setValue,
  onSubmit,
}: {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className="focus-visible:ring-0"
    />
  );
}

export function HumanMessage({
  message,
  isLoading,
}: {
  message: Message;
  isLoading: boolean;
}) {
  const thread = useStreamContext();
  const meta = thread.getMessagesMetadata(message);
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  const [isUrlContentVisible, setIsUrlContentVisible] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const contentString = getContentString(message.content);

  // URL 내용이 있는지 확인
  let urlData = null;
  try {
    if (typeof contentString === 'string' && contentString.startsWith('{') && contentString.includes('"type":"url_content"')) {
      const parsed = JSON.parse(contentString);
      if (parsed && parsed.type === 'url_content') {
        urlData = parsed;
      }
    }
  } catch (e) {
    console.error('JSON 파싱 실패:', e);
    // JSON 파싱 실패 시 일반 텍스트로 처리
  }

  const handleSubmitEdit = () => {
    setIsEditing(false);

    const newMessage: Message = { type: "human", content: value };
    thread.submit(
      { messages: [newMessage] },
      {
        checkpoint: parentCheckpoint,
        streamMode: ["values"],
        optimisticValues: (prev) => {
          const values = meta?.firstSeenState?.values;
          if (!values) return prev;

          return {
            ...values,
            messages: [...(values.messages ?? []), newMessage],
          };
        },
      },
    );
  };

  return (
    <div
      className={cn(
        "flex items-center ml-auto gap-2 group",
        isEditing && "w-full max-w-xl",
      )}
    >
      <div className={cn("flex flex-col gap-2", isEditing && "w-full")}>
        {isEditing ? (
          <EditableContent
            value={value}
            setValue={setValue}
            onSubmit={handleSubmitEdit}
          />
        ) : (
          <div className="flex flex-col items-end">
            {urlData ? (
              <div className="px-4 py-2 rounded-3xl bg-muted w-fit ml-auto">
                <div className="flex flex-col">
                  <div>URL ({urlData.url})</div>
                  <button
                    onClick={() => setIsUrlContentVisible(!isUrlContentVisible)}
                    className="text-blue-500 hover:text-blue-700 text-sm text-left mt-1"
                  >
                    {isUrlContentVisible ? '내용 숨기기' : '내용 보기'}
                  </button>
                  {isUrlContentVisible && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm max-w-xl whitespace-pre-wrap text-left">
                      {urlData.content}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="px-4 py-2 rounded-3xl bg-muted w-fit ml-auto whitespace-pre-wrap">
                {contentString}
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex gap-2 items-center ml-auto transition-opacity",
            "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
            isEditing && "opacity-100",
          )}
        >
          <BranchSwitcher
            branch={meta?.branch}
            branchOptions={meta?.branchOptions}
            onSelect={(branch) => thread.setBranch(branch)}
            isLoading={isLoading}
          />
          <CommandBar
            isLoading={isLoading}
            content={contentString}
            isEditing={isEditing}
            setIsEditing={(c) => {
              if (c) {
                setValue(contentString);
              }
              setIsEditing(c);
            }}
            handleSubmitEdit={handleSubmitEdit}
            isHumanMessage={true}
          />
        </div>
      </div>
    </div>
  );
}
