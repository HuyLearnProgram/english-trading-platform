// một vài tag/time mẫu cho popover
export const TIME_OF_DAY = [
  { id: 'early_morning', label: 'Early morning', hint: '5:00–7:00' },
  { id: 'morning',        label: 'Morning',       hint: '7:00–11:00' },
  { id: 'noon',           label: 'Noon',          hint: '11:00–13:00' },
  { id: 'afternoon',      label: 'Afternoon',     hint: '13:00–17:00' },
  { id: 'evening',        label: 'Evening',       hint: '17:00–19:00' },
  { id: 'late_evening',   label: 'Late evening',  hint: '19:00–22:00' },
  { id: 'late_night',     label: 'Late night',    hint: '22:00–23:00' },
];
export const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];
export const TAGS = [
  'Kid', 'Work', 'Giọng Nam', 'Accounting', 'Giọng Bắc', 'Biology', 'Finance', 'Medical',
  'Bible', 'Kindergarten', 'American English', 'Giọng Trung', 'British English', 'Teenager',
  'Beginner', 'A1', 'Pre A1', 'A2', 'Intermediate', 'Advanced', 'Pronunciation', 'Grammar',
  'Listening', 'Speaking', 'Reading', 'Writing', 'Test preparation', 'Visual aids',
  'Power point', 'Video', 'Economy', 'Business', 'Morning', 'Afternoon',
];

// === Khác (Other) ===
export const GENDERS = [
  { value: 'Male',   label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other',  label: 'Other' },
];

export const COUNTRIES = [
  { value: 'Vietnam',     label: 'Vietnam (Việt Nam)' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Premium',     label: 'Premium' },
  { value: 'Native',      label: 'Native' },
];

export const CERTS_LIST = [
  { value: 'TOEFL',  label: 'TOEFL' },
  { value: 'TOEIC',  label: 'TOEIC' },
  { value: 'IELTS',  label: 'IELTS' },
  { value: 'TESOL',  label: 'TESOL' },
  { value: 'Other',  label: 'Other' },
  { value: 'CEFR',   label: 'CEFR' },
  { value: 'CELTA',  label: 'CELTA' },
  { value: 'TEFL',   label: 'TEFL' },
  { value: 'Bachelor degree in English Teaching', label: 'Bachelor degree in English Teaching' },
  { value: 'Master degree in English Teaching',   label: 'Master degree in English Teaching' },
  { value: 'PhD degree in English Teaching',      label: 'PhD degree in English Teaching' },
];

export const trackBanners = [
    {
      href: 'https://prepedu.com/vi/ielts?utm_source=website&utm_medium=bannerblog',
      src: 'https://static-assets.prepcdn.com/content-management-system/prepedu_giam_gia_va_tang_qua_khi_mua_lo_trinh_hoc_ielts_2_khoa_tro_len_0f71826993.gif',
      alt: 'Đăng ký lộ trình IELTS',
    },
    {
      href: 'https://prepedu.com/vi/toeic?ref=blog',
      src: 'https://static-assets.prepcdn.com/content-management-system/hoc_toeic_4_ky_nang_cung_prep_3404f79608.png',
      alt: 'Lộ trình học TOEIC',
    },
    {
      href: 'https://prepedu.com/vi/prep-talk-english?ref=blog',
      src: 'https://static-assets.prepcdn.com/content-management-system/hoc_tieng_anh_giao_tiep_cung_prep_talk_c340b99738.png',
      alt: 'Học tiếng Anh giao tiếp cùng Antoree Talk',
    },
  ];


export  const placeholderImg = 'https://via.placeholder.com/768x432.png?text=No+Image';

export const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'new', label: 'Mới' },
  { value: 'contacted', label: 'Đã liên hệ' },
  { value: 'scheduled', label: 'Đã đặt lịch' },
  { value: 'done', label: 'Hoàn tất' },
  { value: 'canceled', label: 'Huỷ' },
];

export const SORTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'popular', label: 'Phổ biến' },
];


// Helper lấy thông điệp lỗi từ Axios/Nest
export const getErrMsg = (e) => {
  const d = e?.response?.data;
  if (!d) return e?.message || 'Có lỗi xảy ra.';
  if (typeof d.message === 'string') return d.message;
  if (Array.isArray(d.message)) return d.message.join(', ');
  return d.error || 'Có lỗi xảy ra.';
};


// User Account Manager
export const Account_ROLES = [
  { value: '',         label: 'Tất cả vai trò' },
  { value: 'admin',    label: 'Admin' },
  { value: 'teacher',  label: 'Teacher' },
  { value: 'student',  label: 'Student' },
];

export const Account_STATUS = [
  { value: '',         label: 'Tất cả trạng thái' },
  { value: 'visible',  label: 'Hiện' },
  { value: 'hidden',   label: 'Ẩn (bị khóa)' },
];

export const Account_badgeClass = (s) =>
  s === 'visible' ? 'badge green' :
  s === 'hidden'  ? 'badge red'   : 'badge gray';

export const Account_SORTS = [
  { value: 'email_asc',  label: 'Email A → Z' },
  { value: 'email_desc', label: 'Email Z → A' },
  { value: 'status',     label: 'Theo trạng thái' },
  { value: 'role',       label: 'Theo vai trò' },
];

// Manage Refund Request

export const Refund_STATUS = [
  { value: '',         label: 'Tất cả'   },
  { value: 'pending',  label: 'Pending'  },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export const Refund_badgeClass = (s) =>
  s === 'approved' ? 'badge green' :
  s === 'rejected' ? 'badge red' :
  'badge amber';

export const Refund_SORTS = [
  { value: 'created_desc', label: 'Mới nhất' },
  { value: 'created_asc',  label: 'Cũ nhất'  },
  { value: 'status',       label: 'Theo trạng thái' },
  { value: 'eligible',     label: 'Eligible trước'  },
  { value: 'teacher',      label: 'Theo Teacher ID' },
  { value: 'student',      label: 'Theo Student ID' },
];

export function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  const as = (n, u) => `${n} ${u} trước`;
  if (diff < 60) return as(diff, 'giây');
  const m = Math.floor(diff / 60);
  if (m < 60) return as(m, 'phút');
  const h = Math.floor(diff / 3600);
  if (h < 24) return as(h, 'giờ');
  const day = Math.floor(diff / 86400);
  if (day < 7) return as(day, 'ngày');
  return d.toLocaleString('vi-VN');
}

// Order
export const formatWeeks = (weeks) => {
  const m = Math.floor(weeks / 4);
  const w = weeks % 4;
  if (m > 0 && w > 0) return `${weeks} tuần (≈ ${m} tháng ${w} tuần)`;
  if (m > 0) return `${weeks} tuần (≈ ${m} tháng)`;
  return `${weeks} tuần`;
};

export const DAY_KEYS = ['mon','tue','wed','thu','fri','sat','sun'];
export const LABELS  = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'];

export const toMin = (hhmm) => {
  const [h,m] = String(hhmm||'').split(':').map(n=>parseInt(n,10));
  return h*60 + m;
};
export const toHHMM = (m) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;

export const avatarUrlPlaceholder = "https://cdn-icons-png.flaticon.com/512/3541/3541871.png";