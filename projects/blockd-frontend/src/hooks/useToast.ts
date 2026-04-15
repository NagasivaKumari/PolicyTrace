import toast from 'react-hot-toast';

export const useToast = () => ({
  success: (msg: string) => toast.success(msg, {
    id: msg,
    style: { background: '#12102A', color: '#F1F0FF', border: '1px solid rgba(139,92,246,0.35)' },
  }),
  error: (msg: string) => toast.error(msg, {
    id: msg,
    style: { background: '#12102A', color: '#F87171', border: '1px solid rgba(239,68,68,0.35)' },
  }),
  loading: (msg: string) => toast.loading(msg, {
    id: msg,
    style: { background: '#12102A', color: '#A09DC0', border: '1px solid rgba(139,92,246,0.15)' },
  }),
  dismiss: (id?: string) => toast.dismiss(id),
});
