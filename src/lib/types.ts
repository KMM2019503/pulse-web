/**
 * Domain types mirroring the Yok backend (v2) response shapes.
 * Kept intentionally lean for the DM MVP; extend as more modules are wired.
 */

export type Gender = "M" | "F" | "T";

export type MessageStatusValue = "SENT" | "READ";

export type MessageType =
  | "STANDARD"
  | "CHANNEL_INVITATION"
  | "FORWARD"
  | "REPLY";

/** Full user object returned by login/signup. */
export interface User {
  id: string;
  email: string;
  userUniqueID: string;
  userName: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  profilePictureUrl?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight user as embedded in conversation members. */
export interface UserSummary {
  id: string;
  userName: string;
  profilePictureUrl?: string | null;
  lastActiveAt?: string | null;
}

/** A user returned by the search endpoint. */
export interface UserSearchResult {
  id: string;
  userName: string;
  email: string;
  userUniqueID?: string;
  profilePictureUrl?: string | null;
  lastActiveAt?: string | null;
}

/** A user returned by the location-based "nearby" endpoint (same shape as search). */
export type NearbyUser = UserSearchResult;

export interface SeenStatus {
  status: MessageStatusValue;
  seenUserIds: string[];
}

export interface ConversationMember {
  id: string;
  userId: string;
  conversationId: string;
  joinedAt: string;
  user: UserSummary;
}

export interface LastMessage {
  content: string;
  senderId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  members: ConversationMember[];
  lastMessage?: LastMessage | null;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  status: SeenStatus;
  photoUrl?: string[];
  fileUrls?: string[];
  messageType?: MessageType;
  conversationId?: string | null;
  createdAt: string;
  updatedAt?: string;
  /** Present in some payloads (latest-messages embeds the sender). */
  sender?: UserSummary;
}

/* ----- API response envelopes ----- */

export interface AuthResponse {
  success: boolean;
  user: User;
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  nextCursor?: string | null;
}

export interface ConversationMessagesResponse {
  success: boolean;
  messages: Message[];
}

/** Payload of the realtime `incomingNewMessage` socket event. */
export interface IncomingNewMessagePayload {
  message: Message;
  updatedConversation?: Conversation;
}

/* ----- Friends ----- */

export type FriendRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

/** Relationship between the current user and another user. */
export type FriendshipState =
  | "SELF"
  | "BLOCKED"
  | "FRIENDS"
  | "REQUEST_INCOMING"
  | "REQUEST_OUTGOING"
  | "NONE";

/** An accepted friend, as returned by `GET /friends`. */
export interface Friend {
  id: string;
  userName: string;
  email: string;
  userUniqueID?: string;
  profilePictureUrl?: string | null;
  lastActiveAt?: string | null;
  friendshipId: string;
  friendsSince: string;
}

/** A pending friend request. Embeds `sender` (incoming) or `receiver` (outgoing). */
export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
  sender?: UserSearchResult;
  receiver?: UserSearchResult;
}

export interface FriendsResponse {
  success: boolean;
  friends: Friend[];
  nextCursor?: string | null;
}

export interface FriendSuggestion {
  id: string;
  userName: string;
  email: string;
  userUniqueID?: string;
  profilePictureUrl?: string | null;
  lastActiveAt?: string | null;
  story: string | null;
  summary: string | null;
  tags: Array<{
    slug: string;
    label: string;
    category: ProfileTagCategory;
  }>;
  sharedTags: Array<{
    slug: string;
    label: string;
    category: ProfileTagCategory;
  }>;
  sharedTagCount: number;
}

export interface FriendSuggestionsResponse {
  success: boolean;
  suggestions: FriendSuggestion[];
}

export interface FriendRequestsResponse {
  success: boolean;
  requests: FriendRequest[];
  nextCursor?: string | null;
}

export interface FriendshipStatusResponse {
  success: boolean;
  status: FriendshipState;
  requestId?: string;
}

export interface SendFriendRequestResponse {
  success: boolean;
  status: "PENDING" | "FRIENDS";
  autoAccepted?: boolean;
  request?: FriendRequest;
  friend?: UserSearchResult;
}

/* ----- Persona profiles ----- */

export type ProfileStatus =
  | "PENDING"
  | "SKIPPED"
  | "AWAITING_REVIEW"
  | "READY"
  | "FAILED";

export type ProfileTagCategory =
  | "profession"
  | "sport"
  | "fandom"
  | "personality"
  | "media"
  | "lifestyle"
  | "values";

export interface ProfileTag {
  slug: string;
  label: string;
  category: ProfileTagCategory;
  confidence: number;
}

export interface OwnProfile {
  userId: string;
  story: string | null;
  summary: string | null;
  status: ProfileStatus;
  tags: ProfileTag[];
  confirmedTagSlugs: string[];
  aiTagSlugs: string[];
  suggestedTags: string[];
  parsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response for `GET /profile/me` and every profile mutation
 * (`PUT /profile/me`, `POST /profile/story`, `PUT /profile/tags`,
 * `POST /profile/skip`). `profile` is `null` until a persona exists.
 */
export interface ProfileResponse {
  success: boolean;
  user: User;
  profile: OwnProfile | null;
}

/** Body accepted by the unified `PUT /profile/me` endpoint. */
export interface UpdateProfileInput {
  userName?: string;
  email?: string;
  /** `null` clears the avatar. */
  profilePictureUrl?: string | null;
  /** `null` clears the gender. */
  gender?: Gender | null;
  /** ISO or `YYYY-MM-DD` date string. */
  dateOfBirth?: string | null;
  /** 10–4000 chars; re-parses the persona story. */
  story?: string;
  /** 1–30 lowercase kebab-case slugs; confirms the persona tags. */
  tags?: string[];
}

/** Public account fields exposed by `GET /profile/:userId`. */
export interface PublicProfileUser {
  id: string;
  userName: string;
  userUniqueID?: string;
  profilePictureUrl?: string | null;
  lastActiveAt?: string | null;
}

/** Public persona fields exposed by `GET /profile/:userId` (READY only). */
export interface PublicProfile {
  userId: string;
  summary: string | null;
  tags: ProfileTag[];
  updatedAt: string;
}

export interface PublicProfileResponse {
  success: boolean;
  user: PublicProfileUser;
  profile: PublicProfile;
}
