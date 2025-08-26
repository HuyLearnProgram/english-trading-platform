import React from 'react';
import { listConsultations } from '../../apis/consultation';
import { toast } from 'react-toastify';

export default function AdminOverview() {
  const [stats, setStats] = React.useState({
    total: 0, new: 0, contacted: 0, scheduled: 0, done: 0, canceled: 0
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const [all, sNew, sContacted, sScheduled, sDone, sCanceled] = await Promise.all([
          listConsultations({ limit: 1 }),
          listConsultations({ status: 'new', limit: 1 }),
          listConsultations({ status: 'contacted', limit: 1 }),
          listConsultations({ status: 'scheduled', limit: 1 }),
          listConsultations({ status: 'done', limit: 1 }),
          listConsultations({ status: 'canceled', limit: 1 }),
        ]);
        setStats({
          total: all.data?.meta?.total || 0,
          new: sNew.data?.meta?.total || 0,
          contacted: sContacted.data?.meta?.total || 0,
          scheduled: sScheduled.data?.meta?.total || 0,
          done: sDone.data?.meta?.total || 0,
          canceled: sCanceled.data?.meta?.total || 0,
        });
      } catch (e) {
        toast.error('Không tải được thống kê');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="admin-loading">Đang tải…</div>;

  const Card = ({ title, value, tone }) => (
    <div className={`kpi ${tone}`}>
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );

  return (
    <div className="admin-page">
      <h1 className="admin-title">Tổng quan</h1>
      <div className="kpi-row">
        <Card title="Tổng yêu cầu" value={stats.total} tone="blue" />
        <Card title="Mới" value={stats.new} tone="green" />
        <Card title="Đã liên hệ" value={stats.contacted} tone="amber" />
        <Card title="Đã đặt lịch" value={stats.scheduled} tone="violet" />
        <Card title="Hoàn tất" value={stats.done} tone="gray" />
        <Card title="Huỷ" value={stats.canceled} tone="red" />
      </div>
    </div>
  );
}
