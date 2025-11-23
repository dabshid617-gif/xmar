import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

const Chat = () => {
  const { userId: otherUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (otherUserId) {
      fetchOtherUserProfile();
    }
  }, [otherUserId]);

  useEffect(() => {
    if (user && otherUser) {
      getOrCreateConversation();
    }
  }, [user, otherUser]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      const subscription = subscribeToMessages();
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchOtherUserProfile = async () => {
    if (!otherUserId) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", otherUserId)
      .single();
    if (error) {
      toast.error("Could not load user profile.");
      navigate("/conversations");
    } else {
      setOtherUser(data);
    }
  };

  const getOrCreateConversation = async () => {
    if (!user || !otherUser) return;

    const { data, error } = await supabase
      .from("chat_conversations")
      .select("id")
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUser.id}),and(user1_id.eq.${otherUser.id},user2_id.eq.${user.id})`)
      .maybeSingle();

    if (error) {
      toast.error("Error getting conversation.");
      return;
    }

    if (data) {
      setConversationId(data.id);
    } else {
      const { data: newConv, error: createError } = await supabase
        .from("chat_conversations")
        .insert([{ user1_id: user.id, user2_id: otherUser.id }])
        .select("id")
        .single();

      if (createError) {
        toast.error("Failed to create conversation");
      } else {
        setConversationId(newConv.id);
      }
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load messages.");
    } else {
      setMessages(data as Message[]);
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) throw new Error("Conversation ID not available");
    return supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversationId) return;

    const { error } = await supabase.from("chat_messages").insert([
      {
        conversation_id: conversationId,
        sender_id: user.id,
        message: newMessage.trim(),
      },
    ]);

    if (error) {
      toast.error("Failed to send message.");
    } else {
      setNewMessage("");
    }
  };

  if (!otherUser) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="flex items-center p-2 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <Button variant="ghost" size="icon" onClick={() => navigate("/conversations")}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <img src={otherUser.avatar_url || '/placeholder.svg'} alt={otherUser.full_name} className="w-10 h-10 rounded-full ml-2" />
        <div className="ml-3">
          <h2 className="font-semibold text-lg">{otherUser.full_name || otherUser.username}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">online</p> {/* Placeholder */}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${msg.sender_id === user?.id ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-700"}`}>
                <p>{msg.message}</p>
                <span className="text-xs text-gray-400 float-right mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-2 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
        <form onSubmit={sendMessage} className="flex items-center">
          <Input
            type="text"
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="ghost" size="icon" className="ml-2">
            <Send className="h-6 w-6" />
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default Chat;
