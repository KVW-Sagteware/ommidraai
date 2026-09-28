"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  id: number;
  group_id: number;
  user_id: number;
  username: string;
  role: string;
  content: string;
  created_at: string;
};

type GroupChatProps = {
  groupId: string;
  currentUsername: string;
};

const POLL_INTERVAL_MS = 2500;
const MAX_MESSAGE_LENGTH = 255;

const roleBadgeStyles: Record<string, string> = {
  owner: "bg-green-600 text-white",
  admin: "bg-blue-600 text-white",
  member: "bg-gray-300 text-gray-700",
  guest: "bg-gray-400 text-white",
};

function roleLabel(role: string, t: (key: string) => string): string {
  switch (role) {
    case "owner":
      return t("owner");
    case "admin":
      return t("adminBadge");
    case "guest":
      return t("guestBadge");
    default:
      return t("memberBadge");
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GroupChat({ groupId, currentUsername }: GroupChatProps) {
  const t = useTranslations("group");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      try {
        const response = await fetch(
          `/api/backend/groups/${groupId}/chat/messages`
        );
        if (!response.ok) {
          throw new Error(t("chatLoadFailed"));
        }
        const data = (await response.json()) as ChatMessage[];
        if (!cancelled) setMessages(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("chatLoadFailed")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function pollNewMessages() {
      const existing = messagesRef.current;
      const lastId = existing.length > 0
        ? existing[existing.length - 1].id
        : 0;

      try {
        const response = await fetch(
          `/api/backend/groups/${groupId}/chat/messages?after_id=${lastId}`
        );
        if (!response.ok) return;
        const data = (await response.json()) as ChatMessage[];
        if (data.length > 0) {
          setMessages((prev) => [...prev, ...data]);
        }
      } catch {
        // Polling failures are silent so the chat keeps working on flaky network.
      }
    }

    loadInitial();
    const interval = setInterval(pollNewMessages, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH || sending) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/backend/groups/${groupId}/chat/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.detail || t("chatSendFailed"));
      }
      setMessages((prev) => [...prev, data as ChatMessage]);
      setDraft("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("chatSendFailed")
      );
    } finally {
      setSending(false);
    }
  }

  const draftTooLong = draft.length > MAX_MESSAGE_LENGTH;

  return (
    <section className="flex h-[32rem] flex-col rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <h2 className="text-2xl font-bold text-gray-900">{t("chatTitle")}</h2>

      <div className="mt-4 flex min-h-0 flex-1 flex-col-reverse overflow-y-auto rounded-xl border border-gray-200 bg-white p-4">
        <div ref={endRef} className="flex flex-col justify-end gap-3">
          {loading ? (
            <p className="text-sm text-gray-500">{t("chatLoading")}</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-500">{t("chatEmpty")}</p>
          ) : (
            messages.map((message) => {
              const mine = message.username === currentUsername;
              return (
                <div
                  key={message.id}
                  className={`flex max-w-[75%] flex-col ${
                    mine ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`mb-1 flex items-center gap-2 text-xs font-semibold ${
                      mine ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span className="text-gray-800">{message.username}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        roleBadgeStyles[message.role] ?? roleBadgeStyles.member
                      }`}
                    >
                      {roleLabel(message.role, t)}
                    </span>
                  </div>

                  <div
                    className={`rounded-xl px-3 py-2 text-sm shadow-sm ${
                      mine
                        ? "rounded-tr-sm bg-[#3d3461] text-white"
                        : "rounded-tl-sm border border-gray-200 bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                  </div>

                  <span className="mt-1 text-[10px] text-gray-400">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-4 flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={2}
            placeholder={t("chatPlaceholder")}
            className={`w-full resize-none rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#3d3461] ${
              draftTooLong ? "border-red-400" : "border-gray-300"
            }`}
          />
          <div className="mt-1 text-right text-xs text-gray-400">
            {draft.length}/{MAX_MESSAGE_LENGTH}
          </div>
        </div>

        <button
          type="button"
          onClick={sendMessage}
          disabled={!draft.trim() || draftTooLong || sending}
          className="rounded-lg bg-[#3d3461] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#30294d] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? t("chatSending") : t("chatSend")}
        </button>
      </div>
    </section>
  );
}