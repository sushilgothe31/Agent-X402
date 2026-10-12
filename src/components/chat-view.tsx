import React, { useState } from "react";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputModelSelect,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Reasoning, ReasoningContent } from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";
import { Tool, ToolPart } from "@/components/ai-elements/tool";
import { getSystemWallets, recordPayment } from "@/lib/accounts";

const models = [
  { name: "GPT-4o", value: "openai/gpt-4o" },
  { name: "Gemini 2.0 Flash Lite", value: "google/gemini-2.0-flash-lite" },
  { name: "Claude 3.5 Sonnet", value: "anthropic/claude-3-5-sonnet" },
];

const suggestions: Record<string, string> = {
  "Use a paid tool": "Generate a random number between 1 and 10.",
  "What's my account balance?": "Check your account balance.",
  "Use an unpaid remote tool": "Please greet the user with 'hello-remote' by the name: 'user'",
  "Use an unpaid local tool": "Please greet the user with 'hello-local' by the name: 'user'",
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  parts: (
    | { type: "text"; text: string }
    | { type: "reasoning"; text: string; duration?: number }
    | { type: "tool"; toolPart: ToolPart }
  )[];
}

export function ChatView({ onOpenWallet }: { onOpenWallet?: () => void }) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState(models[0].value);
  const [status, setStatus] = useState<"idle" | "submitted" | "streaming" | "error">("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "Welcome to the **x402 AI Starter Kit**! I am an autonomous AI agent integrated with Model Context Protocol (MCP) and server-managed Coinbase CDP wallets on **Base Sepolia**.\n\nI can invoke both free tools and paid tools protected by HTTP 402 micropayments. Try selecting a suggestion below or asking me to perform an operation!",
        },
      ],
    },
  ]);

  const executeAgentTurn = async (userPrompt: string) => {
    const userMsgId = "user-" + Date.now();
    const assistantMsgId = "asst-" + Date.now();

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      parts: [{ type: "text", text: userPrompt }],
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus("submitted");

    // Artificial short delay to emulate agent reasoning & MCP tool discovery
    setTimeout(async () => {
      setStatus("streaming");

      const promptLower = userPrompt.toLowerCase();

      // Case 1: Paid tool - random number
      if (promptLower.includes("random") || promptLower.includes("paid tool")) {
        const min = 1;
        const max = 10;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        const { hash } = recordPayment("MCP Paid Tool: get_random_number", 0.001);

        const newParts: ChatMessage["parts"] = [
          {
            type: "reasoning",
            duration: 1,
            text: `Analyzing user intent: requested random number between ${min} and ${max}.\nInspecting MCP tool catalog:\n- Tool 'get_random_number' discovered.\n- x402 Price: 0.001 USDC on Base Sepolia.\n- Approving CDP wallet signature and broadcasting settlement transaction.`,
          },
          {
            type: "tool",
            toolPart: {
              toolName: "get_random_number",
              state: "output-available",
              input: { min, max },
              output: {
                result: randomNumber,
                paid: true,
                price: "$0.001 USDC",
                text: `Generated random number: ${randomNumber}`,
                _meta: {
                  "x402.payment-response": {
                    transaction: hash,
                    amount: "0.001 USDC",
                    network: "base-sepolia",
                  },
                },
              },
            },
          },
          {
            type: "text",
            text: `Here is your random number: **${randomNumber}**.\n\nThe tool execution was settled via **x402** on Base Sepolia with an accountless micropayment of $0.001 USDC.`,
          },
        ];

        setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", parts: newParts }]);
        setStatus("idle");
        return;
      }

      // Case 2: Balance check
      if (promptLower.includes("balance") || promptLower.includes("wallet")) {
        const wallets = getSystemWallets();
        const newParts: ChatMessage["parts"] = [
          {
            type: "reasoning",
            duration: 1,
            text: `Querying Coinbase CDP wallet balances for Purchaser account (${wallets.purchaser.address}) and Seller recipient (${wallets.seller.address}) on Base Sepolia testnet.`,
          },
          {
            type: "tool",
            toolPart: {
              toolName: "check_balance",
              state: "output-available",
              input: { network: "base-sepolia" },
              output: {
                result: {
                  purchaser: {
                    address: wallets.purchaser.address,
                    usdc: `${wallets.purchaser.usdcBalance.toFixed(3)} USDC`,
                    eth: `${wallets.purchaser.ethBalance} ETH`,
                  },
                  seller: {
                    address: wallets.seller.address,
                    usdc: `${wallets.seller.usdcBalance.toFixed(3)} USDC`,
                  },
                },
              },
            },
          },
          {
            type: "text",
            text: `Your **Purchaser Wallet** holds **$${wallets.purchaser.usdcBalance.toFixed(3)} USDC** (${wallets.purchaser.ethBalance} ETH for gas).\n\nThe **Seller Wallet** currently holds **$${wallets.seller.usdcBalance.toFixed(3)} USDC** received from paid tool calls and paywalled API accesses.`,
          },
        ];

        setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", parts: newParts }]);
        setStatus("idle");
        return;
      }

      // Case 3: Paid addition tool
      if (promptLower.includes("add") || promptLower.includes("plus") || promptLower.includes("sum")) {
        const a = 14;
        const b = 28;
        const sum = a + b;
        const { hash } = recordPayment("MCP Paid Tool: add(14, 28)", 0.001);

        const newParts: ChatMessage["parts"] = [
          {
            type: "reasoning",
            duration: 1,
            text: `Discovered paid MCP tool 'add'. Negotiating HTTP 402 payment requirements:\n- Price: 0.001 USDC\n- Recipient: Seller Account on Base Sepolia\n- Executing x402 payment and retrieving arithmetic result.`,
          },
          {
            type: "tool",
            toolPart: {
              toolName: "add",
              state: "output-available",
              input: { a, b },
              output: {
                result: sum,
                paid: true,
                _meta: {
                  "x402.payment-response": {
                    transaction: hash,
                    amount: "0.001 USDC",
                    network: "base-sepolia",
                  },
                },
              },
            },
          },
          {
            type: "text",
            text: `The result of adding ${a} and ${b} is **${sum}**. Settled seamlessly via x402 on Base Sepolia.`,
          },
        ];

        setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", parts: newParts }]);
        setStatus("idle");
        return;
      }

      // Case 4: Unpaid remote tool - hello-remote
      if (promptLower.includes("hello-remote") || promptLower.includes("unpaid remote")) {
        const newParts: ChatMessage["parts"] = [
          {
            type: "reasoning",
            duration: 1,
            text: `Invoking unpaid remote MCP tool 'hello-remote'. No payment required (Free).`,
          },
          {
            type: "tool",
            toolPart: {
              toolName: "hello-remote",
              state: "output-available",
              input: { name: "user" },
              output: {
                result: "Hello user",
                text: "Hello user",
              },
            },
          },
          {
            type: "text",
            text: "Hello user! This tool was called remotely over MCP with zero cost.",
          },
        ];

        setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", parts: newParts }]);
        setStatus("idle");
        return;
      }

      // Case 5: Unpaid local tool - hello-local
      if (promptLower.includes("hello-local") || promptLower.includes("unpaid local")) {
        const newParts: ChatMessage["parts"] = [
          {
            type: "reasoning",
            duration: 1,
            text: `Invoking local runtime tool 'hello-local'. Free local execution.`,
          },
          {
            type: "tool",
            toolPart: {
              toolName: "hello-local",
              state: "output-available",
              input: { name: "user" },
              output: {
                result: "Hello user",
                text: "Hello user",
              },
            },
          },
          {
            type: "text",
            text: "Hello user! That was an unpaid local tool executed by the agent runtime.",
          },
        ];

        setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", parts: newParts }]);
        setStatus("idle");
        return;
      }

      // Default conversational response
      const newParts: ChatMessage["parts"] = [
        {
          type: "reasoning",
          duration: 1,
          text: `Analyzing user query: "${userPrompt}". Formulating response regarding x402 agentic payments, MCP capabilities, and Base Sepolia settlement.`,
        },
        {
          type: "text",
          text: `I understand! The x402 protocol enables autonomous AI agents like me to transact with web services and APIs using HTTP status code **402 Payment Required**.\n\nYou can ask me to:\n- **"Generate a random number"** to see a paid MCP tool in action\n- **"Check your account balance"** to inspect your CDP testnet wallet\n- **"Greet user with hello-remote"** to test an unpaid remote tool\n\nOr click the **"Paid API playground"** tab at the top to test paywalled HTTP endpoints and watch live server logs!`,
        },
      ];

      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", parts: newParts }]);
      setStatus("idle");
    }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const text = input.trim();
      setInput("");
      executeAgentTurn(text);
    }
  };

  const handleSuggestionClick = (key: string) => {
    const promptText = suggestions[key];
    if (promptText) {
      executeAgentTurn(promptText);
    }
  };

  return (
    <div className="w-full p-6 relative size-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[580px]">
      <Conversation className="h-full flex-1">
        <ConversationContent>
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent isUser={message.role === "user"}>
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return <Response key={`${message.id}-${i}`}>{part.text}</Response>;
                  } else if (part.type === "reasoning") {
                    return (
                      <Reasoning
                        key={`${message.id}-${i}`}
                        duration={part.duration}
                        defaultOpen={true}
                      >
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );
                  } else if (part.type === "tool") {
                    return (
                      <Tool
                        key={`${message.id}-${i}`}
                        part={part.toolPart}
                        network="base-sepolia"
                        defaultOpen={true}
                      />
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Loader />}
          {status === "error" && (
            <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">
              Something went wrong communicating with the MCP server.
            </div>
          )}
        </ConversationContent>
      </Conversation>

      {/* Suggestion Chips */}
      <Suggestions className="justify-center mt-2">
        {Object.keys(suggestions).map((key) => (
          <Suggestion
            key={key}
            suggestion={key}
            onClick={() => handleSuggestionClick(key)}
            variant="outline"
            size="sm"
          />
        ))}
      </Suggestions>

      {/* Prompt Input Form */}
      <PromptInput onSubmit={handleSubmit} className="mt-4">
        <PromptInputTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or request a paid tool (e.g. 'Generate random number between 1 and 10')..."
        />
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputModelSelect
              value={model}
              onValueChange={setModel}
              models={models}
            />
          </PromptInputTools>
          <PromptInputSubmit disabled={!input.trim()} status={status} />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
