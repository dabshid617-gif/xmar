import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  profiles?: any;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
  getOtherUser: (conv: any) => any;
}

export const ConversationList = ({ conversations, selectedConversation, onSelectConversation, getOtherUser }: ConversationListProps) => {
  return (
    <div className="border-r bg-muted/40">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Conversations</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-200px)]">
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No conversations yet
          </p>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conv) => {
              const otherUser = getOtherUser(conv);
              if (!otherUser) return null;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    selectedConversation === conv.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary/20">
                      {otherUser.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium">{otherUser.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {otherUser.full_name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
