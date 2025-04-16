"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import Link from "next/link";

type Status = "Ready" | "Progress" | "Done";

interface ConfluenceRecord {
  url: string;
  timestamp: string;
  ip: string;
  status: Status;
}

export default function ConfluencePage() {
  const [url, setUrl] = useState("");
  const [records, setRecords] = useState<ConfluenceRecord[]>([]);

  // localStorage에서 기록 불러오기
  useEffect(() => {
    const savedRecords = localStorage.getItem('confluenceRecords');
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
  }, []);

  // 기록이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('confluenceRecords', JSON.stringify(records));
  }, [records]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!url.trim()) return;

    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'http://' + processedUrl;
    }

    const newRecord: ConfluenceRecord = {
      url: processedUrl,
      timestamp: new Date().toISOString(),
      ip: "127.0.0.1", // 실제 IP는 서버에서 가져와야 함
      status: "Ready"
    };

    setRecords([...records, newRecord]);
    setUrl("");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Confluence 관리 페이지</h1>
        <Button 
          variant="outline"
          onClick={() => window.location.href = '/?apiUrl=http%3A%2F%2Flocalhost%3A2024&assistantId=agent&apiKey='}
        >
          채팅 페이지로
        </Button>
      </div>
      
      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">URL 입력</h2>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Confluence URL을 입력하세요 (예: example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit">추가</Button>
          </form>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">기록</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">URL</th>
                  <th className="text-left p-2">시간</th>
                  <th className="text-left p-2">IP</th>
                  <th className="text-left p-2">상태</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{record.url}</td>
                    <td className="p-2">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="p-2">{record.ip}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        record.status === "Ready" ? "bg-yellow-100 text-yellow-800" :
                        record.status === "Progress" ? "bg-blue-100 text-blue-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 