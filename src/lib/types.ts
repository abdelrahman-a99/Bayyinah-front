export interface UserOut {
  id: string;
  auth_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface LoginResponse {
  user: UserOut;
  message: string;
}

export interface ConversationOut {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationCreate {
  title?: string;
}

export interface ConversationUpdate {
  title: string;
}

export interface MessageOut {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MessageCreate {
  content: string;
}

export interface ChatResponse {
  user_message: MessageOut;
  assistant_message: MessageOut;
}
