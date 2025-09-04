// src/pages/checkout/PaymentResult.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { apiGetEnrollment } from '@apis/enrollment';
import { apiSendEnrollmentInvoice } from '@apis/payments';
import '@styles/checkout/PaymentResult.css';

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

function explain(provider, code) {
  switch ((provider || '').toLowerCase()) {
    case 'vnpay':
      return code && VNP_MESSAGES[code] ? `: ${VNP_MESSAGES[code]}` : '';
    default:
      return code ? ` (${code})` : '';
  }
}

export default function PaymentResult() {
  const [sp] = useSearchParams();
  const nav = useNavigate();

  const result   = sp.get('result');                        // 'success' | 'fail'
  const provider = (sp.get('provider') || '').toLowerCase();// 'vnpay' | 'momo' | ...
  const orderId  = Number(sp.get('orderId') || sp.get('vnp_TxnRef'));
  const code     = sp.get('code') || sp.get('vnp_ResponseCode') || sp.get('status');

  const [msg, setMsg] = useState('Đang xác minh thanh toán…');
  const [sending, setSending] = useState(false);
  const [sentInfo, setSentInfo] = useState(null);
  const [sendErr, setSendErr] = useState('');

  const success = useMemo(() => result === 'success', [result]);

  const sendInvoice = useCallback(async (id) => {
    setSendErr('');
    setSending(true);
    try {
      const { data } = await apiSendEnrollmentInvoice(id);
      if (data?.ok) {
        setSentInfo(data);
        toast.success(`Đã gửi hóa đơn ${data.invoiceNo}${data.to ? ` tới ${data.to}` : ''}`);
        setMsg('Hóa đơn đã được gửi qua email. Đang trở về trang chủ…');
        setTimeout(() => nav('/', { replace: true }), 1600);
      } else {
        setSendErr('Không gửi được hóa đơn.');
        setMsg('Thanh toán thành công, nhưng gửi hóa đơn thất bại. Vui lòng thử lại.');
      }
    } catch (e) {
      setSendErr(e?.response?.data?.message || 'Gửi hóa đơn thất bại.');
      setMsg('Thanh toán thành công, nhưng gửi hóa đơn thất bại. Bạn có thể thử gửi lại.');
    } finally {
      setSending(false);
    }
  }, [nav]);

  // Nhánh có ?result=
  useEffect(() => {
    if (!result) return;

    if (success) {
      toast.success('Thanh toán thành công!');
      if (orderId && !Number.isNaN(orderId)) {
        setMsg('Đang gửi hóa đơn đến email của bạn…');
        sendInvoice(orderId);
      } else {
        setMsg('Thiếu mã đơn.');
      }
      return;
    }

    // fail
    const reason = explain(provider, code);
    toast.error('Thanh toán thất bại.');
    setMsg(`Thanh toán thất bại${reason}`);
  }, [result, success, orderId, code, provider, sendInvoice]);

  // Fallback: không có ?result= -> poll
  useEffect(() => {
    if (result) return;
    if (!orderId || Number.isNaN(orderId)) {
      setMsg('Thiếu mã đơn.');
      return;
    }

    let intervalId = null;
    let stop = false;

    const check = async () => {
      try {
        const { data } = await apiGetEnrollment(orderId);
        if (data?.status === 'paid' && !stop) {
          toast.success('Thanh toán thành công!');
          setMsg('Đang gửi hóa đơn đến email của bạn…');
          stop = true;
          clearInterval(intervalId);
          await sendInvoice(orderId);
          return;
        }
        if (['cancelled', 'refunded'].includes(data?.status)) {
          setMsg('Thanh toán không thành công hoặc đã hủy.');
          clearInterval(intervalId);
          return;
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
  }, [result, orderId, sendInvoice]);

  const isFail = !success && !!result;

  return (
    <div className="result-wrap">
      <div className={`result-card ${success ? 'ok' : isFail ? 'fail' : ''}`}>
        <div className="result-icon" aria-hidden>
          {success ? (
            <svg viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm-1.1-6.3 5.657-5.657-1.414-1.415L10.9 12.586 8.86 10.546l-1.414 1.414 2.828 2.829a1 1 0 0 0 1.414 0Z"/></svg>
          ) : isFail ? (
            <svg viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm-3.536-6.464 2.829-2.829-2.829-2.828 1.415-1.415 2.828 2.829 2.829-2.829 1.414 1.415-2.828 2.828 2.828 2.829-1.414 1.414-2.829-2.828-2.828 2.828-1.415-1.414Z"/></svg>
          ) : (
            <div className="spinner" />
          )}
        </div>

        <h2 className="title">
          {success ? 'Thanh toán thành công' : isFail ? 'Thanh toán thất bại' : 'Đang xác minh…'}
        </h2>

        <p className="subtitle">{msg}</p>

        <div className="details-grid">
          {typeof orderId === 'number' && !Number.isNaN(orderId) && (
            <div><span className="muted">Mã đơn</span><strong>#{orderId}</strong></div>
          )}
          {!!provider && <div><span className="muted">Phương thức</span><strong>{provider.toUpperCase()}</strong></div>}
          {!!code && <div><span className="muted">Mã/Trạng thái</span><strong>{code}</strong></div>}
          {sentInfo?.to && <div><span className="muted">Gửi tới</span><strong>{sentInfo.to}</strong></div>}
          {sentInfo?.invoiceNo && <div><span className="muted">Số hóa đơn</span><strong>{sentInfo.invoiceNo}</strong></div>}
        </div>

        <div className="actions">
          {success ? (
            <>
              <button
                className="btn-primary"
                onClick={() => nav('/', { replace: true })}
                disabled={sending}
              >
                {sending ? 'Đang gửi hóa đơn…' : 'Về trang chủ'}
              </button>
              {sendErr && (
                <button
                  className="btn-outline"
                  onClick={() => orderId && sendInvoice(orderId)}
                  disabled={sending}
                >
                  Gửi lại hóa đơn
                </button>
              )}
            </>
          ) : isFail ? (
            <>
              <button className="btn-outline" onClick={() => nav('/')} >Về trang chủ</button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
