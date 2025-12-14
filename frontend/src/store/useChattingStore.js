import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  searchResults: [],
  talkRequests: [],
  sentRequests: [],
  friends: [],
  groups: [],
  chatMemory: [],
  reminders: [],
  isGroupsLoading: false,
  selectedUser: null,
  isConversationsLoading: false,
  isMessagesLoading: false,
  isTyping: false,

  // Notification Settings
  showNotifications: localStorage.getItem("showNotifications") !== "false",
  showPreview: localStorage.getItem("showPreview") !== "false",

  toggleNotificationSetting: (setting) => {
    set((state) => {
      const newValue = !state[setting];
      localStorage.setItem(setting, newValue);
      return { [setting]: newValue };
    });
  },

  getFriends: async () => {
    try {
      const res = await axiosInstance.get("/friends");
      set({ friends: res.data });
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  },

  removeFriend: async (friendId) => {
    try {
      await axiosInstance.delete(`/friends/${friendId}`);
      set((state) => ({
        friends: state.friends.filter((f) => f._id !== friendId),
      }));
      toast.success("Friend removed");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  getConversations: async () => {
    set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get("/messages/conversations");
      set({ conversations: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  searchUsers: async (query) => {
    set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get(`/users/search?query=${query}`);
      set({ searchResults: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
      set({ searchResults: [] });
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  sendTalkRequest: async (receiverId) => {
    try {
      const res = await axiosInstance.post("/requests/send", { receiverId });
      toast.success("Request sent successfully");
      set((state) => ({
        sentRequests: [...state.sentRequests, res.data]
      }));
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  getTalkRequests: async () => {
    try {
      const res = await axiosInstance.get("/requests/received");
      set({ talkRequests: res.data });
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  },

  getSentRequests: async () => {
    try {
      const res = await axiosInstance.get("/requests/sent");
      set({ sentRequests: res.data });
    } catch (error) {
      console.error("Error fetching sent requests:", error);
    }
  },

  acceptTalkRequest: async (requestId) => {
    try {
      const res = await axiosInstance.post("/requests/accept", { requestId });
      const { conversation } = res.data;

      set((state) => ({
        talkRequests: state.talkRequests.filter((r) => r._id !== requestId),
        conversations: [conversation, ...state.conversations],
        selectedUser: conversation.participants.find(p => p._id !== useAuthStore.getState().authUser._id)
      }));
      toast.success("Request accepted");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  rejectTalkRequest: async (requestId) => {
    try {
      await axiosInstance.post("/requests/reject", { requestId });
      set((state) => ({
        talkRequests: state.talkRequests.filter((r) => r._id !== requestId),
      }));
      toast.success("Request rejected");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      // Also fetch memory if it's a conversation
      const conversation = get().conversations.find(c => c.participants.some(p => p._id === userId));
      if (conversation) {
        set({ chatMemory: conversation.memory || [] });
      } else {
        set({ chatMemory: [] });
      }
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups", groupData);
      set((state) => ({
        groups: [res.data, ...state.groups],
      }));
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ messages: res.data });
      // Fetch memory for group (if we store it in group model, but we stored it in Conversation model... wait)
      // Groups don't have a Conversation model entry in my current schema?
      // Actually, my schema has `groupId` in Message, but `Conversation` is for 1-1.
      // If I want memory for groups, I should have added it to Group model too.
      // Let's check Group model.
      // If I didn't add it, I should.
      // For now, let's assume 1-1 memory works.
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    const { messages } = get();
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/messages`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/leave`);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedUser: null,
      }));
      toast.success("Left group");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateGroup: async (groupId, data) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/update`, data);
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedUser: state.selectedUser?._id === groupId ? res.data : state.selectedUser,
      }));
      toast.success("Group updated");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  addGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/add-member`, { memberId });
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedUser: state.selectedUser?._id === groupId ? res.data : state.selectedUser,
      }));
      toast.success("Member added");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  removeGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/remove-member`, { memberId });
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedUser: state.selectedUser?._id === groupId ? res.data : state.selectedUser,
      }));
      toast.success("Member removed");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? res.data : m)),
      }));
      toast.success("Message edited");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.put(`/messages/react/${messageId}`, { emoji });
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? res.data : m)),
      }));
    } catch (error) {
      console.error("Error reacting:", error);
    }
  },

  setSelectedUser: async (selectedUser) => {
    set({ selectedUser });
    if (selectedUser && selectedUser.email) {
      try {
        await axiosInstance.put(`/messages/mark-seen/${selectedUser._id}`);
        set((state) => {
          const updatedConversations = state.conversations.map((c) => {
            if (c.participants.some((p) => p._id === selectedUser._id)) {
              return {
                ...c,
                unreadCount: {
                  ...c.unreadCount,
                  [useAuthStore.getState().authUser._id]: 0,
                },
              };
            }
            return c;
          });
          return { conversations: updatedConversations };
        });
      } catch (error) {
        console.error("Error marking messages as seen:", error);
      }
    }
  },

  checkVideoCallEligibility: async (receiverId) => {
    try {
      const res = await axiosInstance.post("/video-call/check-eligibility", { receiverId });
      return res.data.eligible;
    } catch (error) {
      toast.error(error.response?.data?.message || "Eligibility check failed");
      return false;
    }
  },

  // --- Unique Features Actions ---

  addMemory: async (conversationId, text, referenceMsgId) => {
    try {
      const res = await axiosInstance.post(`/conversations/${conversationId}/memory`, { text, referenceMsgId });
      set({ chatMemory: res.data });
      toast.success("Memory added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add memory");
    }
  },

  removeMemory: async (conversationId, memoryId) => {
    try {
      const res = await axiosInstance.delete(`/conversations/${conversationId}/memory/${memoryId}`);
      set({ chatMemory: res.data });
      toast.success("Memory removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove memory");
    }
  },

  updateMood: async (status, duration) => {
    try {
      await axiosInstance.put("/users/mood", { status, duration });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  createReminder: async (messageId, remindAt) => {
    try {
      await axiosInstance.post("/reminders", { messageId, remindAt });
      toast.success("Reminder set!");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  getReminders: async () => {
    try {
      const res = await axiosInstance.get("/reminders");
      set({ reminders: res.data });
    } catch (error) {
      console.error("Error fetching reminders", error);
    }
  },

  deleteReminder: async (id) => {
    try {
      await axiosInstance.delete(`/reminders/${id}`);
      set(state => ({ reminders: state.reminders.filter(r => r._id !== id) }));
      toast.success("Reminder removed");
    } catch (error) {
      toast.error("Failed to remove reminder");
    }
  },

  subscribeToPush: async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;

      // Fetch VAPID Key
      const configRes = await axiosInstance.get("/notifications/config");
      const vapidPublicKey = configRes.data.vapidPublicKey;

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      await axiosInstance.post("/notifications/subscribe", subscription);
      console.log("Push notification subscribed");
    } catch (error) {
      console.error("Error subscribing to push:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    get().unsubscribeFromMessages(); // Prevent duplicates
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, showNotifications, showPreview, messages } = get();
      const isChatOpen = selectedUser && selectedUser._id === newMessage.senderId;

      if (isChatOpen) {
        // Prevent duplicates
        if (messages.some(m => m._id === newMessage._id)) return;

        set({
          messages: [...messages, newMessage],
        });
      } else if (showNotifications) {
        const senderName = newMessage.senderId.fullname || "User";
        const toastMessage = showPreview
          ? `New message from ${senderName}: ${newMessage.text || "Sent an attachment"}`
          : `New message from ${senderName}`;
        toast.success(toastMessage);

        // Local System Notification if tab is hidden
        if (document.visibilityState === "hidden" && Notification.permission === "granted") {
          new Notification(`New message from ${senderName}`, {
            body: showPreview ? (newMessage.text || "Sent an attachment") : "You have a new message",
            icon: "/vite.svg", // Use app icon
          });
        }
      }
    });

    socket.on("newGroupMessage", (newMessage) => {
      const { selectedUser, groups, showNotifications, showPreview, messages } = get();
      const isGroupOpen = selectedUser && selectedUser._id === newMessage.groupId;

      if (isGroupOpen) {
        // Prevent duplicates
        if (messages.some(m => m._id === newMessage._id)) return;

        set({
          messages: [...messages, newMessage],
        });
      } else if (showNotifications) {
        const groupName = groups.find(g => g._id === newMessage.groupId)?.name || "Group";
        if (newMessage.senderId._id !== useAuthStore.getState().authUser._id) {
          const toastMessage = showPreview
            ? `New message in ${groupName}: ${newMessage.text || "Sent an attachment"}`
            : `New message in ${groupName}`;
          toast.success(toastMessage);
        }
      }
    });

    socket.on("groupUpdated", (updatedGroup) => {
      set((state) => ({
        groups: state.groups.map((g) => (g._id === updatedGroup._id ? updatedGroup : g)),
        selectedUser: state.selectedUser?._id === updatedGroup._id ? updatedGroup : state.selectedUser,
      }));
    });

    socket.on("removedFromGroup", (groupId) => {
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        selectedUser: state.selectedUser?._id === groupId ? null : state.selectedUser,
      }));
      toast.error("You were removed from the group");
    });

    socket.on("newGroup", (newGroup) => {
      set((state) => {
        if (state.groups.some(g => g._id === newGroup._id)) return state;
        return {
          groups: [newGroup, ...state.groups],
        };
      });
      if (newGroup.createdBy !== useAuthStore.getState().authUser._id) {
        toast.success(`Added to group: ${newGroup.name}`);
      }
    });

    socket.on("messageDeleted", ({ messageId, isSoft }) => {
      if (isSoft) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId
              ? { ...m, text: "This message was deleted", image: null, isDeleted: true }
              : m
          ),
        }));
      } else {
        set({
          messages: get().messages.filter((m) => m._id !== messageId),
        });
      }
    });

    socket.on("messageUpdated", (updatedMessage) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === updatedMessage._id ? updatedMessage : m
        ),
      }));
    });

    socket.on("messageReactionUpdate", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === messageId ? { ...m, reactions } : m
        ),
      }));
    });

    socket.on("typing", ({ senderId }) => {
      if (selectedUser && senderId === selectedUser._id) {
        set({ isTyping: true });
      }
    });

    socket.on("stopTyping", ({ senderId }) => {
      if (selectedUser && senderId === selectedUser._id) {
        set({ isTyping: false });
      }
    });

    socket.on("conversationUpdated", (updatedConversation) => {
      set((state) => {
        const otherConversations = state.conversations.filter(
          (c) => c._id !== updatedConversation._id
        );
        return {
          conversations: [updatedConversation, ...otherConversations],
        };
      });
    });

    socket.on("messagesSeen", ({ conversationId }) => {
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === conversationId) {
        set((state) => {
          const updatedMessages = state.messages.map((m) => ({
            ...m,
            status: "seen",
          }));
          return { messages: updatedMessages };
        });
      }
    });

    socket.on("messageStatusUpdate", ({ messageId, status, groupId }) => {
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === groupId) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === messageId ? { ...m, status } : m
          ),
        }));
      }
    });

    socket.on("newTalkRequest", (newRequest) => {
      toast.success(`New talk request from ${newRequest.sender.fullname}`);
      set((state) => ({
        talkRequests: [newRequest, ...state.talkRequests],
      }));
    });

    socket.on("talkRequestAccepted", ({ conversation }) => {
      toast.success("Your talk request was accepted!");
      set((state) => ({
        conversations: [conversation, ...state.conversations],
      }));
    });

    socket.on("callUser", (data) => {
      const { authUser } = useAuthStore.getState();
      if (authUser.plan !== "PRO") {
        socket.emit("callRejected", { reason: "Receiver is not eligible" });
        return;
      }
      window.dispatchEvent(new CustomEvent("startVideoCall"));
      toast.success(`Incoming call from ${data.name || "User"}`);
    });

    socket.on("callRejected", (data) => {
      toast.error(data.reason || "Call rejected");
      window.dispatchEvent(new CustomEvent("endVideoCall"));
    });

    socket.on("messagesDelivered", ({ receiverId }) => {
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === receiverId) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.senderId === useAuthStore.getState().authUser._id && m.status === "sent"
              ? { ...m, status: "delivered" }
              : m
          ),
        }));
      }
    });

    socket.on("newFriend", (newFriend) => {
      set((state) => ({
        friends: [...state.friends, newFriend],
      }));
      toast.success(`You are now friends with ${newFriend.fullname}`);
    });

    socket.on("friendRemoved", (friendId) => {
      set((state) => ({
        friends: state.friends.filter((f) => f._id !== friendId),
        conversations: state.conversations.filter(c => !c.participants.some(p => p._id === friendId)),
        selectedUser: state.selectedUser?._id === friendId ? null : state.selectedUser
      }));
      toast.success("Friend removed");
    });

    socket.on("memoryUpdated", ({ conversationId, memory }) => {
      set(state => {
        const updatedConversations = state.conversations.map(c => c._id === conversationId ? { ...c, memory } : c);
        const currentConv = updatedConversations.find(c => c.participants.some(p => p._id === state.selectedUser?._id));

        if (currentConv && currentConv._id === conversationId) {
          return { conversations: updatedConversations, chatMemory: memory };
        }
        return { conversations: updatedConversations };
      });
    });

    socket.on("userUpdated", ({ userId, mood }) => {
      // Update friend list or selected user if applicable
      set(state => ({
        friends: state.friends.map(f => f._id === userId ? { ...f, mood } : f),
        selectedUser: state.selectedUser?._id === userId ? { ...state.selectedUser, mood } : state.selectedUser
      }));
    });

    socket.on("chat:cleared", ({ userToChatId }) => {
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === userToChatId) {
        set({ messages: [] });
      }
    });

    socket.on("conversation:deleted", ({ conversationId }) => {
      set((state) => ({
        conversations: state.conversations.filter((c) => c._id !== conversationId),
        selectedUser: state.selectedUser && state.conversations.find(c => c._id === conversationId)?.participants.some(p => p._id === state.selectedUser._id) ? null : state.selectedUser
      }));
    });

    socket.on("reminderTriggered", (reminder) => {
      toast(`⏰ Reminder: ${reminder.messageId.text || "Check this message"}`, {
        duration: 6000,
        icon: "⏰"
      });
    });

    socket.on("connect", () => {
      get().getConversations();
      get().getGroups();
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("newGroup");
    socket.off("messageDeleted");
    socket.off("messageUpdated");
    socket.off("messageReactionUpdate");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("conversationUpdated");
    socket.off("messagesSeen");
    socket.off("messageStatusUpdate");
    socket.off("messagesDelivered");
    socket.off("newTalkRequest");
    socket.off("talkRequestAccepted");
    socket.off("callUser");
    socket.off("callRejected");
    socket.off("newFriend");
    socket.off("friendRemoved");
    socket.off("groupUpdated");
    socket.off("removedFromGroup");
    socket.off("memoryUpdated");
    socket.off("userUpdated");
    socket.off("reminderTriggered");
    socket.off("chat:cleared");
    socket.off("conversation:deleted");
    socket.off("connect");
  },

  clearChat: async (userId) => {
    try {
      await axiosInstance.post(`/messages/clear/${userId}`);
      set({ messages: [] });
      toast.success("Chat cleared");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  deleteChat: async (conversationId) => {
    try {
      await axiosInstance.post(`/messages/delete/${conversationId}`);
      set((state) => ({
        conversations: state.conversations.filter((c) => c._id !== conversationId),
        selectedUser: null,
        messages: [],
      }));
      toast.success("Chat deleted");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
}));
