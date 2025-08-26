// src/components/blog/ConsultationForm.jsx
import React from "react";
import { toast } from "react-toastify";
import { createConsultation } from "../../apis/consultation";
import "../../styles/ConsultationForm.css";

export default function ConsultationForm({
  teacherName = "",
  teacherId,              // optional
  blogSlug,               // optional
  source = "blog",        // optional: 'blog' | 'home'
  variant = "inline",     // 'inline' (blog) | 'modal' (home popup)
  isOpen = true,          // chỉ dùng khi variant='modal'
  onClose,                // chỉ dùng khi variant='modal'
  autoCloseOnSuccess,     // optional: ép hành vi đóng sau khi submit OK
}) {
  const firstInputRef = React.useRef(null);

  const [form, setForm] = React.useState({
    fullName: "",
    phone: "",
    email: "",
    message: "",
    teacher: teacherName || "",
  });
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);

  // auto-close: mặc định = true cho modal, false cho inline
  const shouldAutoClose =
    typeof autoCloseOnSuccess === "boolean"
      ? autoCloseOnSuccess
      : variant === "modal";

  // đồng bộ tên GV khi prop đổi
  React.useEffect(() => {
    setForm((f) => ({ ...f, teacher: teacherName || "" }));
  }, [teacherName]);

  // khoá cuộn + ESC để đóng + auto-focus khi modal
  React.useEffect(() => {
    if (variant !== "modal" || !isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKeyDown);
    setTimeout(() => firstInputRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [variant, isOpen, onClose]);

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
      await createConsultation({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email?.trim() || undefined,
        message: form.message || undefined,
        teacherName: form.teacher || undefined,
        teacherId: teacherId || undefined,
        source,
        blogSlug,
      });

      // reset form
      setForm((f) => ({ ...f, fullName: "", phone: "", email: "", message: "" }));

      // toast thành công
      toast.success("Đã gửi đăng ký tư vấn. Chúng tôi sẽ liên hệ với bạn sớm!");

      // nếu là modal (hoặc được ép) -> đóng form; blog detail vẫn giữ nguyên
      if (shouldAutoClose && onClose) {
        onClose();               // đóng ngay
        return;                  // không cần hiển thị done trong modal
      }


    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Có lỗi xảy ra khi gửi đăng ký tư vấn. Vui lòng thử lại!";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // phần body form (dùng chung)
  const FormBody = (
    <>
      <div className="cf-head">
        <h3 id="cf-title" className="cf-title">Đăng ký tư vấn lộ trình học</h3>
        <p className="cf-sub">Bạn hãy để lại thông tin, Antoree sẽ liên hệ tư vấn cho mình ngay nha!</p>
      </div>

      <form className="cf-card" onSubmit={handleSubmit} noValidate>
        <label className="cf-field">
          <span className="cf-label">Họ và tên (*)</span>
          <input
            ref={firstInputRef}
            className={`cf-input ${errors.fullName ? "is-error" : ""}`}
            name="fullName"
            placeholder="Nhập họ và tên của bạn"
            value={form.fullName}
            onChange={handleChange}
            autoComplete="name"
          />
          {errors.fullName && <small className="cf-error">{errors.fullName}</small>}
        </label>

        <label className="cf-field">
          <span className="cf-label">Số điện thoại (*)</span>
          <input
            className={`cf-input ${errors.phone ? "is-error" : ""}`}
            name="phone"
            placeholder="Nhập số điện thoại"
            value={form.phone}
            onChange={handleChange}
            type="tel"
            autoComplete="tel"
          />
          {errors.phone && <small className="cf-error">{errors.phone}</small>}
        </label>

        <label className="cf-field">
          <span className="cf-label">Email</span>
          <input
            className={`cf-input ${errors.email ? "is-error" : ""}`}
            name="email"
            placeholder="Nhập địa chỉ email của bạn"
            value={form.email}
            onChange={handleChange}
            type="email"
            autoComplete="email"
          />
          {errors.email && <small className="cf-error">{errors.email}</small>}
        </label>

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

        {teacherName && (
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
        )}

        <p className="cf-note">
          Bằng việc gửi đăng ký nhận tư vấn, bạn đã đồng ý với Chính sách bảo mật thông tin của Antoree.
        </p>

        <button className="cf-submit" type="submit" disabled={submitting}>
          {submitting ? "Đang gửi..." : "Gửi đăng ký"}
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </form>
    </>
  );

  if (variant === "modal") {
    if (!isOpen) return null;
    return (
      <div className="cf-modal-backdrop" onClick={() => onClose?.()} role="presentation">
        <section
          className="cf-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cf-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="cf-close" aria-label="Đóng" onClick={() => onClose?.()}>
            ✕
          </button>
          {FormBody}
        </section>
      </div>
    );
  }

  // inline (Blog Detail)
  return (
    <section className="cf-wrap" aria-labelledby="cf-title">
      {FormBody}
    </section>
  );
}
