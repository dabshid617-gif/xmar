CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_user_username TEXT,
  other_user_full_name TEXT,
  other_user_avatar_url TEXT,
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  last_message_sender_id UUID
) AS $$
BEGIN
  RETURN QUERY
  WITH user_convos AS (
    SELECT
      c.id AS convo_id,
      CASE
        WHEN c.user1_id = p_user_id THEN c.user2_id
        ELSE c.user1_id
      END AS other_user
    FROM
      chat_conversations c
    WHERE
      c.user1_id = p_user_id OR c.user2_id = p_user_id
  ),
  last_messages AS (
    SELECT
      m.conversation_id,
      m.message,
      m.created_at,
      m.sender_id,
      ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
    FROM
      chat_messages m
    WHERE
      m.conversation_id IN (SELECT convo_id FROM user_convos)
  )
  SELECT
    uc.convo_id,
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    lm.message,
    lm.created_at,
    lm.sender_id
  FROM
    user_convos uc
  JOIN
    profiles p ON uc.other_user = p.id
  LEFT JOIN
    last_messages lm ON uc.convo_id = lm.conversation_id AND lm.rn = 1
  ORDER BY
    lm.created_at DESC;
END;
$$ LANGUAGE plpgsql;
