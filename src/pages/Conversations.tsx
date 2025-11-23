import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import ConversationListItem from "@/components/chat/ConversationListItem";

interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_username: string;
  other_user_full_name: string;
  other_user_avatar_url: string;
  last_message_content: string;
  last_message_created_at: string;
  last_message_sender_id: string;
}

const Conversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      try {
        setLoading(true);

        const { data, error } = await supabase.rpc("get_user_conversations", {
          p_user_id: user.id,
        });

        if (error) throw error;

        setConversations(data || []);
      } catch (error: any) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-0 py-4">
        <div className="bg-card border rounded-lg">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Chats</h1>
          </div>
          <div>
            {loading ? (
              <div className="p-4 text-center">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No conversations yet.</div>
            ) : (
              conversations.map((conv) => (
                <ConversationListItem
                  key={conv.conversation_id}
                  profile={{
                    id: conv.other_user_id,
                    username: conv.other_user_username,
                    full_name: conv.other_user_full_name,
                    avatar_url: conv.other_user_avatar_url,
                  }}
                  last_message={{
                    content: conv.last_message_content,
                    created_at: conv.last_message_created_at,
                    sender_id: conv.last_message_sender_id,
                  }}
                  user={user}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default Conversations;
