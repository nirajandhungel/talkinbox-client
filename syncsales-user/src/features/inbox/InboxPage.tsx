import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, Send, Bot, User, MessageSquare, CheckCircle, Eye,
  ShoppingBag, Phone, Mail, MapPin, ExternalLink, Zap, ZapOff,
  ArrowLeft,
} from "lucide-react";
import { inboxApi, customersApi, ordersApi } from "@/api";
import { QUERY_KEYS, PLATFORM_CONFIG, ORDER_STATUS_CONFIG } from "@/constants";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useToast } from "@/components/feedback/Toast";
import type { Conversation, Customer, Order } from "@/types";

// ─── Status Filter ────────────────────────────────────────────────

type ConvFilter = "all" | "active" | "pending" | "resolved";

const FILTER_OPTIONS: { key: ConvFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "resolved", label: "Resolved" },
];

// ─── Context Panel ────────────────────────────────────────────────

function ContextPanel({
  conversation,
  customer,
  customerOrders,
}: {
  conversation: Conversation;
  customer: Customer | null;
  customerOrders: Order[];
}) {
  const navigate = useNavigate();
  const { success } = useToast();
  const pfCfg = PLATFORM_CONFIG[conversation.platform];

  const handleContact = (method: string) => {
    if (method === "email" && customer) {
      window.open(`mailto:${customer.email}`, "_blank");
    } else if (method === "phone" && customer) {
      window.open(`tel:${customer.phone}`, "_blank");
    } else if (method === "platform") {
      const links: Record<string, string> = {
        whatsapp: `https://wa.me/${customer?.phone?.replace(/[^0-9]/g, "") || ""}`,
        instagram: "https://www.instagram.com/direct/inbox/",
        facebook: "https://www.facebook.com/messages/",
        tiktok: "https://www.tiktok.com/messages",
        email: `mailto:${customer?.email || ""}`,
      };
      window.open(links[conversation.platform] || "#", "_blank");
    }
    success(`Opening ${method}`);
  };

  return (
    <div className="w-72 shrink-0 flex-col bg-surface rounded-xl border border-border overflow-hidden shadow-card hidden lg:flex">
      {/* Customer Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar initials={conversation.avatar} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{conversation.name}</p>
            <Badge color={pfCfg.color}>{pfCfg.label}</Badge>
          </div>
        </div>

        {customer ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <Mail size={11} className="text-foreground-muted shrink-0" />
              <span className="truncate">{customer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <Phone size={11} className="text-foreground-muted shrink-0" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <MapPin size={11} className="text-foreground-muted shrink-0" />
              <span className="truncate">{customer.address}</span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-foreground-muted italic">Customer info unavailable</p>
        )}
      </div>

      {/* Quick Stats */}
      {customer && (
        <div className="grid grid-cols-3 gap-2 p-3 border-b border-border">
          <div className="text-center">
            <p className="text-sm font-bold text-primary font-mono">{customer.totalOrders}</p>
            <p className="text-[9px] text-foreground-muted">Orders</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground font-mono">{formatCurrency(customer.totalSpent)}</p>
            <p className="text-[9px] text-foreground-muted">Spent</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{customer.tier}</p>
            <p className="text-[9px] text-foreground-muted">Tier</p>
          </div>
        </div>
      )}

      {/* Contact Actions */}
      <div className="p-3 border-b border-border grid grid-cols-3 gap-1.5">
        <Button
          variant="outline"
          size="xs"
          icon={<Mail size={10} />}
          onClick={() => handleContact("email")}
          className="text-[10px] px-1"
        >
          Email
        </Button>
        <Button
          variant="outline"
          size="xs"
          icon={<Phone size={10} />}
          onClick={() => handleContact("phone")}
          className="text-[10px] px-1"
        >
          Call
        </Button>
        <Button
          variant="outline"
          size="xs"
          icon={<ExternalLink size={10} />}
          onClick={() => handleContact("platform")}
          className="text-[10px] px-1"
        >
          {pfCfg.label}
        </Button>
      </div>

      {/* Recent Orders */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-2">
            Recent Orders
          </p>
          {customerOrders.length > 0 ? (
            <div className="space-y-2">
              {customerOrders.slice(0, 5).map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id.replace("#", "")}`)}
                  className="w-full text-left p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary font-mono">{order.id}</span>
                    <StatusBadge config={ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG] ?? ORDER_STATUS_CONFIG.confirmed} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-foreground-muted truncate">
                      {order.items[0]?.name}{order.items.length > 1 ? ` +${order.items.length - 1}` : ""}
                    </span>
                    <span className="text-[10px] font-bold text-foreground font-mono">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-foreground-muted">
              <ShoppingBag size={18} className="mx-auto mb-1" />
              <p className="text-[10px]">No orders yet</p>
            </div>
          )}
        </div>

        {/* Quick Order from Chat */}
        <div className="p-3 border-t border-border">
          <Button
            variant="outline"
            size="xs"
            icon={<ShoppingBag size={11} />}
            className="w-full text-[10px]"
            onClick={() => navigate("/orders")}
          >
            Create Order from Chat
          </Button>
        </div>

        {/* View Profile */}
        {customer && (
          <div className="p-3 pt-0">
            <Button
              variant="secondary"
              size="xs"
              icon={<Eye size={11} />}
              className="w-full text-[10px]"
              onClick={() => navigate("/customers")}
            >
              View Full Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Inbox Page ──────────────────────────────────────────────

export default function InboxPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ConvFilter>("all");
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { success, info } = useToast();

  // Fetch conversations
  const { data: convData } = useQuery({
    queryKey: [...QUERY_KEYS.conversations, { page: 1, pageSize: 100, search }],
    queryFn: () => inboxApi.getConversations({ page: 1, pageSize: 100, search }),
  });

  // Fetch messages for active conversation
  const { data: convDetail } = useQuery({
    queryKey: QUERY_KEYS.messages(activeConv?.id ?? ""),
    queryFn: () => inboxApi.getConversation(activeConv!.id),
    enabled: !!activeConv,
  });
  const messages = convDetail?.messages ?? [];

  // Fetch customer details for context panel
  const { data: allCustomers } = useQuery({
    queryKey: [...QUERY_KEYS.customers, "all-for-inbox"],
    queryFn: () => customersApi.getAll({ page: 1, pageSize: 100 }),
  });

  // Fetch orders for context panel
  const { data: allOrders } = useQuery({
    queryKey: [...QUERY_KEYS.orders, "all-for-inbox"],
    queryFn: () => ordersApi.getAll({ page: 1, pageSize: 100 }),
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => inboxApi.sendMessage(id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(activeConv!.id) });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!messageInput.trim() || !activeConv) return;
    sendMutation.mutate({ id: String(activeConv.id), text: messageInput });
    setMessageInput("");
  };

  const handleMarkResolved = () => {
    if (!activeConv) return;
    // Update conversation status locally
    success(`Conversation with ${activeConv.name} marked as resolved`);
    setActiveConv({ ...activeConv, status: "resolved" });
  };

  const handleToggleAI = () => {
    if (!activeConv) return;
    const newState = !activeConv.aiHandled;
    setActiveConv({ ...activeConv, aiHandled: newState });
    info(`AI ${newState ? "enabled" : "disabled"} for ${activeConv.name}`);
  };

  const allConversations = convData?.data ?? [];

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return statusFilter === "all"
      ? allConversations
      : allConversations.filter((c) => c.status === statusFilter);
  }, [allConversations, statusFilter]);

  // Compute context panel data
  const activeCustomer = useMemo(() => {
    if (!activeConv?.customerId) return null;
    return allCustomers?.data?.find((c) => c.id === activeConv.customerId) ?? null;
  }, [activeConv, allCustomers]);

  const customerOrders = useMemo(() => {
    if (!activeConv?.customerId) return [];
    return allOrders?.data?.filter((o) => o.customerId === activeConv.customerId) ?? [];
  }, [activeConv, allOrders]);

  // Unread count for filter badges
  const statusCounts = useMemo(() => ({
    all: allConversations.length,
    active: allConversations.filter((c) => c.status === "active").length,
    pending: allConversations.filter((c) => c.status === "pending").length,
    resolved: allConversations.filter((c) => c.status === "resolved").length,
  }), [allConversations]);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-3 max-w-[1400px]">
      {/* ─── Conversation List (Left Panel) ──────────── */}
      <div className={cn(
        "w-full md:w-72 shrink-0 flex flex-col bg-surface rounded-xl border border-border overflow-hidden shadow-card",
        activeConv && "hidden md:flex"
      )}>
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-foreground">Inbox</h2>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {allConversations.filter((c) => c.unread > 0).length} unread
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1">
            {FILTER_OPTIONS.map((opt) => {
              const count = statusCounts[opt.key];
              return (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className={cn(
                    "flex-1 px-1 py-1 text-[9px] font-medium rounded-md transition-colors",
                    statusFilter === opt.key
                      ? "bg-primary text-primary-foreground text-primary-foreground"
                      : "bg-surface-elevated text-foreground-muted hover:bg-surface-elevated"
                  )}
                >
                  {opt.label} {count > 0 && <span className="ml-0.5">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-foreground-muted">
              <MessageSquare size={20} className="mx-auto mb-1" />
              <p className="text-xs">No conversations</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const platformCfg = PLATFORM_CONFIG[conv.platform];
              const isActive = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-3 text-left transition-colors border-b border-border",
                    isActive ? "bg-primary/10" : "hover:bg-surface-elevated"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar initials={conv.avatar} size="sm" />
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface flex items-center justify-center"
                      style={{ background: platformCfg.color }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start">
                      <p className={cn("text-xs font-semibold text-foreground truncate", conv.unread > 0 && "text-foreground")}>{conv.name}</p>
                      <span className="text-[10px] text-foreground-muted shrink-0 ml-1">{conv.time}</span>
                    </div>
                    <p className="text-[10px] text-foreground-muted truncate mt-0.5">{conv.lastMessage}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {conv.aiHandled && (
                        <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded font-medium inline-flex items-center gap-0.5">
                          <Bot size={8} /> AI
                        </span>
                      )}
                      {conv.status === "resolved" && (
                        <span className="text-[9px] bg-success/10 text-success px-1 py-0.5 rounded font-medium">
                          ✓ Resolved
                        </span>
                      )}
                      {conv.unread > 0 && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-primary-foreground ml-auto"
                          style={{ background: platformCfg.color }}
                        >
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Chat Area (Center Panel) ────────────────── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-surface rounded-xl border border-border overflow-hidden shadow-card min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-border shrink-0">
            {/* Back button — mobile only */}
            <button
              onClick={() => setActiveConv(null)}
              className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground-muted hover:bg-surface-elevated transition-colors md:hidden shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <Avatar initials={activeConv.avatar} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{activeConv.name}</p>
              <div className="flex items-center gap-2">
                <Badge
                  color={PLATFORM_CONFIG[activeConv.platform].color}
                 
                >
                  {PLATFORM_CONFIG[activeConv.platform].label}
                </Badge>
                {activeConv.aiHandled && (
                  <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                    <Bot size={10} /> AI handling
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {/* AI Toggle */}
              <Button
                variant={activeConv.aiHandled ? "primary" : "outline"}
                size="xs"
                icon={activeConv.aiHandled ? <Zap size={11} /> : <ZapOff size={11} />}
                onClick={handleToggleAI}
                title={activeConv.aiHandled ? "Disable AI" : "Enable AI"}
              >
                <span className="hidden sm:inline">{activeConv.aiHandled ? "AI On" : "AI Off"}</span>
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={<CheckCircle size={11} />}
                onClick={handleMarkResolved}
                className="hidden sm:inline-flex"
              >
                Resolve
              </Button>
              <Button
                variant="secondary"
                size="xs"
                icon={<Eye size={11} />}
                onClick={() => {
                  if (activeConv.customerId) {
                    navigate("/customers");
                  } else {
                    info("No linked customer profile");
                  }
                }}
                className="hidden sm:inline-flex"
              >
                Profile
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-2", msg.sender !== "customer" && "flex-row-reverse")}
              >
                <div className="shrink-0 mt-1">
                  {msg.sender === "customer" ? (
                    <Avatar initials={activeConv.avatar} size="xs" />
                  ) : msg.sender === "ai" ? (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot size={11} className="text-primary" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center">
                      <User size={11} className="text-foreground-muted" />
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-3.5 py-2.5 text-xs",
                    msg.sender === "customer"
                      ? "bg-surface-elevated text-foreground rounded-tl-sm"
                      : msg.sender === "ai"
                      ? "bg-primary text-primary-foreground text-primary-foreground rounded-tr-sm"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  )}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  <p className={cn(
                    "text-[10px] mt-1",
                    msg.sender === "customer" ? "text-foreground-muted" :
                    msg.sender === "ai" ? "text-primary-foreground/70" : "text-primary-foreground/70"
                  )}>
                    {msg.time}
                    {msg.sender === "ai" && " · AI"}
                    {msg.sender === "human" && " · You"}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0">
            <div className="flex gap-2">
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                onClick={handleSend}
                disabled={!messageInput.trim()}
                className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-primary-foreground hover:bg-primary-hover text-primary-foreground disabled:opacity-50 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-surface rounded-xl border border-border items-center justify-center shadow-card hidden md:flex">
          <EmptyState
            icon={<MessageSquare size={28} />}
            title="Select a conversation"
            description="Choose a conversation from the left to start messaging."
          />
        </div>
      )}

      {/* ─── Context Panel (Right Panel) ─────────────── */}
      {activeConv && (
        <div className="hidden lg:block">
          <ContextPanel
            conversation={activeConv}
            customer={activeCustomer}
            customerOrders={customerOrders}
          />
        </div>
      )}
    </div>
  );
}
