import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "./Admin.css";
import AdminLayout from "../../components/Admin/AdminLayout";
import Loader from "../../components/Common/Loader";

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/contact`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Handles both { success: true, messages: [...] } and array responses
        if (response.data.success) {
          setMessages(response.data.messages);
        } else if (Array.isArray(response.data)) {
          setMessages(response.data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load contact messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  return (
    <AdminLayout>
      <div className="admin-page-container">
        <h2>Contact Messages</h2>

        {loading ? (
          <Loader text="Loading messages..." />
        ) : messages.length === 0 ? (
          <p className="no-requests">No messages found.</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg, index) => (
                  <tr key={msg._id || index}>
                    <td>{index + 1}</td>
                    <td>{msg.name}</td>
                    <td>
                      <a href={`mailto:${msg.email}`}>{msg.email}</a>
                    </td>
                    <td>{msg.subject || "N/A"}</td>
                    <td>{msg.message}</td>
                    <td>
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ContactMessages;
