import React, { useEffect, useMemo, useState, useCallback } from "react";
import "../../styles/CustomerHome.css";
import { TeacherCard } from "../../components/teacher/TeacherCard";
import { apiGetTeachers } from "../../apis/teacher";
import { TIME_OF_DAY, DAYS, TAGS, GENDERS, COUNTRIES, CERTS_LIST} from "../../utils/constants"




const CustomerHome = () => {
  const [q, setQ] = useState("");
  const [showTime, setShowTime] = useState(false);
  const [showTag, setShowTag] = useState(false);
  const [showOther, setShowOther] = useState(false);

  const [timeOfDay, setTimeOfDay] = useState([]);
  const [days, setDays] = useState([]);
  const [tags, setTags] = useState([]);
  const [gender, setGender] = useState([]);
  const [countries, setCountries] = useState([]);
  const [level, setLevel] = useState([]);
  const [certs, setCerts] = useState([]);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);

  // phân trang 5/sp
  const [page, setPage] = useState(1);
  const limit = 5;
  const [hasMore, setHasMore] = useState(false);

  const currentFilters = useMemo(() => {
    const chips = [];
    if (q) chips.push(q);
    if (timeOfDay.length) chips.push(...timeOfDay.map(x => `Time: ${x.replaceAll("_"," ")}`));
    if (days.length) chips.push(...days.map(d => DAYS[d]));
    if (tags.length) chips.push(...tags.map(t => `#${t}`));
    if (countries.length) chips.push(...countries);
    if (gender.length) chips.push(...gender);
    if (level.length) chips.push(...level);
    if (certs.length) chips.push(...certs);
    return chips;
  }, [q, timeOfDay, days, tags, countries, gender, level, certs]);

  const fetchTeachers = useCallback(async ({ append = false, p = 1, q, tags, countries, gender, level, certs, timeOfDay: tod, days: dayIdxs, }) => {
    setLoading(true);
    try {
      const params = {
        sort: "rating_desc",
        limit,
        page: p,
        search: q || undefined,
        specialties: (tags && tags.length) ? tags.join(",") : undefined,
        country: (countries && countries.length) ? countries.join(",") : undefined,
        gender: (gender && gender.length) ? gender.join(",") : undefined,
        level: (level && level.length) ? level.join(",") : undefined,
        certs: (certs && certs.length) ? certs.join(",") : undefined,
        // LẤY từ tham số truyền vào, không phải từ biến state đóng trên
        timeOfDay: tod?.length ? tod.join(",") : undefined,
        days: dayIdxs?.length ? dayIdxs.join(",") : undefined,
      };
      console.log(params);
  
      const { data } = await apiGetTeachers(params);
  
      const newItems = data.items || [];
      setItems(prev => (append ? [...prev, ...newItems] : newItems));
  
      const total = data?.meta?.total;
      setMeta(data.meta || { total: typeof total === "number" ? total : newItems.length });
  
      // nếu không có total, suy bằng độ dài trang
      const more = typeof total === "number" ? (p * limit < total) : (newItems.length === limit);
      setHasMore(more);
    } catch (e) {
      console.error("Fetch teachers failed", e);
      setItems([]);
      setMeta({ total: 0 });
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []); // <- ổn định, không phụ thuộc state
  const refresh = useCallback(() => {
    fetchTeachers({ append: false, p: 1, q, tags, countries, gender, level, certs, timeOfDay, days });
  }, [fetchTeachers, q, tags, countries, gender, level, certs, timeOfDay, days]);
  
  useEffect(() => {
    refresh();
  }, [refresh]);


  const onSearch = () => {
    setPage(1);
    fetchTeachers({ append: false, p: 1, q, tags, countries, gender, level, certs, timeOfDay, days, });
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchTeachers({ append: true, p: next, q, tags, countries, gender, level, certs, timeOfDay, days, });
  };

  const toggle = (arrSetter, arr, value) => {
    if (arr.includes(value)) arrSetter(arr.filter(v => v !== value));
    else arrSetter([...arr, value]);
  };

  return (
    <>
      {/* ======= HERO / SEARCH ======= */}
      <section className="ant-search">
        <div className="ant-container">
          <h3>TÌM GIÁO VIÊN TIẾNG ANH TỐT NHẤT</h3>
          <p>Tìm giáo viên tiếng Anh tốt nhất trên toàn cầu</p>

          <div className={`ant-search-box ${ (showTime||showTag||showOther) ? 'is-open' : '' }`} id="search-teacher-box">
            <div className="ant-row">
              {/* Input + icon search */}
              <div className="ant-col input-col">
                <div className="ant-input-wrap">
                  <svg className="ant-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M21 21l-4.35-4.35m1.85-5.4a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Bạn muốn học gì?"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSearch()}
                  />
                </div>
              </div>

              {/* Time */}
              <div className="ant-col filter-col">
                <button
                  className={`btn btn-default popover-btn time ${showTime ? 'is-open' : ''}`}
                  onClick={() => { setShowTime(v=>!v); setShowTag(false); setShowOther(false); }}
                  aria-expanded={showTime}
                >
                  Thời gian
                  <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                {showTime && (
                  <div className="ant-search-popup">
                    <div className="ant-popup-section">
                      <h4>Buổi</h4>
                      <div className="ant-row">
                        {TIME_OF_DAY.map((t) => (
                          <label key={t.id} className="ant-col half">
                            <input
                              type="checkbox"
                              checked={timeOfDay.includes(t.id)}
                              onChange={() => toggle(setTimeOfDay, timeOfDay, t.id)}
                            />
                            <span>{t.label}</span>
                            <span className="ant-help" title={t.hint}>?</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="ant-popup-section">
                      <h4>Ngày trong tuần</h4>
                      <div className="ant-row">
                        {DAYS.map((d, idx) => (
                          <label key={d} className="ant-col half">
                            <input
                              type="checkbox"
                              checked={days.includes(idx)}
                              onChange={() => toggle(setDays, days, idx)}
                            />
                            <span>{d}</span>
                          </label>
                        ))}
                      </div>
                      <div className="ant-popup-actions">
                        <button className="btn apply-btn" onClick={() => setShowTime(false)}>Apply</button>
                        <button className="btn clear-btn" onClick={() => { setTimeOfDay([]); setDays([]); }}>Clear All</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tag */}
              <div className="ant-col filter-col">
                <button
                  className={`btn btn-default popover-btn tag ${showTag ? 'is-open' : ''}`}
                  onClick={() => { setShowTag(v=>!v); setShowTime(false); setShowOther(false); }}
                  aria-expanded={showTag}
                >
                  Thẻ
                  <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                {showTag && (
                  <div className="ant-search-popup">
                    <div className="ant-row tag-row">
                      {TAGS.map((t) => (
                        <label key={t} className="ant-col quarter tag">
                          <input
                            type="checkbox"
                            checked={tags.includes(t)}
                            onChange={() => toggle(setTags, tags, t)}
                          />
                          <span>{t}</span>
                        </label>
                      ))}
                    </div>
                    <div className="ant-popup-actions">
                      <button className="btn apply-btn" onClick={() => setShowTag(false)}>Apply</button>
                      <button className="btn clear-btn" onClick={() => setTags([])}>Clear All</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Other */}
              <div className="ant-col filter-col">
                <button
                  className={`btn btn-default popover-btn other ${showOther ? 'is-open' : ''}`}
                  onClick={() => { setShowOther(v=>!v); setShowTime(false); setShowTag(false); }}
                  aria-expanded={showOther}
                >
                  Khác
                  <svg className="chev" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                {showOther && (
                <div className="ant-search-popup">
                  <div className="ant-popup-section">
                    <h4>Giới tính</h4>
                    <div className="ant-row">
                      {GENDERS.map(g => (
                        <label key={g.value} className="ant-col half">
                          <input
                            type="checkbox"
                            checked={gender.includes(g.value)}
                            onChange={() => toggle(setGender, gender, g.value)}
                          />
                          <span>{g.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="ant-popup-section">
                    <h4>Quốc gia</h4>
                    <div className="ant-row">
                      {COUNTRIES.map(c => (
                        <label key={c.value} className="ant-col half">
                          <input
                            type="checkbox"
                            checked={countries.includes(c.value)}
                            onChange={() => toggle(setCountries, countries, c.value)}
                          />
                          <span>{c.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="ant-popup-section">
                    <h4>Chứng chỉ</h4>
                    <div className="ant-row cert-row">
                      {CERTS_LIST.map(cert => (
                        <label key={cert.value} className="ant-col half">{/* 2 cột */}
                          <input
                            type="checkbox"
                            checked={certs.includes(cert.value)}
                            onChange={() => toggle(setCerts, certs, cert.value)}
                          />
                          <span>{cert.label}</span>
                        </label>
                      ))}
                    </div>
                    <div className="ant-popup-actions">
                      <button className="btn apply-btn" onClick={() => setShowOther(false)}>Apply</button>
                      <button
                        className="btn clear-btn"
                        onClick={() => { setGender([]); setCountries([]); setLevel([]); setCerts([]); }}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              </div>

              {/* Search button */}
              <div className="ant-col do-search">
                <button id="search-btn" className="btn green-btn" onClick={onSearch}>Tìm giáo viên</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======= RESULT ======= */}
      <div className="ant-container ant-result-wrap">
        <div className="ant-row">
          <div className="ant-col main-col">
            <div className="ant-current-filter">
              <span>Tìm kiếm hiện tại: </span>
              <div className="ant-filter-list">
                {currentFilters.map((f, idx) => (
                  <span key={idx} className="ant-chip">{f}</span>
                ))}
              </div>
            </div>

            <div className="ant-result-head">
              {loading ? <p>Đang tải…</p> : <p>{meta?.total ?? 0} kết quả tìm được</p>}
            </div>

            <div className="ant-result-list">
              {items.map((t) => <TeacherCard key={t.id} t={t} />)}
              {!loading && !items.length && <div className="ant-empty">Không tìm thấy giáo viên phù hợp.</div>}
            </div>

            {hasMore && (
              <button className="btn white-btn ant-load-more" onClick={loadMore}>
                Tải thêm
              </button>
            )}
          </div>

          <aside className="ant-col side-col">
            <div className="ant-join text-center">
              <h4>Tham gia với chúng tôi</h4>
              <p className="text-left">
                Hãy tham gia cộng đồng giáo viên trên toàn cầu và tạo ra cách học trực tuyến mới.
              </p>
              <a className="btn green-btn" href="https://members.antoree.com/teacher-register?utm_source=search_teacher" target="_blank" rel="noreferrer">
                Trở thành giáo viên
              </a>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default CustomerHome;
