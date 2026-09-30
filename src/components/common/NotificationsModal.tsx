import React from 'react';
import { Bell, CheckCheck, X, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';
import { NotificationItem, User } from '../../types';
import { storage } from '../../services/storageService';

interface NotificationsModalProps {
  currentUser: User;
  onClose: () => void;
  onRefresh: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ 
  currentUser, 
  onClose,
  onRefresh 
}) => {
  const allNotifs = storage.getNotifications();
  const myNotifs = allNotifs.filter(n => n.userId === currentUser.id || n.userId === 'all');

  const handleMarkAllRead = () => {
    storage.markAllNotificationsAsRead(currentUser.id);
    onRefresh();
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Notificações do Sistema</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar lidas
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
          {myNotifs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhuma notificação no momento.
            </div>
          ) : (
            myNotifs.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 text-xs transition-colors ${
                  !n.read ? 'bg-sky-50/40 font-medium' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {n.type === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  {n.type === 'success' && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {n.type === 'alert' && (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  {n.type === 'info' && (
                    <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(n.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
