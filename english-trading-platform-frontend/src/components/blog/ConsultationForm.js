import React from "react";
import "../../styles/ConsultationForm.css";

export default function ConsultationForm({ teacherName = "", onSubmit }) {
  const [form, setForm] = React.useState({
    fullName: "",
    phone: "",
    email: "",
    message: "",
    teacher: teacherName || "",
  });
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  // cập nhật lại tên GV nếu prop thay đổi (khi blog load xong)
  React.useEffect(() => {
    setForm((f) => ({ ...f, teacher: teacherName || "" }));
  }, [teacherName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ tên";
    if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email không hợp lệ";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(form);
      } else {
        // demo: giả lập submit
        await new Promise((r) => setTimeout(r, 800));
        console.log("Consultation form:", form);
      }
      setDone(true);
      setForm((f) => ({
        ...f,
        fullName: "",
        phone: "",
        email: "",
        message: "",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="cf-wrap" aria-labelledby="cf-title">
      <div className="cf-head">
        <h3 id="cf-title" className="cf-title">Đăng ký tư vấn lộ trình học</h3>
        <p className="cf-sub">
          Bạn hãy để lại thông tin, Antoree sẽ liên hệ tư vấn cho mình ngay nha!
        </p>
      </div>

      <form className="cf-card" onSubmit={handleSubmit} noValidate>
        {/* Họ tên */}
        <label className="cf-field">
          <span className="cf-label">Họ và tên (*)</span>
          <input
            className={`cf-input ${errors.fullName ? "is-error" : ""}`}
            name="fullName"
            placeholder="Nhập họ và tên của bạn"
            value={form.fullName}
            onChange={handleChange}
          />
          {errors.fullName && <small className="cf-error">{errors.fullName}</small>}
        </label>

        {/* Điện thoại */}
        <label className="cf-field">
          <span className="cf-label">Số điện thoại (*)</span>
          <input
            className={`cf-input ${errors.phone ? "is-error" : ""}`}
            name="phone"
            placeholder="Nhập số điện thoại"
            value={form.phone}
            onChange={handleChange}
          />
          {errors.phone && <small className="cf-error">{errors.phone}</small>}
        </label>

        {/* Email */}
        <label className="cf-field">
          <span className="cf-label">Email</span>
          <input
            className={`cf-input ${errors.email ? "is-error" : ""}`}
            name="email"
            placeholder="Nhập địa chỉ email của bạn"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <small className="cf-error">{errors.email}</small>}
        </label>

        {/* Lời nhắn */}
        <label className="cf-field">
          <span className="cf-label">Lời nhắn</span>
          <textarea
            className="cf-textarea"
            rows={3}
            name="message"
            placeholder="Bạn cần tư vấn gì?"
            value={form.message}
            onChange={handleChange}
          />
        </label>

        {/* Giảng viên đăng ký (prefill từ tác giả bài) */}
        <label className="cf-field">
          <span className="cf-label">Giảng viên đăng ký</span>
          <input
            className="cf-input"
            name="teacher"
            value={form.teacher}
            readOnly
            aria-readonly="true"
          />
        </label>

        <p className="cf-note">
          Bằng việc gửi đăng ký nhận tư vấn, bạn đã đồng ý với Chính sách bảo mật thông tin của Antoree.
        </p>

        {done && (
          <div className="cf-success" role="status">
            Đã gửi đăng ký tư vấn thành công. Antoree sẽ liên hệ với bạn sớm!
          </div>
        )}

        <button className="cf-submit" type="submit" disabled={submitting}>
          {submitting ? "Đang gửi..." : "Gửi đăng ký"}
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </form>
    </section>
  );
}
