// src/components/order/PriceSummaryBox.jsx
import React from 'react';

export default function PriceSummaryBox({ pkg, coupon, onCouponChange }) {
  return (
    <div className="box">
      <h4>Tổng quan giá</h4>

      <div className="row">
        <span>Giá / buổi</span>
        <strong>{pkg.pricePerLesson.toLocaleString('vi-VN')}₫</strong>
      </div>

      {pkg.discount > 0 && (
        <>
          <div className="row">
            <span>Tổng trước giảm ({pkg.lessons} buổi)</span>
            <span>{pkg.gross.toLocaleString('vi-VN')}₫</span>
          </div>
          <div className="row">
            <div className="save-tag">
              <span className="save-pct">{Math.round(pkg.discountPct * 100)}% OFF</span>
            </div>
            <strong>-{pkg.discount.toLocaleString('vi-VN')}₫</strong>
          </div>
        </>
      )}

      <div className="row coupon">
        <span>Mã giảm giá</span>
        <div className="coupon-field">
          <input
            placeholder="Nhập mã…"
            value={coupon}
            onChange={(e)=>onCouponChange(e.target.value)}
          />
        </div>
      </div>

      <div className="row total">
        <span>Thành tiền</span>
        <strong className="total-strong">{pkg.total.toLocaleString('vi-VN')}₫</strong>
      </div>
    </div>
  );
}
