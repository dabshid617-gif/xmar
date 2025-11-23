import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface Message {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
}

interface ChatWindowProps {
  messages: Message[];
  selectedConversation: string | null;
  user: any;
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: (e: React.FormEvent) => void;
  getOtherUser: (conv: any) => any;
  conversation: any;
}

export const ChatWindow = ({ messages, selectedConversation, user, newMessage, setNewMessage, sendMessage, getOtherUser, conversation }: ChatWindowProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a conversation to start chatting
      </div>
    );
  }

  const otherUser = getOtherUser(conversation);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-3">
        <Avatar>
          <AvatarFallback className="bg-primary/20">
            {otherUser?.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{otherUser?.username}</p>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${
                msg.sender_id === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender_id !== user?.id && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20">
                    {otherUser?.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.sender_id === user?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.sender_id === user?.id && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
