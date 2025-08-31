// src/pages/TeacherProfile.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

// components
import TeacherHeader from '@components/teacher/TeacherHeader';
import StickyTabs from '@components/teacher/StickyTabs';
import AvailabilityTable from '@components/teacher/AvailabilityTable';
import StarRow from '@components/common/StarRow';
import VideoModal from '@components/common/VideoModal';
import ConsultationForm from '@components/blog/ConsultationForm';
import TeacherMetrics from '@components/teacher/TeacherMetrics';   

// page styles (chỉ còn layout/chung)
import '@styles/teacher/TeacherProfile.css';
import { apiGetTeacherPublic, apiGetTeacherReviews } from '../../apis/teacher';

export default function TeacherProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  // tabs
  const [active, setActive] = useState('about');
  const [navHeight, setNavHeight] = useState(0);
  const [headerH, setHeaderH] = useState(0);

  // sample modal
  const [showSample, setShowSample] = useState(false);
  const [showConsult, setShowConsult] = useState(false);

  // reviews (pagination)
  const [rvItems, setRvItems] = useState([]);
  const [rvPage, setRvPage] = useState(1);
  const [rvLimit] = useState(5);
  const [rvTotalPages, setRvTotalPages] = useState(1);
  const [rvLoading, setRvLoading] = useState(false);


  // refs cho các section
  const aboutRef = useRef(null);
  const standardRef = useRef(null);
  const timeRef = useRef(null);
  const reviewsRef = useRef(null);

  // ref của thanh tab (được forward từ StickyTabs)
  const navRef = useRef(null);

  // fetch teacher public
  useEffect(() => {
    (async () => {
      const { data } = await apiGetTeacherPublic(id);
      setData(data);
    })();
  }, [id]);
  
  // fetch reviews page
  const fetchReviews = async (page = 1) => {
    setRvLoading(true);
    try {
      const { data } = await apiGetTeacherReviews(id, { page, limit: rvLimit });
      setRvItems(Array.isArray(data.items) ? data.items : []);
      const meta = data.meta || {};
      setRvTotalPages(meta.totalPages || 1);
      setRvPage(meta.page || page);
    } finally {
      setRvLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(rvPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, rvPage]);

  const t = data?.teacher;
  const rating = data?.rating;

  // đo chiều cao header & nav
  const measure = () => {
    const cssVar = getComputedStyle(document.documentElement)
      .getPropertyValue('--header-h')
      .trim();
    const cssNum = parseInt(cssVar, 10);
    let h = !Number.isNaN(cssNum) ? cssNum : 0;
    if (!h) {
      const hdr = document.querySelector('[data-fixed-header], .site-header, header, .hero');
      if (hdr) h = hdr.offsetHeight || 0;
    }
    setHeaderH(h);

    const nh = navRef.current?.offsetHeight || 0;
    setNavHeight(nh);
    document.documentElement.style.setProperty('--nav-h', `${nh}px`);
  };

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  // khi data render xong => đo lại
  useEffect(() => {
    if (data) requestAnimationFrame(() => measure());
  }, [data]);

  // highlight tab theo section đang xem
  useEffect(() => {
    const sections = [
      { id: 'about', ref: aboutRef },
      { id: 'standard', ref: standardRef },
      { id: 'time', ref: timeRef },
      { id: 'reviews', ref: reviewsRef },
    ].filter((s) => s.ref.current);

    if (!sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      {
        root: null,
        rootMargin: `-${headerH + navHeight}px 0px -55% 0px`,
        threshold: [0.2, 0.35, 0.5, 0.65, 0.8],
      }
    );

    sections.forEach((s) => obs.observe(s.ref.current));
    return () => obs.disconnect();
  }, [headerH, navHeight]);

  const scrollToSection = (id, ref) => {
    if (!ref?.current) return;
    setActive(id); // active ngay khi click
    const offset = headerH + navHeight + 12;
    const top = ref.current.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // quốc kỳ (sử dụng ở header)
  const countryFlag = useMemo(() => {
    if (!t?.country) return '🏳️';
    const s = t.country.toLowerCase();
    if (s.includes('viet')) return '🇻🇳';
    if (s.includes('united kingdom') || s.includes('england')) return '🇬🇧';
    if (s.includes('united states') || s.includes('usa')) return '🇺🇸';
    return '🌍';
  }, [t]);

  if (!t) return <div className="container">Loading…</div>;

  // danh sách tabs
  const tabs = [
    { id: 'about',    title: 'Thông tin',            ref: aboutRef },
    { id: 'standard', title: 'Tiêu chuẩn giáo viên', ref: standardRef },
    { id: 'time',     title: 'Thời gian nhận lớp',   ref: timeRef },
    { id: 'reviews',  title: 'Đánh giá & nhận xét',  ref: reviewsRef },
  ];

  return (
    <div className="tp-container">
      {/* Header */}
      <TeacherHeader
        teacher={t}
        ratingAverage={Number(rating?.average || 0)}
        ratingTotal={rating?.total || 0}
        countryFlag={countryFlag}
      />

      {/* Tabs sticky (dưới header) */}
      <StickyTabs
        ref={navRef}
        top={headerH}
        active={active}
        tabs={tabs.map(({ id, title }) => ({ id, title }))}
        onTabClick={(id) => {
          const found = tabs.find((t) => t.id === id);
          if (found) scrollToSection(found.id, found.ref);
        }}
      />

      <div className="tp-grid">
        <div className="left">
          {/* ========== THÔNG TIN ========== */}
          <section id="about" ref={aboutRef} className="section-block">
            {t.certificates?.length ? (
              <div className="section">
                <h4>CEFR / Certificates</h4>
                <ul className="list">
                  {t.certificates.map((c, idx) => (
                    <li key={idx}>
                      <strong>{c.name}</strong>
                      {c.fileUrl && (
                        <>
                          {' '}
                          · File:{' '}
                          <a href={c.fileUrl} target="_blank" rel="noreferrer">
                            Tải xuống
                          </a>
                        </>
                      )}
                      {c.verified && <span className="verified">Đã xác minh</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {t.education?.length ? (
              <div className="section">
                <h4>Trình độ & Bằng cấp</h4>
                {t.education.map((e, idx) => (
                  <div className="edu" key={idx}>
                    <h3>{e.title}</h3>
                    <h5>
                      {e.org} {e.start ? `${e.start} - ${e.end || ''}` : ''}
                    </h5>
                    {e.verified && <div className="verified-line">Chứng chỉ đã được tải lên</div>}
                  </div>
                ))}
              </div>
            ) : null}

            {t.specialties && (
              <div className="section">
                <h4>Lĩnh vực làm việc</h4>
                <div className="chips">
                  {t.specialties.split(',').map((s, i) => (
                    <span className="chip" key={i}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {t.experiences?.length ? (
              <div className="section">
                <h4>Kinh nghiệm làm việc</h4>
                <ul className="exp-list">
                  {t.experiences.map((ex, idx) => (
                    <li key={idx}>
                      <h3>{ex.title}</h3>
                      <h5>
                        {ex.company}{' '}
                        {ex.start ? <span className="year">{ex.start} - {ex.end || 'Hiện tại'}</span> : null}
                      </h5>
                      {ex.desc && <div className="desc">{ex.desc}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* ========== TIÊU CHUẨN ========== */}
          <section id="standard" ref={standardRef} className="section-block">
            <h4>Tiêu chuẩn giáo viên</h4>
            <TeacherMetrics
              teacherId={id}
              onViewReviews={() => { setRvPage(1); scrollToSection('reviews', reviewsRef); }}
            />
          </section>

          {/* ========== THỜI GIAN NHẬN LỚP ========== */}
          <section id="time" ref={timeRef} className="section-block">
            <h4>Thời gian nhận lớp</h4>
            <AvailabilityTable
              // ưu tiên dữ liệu đã tách sẵn từ BE
              weeklyAvailability={t.weeklyAvailabilitySlots || t.weeklyAvailability}
              // để FE vẫn render đúng nếu BE chưa tách
              slotMinutes={t.slotMinutes || (t.lessonLengthMinutes === 60 ? 90 : t.lessonLengthMinutes === 90 ? 120 : 60)}
            />
            <p className="muted">Cập nhật gần nhất: {new Date(t.updatedAt).toLocaleDateString()}</p>
          </section>

          {/* ========== ĐÁNH GIÁ ========== */}
          <section id="reviews" ref={reviewsRef} className="section-block">
            <h4>Đánh giá & nhận xét</h4>
            <div className="rating-summary">
              <StarRow value={Number(rating?.average || 0)} />
              <span className="score">({Number(rating?.average || 0).toFixed(2)})</span>
              <span className="muted"> · {rating?.total || 0} nhận xét</span>
            </div>

            {rvLoading && <div className="muted">Đang tải nhận xét…</div>}

            {!rvLoading && rvItems.map((rv) => (
              <div key={rv.id} className="review">
                <img className="avatar" src={rv.user?.avatarUrl || 'https://static.antoree.com/avatar.png'} alt={rv.user?.fullName || 'user'} />
                <div className="content">
                  <div className="row1">
                    <span className="name">{rv.user?.fullName || 'Người dùng'}</span>
                    {rv.courseName && (
                      <span className="course">
                        {rv.courseName} {rv.totalHours ? <><span className="num">{rv.totalHours}</span> tổng số giờ</> : null}
                      </span>
                    )}
                  </div>
                  <div className="when">{new Date(rv.createdAt).toLocaleString()}</div>
                  <div className="text">{rv.reviewText}</div>
                </div>
              </div>
            ))}

            {/* Pager */}
            {rvTotalPages > 1 && (
              <div className="tp-pager">
                <button
                  className="page-nav"
                  disabled={rvPage <= 1}
                  onClick={() => setRvPage((p) => Math.max(1, p - 1))}
                  aria-label="Trang trước"
                >
                  ‹
                </button>

                {Array.from({ length: rvTotalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`page-btn ${n === rvPage ? 'active' : ''}`}
                    onClick={() => setRvPage(n)}
                  >
                    {n}
                  </button>
                ))}

                <button
                  className="page-nav"
                  disabled={rvPage >= rvTotalPages}
                  onClick={() => setRvPage((p) => Math.min(rvTotalPages, p + 1))}
                  aria-label="Trang sau"
                >
                  ›
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="right">
          {/* demoVideoUrl nằm TRÊN các nút */}
          {t.demoVideoUrl && (
            <div className="video-card">
              <video controls src={t.demoVideoUrl} />
            </div>
          )}

          {t.sampleClassVideoUrl && (
            <button className="btn btn-green" onClick={() => setShowSample(true)}>
              Xem lớp học mẫu
            </button>
          )}
          <button className="btn btn-green" onClick={() => setShowConsult(true)}>
            Học với giáo viên này
          </button>
        </div>
      </div>

      {/* Modal sample class (portal) */}
      <VideoModal
        open={showSample}
        src={t.sampleClassVideoUrl}
        onClose={() => setShowSample(false)}
      />
      <ConsultationForm
        variant="modal"
        isOpen={showConsult}
        onClose={() => setShowConsult(false)}
        source="home"
        teacherName={t.fullName}
        teacherId={id}
      />
    </div>
  );
}
