import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, Check, CheckCheck, Loader2, Sparkles, AlertCircle, CreditCard, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const notificationIcons: Record<string, React.ReactNode> = {
  job_completed: <Sparkles className="w-4 h-4 text-green-500" />,
  job_failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  credits_debited: <CreditCard className="w-4 h-4 text-orange-500" />,
  credits_credited: <Zap className="w-4 h-4 text-green-500" />,
  payment_completed: <CreditCard className="w-4 h-4 text-green-500" />,
  subscription_updated: <Bell className="w-4 h-4 text-blue-500" />,
  system: <Bell className="w-4 h-4 text-gray-500" />,
};

const notificationTitles: Record<string, string> = {
  job_completed: 'Job Concluído',
  job_failed: 'Job Falhou',
  credits_debited: 'Dracmas Debitados',
  credits_credited: 'Dracmas Creditados',
  payment_completed: 'Pagamento Aprovado',
  subscription_updated: 'Assinatura Atualizada',
  system: 'Notificação do Sistema',
};

export function NotificationList() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, isMarkingAllAsRead } = useNotifications();

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error: any) {
      toast.error('Erro ao marcar notificação como lida', {
        description: error?.message || 'Tente novamente mais tarde.',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error: any) {
      toast.error('Erro ao marcar todas como lidas', {
        description: error?.message || 'Tente novamente mais tarde.',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Notificações</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Marcar todas como lidas
                </>
              )}
            </Button>
          )}
        </div>
        <CardDescription>
          Acompanhe o status de seus jobs, Dracmas e eventos importantes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma notificação ainda</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                    !notification.read_at ? 'bg-muted/30 border-primary/20' : ''
                  }`}
                  onClick={() => !notification.read_at && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {notificationIcons[notification.type] || <Bell className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {notificationTitles[notification.type] || 'Notificação'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                          {notification.payload?.message && (
                            <p className="text-sm mt-2">{notification.payload.message}</p>
                          )}
                          {notification.payload?.jobId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Job ID: {notification.payload.jobId}
                            </p>
                          )}
                        </div>
                        {!notification.read_at && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

