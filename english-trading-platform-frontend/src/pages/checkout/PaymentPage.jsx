import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiGetEnrollment } from '@apis/enrollment';
import { apiStartVnpayCheckout } from '@apis/payments';
import '@styles/checkout/PaymentPage.css';

export default function PaymentPage() {
  const { id } = useParams();                  // enrollmentId
  const nav = useNavigate();
  const { state } = useLocation();             // { enrollment? }
  const [en, setEn] = useState(state?.enrollment || null);
  const [loading, setLoading] = useState(!state?.enrollment);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (state?.enrollment) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await apiGetEnrollment(id);
        if (alive) setEn(data);
      } catch (e) {
        setErr(e?.response?.data?.message || 'Không tải được đơn hàng.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, state]);

  const summary = useMemo(() => {
    if (!en) return null;
    return {
      lessons: en.lessons,
      subtotal: Number(en.gross || 0),
      discount: Number(en.discount || 0),
      total: Number(en.total || 0),
      unit: Number(en.unitPriceBeforeDiscount || 0),
      lessonLen: en.lessonLengthMinutesSnapshot,
      lessonsPerWeek: en.lessonsPerWeek,
    };
  }, [en]);

  const payWithVnpay = async () => {
    if (!en?.id) return;
    setSubmitting(true);
    setErr('');
    try {
      const { data } = await apiStartVnpayCheckout(en.id);
      window.location.href = data.checkoutUrl;        // chuyển sang trang VNPAY
    } catch (e) {
      setErr(e?.response?.data?.message || 'Không khởi tạo được phiên thanh toán.');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="checkout-container">Loading…</div>;
  if (!en || !summary) return <div className="checkout-container">Không tìm thấy đơn hàng.</div>;

  return (
    <div className="checkout-container">
      <div className="checkout-grid">
        {/* LEFT - SUMMARY */}
        <div className="co-left">
          <div className="summary-card">
            <div className="sum-title">Summary</div>
            <div className="sum-subtitle">
              {summary.lessonsPerWeek} lesson{summary.lessonsPerWeek>1?'s':''} per week · {summary.lessonLen} phút/buổi
            </div>

            <hr />

            <div className="sum-row">
              <span>{summary.lessons} lessons</span>
              <span>{summary.subtotal.toLocaleString('vi-VN')}₫</span>
            </div>

            {summary.discount > 0 && (
              <div className="sum-row">
                <span className="off-badge">-{Math.round((summary.discount/summary.subtotal)*100)}% OFF</span>
                <span>-{summary.discount.toLocaleString('vi-VN')}₫</span>
              </div>
            )}

            <div className="sum-row total">
              <span>Total due today</span>
              <strong>{summary.total.toLocaleString('vi-VN')}₫</strong>
            </div>

            {err ? <div className="co-alert error">{err}</div> : null}
          </div>
        </div>

        {/* RIGHT - PAYMENT TYPE */}
        <div className="co-right">
          <div className="pay-card">
            <div className="pay-title">ADD PAYMENT INFORMATION</div>

            <div className="pay-method">
              <button
                type="button"
                className={`vnpay-cta ${submitting ? 'is-loading' : ''}`}
                onClick={payWithVnpay}
                disabled={submitting}
                aria-label="Thanh toán qua VNPAY"
              >
                <img
                  src="https://thuonghieumanh.vneconomy.vn/upload/vnpay.png"
                  alt=""
                  className="vnpay-mark"
                />
                <span className="vnpay-text-cta">
                  Thanh toán qua <strong>VNPAY</strong>
                </span>
                {submitting && <span className="spinner" aria-hidden="true" />}
              </button>
            </div>

            <div className="secure-note">🔒 Secure Checkout</div>
            <button className="btn-ghost" onClick={() => nav(-1)}>← Quay lại</button>
          </div>
        </div>

      </div>
    </div>
  );
}
