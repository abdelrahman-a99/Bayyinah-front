import { supabase } from "./supabase";
import {
  ChatResponse,
  ConversationCreate,
  ConversationOut,
  ConversationUpdate,
  LoginResponse,
  MessageCreate,
  MessageOut,
  UserOut,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.detail || `API Error: ${response.statusText}`
      );
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Auth
  async login(access_token: string): Promise<LoginResponse> {
    const res = await fetchWithAuth("/auth/login", {
      method: "POST",
      body: JSON.stringify({ access_token }),
    });
    return res.json();
  },

  async getMe(): Promise<UserOut> {
    const res = await fetchWithAuth("/auth/me");
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<ConversationOut[]> {
    const res = await fetchWithAuth("/conversations");
    return res.json();
  },

  async createConversation(data: ConversationCreate): Promise<ConversationOut> {
    const res = await fetchWithAuth("/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateConversation(
    id: string,
    data: ConversationUpdate
  ): Promise<ConversationOut> {
    const res = await fetchWithAuth(`/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    await fetchWithAuth(`/conversations/${id}`, {
      method: "DELETE",
    });
  },

  // Messages
  async getMessages(conversationId: string): Promise<MessageOut[]> {
    const res = await fetchWithAuth(`/conversations/${conversationId}/messages`);
    return res.json();
  },

  async sendMessage(
    conversationId: string,
    data: MessageCreate
  ): Promise<ChatResponse> {
    const res = await fetchWithAuth(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
