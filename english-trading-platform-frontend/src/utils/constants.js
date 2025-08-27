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