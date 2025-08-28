import React from 'react';
import ConsultationForm from '@components/blog/ConsultationForm';
import { trackBanners as defaultBanners } from '@utils/constants';
import '@styles/blog/SidebarCard.css';

/**
 * SidebarCard
 *
 * Props:
 * - title: string — tiêu đề card
 * - searchTerm: string — giá trị ô input
 * - onChangeSearchTerm: (next: string) => void — thay đổi input
 * - onSubmitSearch: (e?: FormEvent) => void — bắt buộc truyền vào để thực hiện tìm kiếm
 * - searching: boolean — trạng thái đang tìm
 * - searchResults: Array<{id, slug?, title}> — mảng kết quả
 * - banners: Array<{src, alt, href}> — banner “Lộ Trình Cá Nhân Hoá”; mặc định dùng trackBanners từ constants
 * - showConsultation: boolean — có hiển thị ConsultationForm không
 * - consultationProps: object — các props truyền vào ConsultationForm (teacherName, teacherId, blogSlug, source, …)
 * - maxResults: number — số kết quả hiển thị (mặc định 6)
 */
export default function SidebarCard({
  title = 'Tìm kiếm bài viết học tập',
  searchTerm = '',
  onChangeSearchTerm = () => {},
  onSubmitSearch,
  banners = defaultBanners,
  showConsultation = false,
  consultationProps = {},
  }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSubmitSearch === 'function') onSubmitSearch(e);
  };

  return (
    <div className="sidebar-card">
      <div className="card">
        <h3 className="card-title">{title}</h3>

        <form onSubmit={handleSubmit} className="search-form">
          <div className="input-with-icon">
            <input
              className="search-input"
              type="text"
              placeholder="Tìm kiếm"
              value={searchTerm}
              onChange={(e) => onChangeSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-icon-btn" aria-label="Tìm kiếm">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M21 21l-4.35-4.35m1.85-5.4a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </form>

        {/* Lộ trình cá nhân hoá */}
        <div className="card track-card">
          <h3 className="card-title">Lộ Trình Cá Nhân Hoá</h3>
          <div className="tracks">
            {(banners || []).map((b) => (
              <a
                key={b.alt}
                href={b.href}
                target="_blank"
                rel="noreferrer"
                className="track-banner"
              >
                <img src={b.src} alt={b.alt} loading="lazy" />
              </a>
            ))}
          </div>
        </div>

        {showConsultation && <ConsultationForm {...consultationProps} />}
      </div>
    </div>
  );
}
