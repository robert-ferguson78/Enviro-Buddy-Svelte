import { doc, collection, updateDoc, query, where, getDocs, deleteDoc, addDoc, collectionGroup, orderBy, Timestamp, getDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from '$lib/firebase/firebase.client';

const collectionName = "chats";

// Define the Firestore store for chats
export const chatsFirestoreStore = {
    getMessagesRealtime: function(chatId: string, callback: (messages: any[]) => void) {
        console.log(`Setting up real-time listener for chatId: ${chatId}`);
        const messagesRef = collection(doc(db, collectionName, chatId), 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp'));
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`Received ${messages.length} real-time messages:`, messages);
            callback(messages);
        }, (error) => {
            console.error(`Error setting up real-time listener:`, error);
        });
        return unsubscribe;
    },

    getMessages(chatId, callback) {
        const messagesRef = collection(doc(db, collectionName, chatId), 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp'));
        return onSnapshot(messagesQuery, async (snapshot) => {
            let msgs = [];
            snapshot.forEach((doc) => {
                msgs.push(doc.data());
            });
            const chatData = await this.getChat(chatId);
            callback(msgs, chatData.userNames);
        });
    },

    sendMessage: async function(chatId: string, message: string, senderId: string, receiverId: string, senderName: string) {
        const messagesRef = collection(doc(db, collectionName, chatId), 'messages');
        await addDoc(messagesRef, {
            text: message,
            timestamp: Timestamp.now(),
            senderId: senderId,
            receiverId: receiverId,
            senderName: senderName
        });
    },

    getChats: async function(userId: string) {
        console.log('getChats called with userId:', userId); // Log the userId
        const chatsRef = collection(db, collectionName);
        const chatsQuery = query(chatsRef, where('userIds', 'array-contains', userId));
        const chatsSnap = await getDocs(chatsQuery);
        console.log('chatsSnap:', chatsSnap); // Log the snapshot
        const chats = chatsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('chats:', chats); // Log the chats
        return chats;
    },

    getChat: async function(chatId: string) {
        const chatRef = doc(db, collectionName, chatId);
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
            return { id: chatSnap.id, ...chatSnap.data() };
        } else {
            throw new Error("No such chat exists!");
        }
    },

    createChat: async function(userId1: string, userId2: string, userName1: string, userName2: string) {
        console.log('userId1:', userId1);
        console.log('userId2:', userId2);
        console.log('userName1:', userName1);
        console.log('userName2:', userName2);
        console.log('timestamp:', serverTimestamp());
    
        const chatData = {
            userIds: [userId1, userId2],
            userNames: [userName1, userName2],
            timestamp: serverTimestamp(),
            // Add other fields as needed
        };
    
        const chatRef = await addDoc(collection(db, collectionName), chatData);
        return chatRef.id;
    },

};