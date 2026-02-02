
"use client";
import { useState, useEffect } from "react";
import ChatList from "./CharList";
import ChatDetail from "./ChatDetail";
import { useMediaQuery } from "./Query";
import axios from "axios";
import { useAuth } from "@/All_Components/screen/AuthContext";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function InterFace() {
    const navigate = useNavigate();

  const [selectedChat, setSelectedChat] = useState(null);
  const [psychics, setPsychics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { user } = useAuth();
   const { psychicId } = useParams();

useEffect(() => {
  const fetchPsychics = async () => {
    if (!user?._id) return;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/psychics/user/${user._id}`
      );

      const chatPsychics = res.data.data || [];
      setPsychics(chatPsychics);

      // Bij mobiel, toon altijd de lijst, niet de chat
      if (isMobile) {
        setShowMobileChat(false);
      } else {
        // Bij desktop, selecteer de juiste chat
        if (!isMobile && chatPsychics.length > 0) {
          let selected = null;

          if (psychicId) {
            // Als psychicId bestaat in chatPsychics
            selected = chatPsychics.find((p) => p._id === psychicId);

            // Als niet, probeer het direct op te halen (eerste keer chatten)
            if (!selected) {
              const singlePsychicRes = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/api/psychics/${psychicId}`
              );
              selected = singlePsychicRes.data.data;
            }
          }

          await handlePsychicSelect(selected || chatPsychics[0]);
        }
      }
    } catch (error) {
      console.error("Kon psychics of geselecteerde psychic niet ophalen:", error);
      setPsychics([]);
    } finally {
      setIsLoading(false);
    }
  };

  fetchPsychics();
}, [isMobile, user?._id, psychicId]);


 // In InterFace.js
const handlePsychicSelect = async (psychic) => {
    if (!psychic?._id) return;
    
    // Update URL eerste
    navigate(`/chat/${psychic._id}`);
    
    // Bij mobiel, toon de chat
    if (isMobile) {
      setShowMobileChat(true);
    }
    
  try {
    setIsLoading(true);
    const chatRes = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/api/chat/history/${psychic._id}`,
      { headers: { Authorization: `Bearer ${user?.token}` } }
    );
    // Transformeer berichten naar verwachte structuur
    const transformedMessages = (chatRes.data?.messages || []).map(msg => ({
      _id: msg._id || msg.id,
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
      timestamp: msg.createdAt || new Date().toISOString()
    }));

    setSelectedChat({
      ...psychic,
      messages: transformedMessages
    });

    if (isMobile) setShowMobileChat(true);
  } catch (error) {
    console.error("Kon chatgeschiedenis niet ophalen:", error);
    setSelectedChat({
      ...psychic,
      messages: []
    });
  } finally {
    setIsLoading(false);
  }
};

  const handleBackToList = () => {
    if (isMobile) setShowMobileChat(false);
  };

 const handleSendMessage = async (messageContent) => {
  if (!selectedChat || !messageContent?.trim()) return;

  const tempId = `temp-${Date.now()}`;
  const userMessage = {
    _id: tempId,
    role: "user",
    content: messageContent,
    timestamp: new Date().toISOString(),
    isOptimistic: true,
  };

  setSelectedChat((prev) => ({
    ...prev,
    messages: [...(prev?.messages || []), userMessage],
  }));

  try {
    console.log("Bericht verzenden naar:", `${import.meta.env.VITE_BASE_URL}/api/chat/${selectedChat._id}`);
    
    const res = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/api/chat/${selectedChat._id}`,
      {
        message: messageContent,
        // Hoef psychicId niet opnieuw te sturen omdat het in de URL zit
      },
      {
        headers: { 
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
      }
    );

    console.log("Response:", res.data);

   if (res.data?.reply) {
  const aiMessage = {
    _id: `ai-${Date.now()}`,
    role: "assistant",
    content: res.data.reply,
    timestamp: new Date().toISOString(),
  };

  setPsychics(prevPsychics => {
    const alreadyExists = prevPsychics.some(p => p._id === selectedChat._id);
    if (alreadyExists) return prevPsychics;
    return [...prevPsychics, selectedChat];
  });

     setSelectedChat((prev) => ({
    ...prev,
    messages: [
      ...(prev?.messages?.filter((m) => m._id !== tempId) || []),
      { ...userMessage, isOptimistic: false },
      aiMessage,
    ],
  }));
}
  } catch (error) {
    console.error("Kon bericht niet verzenden:", error);
    console.error("Fout details:", error.response?.data);

    // Verwijder optimistisch bericht
    setSelectedChat((prev) => ({
      ...prev,
      messages: (prev?.messages || []).filter((m) => m._id !== tempId),
    }));

    // Toon foutmelding
    const errorMessage = {
      _id: `error-${Date.now()}`,
      role: "system",
      content: error.response?.data?.message || "Kon bericht niet verzenden. Probeer het opnieuw.",
      timestamp: new Date().toISOString(),
      isError: true,
    };

    setSelectedChat((prev) => ({
      ...prev,
      messages: [...(prev?.messages || []), errorMessage],
    }));
  }
};

  // JSX rendering
  if (isMobile) {
    return (
      <div className="h-screen w-full bg-background">
        {!showMobileChat ? (
          <ChatList
            psychics={psychics}
            onSelectPsychic={handlePsychicSelect}
            selectedPsychicId={selectedChat?._id}
            isLoading={isLoading}
          />
        ) : (
          <ChatDetail
            chat={selectedChat}
            onBack={handleBackToList}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen max-w-7xl mx-auto px-2 border border-gray-200 mt-4 mb-10 overflow-hidden bg-background">
      <div className="w-1/3 border-r border-border">
        <ChatList
          psychics={psychics}
          onSelectPsychic={handlePsychicSelect}
          selectedPsychicId={selectedChat?._id}
          isLoading={isLoading}
        />
      </div>
      <div className="w-2/3">
        {selectedChat ? (
          <ChatDetail chat={selectedChat} onSendMessage={handleSendMessage} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              {isLoading ? "Laden..." : "Selecteer een psychic om te beginnen met berichten"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}