import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Clock, User, Reply, Trash2, Home, Send, CheckCircle2, Clock as ClockIcon } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';

const Send_Mail = () => {
  const [side, setSide] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [emailStats, setEmailStats] = useState({ totalMessages: 0, newMessages: 0, repliedMessages: 0 });
  const [loading, setLoading] = useState(true);
  const [messagePage, setMessagePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [messagePagination, setMessagePagination] = useState({ totalPages: 1 });
  const [userPagination, setUserPagination] = useState({ totalPages: 1 });
  const [replyData, setReplyData] = useState({ subject: '', message: '', toEmail: '' });
  const [userEmailData, setUserEmailData] = useState({ subject: '', message: '', userId: '' });
  const [currentMessage, setCurrentMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [sendingUserEmail, setSendingUserEmail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [quickSendData, setQuickSendData] = useState({ toEmail: '', subject: '', message: '' });
  const [sendingQuickEmail, setSendingQuickEmail] = useState(false);

  const navigate = useNavigate();
  const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://www.spiritueelchatten.nl';
  const ITEMS_PER_PAGE = 10;

  const user = {
    name: "User",
    email: "user@gmail.com",
    profile: "https://avatars.mds.yandex.net/i?id=93f523ab7f890b9175f222cd947dc36ccbd81bf7-9652646-images-thumbs&n=13"
  };

  // Handle homepage redirect
  const handleHomepageRedirect = () => {
    window.open(WEBSITE_URL, '_blank');
  };

  // Fetch all messages with pagination
  const fetchMessages = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/messages`, {
        params: { page, limit: ITEMS_PER_PAGE }
      });
      setMessages(response.data.data || []);
      setMessagePagination(response.data.pagination || { totalPages: 1 });
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users with pagination
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/users`, {
        params: { page, limit: ITEMS_PER_PAGE }
      });
      setUsers(response.data.data || []);
      setUserPagination(response.data.pagination || { totalPages: 1 });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch email statistics
  const fetchEmailStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/users/stats`);
      setEmailStats(response.data.data || { totalMessages: 0, newMessages: 0, repliedMessages: 0 });
    } catch (error) {
      console.error('Error fetching email stats:', error);
      toast.error('Failed to fetch email stats');
    }
  };

  useEffect(() => {
    fetchMessages(messagePage);
    fetchUsers(userPage);
    fetchEmailStats();
  }, [messagePage, userPage]);

  // Get reply status for a message
  const getReplyStatus = (message) => {
    if (!message || !message.hasReplied) {
      return { replied: false, repliedAt: null, replyContent: null };
    }
    return { replied: true, repliedAt: message.repliedAt, replyContent: message.replyContent };
  };

  // Format reply status display for messages
  const renderReplyStatus = (message) => {
    const status = getReplyStatus(message);
    if (!status.replied) {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <ClockIcon className="h-3 w-3" />
          <span>Pending Reply</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
        <CheckCircle2 className="h-3 w-3" />
        <span>Replied</span>
        <span className="text-gray-500 ml-1">{format(new Date(status.repliedAt), 'MMM dd')}</span>
      </div>
    );
  };

  // Format reply status for users
  const renderUserReplyStatus = (user) => {
    if (user.repliedMessages > 0) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Replied
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        <ClockIcon className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  // Handle reply
  const handleReply = async () => {
    if (!replyData.message.trim()) {
      toast.error('Please enter a reply message');
      return;
    }
    try {
      setSendingReply(true);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/messages/reply`, {
        toEmail: replyData.toEmail,
        subject: replyData.subject,
        message: replyData.message,
        messageId: currentMessage._id
      });
      if (response.data.success) {
        toast.success('Reply sent successfully!');
        setReplyData({ subject: '', message: '', toEmail: '' });
        setCurrentMessage(null);
        setIsEditing(false);
        fetchMessages(messagePage);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/messages/${messageId}`);
      toast.success('Message deleted successfully');
      fetchMessages(messagePage);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Open reply dialog
  const openReplyDialog = (message) => {
    setCurrentMessage(message);
    setIsEditing(false);
    setReplyData({
      toEmail: message.email,
      subject: `Re: ${message.name}'s Message`,
      message: ''
    });
  };

  // Handle quick send email
  const handleQuickSend = async (e) => {
    e.preventDefault();
    const { toEmail, subject, message } = quickSendData;
    if (!toEmail.trim() || !subject.trim() || !message.trim()) {
      toast.error('All fields are required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      setSendingQuickEmail(true);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/messages/quick-send`, {
        toEmail,
        subject,
        message
      });
      if (response.data.success) {
        toast.success('Email sent successfully!');
        setQuickSendData({ toEmail: '', subject: '', message: '' });
      }
    } catch (error) {
      console.error('Error sending quick email:', error);
      toast.error(error.response?.data?.error || 'Failed to send email');
    } finally {
      setSendingQuickEmail(false);
    }
  };

  // Handle send email to user
  const handleSendUserEmail = async () => {
    if (!userEmailData.message.trim() || !userEmailData.subject.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    try {
      setSendingUserEmail(true);
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/users/send-email`, {
        userId: currentUser._id,
        subject: userEmailData.subject,
        message: userEmailData.message
      });
      if (response.data.success) {
        toast.success('Email sent successfully!');
        setUserEmailData({ subject: '', message: '', userId: '' });
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error sending user email:', error);
      toast.error('Failed to send email');
    } finally {
      setSendingUserEmail(false);
    }
  };

  // Open user email dialog
  const openUserEmailDialog = (user) => {
    setCurrentUser(user);
    setUserEmailData({
      userId: user._id,
      subject: `Message for ${user.name}`,
      message: ''
    });
  };

  if (loading) {
    return (
      <div>
        <Dashboard_Navbar side={side} setSide={setSide} user={user}/>
        <div className="dashboard-wrapper">
          <Doctor_Side_Bar side={side} setSide={setSide} user={user}/>
          <div className="dashboard-side min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Dashboard_Navbar side={side} setSide={setSide} user={user}/>
      <div className="dashboard-wrapper flex">
        <Doctor_Side_Bar side={side} setSide={setSide} user={user}/>
        <div className="dashboard-side flex-1 min-h-screen p-4 md:p-6">
          <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 rounded-lg shadow-sm">
            
            <div className="text-center flex-1">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold text-gray-800">
                Admin Communications
              </h2>
              <p className="text-sm text-gray-500 mt-1">Manage user messages and numerology reports</p>
            </div>
            <div className="w-6"></div> {/* Spacer for alignment */}
          </div>

          <div className="mx-2 md:mx-4 mt-6">
            <Tabs defaultValue="messages" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-lg p-1">
                <TabsTrigger value="messages" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Messages
                </TabsTrigger>
                <TabsTrigger value="users" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Numerology Reports
                </TabsTrigger>
              </TabsList>

              {/* Messages Tab */}
              <TabsContent value="messages">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-purple-600" />
                      <div>
                        <CardTitle className="text-xl font-semibold">Inbox Messages</CardTitle>
                        <CardDescription className="text-sm">
                          {emailStats.totalMessages} message{emailStats.totalMessages !== 1 ? 's' : ''} received
                          <div className="text-xs text-green-600 mt-1">
                            • {emailStats.newMessages} new • {emailStats.repliedMessages} replied
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                        <p className="text-gray-500">Messages from users will appear here.</p>
                        <Button variant="outline" onClick={handleHomepageRedirect} className="mt-4 hover:bg-purple-50">
                          <Home className="h-4 w-4 mr-2" />
                          Visit Homepage
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-b border-gray-200">
                                <TableHead className="text-gray-700 font-semibold">Sender</TableHead>
                                <TableHead className="text-gray-700 font-semibold">Email</TableHead>
                                <TableHead className="text-gray-700 font-semibold">Message Preview</TableHead>
                                <TableHead className="text-gray-700 font-semibold">Date</TableHead>
                                <TableHead className="text-gray-700 font-semibold text-center">Status</TableHead>
                                <TableHead className="text-gray-700 font-semibold text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {messages.map((message) => {
                                const replyStatus = getReplyStatus(message);
                                return (
                                  <TableRow key={message._id} className="hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                          <User className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900">{message.name}</p>
                                          <p className="text-sm text-gray-500">From {message.email}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-mono text-sm text-gray-900">{message.email}</div>
                                      <div className="mt-1">{renderReplyStatus(message)}</div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="max-w-md">
                                        <p className="text-sm text-gray-900 line-clamp-2">{message.message}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm text-gray-500">
                                        <Clock className="h-4 w-4 inline mr-1" />
                                        {format(new Date(message.createdAt), 'MMM dd, yyyy')}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {replyStatus.replied ? (
                                        <Badge variant="default" className="bg-green-100 text-green-800">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Replied
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                          <ClockIcon className="h-3 w-3 mr-1" />
                                          Pending
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex gap-2 justify-end">
                                        <Dialog open={currentMessage?._id === message._id}>
                                          <DialogTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="hover:bg-purple-50"
                                              onClick={() => openReplyDialog(message)}
                                            >
                                              <Reply className="h-4 w-4 mr-1" />
                                              {replyStatus.replied ? 'View Reply' : 'Reply'}
                                            </Button>
                                          </DialogTrigger>
                                          {currentMessage?._id === message._id && (
                                            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col bg-white rounded-lg shadow-xl">
                                              <DialogHeader className="flex-shrink-0">
                                                <DialogTitle className="text-lg font-semibold">Reply to {currentMessage.name}</DialogTitle>
                                                <DialogDescription className="text-sm text-gray-500">
                                                  Replying to: {currentMessage.email}
                                                </DialogDescription>
                                              </DialogHeader>
                                              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                                                <Card className="bg-gray-50 border-gray-200">
                                                  <CardContent className="pt-4">
                                                    <div className="flex items-start gap-3 mb-3">
                                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <User className="h-4 w-4 text-blue-600" />
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <span className="font-medium text-sm text-gray-900">{currentMessage.name}</span>
                                                          <Badge variant="secondary" className="text-xs bg-gray-200">Original</Badge>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mb-2">
                                                          {format(new Date(currentMessage.createdAt), 'MMM dd, yyyy HH:mm')}
                                                        </p>
                                                        <p className="text-sm whitespace-pre-wrap text-gray-900">{currentMessage.message}</p>
                                                      </div>
                                                    </div>
                                                  </CardContent>
                                                </Card>
                                                {getReplyStatus(currentMessage)?.replied && !isEditing && (
                                                  <Card className="bg-green-50 border-green-200">
                                                    <CardContent className="pt-4">
                                                      <div className="flex items-start gap-3 mb-3">
                                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                          <Reply className="h-4 w-4 text-green-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                          <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-sm text-gray-900">Your Reply</span>
                                                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">Sent</Badge>
                                                          </div>
                                                          <p className="text-xs text-gray-500 mb-2">
                                                            {format(new Date(getReplyStatus(currentMessage).repliedAt), 'MMM dd, yyyy HH:mm')}
                                                          </p>
                                                          <p className="text-sm whitespace-pre-wrap text-green-800">{getReplyStatus(currentMessage).replyContent}</p>
                                                        </div>
                                                      </div>
                                                    </CardContent>
                                                  </Card>
                                                )}
                                                {(!getReplyStatus(currentMessage)?.replied || isEditing) && (
                                                  <div className="space-y-3">
                                                    <div className="space-y-1">
                                                      <Label htmlFor="replySubject" className="text-sm font-medium">Subject</Label>
                                                      <Input
                                                        id="replySubject"
                                                        type="text"
                                                        value={replyData.subject}
                                                        onChange={(e) => setReplyData({ ...replyData, subject: e.target.value })}
                                                        placeholder="Re: Your message"
                                                        className="w-full border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                                                      />
                                                    </div>
                                                    <div className="space-y-1">
                                                      <Label htmlFor="replyMessage" className="text-sm font-medium">Your Reply</Label>
                                                      <Textarea
                                                        id="replyMessage"
                                                        value={replyData.message}
                                                        onChange={(e) => setReplyData({ ...replyData, message: e.target.value })}
                                                        placeholder="Type your reply here..."
                                                        rows={6}
                                                        className="w-full resize-none border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                                                      />
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                              <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
                                                <Button
                                                  variant="outline"
                                                  onClick={() => {
                                                    setCurrentMessage(null);
                                                    setReplyData({ subject: '', message: '', toEmail: '' });
                                                    setIsEditing(false);
                                                  }}
                                                  className="mr-2 border-gray-300 hover:bg-gray-100"
                                                >
                                                  {getReplyStatus(currentMessage)?.replied && !isEditing ? 'Close' : 'Cancel'}
                                                </Button>
                                                {(!getReplyStatus(currentMessage)?.replied || isEditing) && (
                                                  <Button
                                                    variant="purple"
                                                    onClick={handleReply}
                                                    disabled={sendingReply || !replyData.message.trim()}
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                  >
                                                    {sendingReply ? (
                                                      <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                        Sending...
                                                      </>
                                                    ) : (
                                                      isEditing ? 'Update Reply' : 'Send Reply'
                                                    )}
                                                  </Button>
                                                )}
                                              </DialogFooter>
                                            </DialogContent>
                                          )}
                                        </Dialog>
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          className="hover:bg-red-600"
                                          onClick={() => handleDeleteMessage(message._id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <Button
                            disabled={messagePage === 1}
                            onClick={() => setMessagePage(prev => prev - 1)}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-gray-600">Page {messagePage} of {messagePagination.totalPages}</span>
                          <Button
                            disabled={messagePage === messagePagination.totalPages}
                            onClick={() => setMessagePage(prev => prev + 1)}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Next
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="mt-6 border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <Send className="h-5 w-5 text-green-600" />
                      <div>
                        <CardTitle className="text-xl font-semibold">Quick Send Email</CardTitle>
                        <CardDescription className="text-sm">Send a new email to any user</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form className="space-y-4" onSubmit={handleQuickSend}>
                      <div className="space-y-2">
                        <Label htmlFor="quickEmail" className="text-sm font-medium">Email Address <span className="text-red-500">*</span></Label>
                        <Input
                          id="quickEmail"
                          type="email"
                          placeholder="user@example.com"
                          value={quickSendData.toEmail}
                          onChange={(e) => setQuickSendData({ ...quickSendData, toEmail: e.target.value })}
                          className="w-full border-gray-300 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quickSubject" className="text-sm font-medium">Subject <span className="text-red-500">*</span></Label>
                        <Input
                          id="quickSubject"
                          type="text"
                          placeholder="Enter email subject"
                          value={quickSendData.subject}
                          onChange={(e) => setQuickSendData({ ...quickSendData, subject: e.target.value })}
                          className="w-full border-gray-300 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quickMessage" className="text-sm font-medium">Message <span className="text-red-500">*</span></Label>
                        <Textarea
                          id="quickMessage"
                          placeholder="Type your message here..."
                          rows={4}
                          value={quickSendData.message}
                          onChange={(e) => setQuickSendData({ ...quickSendData, message: e.target.value })}
                          className="w-full resize-none border-gray-300 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="purple"
                        className="w-full bg-[#3B5EB7] hover:bg-blue-900"
                        disabled={sendingQuickEmail}
                      >
                        {sendingQuickEmail ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Email
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Numerology Reports Tab */}
              <TabsContent value="users">
                <Card className="border-none shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-indigo-600" />
                      <div>
                        <CardTitle className="text-xl font-semibold">Numerology Reports</CardTitle>
                        <CardDescription className="text-sm">
                          {users.length} user{users.length !== 1 ? 's' : ''} Generated Numerology Report
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {users.length === 0 ? (
                      <div className="text-center py-12">
                        <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
                        <p className="text-gray-500">Users who have generated numerology reports will appear here.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-b border-gray-200">
                                <TableHead className="text-gray-700 font-semibold">Name</TableHead>
                                <TableHead className="text-gray-700 font-semibold">Email</TableHead>
                                <TableHead className="text-gray-700 font-semibold">Date of Birth</TableHead>
                                <TableHead className="text-gray-700 font-semibold text-center">Replied</TableHead>
                                <TableHead className="text-gray-700 font-semibold text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {users.map((user) => (
                                <TableRow key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                  <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                                  <TableCell>
                                    <div className="font-mono text-sm text-gray-900">{user.email}</div>
                                  </TableCell>
                                  <TableCell className="text-gray-700">{format(new Date(user.dob), 'MMM dd, yyyy')}</TableCell>
                                  <TableCell className="text-center">
                                    {renderUserReplyStatus(user)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Dialog open={currentUser?._id === user._id}>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="hover:bg-indigo-50 border-indigo-300 text-indigo-700"
                                          onClick={() => openUserEmailDialog(user)}
                                        >
                                          <Send className="h-4 w-4 mr-1" />
                                          Send Email
                                        </Button>
                                      </DialogTrigger>
                                      {currentUser?._id === user._id && (
                                        <DialogContent className="sm:max-w-[500px] bg-white rounded-lg shadow-xl">
                                          <DialogHeader>
                                            <DialogTitle className="text-lg font-semibold">Send Email to {currentUser.name}</DialogTitle>
                                            <DialogDescription className="text-sm text-gray-500">
                                              Email: {currentUser.email}
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-3">
                                            <div className="space-y-1">
                                              <Label htmlFor="userSubject" className="text-sm font-medium">Subject</Label>
                                              <Input
                                                id="userSubject"
                                                type="text"
                                                value={userEmailData.subject}
                                                onChange={(e) => setUserEmailData({ ...userEmailData, subject: e.target.value })}
                                                placeholder="Enter subject"
                                                className="w-full border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label htmlFor="userMessage" className="text-sm font-medium">Message</Label>
                                              <Textarea
                                                id="userMessage"
                                                value={userEmailData.message}
                                                onChange={(e) => setUserEmailData({ ...userEmailData, message: e.target.value })}
                                                placeholder="Type your message here..."
                                                rows={6}
                                                className="w-full resize-none border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                              />
                                            </div>
                                          </div>
                                          <DialogFooter className="border-t pt-4 mt-4">
                                            <Button
                                              variant="outline"
                                              onClick={() => setCurrentUser(null)}
                                              className="mr-2 border-gray-300 hover:bg-gray-100"
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              variant="purple"
                                              onClick={handleSendUserEmail}
                                              disabled={sendingUserEmail || !userEmailData.message.trim() || !userEmailData.subject.trim()}
                                              className="bg-indigo-600 hover:bg-indigo-700"
                                            >
                                              {sendingUserEmail ? (
                                                <>
                                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                  Sending...
                                                </>
                                              ) : (
                                                'Send Email'
                                              )}
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      )}
                                    </Dialog>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <Button
                            disabled={userPage === 1}
                            onClick={() => setUserPage(prev => prev - 1)}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-gray-600">Page {userPage} of {userPagination.totalPages}</span>
                          <Button
                            disabled={userPage === userPagination.totalPages}
                            onClick={() => setUserPage(prev => prev + 1)}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Next
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Send_Mail;