// src/pages/checkout/PaymentResult.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiGetEnrollment } from '@apis/enrollment';
// import { apiVerifyVnpayReturn } from '@apis/payments'; // không cần cho flow return-dev

// (Optional) Map mã lỗi VNPAY -> thông điệp ngắn gọn
const VNP_MESSAGES = {
  '00': 'Giao dịch thành công.',
  '07': 'Giao dịch nghi ngờ (khấu trừ).',
  '09': 'Thẻ/TK chưa đăng ký dịch vụ.',
  '10': 'Xác thực sai quá số lần.',
  '11': 'Hết hạn mức/đã vượt hạn mức.',
  '12': 'Thẻ/TK bị khóa.',
  '13': 'Nhập sai mật khẩu OTP.',
  '24': 'Giao dịch bị hủy.',
  '51': 'Không đủ số dư.',
  '65': 'Quá số lần xác thực.',
  '75': 'Ngân hàng giữ thẻ.',
  '79': 'Giao dịch bị từ chối.',
};

export default function PaymentResult() {
  const [sp] = useSearchParams();
  const nav = useNavigate();

  // return-dev sẽ đính sẵn các query này:
  const result = sp.get('result'); // 'success' | 'fail'
  const orderId = Number(sp.get('orderId') || sp.get('vnp_TxnRef'));
  const code = sp.get('code') || sp.get('vnp_ResponseCode');

  const [msg, setMsg] = useState('Đang xác minh thanh toán…');

  // Nếu BE đã redirect về FE với ?result=..., thì hiển thị trực tiếp
  useEffect(() => {
    if (!result) return;

    if (result === 'success') {
      toast.success('Thanh toán thành công!');
      setMsg('Thanh toán thành công. Đang chuyển về trang chủ…');
      const t = setTimeout(() => nav('/', { replace: true }), 1500);
      return () => clearTimeout(t);
    }

    // fail
    const reason = code && VNP_MESSAGES[code] ? ` (${VNP_MESSAGES[code]})` : '';
    toast.error('Thanh toán thất bại.');
    setMsg(`Thanh toán thất bại${reason ? `: ${reason}` : ''}.`);
  }, [result, code, nav]);

  // Fallback: nếu vì lý do nào đó không có ?result=..., poll trạng thái đơn
  useEffect(() => {
    if (result) return; // đã xử lý ở block trên
    if (!orderId || Number.isNaN(orderId)) {
      setMsg('Thiếu mã đơn.');
      return;
    }

    let intervalId = null;
    let count = 0;

    const check = async () => {
      try {
        const { data } = await apiGetEnrollment(orderId);
        if (data?.status === 'paid') {
          toast.success('Thanh toán thành công!');
          nav('/', { replace: true });
          return;
        }
        if (['cancelled', 'refunded'].includes(data?.status)) {
          setMsg('Thanh toán không thành công hoặc đã hủy.');
          clearInterval(intervalId);
          return;
        }
        count += 1;
        if (count > 30) {
          setMsg('Chưa có xác nhận. Vui lòng kiểm tra lịch sử đơn sau ít phút.');
          clearInterval(intervalId);
        }
      } catch {
        setMsg('Không kiểm tra được trạng thái đơn.');
        clearInterval(intervalId);
      }
    };

    setMsg('Đang chờ xác nhận từ ngân hàng…');
    check();
    intervalId = setInterval(check, 2000);
    return () => intervalId && clearInterval(intervalId);
  }, [result, orderId, nav]);

  return (
    <div style={{ maxWidth: 720, margin: '60px auto', textAlign: 'center' }}>
      <h2>Kết quả thanh toán</h2>
      <p>{msg}</p>

      {/* Cho người dùng xem mã giao dịch/QR nếu cần debug */}
      <div style={{ fontSize: 12, color: '#6b7280' }}>
        {typeof orderId === 'number' && !Number.isNaN(orderId) ? (
          <div>Mã đơn: #{orderId}</div>
        ) : null}
        {code ? <div>Mã phản hồi: {code} {VNP_MESSAGES[code] ? `- ${VNP_MESSAGES[code]}` : ''}</div> : null}
      </div>

      <button onClick={() => nav('/home')}>Về trang chủ</button>
    </div>
  );
}
