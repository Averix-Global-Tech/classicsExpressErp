import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import grievanceService from '../../services/grievanceService';
import { useToast } from '../../context/ToastContext';
import { Spinner, Button, Card, Badge } from '../../components/ui';
import { User, Clock, FileText, Send, AlertCircle, MessageSquare } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function GrievanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN].includes(user?.role);
  
  const [grievance, setGrievance] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Reply form
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyFiles, setReplyFiles] = useState([]);
  const [submittingReply, setSubmittingReply] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchDetails = async () => {
    try {
      const res = await grievanceService.getDetails(id);
      setGrievance(res.grievance);
      setMessages(res.messages);
    } catch (err) {
      showToast(err.message || 'Failed to fetch details', 'error');
      navigate('/grievance/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText || replyText === '<p><br></p>') {
      showToast('Message cannot be empty', 'error');
      return;
    }
    
    setSubmittingReply(true);
    try {
      const formData = new FormData();
      formData.append('message', replyText);
      formData.append('isInternalNote', isInternalNote);
      replyFiles.forEach(f => formData.append('attachments', f));
      
      const res = await grievanceService.addReply(id, formData);
      setMessages([...messages, res.reply]);
      setReplyText('');
      setReplyFiles([]);
      setIsInternalNote(false);
      
      // Refresh grievance to get new status if it auto-updated
      const updatedDetails = await grievanceService.getDetails(id);
      setGrievance(updatedDetails.grievance);
      
    } catch (err) {
      showToast(err.message || 'Failed to send reply', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      let payload = { status: newStatus };
      if (newStatus === 'Rejected') {
        const reason = window.prompt("Please provide a rejection reason:");
        if (!reason) return;
        payload.rejectionReason = reason;
      }
      const res = await grievanceService.updateStatus(id, payload);
      setGrievance(res.grievance);
      showToast(`Status updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleFeedback = async (isResolved) => {
    try {
      let payload = { resolved: isResolved };
      if (isResolved) {
        payload.rating = 5; // Simplified for MVP
        payload.feedback = window.prompt("Any final comments?") || '';
      } else {
        payload.feedback = window.prompt("Why wasn't it resolved?") || 'Not resolved';
      }
      const res = await grievanceService.submitFeedback(id, payload);
      setGrievance(res.grievance);
      showToast(isResolved ? 'Ticket Closed' : 'Ticket Reopened', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit feedback', 'error');
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  if (!grievance) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{grievance.ticketNumber}</h1>
            <Badge>
              {grievance.status}
            </Badge>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 mt-1">{grievance.subject}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {isAdmin && grievance.status !== 'Closed' && grievance.status !== 'Resolved' && grievance.status !== 'Rejected' && (
            <>
              <Button variant="outline" onClick={() => handleStatusChange('In Progress')} className="text-blue-600">Mark In Progress</Button>
              <Button variant="outline" onClick={() => handleStatusChange('Resolved')} className="text-green-600">Mark Resolved</Button>
              <Button variant="outline" onClick={() => handleStatusChange('Rejected')} className="text-red-600">Reject</Button>
            </>
          )}
          {!isAdmin && grievance.status === 'Resolved' && (
            <>
              <Button onClick={() => handleFeedback(true)} className="bg-green-600 hover:bg-green-700">Accept Resolution (Close)</Button>
              <Button onClick={() => handleFeedback(false)} className="bg-red-600 hover:bg-red-700">Not Resolved (Reopen)</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Initial Ticket Description */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{grievance.employee.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(grievance.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div 
              className="prose max-w-none text-sm text-slate-700 dark:text-slate-300" 
              dangerouslySetInnerHTML={{ __html: grievance.description }} 
            />

            {grievance.attachments?.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Attachments</p>
                <div className="flex flex-wrap gap-2">
                  {grievance.attachments.map((file, i) => (
                    <a key={i} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-navy-800 rounded-md hover:bg-slate-200 transition-colors">
                      <FileText size={14} className="text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-medium text-blue-600">{file.filename}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Timeline of Messages */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-2">Timeline</h3>
            
            {messages.map((msg) => {
              const isOwner = msg.sender._id === user._id;
              return (
                <div key={msg._id} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-4 shadow-sm border ${
                    msg.isInternalNote ? 'bg-amber-50 border-amber-200' : 
                    isOwner ? 'bg-blue-50 border-blue-100' : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700'
                  }`}>
                    
                    <div className="flex items-center justify-between mb-2 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{msg.sender.name}</span>
                        {msg.isInternalNote && <Badge className="bg-amber-100 text-amber-800 text-[10px]">Internal Note</Badge>}
                      </div>
                      <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    
                    <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: msg.message }} />
                    
                    {msg.attachments?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-700/60 flex flex-wrap gap-2">
                        {msg.attachments.map((file, i) => (
                          <a key={i} href={file.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <FileText size={12} /> {file.filename}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Box */}
          {grievance.status !== 'Closed' && grievance.status !== 'Rejected' && (
            <Card className="p-4 bg-slate-50 dark:bg-navy-900/50 border-slate-200 dark:border-navy-700 mt-4">
              <form onSubmit={handleReply}>
                <div className="h-32 mb-12">
                  <ReactQuill theme="snow" value={replyText} onChange={setReplyText} className="h-full bg-white dark:bg-navy-900" placeholder="Type your reply here..." />
                </div>
                
                <div className="flex items-center justify-between mt-2 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <input type="file" multiple onChange={(e) => setReplyFiles(Array.from(e.target.files || []))} className="text-xs" />
                    {isAdmin && (
                      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={isInternalNote} onChange={(e) => setIsInternalNote(e.target.checked)} className="rounded text-blue-600" />
                        Internal Note (Hidden from Employee)
                      </label>
                    )}
                  </div>
                  
                  <Button type="submit" disabled={submittingReply} className="gap-2 bg-blue-600">
                    {submittingReply ? <Spinner size={16} /> : <><Send size={16} /> Send Reply</>}
                  </Button>
                </div>
              </form>
            </Card>
          )}

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Ticket Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between pb-2 border-b">
                <span className="text-slate-500 dark:text-slate-400">Category</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{grievance.category}</span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-slate-500 dark:text-slate-400">Priority</span>
                <Badge>{grievance.priority}</Badge>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-slate-500 dark:text-slate-400">Assigned To</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{grievance.assignedTo ? grievance.assignedTo.name : 'Unassigned'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b">
                <span className="text-slate-500 dark:text-slate-400">SLA Due</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {grievance.expectedResolutionDate ? new Date(grievance.expectedResolutionDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          {grievance.rejectionReason && (
            <Card className="p-5 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                <AlertCircle size={18} /> Rejection Reason
              </div>
              <p className="text-sm text-red-600">{grievance.rejectionReason}</p>
            </Card>
          )}

          {isAdmin && (
            <Card className="p-5">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 text-sm uppercase tracking-wider">Audit Log</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {grievance.auditLog.map((log, i) => (
                  <div key={i} className="flex gap-3 text-xs border-l-2 border-slate-200 dark:border-navy-700 pl-3">
                    <div className="text-slate-400 mt-0.5"><Clock size={12} /></div>
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{log.action}</p>
                      <p className="text-slate-500 dark:text-slate-400">{log.modifiedBy?.name}</p>
                      {log.details && <p className="text-slate-500 dark:text-slate-400 italic">{log.details}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
