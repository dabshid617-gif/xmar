import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";

interface ConversationListItemProps {
  profile: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  user: User | null;
}

const ConversationListItem = ({ profile, last_message, user }: ConversationListItemProps) => {
  const isMyMessage = last_message.sender_id === user?.id;

  return (
    <Link to={`/chat/${profile.id}`}>
      <div className="flex items-center p-4 border-b hover:bg-muted/50 cursor-pointer">
        <img src={profile.avatar_url || '/placeholder.svg'} alt={profile.full_name} className="w-12 h-12 rounded-full mr-4" />
        <div className="flex-1">
          <div className="flex justify-between">
            <h2 className="font-semibold">{profile.full_name || profile.username}</h2>
            <span className="text-xs text-muted-foreground">
              {new Date(last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm truncate text-muted-foreground">
              {isMyMessage && "You: "}
              {last_message.content}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ConversationListItem;
