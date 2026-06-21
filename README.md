# Customer Service Chat FrontEnd

React + Vite 智能客服聊天界面，用于联调本地 FastAPI 智能客服后端。

默认后端地址：

```text
http://127.0.0.1:8000
```

## 功能

- iOS 风格聊天界面
- 快捷测试问题
- 本地后端连接状态
- 智能客服回复展示
- Agent 调试面板
- 展示 `route`、`intent`、`tool_calls`、`react_steps`

## 启动后端

在后端项目目录启动：

```powershell
cd C:\Users\Adminis\Documents\Codex\2026-06-15\google-calendar-google-drive-gmail\Chatbox-Customer-Service

$env:LLM_PROVIDER="zhipu"
$env:LLM_MODEL="glm-4.7-flash"
$env:LLM_API_KEY="你的智谱 API Key"
$env:LLM_MAX_TOKENS="2048"
$env:LLM_TIMEOUT="180"

py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

确认后端正常：

```powershell
Invoke-WebRequest http://127.0.0.1:8000/health -UseBasicParsing
```

## 启动前端

在本项目目录启动：

```powershell
cd E:\codex\Skill\Customer-Service-Chat-FrontEnd
npm.cmd install
npm.cmd run dev
```

打开：

```text
http://127.0.0.1:5173
```

## 修改后端地址

如果后端不是 `http://127.0.0.1:8000`，启动前设置：

```powershell
$env:VITE_API_BASE="http://127.0.0.1:8000"
npm.cmd run dev
```

## 推荐测试问题

```text
你好，在吗
订单 O20260617001 到哪了
苹果有没有货，怎么保存
订单 O20260617001 的苹果坏了，帮我申请售后赔付
苹果有没有货，给我推荐一下
介绍一下阿克苏苹果
能否买高达，介绍一下高达这个玩具
能否买避孕套
```

右侧 Agent 面板会展示 `LLM Calls`，用于查看后端每次大模型调用的 request、raw_response 和解析结果。

## 构建

```powershell
npm.cmd run build
```

构建产物在：

```text
dist/
```

## 联调成功标志

页面顶部显示 `已连接`，发送消息后能看到客服回复；右侧 Agent 面板会出现：

- Route
- Intent
- Confidence
- Tools
- ReAct Steps
- Tool Calls

## 避免 WinError 10013

这个错误一般是端口已经被旧进程占用了。以后推荐用脚本启动前端，它会先检查 `5173` 端口，已经启动就直接提示，不会重复绑定端口。

```powershell
cd E:\codex\Skill\Customer-Service-Chat-FrontEnd
powershell -ExecutionPolicy Bypass -File .\start_frontend.ps1
```

如果需要换端口：

```powershell
powershell -ExecutionPolicy Bypass -File .\start_frontend.ps1 -Port 5174
```

如果后端也要清理旧进程，可在后端项目目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop_dev_ports.ps1
```
