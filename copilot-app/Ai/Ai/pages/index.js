import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import {
  FiTrash2,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiKey,
  FiSend,
  FiMenu,
  FiX,
  FiCopy,
  FiCheck,
  FiMessageSquare,
  FiSettings,
  FiSun,
  FiMoon,
  FiFolder,
  FiPlus,
  FiEdit3,
  FiSave,
  FiCode,
  FiFolderPlus,
} from "react-icons/fi";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [apiKey, setApiKey] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewCode, setPreviewCode] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");
  const [typingMessageId, setTypingMessageId] = useState(null);
  const [typingText, setTypingText] = useState("");
  const [currentView, setCurrentView] = useState("chat"); // "chat" or "projects"
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const messagesEndRef = useRef(null);
  const typingIntervalRef = useRef(null);

  
  // Load data from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("claude_clone_messages");
    const savedApiKey = localStorage.getItem("claude_clone_api_key");
    const savedProjects = localStorage.getItem("claude_clone_projects");

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
    }
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Save projects to localStorage whenever projects change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem("claude_clone_projects", JSON.stringify(projects));
    }
  }, [projects]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("claude_clone_messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText]);

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const typeWriterEffect = (text, messageId, callback) => {
    let index = 0;
    setTypingMessageId(messageId);
    setTypingText("");

    const typeChar = () => {
      if (index < text.length) {
        setTypingText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(typingIntervalRef.current);
        setTypingMessageId(null);
        setTypingText("");
        if (callback) callback();
      }
    };

    typingIntervalRef.current = setInterval(typeChar, 20); // Adjust speed here (lower = faster)
  };

  const callOpenAI = async (conversationMessages) => {
 const response = await fetch("/copilot/api/claude", {


  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [
      {
        role: "system",
        content: "You are Claude, a helpful AI assistant...",
      },
      ...conversationMessages,
    ],
  }),
});


    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || `API Error: ${response.status}`
      );
    }

    const data = await response.json();
   return data.reply || "No response from backend";
  };

  const sendMessage = async () => {
   if (!input.trim()) return;


    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput("");
    setSidebarOpen(false); // Close sidebar on mobile after sending

    try {
      const conversationMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const responseContent = await callOpenAI(conversationMessages);

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      };

      // Add message without content first, then start typing effect
      const messageWithoutContent = { ...assistantMessage, content: "" };
      setMessages((prev) => [...prev, messageWithoutContent]);

      // Start typing effect
      typeWriterEffect(responseContent, assistantMessage.id, () => {
        // Update the message with full content when typing is done
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: responseContent }
              : msg
          )
        );

        // Check if response contains code after typing is complete
        const codeMatch = responseContent.match(
          /```(?:html|javascript|jsx|css|python|java|cpp|c|json|xml|sql)\n([\s\S]*?)```/
        );
        if (codeMatch) {
          setPreviewCode(codeMatch[1]);
          setShowPreview(true);
        }
      });
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message}. Please check your API key and try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("claude_clone_messages");
    setPreviewCode("");
    setShowPreview(false);
    setSidebarOpen(false);
  };

  const exportChat = () => {
    const chatData = {
      messages,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claude-clone-chat-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSidebarOpen(false);
  };

  const createProject = () => {
    if (!newProjectName.trim()) return;

    const newProject = {
      id: Date.now(),
      name: newProjectName,
      code: "",
      language: "javascript",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [...prev, newProject]);
    setCurrentProject(newProject);
    setProjectCode("");
    setNewProjectName("");
    setShowProjectModal(false);
    setCurrentView("projects");
    setSidebarOpen(false);
  };

  const selectProject = (project) => {
    setCurrentProject(project);
    setProjectCode(project.code);
    setCurrentView("projects");
    setSidebarOpen(false);
  };

  const saveProject = () => {
    if (!currentProject) return;

    const updatedProjects = projects.map((project) =>
      project.id === currentProject.id
        ? { ...project, code: projectCode, updatedAt: new Date().toISOString() }
        : project
    );

    setProjects(updatedProjects);
    setCurrentProject((prev) => ({
      ...prev,
      code: projectCode,
      updatedAt: new Date().toISOString(),
    }));
  };

  const deleteProject = (projectId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
      setProjectCode("");
      setCurrentView("chat");
    }
  };

  const addCodeToProject = (code) => {
    if (!currentProject) {
      // Create a new project if none exists
      const newProject = {
        id: Date.now(),
        name: `Project ${projects.length + 1}`,
        code: code,
        language: "javascript",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setProjects((prev) => [...prev, newProject]);
      setCurrentProject(newProject);
      setProjectCode(code);
      setCurrentView("projects");
    } else {
      // Add to existing project
      const newCode = projectCode
        ? `${projectCode}\n\n// Added from chat\n${code}`
        : code;
      setProjectCode(newCode);
      saveProject();
    }
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(""), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleCodeBlockClick = (codeContent) => {
    setPreviewCode(codeContent);
    setShowPreview(true);
  };

  const renderMessage = (message) => {
    // If this message is currently being typed, show the typing text
    if (typingMessageId === message.id) {
      const parts = typingText.split(/(```[\s\S]*?```)/);

      return (
        <div className="relative">
          {parts.map((part, index) => {
            if (part.startsWith("```")) {
              const languageMatch = part.match(/```(\w+)\n/);
              const language = languageMatch ? languageMatch[1] : "code";
              const codeContent = part
                .replace(/```\w*\n/, "")
                .replace(/```$/, "");

              return (
                <div
                  key={index}
                  className="bg-[#1a1625] rounded-xl p-4 my-3 overflow-x-auto border border-gray-700/30 cursor-pointer hover:border-blue-500/50 transition-all duration-200 group"
                  onClick={() => handleCodeBlockClick(codeContent)}
                  title="Click to view in preview panel"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-400 text-sm font-medium bg-gray-800/50 px-2 py-1 rounded-md group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-all duration-200">
                      {language} • Click to preview
                    </span>
                  </div>
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap leading-relaxed group-hover:text-green-300 transition-colors duration-200">
                    {codeContent}
                  </pre>
                </div>
              );
            }
            return (
              <span key={index} className="leading-relaxed">
                {part}
              </span>
            );
          })}
          {/* Typing cursor */}
          <span className="inline-block w-0.5 h-5 bg-blue-400 ml-1 animate-pulse"></span>
        </div>
      );
    }

    // Regular message rendering for completed messages
    const parts = message.content.split(/(```[\s\S]*?```)/);

    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const languageMatch = part.match(/```(\w+)\n/);
        const language = languageMatch ? languageMatch[1] : "code";
        const codeContent = part.replace(/```\w*\n/, "").replace(/```$/, "");
        const codeId = `${message.id}-${index}`;

        return (
          <div
            key={index}
            className="bg-[#1a1625] rounded-xl p-4 my-3 overflow-x-auto border border-gray-700/30 cursor-pointer hover:border-blue-500/50 transition-all duration-200 group"
            onClick={() => handleCodeBlockClick(codeContent)}
            title="Click to view in preview panel"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400 text-sm font-medium bg-gray-800/50 px-2 py-1 rounded-md group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-all duration-200">
                {language} • Click to preview
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addCodeToProject(codeContent);
                  }}
                  className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm transition-colors duration-200 hover:bg-green-500/10 px-2 py-1 rounded-md z-10"
                  title="Add to project"
                >
                  <FiPlus size={14} />
                  <span>Add</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(codeContent, codeId);
                  }}
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200 hover:bg-blue-500/10 px-2 py-1 rounded-md z-10"
                >
                  {copiedCode === codeId ? (
                    <FiCheck size={14} />
                  ) : (
                    <FiCopy size={14} />
                  )}
                  <span>{copiedCode === codeId ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>
            <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap leading-relaxed group-hover:text-green-300 transition-colors duration-200">
              {codeContent}
            </pre>
          </div>
        );
      }
      return (
        <span key={index} className="leading-relaxed">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#13101A] text-gray-100">
      <Head>
        <title>Sentora Copilot</title>
        <meta name="description" content="Sentora Copilot built with Next.js" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1625] rounded-2xl p-6 w-full max-w-md border border-gray-700/30 shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FiFolderPlus className="text-green-400" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-100">
                Create New Project
              </h2>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Create a new project to organize and work on your code. You can
              add code from chat messages or write directly in the project
              editor.
            </p>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Enter project name..."
              className="w-full px-4 py-3 bg-[#13101A] border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 mb-6 text-gray-100 placeholder-gray-500 transition-all duration-200"
              onKeyPress={(e) => e.key === "Enter" && createProject()}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowProjectModal(false);
                  setNewProjectName("");
                }}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-[#1a1625] rounded-lg border border-gray-700/30 text-gray-300 hover:text-white transition-colors duration-200"
        >
          {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>

        {/* Sidebar */}
        <div
          className={`
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          fixed lg:relative inset-y-0 left-0 z-20
          w-80 bg-[#1a1625] border-r border-gray-700/30 p-6 flex flex-col
        `}
        >
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8 pt-12 lg:pt-0">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <FiMessageSquare className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">Copilot by Sentora</h1>
              <p className="text-sm text-gray-400">AI Assistant</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setCurrentView("chat")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentView === "chat"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/30"
              }`}
            >
              <FiMessageSquare size={16} />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setCurrentView("projects")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentView === "projects"
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/30"
              }`}
            >
              <FiCode size={16} />
              <span>Projects</span>
            </button>
          </div>

          {/* Projects Section */}
          {currentView === "projects" && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300">
                  Your Projects
                </h3>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm transition-colors duration-200"
                >
                  <FiPlus size={14} />
                  <span>New</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiFolder size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No projects yet</p>
                    <p className="text-xs opacity-75">
                      Create your first project to get started
                    </p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                        currentProject?.id === project.id
                          ? "bg-green-500/10 border-green-500/30 text-green-300"
                          : "bg-gray-800/30 border-gray-700/30 text-gray-300 hover:bg-gray-700/50"
                      }`}
                      onClick={() => selectProject(project)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <FiFolder size={14} />
                          <span className="text-sm font-medium truncate">
                            {project.name}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(project.id);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200 p-1 opacity-0 group-hover:opacity-100"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          <div className="space-y-3 mb-8">
            <button
              onClick={clearChat}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all duration-200 border border-red-500/20 group"
            >
              <FiTrash2
                size={18}
                className="group-hover:scale-110 transition-transform duration-200"
              />
              <span className="font-medium">Clear Chat</span>
            </button>

            <button
              onClick={exportChat}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all duration-200 border border-blue-500/20 group"
            >
              <FiDownload
                size={18}
                className="group-hover:scale-110 transition-transform duration-200"
              />
              <span className="font-medium">Export Chat</span>
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl transition-all duration-200 border border-green-500/20 group disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!previewCode}
            >
              {showPreview ? (
                <FiEyeOff
                  size={18}
                  className="group-hover:scale-110 transition-transform duration-200"
                />
              ) : (
                <FiEye
                  size={18}
                  className="group-hover:scale-110 transition-transform duration-200"
                />
              )}
              <span className="font-medium">
                {showPreview ? "Hide Preview" : "Show Preview"}
              </span>
            </button>

        
          </div>

          {/* Stats */}
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30 mt-auto">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Session Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Messages:</span>
                <span className="text-gray-200 font-medium">
                  {messages.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Storage:</span>
                <span className="text-gray-200 font-medium">Local</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">API Status:</span>
               <span className="font-medium text-green-400">✅ Connected (Backend)</span>

              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-10"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-20 max-w-2xl mx-auto">
                <div className="mb-8">
                  <div className="inline-flex p-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl mb-4">
                    <FiMessageSquare size={48} className="text-blue-400" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold mb-4 text-gray-200">
                  Welcome to Sentora Copilot
                </h2>
                <p className="text-lg mb-2">
                  Start a conversation by typing a message below.
                </p>
                <p className="text-sm opacity-75">
                  Try asking me to generate some code, write content, or help
                  with analysis!
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-4xl px-6 py-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "bg-[#1a1625] border border-gray-700/30 text-gray-100"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {message.role === "assistant"
                        ? renderMessage(message)
                        : message.content}
                    </div>
                    <div
                      className={`text-xs mt-3 ${
                        message.role === "user"
                          ? "text-blue-200"
                          : "text-gray-500"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1625] border border-gray-700/30 rounded-2xl px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-gray-300">Nexline is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-700/30 bg-[#1a1625] p-4 lg:p-6">
            <div className="flex space-x-4 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && !loading && apiKey && sendMessage()
                  }
                  placeholder="Message Nexline..."
                  className="w-full px-6 py-4 bg-[#13101A] border border-gray-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-100 placeholder-gray-500 transition-all duration-200 pr-14"
                    disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disableddisabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  <FiSend size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Code Preview Panel */}
        {showPreview && (previewCode || projectCode) && (
          <div className="hidden lg:flex w-96 bg-[#1a1625] border-l border-gray-700/30 flex-col h-full">
            <div className="p-4 border-b border-gray-700/30 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiEye className="text-green-400" size={20} />
                  <h3 className="font-semibold text-gray-100">
                    {currentView === "projects" && currentProject
                      ? "Project Preview"
                      : "Code Preview"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 hover:bg-gray-700/30 rounded-lg transition-colors duration-200"
                >
                  <FiX
                    className="text-gray-400 hover:text-gray-200"
                    size={18}
                  />
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 p-4 min-h-0">
                <div className="bg-[#13101A] rounded-xl p-4 h-full border border-gray-700/30 overflow-auto">
                  <pre className="text-green-400 text-xs font-mono leading-relaxed break-words whitespace-pre-wrap overflow-wrap-anywhere">
                    {currentView === "projects" && currentProject
                      ? projectCode
                      : previewCode}
                  </pre>
                </div>
              </div>
              <div className="p-4 border-t border-gray-700/30 flex-shrink-0">
                <button
                  onClick={() =>
                    copyToClipboard(
                      currentView === "projects" && currentProject
                        ? projectCode
                        : previewCode,
                      "preview"
                    )
                  }
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg text-sm"
                >
                  {copiedCode === "preview" ? (
                    <FiCheck size={16} />
                  ) : (
                    <FiCopy size={16} />
                  )}
                  <span>
                    {copiedCode === "preview" ? "Copied!" : "Copy Code"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
