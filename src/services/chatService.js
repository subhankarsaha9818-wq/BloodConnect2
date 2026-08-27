import axios from "axios";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/chat`;

export const sendMessage = async (message) => {
  const res = await axios.post(API, {
    message,
  });

  return res.data.reply;
};