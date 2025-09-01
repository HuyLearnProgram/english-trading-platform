// src/pages/guest/OrderPage.jsx
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '@styles/order/OrderPage.css';
import { apiGetTeacherOrderOptions } from '@apis/teacher';
import { apiPurchaseEnrollment } from '@apis/enrollment';
import { AuthContext } from '@contexts/AuthContext';
import { formatWeeks } from '@utils/constants';

// Components (mới tách)
import TeacherHeaderOrder from '@components/order/TeacherHeaderOrder';
import LessonsPerWeekSelector from '@components/order/LessonsPerWeekSelector';
import SlotSection from '@components/order/SlotSection';
import PackageGrid from '@components/order/PackageGrid';
import TimeEstimateBox from '@components/order/TimeEstimateBox';
import PriceSummaryBox from '@components/order/PriceSummaryBox';

export default function OrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext) || {};
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [selectedHours, setSelectedHours] = useState(30);
  const [lessonsPerWeek, setLessonsPerWeek] = useState(1);
  const [picked, setPicked] = useState([]); // ['mon 09:00-10:00', ...]
  const [coupon, setCoupon] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await apiGetTeacherOrderOptions(id);
        if (!mounted) return;
        setData(data);
        const def = Math.max(1, Math.min(2, data.maxLessonsPerWeek || 1));
        setLessonsPerWeek(def);
      } catch (err) {
        console.error(err);
        setErrorMsg(err?.response?.data?.message || 'Không tải được dữ liệu gói học.');
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const pkg = useMemo(() => {
    if (!data) return null;
    return data.packages.find((p) => p.hours === selectedHours) || data.packages[0];
  }, [data, selectedHours]);

  const maxDiscountPct = useMemo(
    () => Math.max(...(data?.packages || []).map(p => p.discountPct || 0)),
    [data]
  );

  // cắt bớt khi giảm lessonsPerWeek
  useEffect(() => {
    if (picked.length > lessonsPerWeek) setPicked(picked.slice(0, lessonsPerWeek));
  }, [lessonsPerWeek]); // eslint-disable-line

  if (!data || !pkg) return <div className="order-container">Loading…</div>;

  const maxWeek = data.maxLessonsPerWeek;
  const weeks = Math.max(1, Math.ceil(pkg.lessons / Math.max(1, lessonsPerWeek)));

  const togglePick = (key) => {
    const has = picked.includes(key);
    if (has) setPicked(picked.filter(k => k !== key));
    else {
      if (picked.length >= lessonsPerWeek) return;
      if (data.bookedKeys?.includes(key)) return; // chặn key đã book ở BE
      setPicked([...picked, key]);
    }
  };

  const canSubmit = picked.length === lessonsPerWeek && maxWeek > 0 && !submitting;

  const placeOrder = async () => {
    setErrorMsg('');
    setSuccess(null);
    if (!user?.id) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const payload = {
        teacherId: Number(id),
        studentId: user.id,
        planHours: selectedHours,
        lessonsPerWeek,
        preferredSlots: picked,
        couponCode: coupon.trim() || undefined, // chỉ gửi lên nếu có
        status: 'pending',
      };
      const { data: created } = await apiPurchaseEnrollment(payload);
      setSuccess(created);
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || 'Đặt hàng không thành công. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const labelFromKey = (key) => {
    const [d, rest] = key.split(' ');
    const names = { mon:'Thứ 2', tue:'Thứ 3', wed:'Thứ 4', thu:'Thứ 5', fri:'Thứ 6', sat:'Thứ 7', sun:'Chủ nhật' };
    return `${names[d]} ${rest}`;
  };

  return (
    <div className="order-container">
      <div className="order-grid swapped">
        {/* LEFT — TEACHER BIG COLUMN */}
        <div className="col-left">
          <TeacherHeaderOrder teacher={data.teacher} />

          <LessonsPerWeekSelector
            maxWeek={maxWeek}
            value={lessonsPerWeek}
            onChange={setLessonsPerWeek}
            submitting={submitting}
          />

          <SlotSection
            maxWeek={maxWeek}
            lessonsPerWeek={lessonsPerWeek}
            weeklyAvailabilitySlots={data.weeklyAvailabilitySlots}
            slotMinutes={data.slotMinutes}
            bookedKeys={data.bookedKeys || []}
            picked={picked}
            onToggle={togglePick}
            labelFromKey={labelFromKey}
          />

          {errorMsg ? <div className="alert error">{errorMsg}</div> : null}
          {success ? (
            <div className="alert success">
              <div><strong>Đặt hàng thành công!</strong></div>
              <div>Mã đơn: #{success.id}</div>
              <div>Tổng tiền: {Number(success.total).toLocaleString('vi-VN')}₫</div>
              <div className="muted small">Trạng thái: {success.status}</div>
            </div>
          ) : null}
        </div>

        {/* RIGHT — ORDER SMALL COLUMN */}
        <div className="col-right">
          <h2>Chọn gói học</h2>

          <PackageGrid
            packages={data.packages}
            selectedHours={selectedHours}
            onSelect={setSelectedHours}
            submitting={submitting}
            maxDiscountPct={maxDiscountPct}
          />

          <TimeEstimateBox
            lessonsPerWeek={lessonsPerWeek}
            totalLessons={pkg.lessons}
            weeks={weeks}
            formatWeeks={formatWeeks}
          />

          <PriceSummaryBox
            pkg={pkg}
            coupon={coupon}
            onCouponChange={setCoupon}
          />

          <button
            className="btn-primary large"
            disabled={!canSubmit}
            title={
              maxWeek === 0
                ? 'Giáo viên chưa mở lịch'
                : picked.length !== lessonsPerWeek
                  ? 'Hãy chọn đủ số khung giờ/tuần'
                  : 'Tạo đơn (chưa thanh toán)'
            }
            onClick={placeOrder}
          >
            {submitting ? 'Đang tạo đơn…' : 'Tạo đơn (chưa thanh toán)'}
          </button>

          <div className="muted small">Bạn có thể chọn/đổi lịch chi tiết sau khi thanh toán.</div>
        </div>
      </div>
    </div>
  );
}
