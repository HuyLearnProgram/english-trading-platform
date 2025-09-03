// src/pages/checkout/PaymentResult.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiGetEnrollment } from '@apis/enrollment';

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

// Thông điệp chung theo provider
function explain(provider, code) {
  switch ((provider || '').toLowerCase()) {
    case 'vnpay':
      return code && VNP_MESSAGES[code] ? `: ${VNP_MESSAGES[code]}` : '';
    case 'zalopay':
      // ZaloPay thường trả status/code khác nhau; bạn có thể map thêm khi cần
      return code ? ` (ZaloPay: ${code})` : '';
    case 'paypal':
      // PayPal thường trả COMPLETED/CANCELED...
      return code ? ` (PayPal: ${code})` : '';
    default:
      return code ? ` (${code})` : '';
  }
}

export default function PaymentResult() {
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const result   = sp.get('result');    // 'success' | 'fail'
  const provider = (sp.get('provider') || '').toLowerCase(); // 'vnpay' | 'zalopay' | 'paypal' ...
  const orderId  = Number(sp.get('orderId') || sp.get('vnp_TxnRef'));
  const code     = sp.get('code') || sp.get('vnp_ResponseCode') || sp.get('status');

  const [msg, setMsg] = useState('Đang xác minh thanh toán…');

  useEffect(() => {
    if (!result) return;

    if (result === 'success') {
      toast.success('Thanh toán thành công!');
      setMsg('Thanh toán thành công. Đang chuyển về trang chủ…');
      const t = setTimeout(() => nav('/', { replace: true }), 1500);
      return () => clearTimeout(t);
    }

    // fail
    const reason = explain(provider, code);
    toast.error('Thanh toán thất bại.');
    setMsg(`Thanh toán thất bại${reason}`);
  }, [result, code, provider, nav]);

  // Fallback: nếu không có ?result=..., poll trạng thái đơn như cũ
  useEffect(() => {
    if (result) return;
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

    setMsg('Đang chờ xác nhận từ cổng thanh toán…');
    check();
    intervalId = setInterval(check, 2000);
    return () => intervalId && clearInterval(intervalId);
  }, [result, orderId, nav]);

  return (
    <div style={{ maxWidth: 720, margin: '60px auto', textAlign: 'center' }}>
      <h2>Kết quả thanh toán</h2>
      <p>{msg}</p>

      <div style={{ fontSize: 12, color: '#6b7280' }}>
        {typeof orderId === 'number' && !Number.isNaN(orderId) ? (
          <div>Mã đơn: #{orderId}</div>
        ) : null}
        {provider ? <div>Phương thức: {provider.toUpperCase()}</div> : null}
        {code ? <div>Mã/Trạng thái: {code}</div> : null}
      </div>

      <button onClick={() => nav('/home')}>Về trang chủ</button>
    </div>
  );
}
