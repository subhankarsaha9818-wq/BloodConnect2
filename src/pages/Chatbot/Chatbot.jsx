import { useState } from "react";
import { FaRobot } from "react-icons/fa";
import axios from "axios";
import "./Chatbot.css";

function Chatbot() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hello! I am your BloodConnect Assistant. How can I help you today?",
    },
  ]);

  const [loading, setLoading] = useState(false);

const handleSend = async () => {
  if (!message.trim()) return;

  const userText = message; // Save the message

  const userMessage = {
    sender: "user",
    text: userText,
  };

  setMessages((prev) => [...prev, userMessage]);

  // Clear the input immediately
  setMessage("");

  setLoading(true);

  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/chat`,
      {
        message: userText,
      }
    );

    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: res.data.reply,
      },
    ]);
  } catch (err) {
    console.error(err);

    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text:
          err.response?.data?.reply ||
          err.message ||
          "Unknown error",
      },
    ]);
  }

  setLoading(false);
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <FaRobot size={28} />
        <h2>BloodConnect Assistant</h2>
      </div>

      <div className="chat-body">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.sender === "user"
                ? "user-message"
                : "bot-message"
            }
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div className="bot-message">
            Typing...
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Chatbot;