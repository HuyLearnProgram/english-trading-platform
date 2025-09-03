import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiGetEnrollment } from '@apis/enrollment';
import { apiStartVnpayCheckout } from '@apis/payments';
import '@styles/checkout/PaymentPage.css';
import { apiStartPaypalCheckout, apiStartZaloPayCheckout } from '../../apis/payments';

export default function PaymentPage() {
  const { id } = useParams();                  // enrollmentId
  const nav = useNavigate();
  const { state } = useLocation();             // { enrollment? }
  const [en, setEn] = useState(state?.enrollment || null);
  const [loading, setLoading] = useState(!state?.enrollment);
  const [err, setErr] = useState('');

  // provider đang xử lý: 'vnpay' | 'zalopay' | null
  const [paying, setPaying] = useState(null);

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
    if (!en?.id || paying) return;
    setErr('');
    setPaying('vnpay');
    try {
      const { data } = await apiStartVnpayCheckout(en.id);
      window.location.href = data.checkoutUrl; // qua trang VNPAY
    } catch (e) {
      setErr(e?.response?.data?.message || 'Không khởi tạo được phiên thanh toán (VNPAY).');
      setPaying(null);
    }
  };

  const payWithZaloPay = async () => {
    if (!en?.id || paying) return;
    setErr('');
    setPaying('zalopay');
    try {
      // BE trả về { checkoutUrl } — trỏ đến ZaloPay (orderurl/deeplink)
      const { data } = await apiStartZaloPayCheckout(en.id);
      // Desktop web: mở orderurl (web)
      // Mobile app: deeplink (nếu backend trả deeplink thì có thể ưu tiên deeplink)
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setErr(e?.response?.data?.message || 'Không khởi tạo được phiên thanh toán (ZaloPay).');
      setPaying(null);
    }
  };

  const payWithPaypal = async () => {
    if (!en?.id || paying) return;
    setErr('');
    setPaying('paypal');
    try {
      const { data } = await apiStartPaypalCheckout(en.id);
      window.location.href = data.checkoutUrl; // approval link PayPal
    } catch (e) {
      setErr(e?.response?.data?.message || 'Không khởi tạo được phiên thanh toán (PayPal).');
      setPaying(null);
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
              {/* VNPAY */}
              <button
                type="button"
                className={`pay-cta vnpay-cta ${paying === 'vnpay' ? 'is-loading' : ''}`}
                onClick={payWithVnpay}
                disabled={!!paying}
                aria-label="Thanh toán qua VNPAY"
              >
                <img
                  src="https://cdn-new.topcv.vn/unsafe/140x/https://static.topcv.vn/company_logos/cong-ty-cp-giai-phap-thanh-toan-viet-nam-vnpay-6194ba1fa3d66.jpg"
                  alt=""
                  className="vnpay-mark"
                />
                <span className="vnpay-text-cta">
                  Thanh toán qua <strong>VNPAY</strong>
                </span>
                {paying === 'vnpay' && <span className="spinner" aria-hidden="true" />}
              </button>
              
              {/* ZaloPay */}
              <button
                type="button"
                className={`pay-cta zalopay-cta ${paying === 'zalopay' ? 'is-loading' : ''}`}
                onClick={payWithZaloPay}
                disabled={!!paying}
                aria-label="Thanh toán qua ZaloPay"
              >
                <img
                  src="https://docs.zalopay.vn/vi/img/zalopay-logo.png"
                  alt="ZaloPay logo"
                  className="pay-mark zalopay-mark"
                />
                <span className="zalopay-text-cta">
                  Thanh toán qua <strong>ZaloPay</strong>
                </span>
                {paying === 'zalopay' && <span className="spinner" aria-hidden="true" />}
              </button>

              {/* PayPal */}
              <button
                type="button"
                className={`pay-cta paypal-cta ${paying === 'paypal' ? 'is-loading' : ''}`}
                onClick={payWithPaypal}
                disabled={!!paying}
                aria-label="Thanh toán qua PayPal"
              >
                <img
                  src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
                  alt="PayPal"
                  className="pay-mark paypal-mark"
                />
                <span className="paypal-text-cta">Thanh toán qua <strong>PayPal</strong></span>
                {paying === 'paypal' && <span className="spinner" aria-hidden="true" />}
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
