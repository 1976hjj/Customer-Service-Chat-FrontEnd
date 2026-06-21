import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bot, ChevronDown, Circle, Loader2, Send, Sparkles, UserRound, Wifi, WifiOff } from "lucide-react";
import "./styles.css";

type Sentiment = {
  label: string;
  score: number;
};

type Intent = {
  intent_id: string;
  intent_name: string;
  category: string;
  confidence: number;
  slots: Record<string, unknown>;
};

type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
};

type LlmCall = {
  task: string;
  provider: string;
  model: string;
  request: unknown;
  raw_response: string;
  parsed_response?: unknown;
};

type ChatResponse = {
  session_id: string;
  user_id: string;
  message: string;
  normalized_message: string;
  sentiment: Sentiment;
  intent: Intent;
  reply: string;
  route: string;
  tool_calls: ToolCall[];
  citations: unknown[];
  react_steps: string[];
  llm: Record<string, unknown>;
  llm_calls: LlmCall[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: ChatResponse;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

const quickPrompts = [
  "你好，在吗",
  "订单 O20260617001 到哪了",
  "介绍一下阿克苏苹果",
  "苹果有没有货，给我推荐一下",
  "订单 O20260617001 的苹果坏了，帮我申请售后赔付",
];

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "您好，我是智能客服助手。可以帮您查订单、商品库存、售后赔付和优惠券。",
    },
  ]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [health, setHealth] = useState<"checking" | "online" | "offline">("checking");
  const [selectedMeta, setSelectedMeta] = useState<ChatResponse | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const sessionId = useMemo(() => `web-${Date.now()}`, []);
  const userId = "u1001";

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => setHealth(res.ok ? "online" : "offline"))
      .catch(() => setHealth("offline"));
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(content = text.trim()) {
    if (!content || isSending) return;

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
      },
    ]);
    setText("");
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          message: content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as ChatResponse;
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          meta: data,
        },
      ]);
      setSelectedMeta(data);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `连接后端失败：${error instanceof Error ? error.message : "未知错误"}`,
        },
      ]);
      setHealth("offline");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="chat-panel">
        <header className="topbar">
          <div className="assistant-mark">
            <Sparkles size={22} />
          </div>
          <div>
            <h1>智能客服</h1>
            <p>GLM ReAct Agent · 本地联调</p>
          </div>
          <StatusPill status={health} />
        </header>

        <div className="quick-row" aria-label="快捷问题">
          {quickPrompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => sendMessage(prompt)} disabled={isSending}>
              {prompt}
            </button>
          ))}
        </div>

        <div ref={listRef} className="message-list">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} onInspect={setSelectedMeta} />
          ))}
          {isSending && (
            <div className="message-row assistant">
              <div className="avatar">
                <Bot size={18} />
              </div>
              <div className="bubble loading">
                <Loader2 size={16} />
                <span>正在思考下一步动作</span>
              </div>
            </div>
          )}
        </div>

        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="输入订单、商品或售后问题"
            aria-label="聊天输入"
          />
          <button type="submit" disabled={!text.trim() || isSending} aria-label="发送">
            {isSending ? <Loader2 size={19} /> : <Send size={19} />}
          </button>
        </form>
      </section>

      <aside className="debug-panel">
        <AgentInspector meta={selectedMeta} />
      </aside>
    </main>
  );
}

function StatusPill({ status }: { status: "checking" | "online" | "offline" }) {
  const label = status === "checking" ? "检测中" : status === "online" ? "已连接" : "未连接";
  const Icon = status === "offline" ? WifiOff : Wifi;

  return (
    <div className={`status ${status}`}>
      <Icon size={15} />
      <span>{label}</span>
    </div>
  );
}

function MessageBubble({ message, onInspect }: { message: ChatMessage; onInspect: (meta: ChatResponse) => void }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`message-row ${message.role}`}>
      <div className="avatar">{isAssistant ? <Bot size={18} /> : <UserRound size={18} />}</div>
      <div className="message-stack">
        <div className="bubble">{message.content}</div>
        {message.meta && (
          <button type="button" className="inspect-button" onClick={() => onInspect(message.meta!)}>
            查看 Agent 过程
            <ChevronDown size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function AgentInspector({ meta }: { meta: ChatResponse | null }) {
  if (!meta) {
    return (
      <div className="empty-inspector">
        <Circle size={10} />
        <h2>Agent 过程</h2>
        <p>发送一条消息后，这里会显示意图、路由、工具调用、ReAct 步骤和 LLM 返回结果。</p>
      </div>
    );
  }

  return (
    <div className="inspector-content">
      <div className="inspector-head">
        <h2>Agent 过程</h2>
        <span>{String(meta.llm.provider ?? "mock")}</span>
      </div>

      <div className="metric-grid">
        <Metric label="Route" value={meta.route} />
        <Metric label="Intent" value={meta.intent.intent_id} />
        <Metric label="Confidence" value={`${Math.round(meta.intent.confidence * 100)}%`} />
        <Metric label="Tools" value={`${meta.tool_calls.length}`} />
      </div>

      <section className="debug-section">
        <h3>ReAct Steps</h3>
        <ol>
          {meta.react_steps.map((step, index) => (
            <li key={`${index}-${step}`}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="debug-section">
        <h3>Tool Calls</h3>
        {meta.tool_calls.length === 0 ? (
          <p className="muted">没有调用工具</p>
        ) : (
          meta.tool_calls.map((tool, index) => (
            <details key={`${tool.name}-${index}`}>
              <summary>{tool.name}</summary>
              <pre>{JSON.stringify({ arguments: tool.arguments, result: tool.result }, null, 2)}</pre>
            </details>
          ))
        )}
      </section>

      <section className="debug-section">
        <h3>LLM Calls</h3>
        {!meta.llm_calls?.length ? (
          <p className="muted">没有记录到 LLM 调用</p>
        ) : (
          meta.llm_calls.map((call, index) => (
            <details key={`${call.task}-${index}`}>
              <summary>
                {index + 1}. {call.task}
              </summary>
              <pre>{JSON.stringify(call, null, 2)}</pre>
            </details>
          ))
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
