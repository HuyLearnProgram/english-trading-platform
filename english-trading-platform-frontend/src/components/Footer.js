import React, { useEffect, useState } from "react";
import "@styles/Footer.css";

const Footer = () => {
  const [showToTop, setShowToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowToTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="ant-footer">
      <div className="ant-container">
        <div className="ant-footer-grid">
          {/* Cột 1 */}
          <div className="col">
            <h4>HỖ TRỢ KHÁCH HÀNG</h4>
            <ul>
              <li>
                Hotline <a href="tel:0877709376">0877709376</a> /
              </li>
              <li>
                Email <a href="mailto:cskh@antoree.com">cskh@antoree.com</a>
              </li>
              <li>
                Phản hồi về dịch vụ:&nbsp;
                <a href="mailto:anh.pham2@antoree.com">anh.pham2@antoree.com</a>
              </li>
            </ul>
          </div>

          {/* Cột 2 */}
          <div className="col">
            <h4>THÔNG TIN DỊCH VỤ</h4>
            <ul>
              <li><a href="#terms">Điều khoản sử dụng</a></li>
              <li><a href="#privacy">Chính sách bảo mật</a></li>
              <li><a href="#refund">Chính sách hoàn tiền</a></li>
              <li><a href="#faq">FAQs</a></li>
              <li><a href="#commitment">Cam kết đầu ra</a></li>
            </ul>
          </div>

          {/* Cột 3 */}
          <div className="col">
            <h4>KẾT NỐI VỚI ANTOREE</h4>
            <a
              className="btn green-btn become-teacher"
              href="https://members.antoree.com/teacher-register?utm_source=footer"
              target="_blank"
              rel="noopener noreferrer"
            >
              Trở thành giáo viên
            </a>

            <div className="ant-social">
              <a aria-label="Facebook" href="#fb">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 3h4v4h-4v3h4v11h-4v-7h-3v7H6V10h4V7a4 4 0 0 1 3-4z"/></svg>
              </a>
              <a aria-label="Zalo" href="#zalo">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 3h16a1 1 0 0 1 1 1v16l-4-3H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/></svg>
              </a>
              <a aria-label="YouTube" href="#youtube">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 15l5.19-3L10 9v6zm11-3c0-2.5-.2-4.1-.2-4.1-.2-.9-.9-1.6-1.8-1.8C17.8 5 12 5 12 5s-5.8 0-7 .1c-.9.2-1.6.9-1.8 1.8C3 7.9 3 9.5 3 12s.2 4.1.2 4.1c.2.9.9 1.6 1.8 1.8 1.2.1 7 .1 7 .1s5.8 0 7-.1c.9-.2 1.6-.9 1.8-1.8.1 0 .2-1.6.2-4.1z"/></svg>
              </a>
              <a aria-label="Skype" href="#skype">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a6.3 6.3 0 0 0-5.4 3.1A5 5 0 0 0 5 5 5 5 0 0 0 0 10a5 5 0 0 0 3.1 4.6A6.3 6.3 0 0 0 12 22a6.3 6.3 0 0 0 5.4-3.1A5 5 0 0 0 19 19a5 5 0 0 0 5-5 5 5 0 0 0-3.1-4.6A6.3 6.3 0 0 0 12 2zm1.9 13.9c-3.2 0-5.3-1.6-5.3-3.2 0-.7.5-1.2 1.1-1.2 1.4 0 1 2 4.2 2 1.2 0 1.7-.4 1.7-1 0-1.6-7.1-.5-7.1-5 0-2.3 2.2-3.5 4.8-3.5 2.2 0 4.9.9 4.9 2.6 0 .7-.6 1.2-1.3 1.2-1.3 0-.9-1.7-3.7-1.7-1.4 0-2.1.6-2.1 1.2 0 1.8 7.1.5 7.1 5.1 0 2.4-2.2 3.5-5.3 3.5z"/></svg>
              </a>
            </div>
          </div>

          {/* Cột 4 */}
          <div className="col">
            <h4>TẢI ỨNG DỤNG TRÊN ĐIỆN THOẠI</h4>
            <div className="store-badges">
              <a href="#googleplay" aria-label="Google Play">
                <img
                  src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                  alt="Get it on Google Play"
                />
              </a>
              <a href="#appstore" aria-label="App Store">
                <img
                  src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                  alt="Download on the App Store"
                />
              </a>
            </div>
          </div>
        </div>

        <hr className="ant-footer-divider" />

        <div className="ant-company">
          <p>
            <strong>
              Công ty Giáo dục và Đào tạo ANTOREE INTERNATIONAL PTE. LTD. (MST: 201436698Z)
            </strong>
          </p>
          <p>Trụ sở chính: 10 Anson Road, #27-15, International Plaza, Singapore 079903</p>

          <p>
            <strong>
              Đối tác đại diện tại Việt Nam: CÔNG TY TNHH PHÁT TRIỂN GIÁO DỤC ANTOREE (MST: 0313769851)
            </strong>
          </p>
          <p>
            Trụ sở chính: 187/7 Điện Biên Phủ, P. Đa Kao, Q 1, TP Hồ Chí Minh, Việt Nam
          </p>
          <p>
            Văn phòng đại diện, tiếp khách và nhận thư tại TP Hồ Chí Minh: Số 55A Trần Thái Tông, Phường 15, Quận Tân Bình, Hồ Chí Minh, Việt Nam
          </p>
        </div>

        <div className="ant-footer-bottom">
          <span>© 2025 Antoree Pte.Ltd</span>
          <div className="links">
            <a href="#privacy">Chính sách bảo mật</a>
            <a href="#terms">Điều khoản sử dụng</a>
          </div>
        </div>
      </div>

      {showToTop && (
        <button className="ant-to-top" onClick={scrollTop} aria-label="Lên đầu trang">
          <svg viewBox="0 0 24 24">
            <path d="M12 8l6 6H6l6-6z" transform="rotate(180 12 12)" fill="currentColor" />
          </svg>
        </button>
      )}
    </footer>
  );
};

export default Footer;
