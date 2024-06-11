import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Chatbot.css';

const Chatbot = () => {
  const [query, setQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('Fine-Tune');

  const handleModeSwitch = () => {
    setMode((prevMode) => (prevMode === 'Fine-Tune' ? 'RAG' : 'Fine-Tune'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userChat = {
      query,
      response: '',
      timestamp: new Date().toLocaleTimeString(),
      isUser: true,
    };

    setChats([...chats, userChat]);
    setIsLoading(true);
    setQuery('');

    try {
      const result = await axios.post(`http://127.0.0.1:5000/query${mode.replace('-', '')}`, {
        query_text: query,
      });

      const botChat = {
        query,
        response: result.data.response,
        timestamp: new Date().toLocaleTimeString(),
        isUser: false,
      };
      setChats((prevChats) => [...prevChats, botChat]);
    } catch (error) {
      const botChat = {
        query,
        response: error.response?.data?.error || 'There was an error processing your request.',
        timestamp: new Date().toLocaleTimeString(),
        isUser: false,
      };
      setChats((prevChats) => [...prevChats, botChat]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Astor AI</h1>
        <h6>A personal medical assistant at your fingertips</h6>
        <button className="mode-switch" onClick={handleModeSwitch}>
          {mode}
        </button>
      </div>
      <div className="chat-body">
        <div className="messages">
          {chats.map((chat, index) => (
            <div
              key={index}
              className={`message-item ${chat.isUser ? 'user-message' : 'bot-message'}`}
            >
              <ReactMarkdown>{chat.isUser ? chat.query : chat.response}</ReactMarkdown>
              <div className="message-time">{chat.timestamp}</div>
            </div>
          ))}
          {isLoading && (
            <div className="message-item bot-message">
              <div className="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          className="input-field"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="send-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-send-fill" viewBox="0 0 16 16">
            <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
