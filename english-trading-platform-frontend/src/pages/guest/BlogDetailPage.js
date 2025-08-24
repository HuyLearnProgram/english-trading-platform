import React, { useMemo, useRef } from "react";
import {
  Home,
  ChevronRight,
  Search,
  ArrowRight,
  Globe,
} from "lucide-react";

/**
 * Blog page UI inspired by the screenshot the user provided.
 * - TailwindCSS for styling
 * - Responsive 3-column layout (content + right sidebar)
 * - Breadcrumbs, title, category pill
 * - Table of contents with in-page anchors
 * - Figures, callouts, and article sections
 * - Premium & Related posts carousels (simple scroll + arrows)
 * - Author card, comments box
 * - Right sidebar with search + banners + social links
 */

const data = {
  breadcrumbs: [
    { label: "Trang chủ", href: "/vi/" },
    { label: "Blog vi", href: "/vi/blog" },
    { label: "Tiếng Anh Giao tiếp", href: "/vi/blog/conversational-english" },
    { label: "Tiếng Anh Giao tiếp Nói", href: "/vi/blog/conversationalglish-speaking" },
    { label: "Tổng hợp hội thoại tiếng Anh về chủ đề âm nhạc", href: "/vi/blog/hoi-thoai-tieng-anh-ve-chu-de-am-nhac" },
  ],
  category: { label: "TIẾNG ANH GIAO TIẾP NÓI", href: "/vi/blog/conversationalglish-speaking" },
  title: "Tổng hợp hội thoại tiếng Anh về chủ đề âm nhạc",
  bulletLinks: [
    { label: "Quy tắc biên tập và xuất bản nội dung", href: "/vi/content-publishing-rules" },
  ],
  hero: {
    src: "https://static-assets.prepcdn.com/content-management-system/hoi_thoai_tieng_anh_ve_chu_de_am_nhac_6b17813d22.png",
    caption: "Các mẫu hội thoại tiếng Anh về chủ đề âm nhạc thông dụng nhất",
  },
  toc: [
    { id: "vocab", label: "I. Từ vựng tiếng Anh chủ đề Âm nhạc (Music)" },
    {
      id: "dialogs",
      label: "II. Tổng hợp hội thoại tiếng Anh về chủ đề Âm nhạc",
      children: [
        { id: "fav-artist", label: "1. Hỏi ca sĩ / ban nhạc yêu thích" },
        { id: "instrument", label: "2. Hỏi về nhạc cụ" },
        { id: "fav-song", label: "3. Chia sẻ bài hát yêu thích" },
        { id: "concert", label: "4. Thảo luận về buổi hòa nhạc" },
        { id: "movie-music", label: "5. Âm nhạc trong phim" },
      ],
    },
    { id: "videos", label: "III. Video tham khảo" },
  ],
  premiumPosts: [
    {
      title: "Tiếng Anh 10 Unit 6 Listening: Audio & Đáp Án",
      href: "#",
      image:
        "https://static-assets.prepcdn.com/content-management-system/tieng_anh_10_unit_6_listening_b18cb819f7.jpg",
      tags: ["PREMIUM"],
    },
    {
      title: "Tiếng Anh 10 Unit 2 Speaking Humans and Environment",
      href: "#",
      image:
        "https://static-assets.prepcdn.com/content-management-system/tieng_anh_10_unit_2_speaking_2a2738afcd.jpg",
      tags: ["PREMIUM"],
    },
    {
      title: "Destination B1 - Từ vựng & ngữ pháp B1",
      href: "#",
      image:
        "https://static-assets.prepcdn.com/content-management-system/sach_destination_b1_a5f898d908.jpg",
      tags: ["PREMIUM", "IELTS TỪ VỰNG"],
    },
    {
      title: "Review bộ sách Master TOPIK",
      href: "#",
      image:
        "https://cms-static-assets.prepcdn.com/uploads/sach_tieng_han_master_topik_11bfe163fc.png",
      tags: ["PREMIUM"],
    },
    {
      title: "Giáo trình Hán ngữ Quyển 3",
      href: "#",
      image:
        "https://cms-static-assets.prepcdn.com/uploads/sach_giao_trinh_han_ngu_quyen_3_7c5e2e7462.jpg",
      tags: ["PREMIUM"],
    },
  ],
  related: [
    {
      title: "Top 7+ trung tâm tiếng Anh cho người mất gốc",
      href: "#",
      image:
        "https://static-assets.prepcdn.com/content-management-system/trung_tam_hoc_tieng_anh_cho_nguoi_mat_goc_1_12c40a14a3.png",
    },
    {
      title: "Khóa học tiếng Anh cho người mất gốc: tổng hợp & lộ trình",
      href: "#",
      image:
        "https://static-assets.prepcdn.com/content-management-system/khoa_hoc_tieng_anh_cho_nguoi_mat_goc_cfea5bd935.png",
    },
    {
      title: "Tiếng Anh 10 Unit 9 Reading - Bài đọc & đáp án",
      href: "#",
      image:
        "https://static-assets.prepcdn.com/content-management-system/tieng_anh_10_unit_9_reading_587bb6249d.jpg",
    },
    {
      title: "Tiếng Anh 10 Unit 9 Protecting The Environment",
      href: "#",
      image:
        "https://static-assets.prepcdn.com/content-management-system/tieng_anh_10_unit_9_37b63baaa9.jpg",
    },
    {
      title: "Tiếng Anh 10 Unit 8 Communication and Culture",
      href: "#",
      image:
        "https://static-assets.prepcdn.com/content-management-system/tieng_anh_10_unit_8_communication_and_culture_974dc20b99.jpg",
    },
    {
      title: "Tiếng Anh 10 Unit 8 Getting Started – Khởi động",
      href: "#",
      image:
        "https://static-assets.prepcdn.com/content-management-system/tieng_anh_10_unit_8_getting_started_48dd9264aa.jpg",
    },
  ],
  author: {
    name: "Hien Hoang",
    role: "Product Content Admin",
    avatar:
      "https://static-assets.prepcdn.com/content-management-system/hien_admin_author_globalx333_231467379a.png",
    bio: `Chào bạn! Mình là Hiền Hoàng, hiện đang đảm nhận vai trò quản trị nội dung sản phẩm tại Blog.
Với hơn 5 năm tự học ngoại ngữ và ôn luyện IELTS, TOEIC, mình hy vọng những chia sẻ sẽ giúp ích cho bạn trong quá trình tự học hiệu quả!`,
    socials: {
      linkedin: "https://www.linkedin.com/",
      website: "https://example.com",
      youtube: "https://youtube.com",
      x: "https://x.com",
      tiktok: "https://www.tiktok.com/",
      instagram: "https://www.instagram.com/",
    },
  },
  banners: [
    {
      href: "https://prepedu.com/vi/ielts",
      src: "https://static-assets.prepcdn.com/content-management-system/prep_giam_gia_va_tang_qua_khi_mua_lo_trinh_hoc_ielts_2_khoa_tro_len_cead702a0b.gif",
      alt: "Đăng ký lộ trình IELTS 2 khóa trở lên",
    },
    {
      href: "https://prepedu.com/vi/toeic?ref=blog",
      src: "https://static-assets.prepcdn.com/content-management-system/hoc_toeic_4_ky_nang_cung_prep_3404f79608.png",
      alt: "Lộ trình học TOEIC",
    },
    {
      href: "https://prepedu.com/vi/prep-talk-english?ref=blog",
      src: "https://static-assets.prepcdn.com/content-management-system/hoc_tieng_anh_giao_tiep_cung_prep_talk_c340b99738.png",
      alt: "Học tiếng Anh giao tiếp cùng PREP Talk",
    },
  ],
};

const Pill = ({ children, color = "blue" }) => (
  <span
    className={
      `rounded-md px-[7px] text-[10px] font-bold leading-5 tracking-tight ` +
      (color === "blue"
        ? "bg-blue-200 text-blue-600"
        : color === "orange"
        ? "bg-orange-200 text-orange-600"
        : "bg-gray-200 text-gray-700")
    }
  >
    {children}
  </span>
);

function Breadcrumbs() {
  return (
    <nav className="flex text-sm text-gray-400" aria-label="Breadcrumb">
      <ol className="inline-flex items-center flex-wrap space-x-1 md:space-x-3">
        {data.breadcrumbs.map((b, i) => (
          <li key={b.href} className="inline-flex items-center">
            {i === 0 ? (
              <a href={b.href} className="inline-flex items-center hover:text-blue-500">
                <Home className="mr-2 h-4 w-4" />
                {b.label}
              </a>
            ) : (
              <>
                <ChevronRight className="mx-1 h-5 w-5 text-gray-400" />
                <a href={b.href} className="ml-1 hover:text-blue-500">
                  {b.label}
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function SearchBox({ placeholder = "Tìm kiếm" }) {
  return (
    <form className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white h-12 px-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
        <input
          name="searchValue"
          placeholder={placeholder}
          className="w-full bg-transparent outline-none placeholder:text-gray-500"
        />
        <Search className="h-4 w-4 text-blue-900" />
      </div>
    </form>
  );
}

function TOC() {
  return (
    <div className="toc_main border border-gray-200 rounded-md p-4 bg-white" contentEditable={false}>
      <ol className="space-y-2">
        {data.toc.map((t) => (
          <li key={t.id} className="pl-1">
            <a className="text-blue-600 hover:underline" href={`#${t.id}`}>
              {t.label}
            </a>
            {t.children && (
              <ol className="mt-2 space-y-1 pl-4">
                {t.children.map((c) => (
                  <li key={c.id}>
                    <a className="text-blue-600 hover:underline" href={`#${c.id}`}>
                      {c.label}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Figure({ src, caption, alt }) {
  return (
    <figure className="my-6">
      <img src={src} alt={alt || caption} className="w-full rounded-md bg-gray-100" />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-600">{caption}</figcaption>
      )}
    </figure>
  );
}

function PremiumCarousel({ title = "Nội dung premium", items = data.premiumPosts }) {
  const ref = useRef(null);
  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector(".premium-card");
    const step = card ? card.clientWidth + 32 : 300; // gap-8
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };
  return (
    <div className="relative w-full rounded-lg bg-gradient-to-b from-[#FFD324] to-[#FF9F00] p-1">
      <div className="rounded-lg bg-white">
        <div className="px-4 md:px-6 pb-2 pt-3">
          <div className="flex items-center">
            <h2 className="gradient-text text-lg md:text-xl font-semibold text-yellow-500">
              {title}
            </h2>
            <a href="#all" className="ml-auto text-sm text-blue-600 flex items-center gap-2">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="relative px-4 md:px-6 pb-8">
          <div className="flex items-center gap-2">
            <button
              aria-label="Prev"
              onClick={() => scrollBy(-1)}
              className="hidden md:flex p-2 rounded-full bg-white shadow border hover:bg-gray-50"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
            <div
              ref={ref}
              className="flex overflow-x-auto gap-8 scroll-smooth snap-x snap-mandatory w-full"
            >
              {items.map((p, i) => (
                <a
                  key={i}
                  className="premium-card group min-w-[260px] w-[260px] snap-start"
                  href={p.href}
                >
                  <div className="aspect-video w-full overflow-hidden rounded-md bg-gray-100">
                    <img src={p.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <h3 className="mt-3 text-base font-medium group-hover:text-blue-600 line-clamp-2">
                    {p.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.tags?.map((t) => (
                      <Pill key={t} color={t === "PREMIUM" ? "orange" : "blue"}>{t}</Pill>
                    ))}
                  </div>
                </a>
              ))}
            </div>
            <button
              aria-label="Next"
              onClick={() => scrollBy(1)}
              className="hidden md:flex p-2 rounded-full bg-white shadow border hover:bg-gray-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedCarousel({ items = data.related }) {
  const ref = useRef(null);
  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector(".related-card");
    const step = card ? card.clientWidth + 60 : 480; // gap-15 (60px)
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };
  return (
    <div className="relative mt-10 md:mt-[60px]">
      <div className="flex items-center gap-2">
        <h2 className="text-md md:text-xl font-semibold text-gray-900 flex items-center">
          <svg width="7" height="7" viewBox="0 0 7 7" className="mr-[10px]"><path d="M5.23.095H.82C.37.095 0 .497 0 1.003v4.89c0 .5.36.908.82.908h4.41c.45 0 .82-.403.82-.908V1.003c0-.5-.37-.908-.82-.908Z" fill="#FF9E00"/></svg>
          Bài viết liên quan
        </h2>
        <div className="ml-auto hidden md:flex gap-2">
          <button onClick={() => scrollBy(-1)} className="p-2 rounded-full bg-white shadow border">
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <button onClick={() => scrollBy(1)} className="p-2 rounded-full bg-white shadow border">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="relative mt-6">
        <div ref={ref} className="flex overflow-x-auto gap-[60px] scroll-smooth">
          {items.map((r, i) => (
            <a key={i} className="related-card group min-w-[422px] w-[422px]" href={r.href}>
              <div className="rounded-md bg-gray-100 overflow-hidden">
                <img src={r.image} alt="" className="aspect-video w-full object-cover" />
              </div>
              <h3 className="mt-3 text-base font-medium group-hover:text-blue-600 line-clamp-2">
                {r.title}
              </h3>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthorCard() {
  const a = data.author;
  return (
    <div className="mb-10 mt-6 flex gap-6 rounded-md bg-[#FAFAFA] p-6 md:p-8">
      <div className="w-3/12 min-w-[120px] max-w-[220px]">
        <img src={a.avatar} alt="author" className="w-full rounded-md bg-gray-100" />
      </div>
      <div className="w-9/12">
        <div className="text-md font-bold">{a.name}</div>
        <div className="mb-4 text-xs text-gray-500">{a.role}</div>
        <p className="text-sm text-gray-800 line-clamp-4 whitespace-pre-line">{a.bio}</p>
        <div className="mt-4 flex gap-3 items-center">
          {/* <a target="_blank" rel="noreferrer" href={a.socials.linkedin} className="h-8 w-8 rounded-full bg-[#0B9CDA] p-1.5 flex items-center justify-center">
            <Linkedin className="text-white h-5 w-5" />
          </a> */}
          <a target="_blank" rel="noreferrer" href={a.socials.website} className="h-8 w-8 rounded-full bg-[#F49000] p-1.5 flex items-center justify-center">
            <Globe className="text-white h-5 w-5" />
          </a>
          {/* <a target="_blank" rel="noreferrer" href={a.socials.youtube} className="h-8 w-8 rounded-full bg-[#EC263E] p-1.5 flex items-center justify-center">
            <Youtube className="text-white h-5 w-5" />
          </a>
          <a target="_blank" rel="noreferrer" href={a.socials.x} className="h-8 w-8 rounded-full bg-black p-1.5 flex items-center justify-center">
            <Twitter className="text-white h-5 w-5" />
          </a> */}
        </div>
      </div>
    </div>
  );
}

function CommentsBox() {
  return (
    <div className="mt-10 md:mt-[60px] space-y-6">
      <div>
        <h3 className="text-md md:text-xl font-semibold text-gray-900 flex items-center">
          <svg width="7" height="7" viewBox="0 0 7 7" className="mr-[10px]"><path d="M5.23.095H.82C.37.095 0 .497 0 1.003v4.89c0 .5.36.908.82.908h4.41c.45 0 .82-.403.82-.908V1.003c0-.5-.37-.908-.82-.908Z" fill="#FF9E00"/></svg>
          Bình luận
        </h3>
      </div>

      <form className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label className="mb-2 block text-sm font-medium text-gray-700">Họ và tên</label>
          <div className="h-14 flex items-center rounded-lg border border-neutral-200 bg-white px-4">
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Nhập họ và tên của bạn"
              name="authorName"
            />
          </div>
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
          <div className="h-14 flex items-center rounded-lg border border-neutral-200 bg-white px-4">
            <input className="w-full bg-transparent outline-none" placeholder="Nhập địa chỉ email của bạn" />
          </div>
        </div>
        <div className="col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">Bình luận</label>
          <textarea rows={5} maxLength={300} placeholder="Nhập bình luận" className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 outline-none" />
          <div className="mt-2 flex justify-end text-sm text-gray-500">0/300 ký tự</div>
        </div>
        <div className="col-span-2">
          <button type="button" className="btn-primary rounded-xl bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
            Gửi bình luận <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function RightSidebar() {
  return (
    <aside className="px-4 md:px-0 xl:col-span-1">
      <div className="hidden xl:block">
        <h2 className="mb-6 text-[18px] font-semibold text-gray-900">Tìm kiếm bài viết học tập</h2>
        <SearchBox />
      </div>

      <h2 className="mb-6 mt-12 text-lg font-semibold text-gray-900">Lộ trình cá nhân hoá</h2>
      <div className="flex flex-col gap-6">
        <div className="hidden xl:flex flex-col gap-6">
          {data.banners.map((b, i) => (
            <a key={i} href={b.href} target="_blank" rel="noreferrer">
              <img src={b.src} alt={b.alt} className="w-full rounded-md" />
            </a>
          ))}
        </div>
        {/* Mobile swiper substitute: simple stacked cards */}
        <div className="xl:hidden space-y-6">
          {data.banners.map((b, i) => (
            <a key={i} href={b.href} target="_blank" rel="noreferrer" className="block">
              <img src={b.src} alt={b.alt} className="w-full rounded-md" />
            </a>
          ))}
        </div>
      </div>

      <h2 className="mb-6 mt-12 text-lg font-semibold text-gray-900">Kết nối với Prep</h2>
      <div className="grid grid-cols-3 gap-4">
        <a href="https://www.facebook.com/prep.official" target="_blank" rel="noreferrer">
          <img
            src="https://static-assets.prepcdn.com/content-management-system/facebook_7f55de3daf.png"
            alt="facebook"
            className="rounded"
          />
        </a>
        <a href="https://www.youtube.com/@Prepvn" target="_blank" rel="noreferrer">
          <img
            src="https://static-assets.prepcdn.com/content-management-system/youtube_05a4578628.png"
            alt="youtube"
            className="rounded"
          />
        </a>
        <a href="https://www.instagram.com/prepedu/" target="_blank" rel="noreferrer">
          <img
            src="https://static-assets.prepcdn.com/content-management-system/instagram_2c0a9d8419.png"
            alt="instagram"
            className="rounded"
          />
        </a>
      </div>
    </aside>
  );
}

export default function BlogDetailPage() {
  const breadcrumb = useMemo(() => <Breadcrumbs />, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Container */}
      <div className="mx-auto max-w-[343px] md:max-w-[610px] xl:max-w-[1216px] px-0 md:px-0">
        {/* Top: Breadcrumbs */}
        <div className="flex items-center justify-between gap-4">
          <div className="overflow-x-hidden py-4 md:py-6">{breadcrumb}</div>
        </div>

        {/* Divider line under breadcrumb */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200" />

        {/* Main grid */}
        <div className="my-4 grid grid-cols-4 gap-8 md:my-6">
          {/* Left column for mobile search */}
          <div className="col-span-4 xl:hidden">
            <div className="rounded-sm bg-[#F3F3F3] p-4">
              <h3 className="mb-6 text-[18px] font-semibold">Tìm kiếm bài viết học tập</h3>
              <SearchBox />
            </div>
          </div>

          {/* Content */}
          <main className="col-span-4 xl:col-span-3 px-4 md:px-0">
            <h1 className="text-lg md:text-2xl font-semibold">{data.title}</h1>

            {/* Category pill */}
            <div className="subcategory mt-4 flex flex-wrap gap-2">
              <a href={data.category.href} className="inline-flex">
                <span className="rounded-md bg-blue-200 px-[7px] text-[10px] font-bold text-blue-600">
                  {data.category.label}
                </span>
              </a>
            </div>

            {/* tiny divider */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 py-2.5" />

            {/* bullet links */}
            <ul className="mt-4 list-disc list-inside text-xs md:ml-4">
              {data.bulletLinks.map((l) => (
                <li key={l.href} className="font-medium">
                  <a href={l.href} className="text-gray-900 hover:text-blue-600">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="my-4 h-px w-full bg-gray-200" />

            {/* Article content */}
            <article className="prose-prep-post-blog text-[15px] leading-7">
              <div className="my-6 space-y-4">
                <p>
                  Bạn đang tìm kiếm các mẫu hội thoại tiếng Anh về chủ đề âm nhạc để cải thiện kỹ năng giao tiếp? Âm
                  nhạc không chỉ thú vị mà còn là cách tuyệt vời để học từ vựng, cấu trúc câu mới.
                </p>
                <p className="italic text-gray-700">
                  *Bài viết được biên soạn dưới sự hướng dẫn của đội ngũ chuyên môn và giáo viên có kinh nghiệm.*
                </p>
              </div>

              <Figure src={data.hero.src} caption={data.hero.caption} />

              {/* TOC */}
              <TOC />

              {/* Sections */}
              <section id="vocab" className="mt-8">
                <h2 className="text-xl font-semibold">I. Từ vựng tiếng Anh chủ đề Âm nhạc (Music)</h2>
                <p className="mt-3">
                  Một vài từ vựng nền tảng giúp bạn theo dõi hội thoại tốt hơn: melody (giai điệu), rhythm (nhịp điệu),
                  tempo (nhịp độ), harmony (hòa âm), instrument (nhạc cụ), concert (hòa nhạc)...
                </p>
                <Figure
                  src="https://static-assets.prepcdn.com/content-management-system/hoi_thoai_tieng_anh_ve_chu_de_am_nhac_2494f0fffe.png"
                  caption="Từ vựng tiếng Anh chủ đề Âm nhạc (Music)"
                />
              </section>

              <section id="dialogs" className="mt-10">
                <h2 className="text-xl font-semibold">II. Tổng hợp hội thoại tiếng Anh về chủ đề Âm nhạc</h2>

                <Figure
                  src="https://static-assets.prepcdn.com/content-management-system/hoi_thoai_tieng_anh_ve_chu_de_am_nhac_2_a56962145d.png"
                  caption="Tổng hợp hội thoại tiếng Anh về chủ đề Âm nhạc"
                />

                <div id="fav-artist" className="mt-6">
                  <h3 className="text-lg font-semibold">1. Hỏi ca sĩ / ban nhạc yêu thích</h3>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Emma: Hi Lisa! Do you have a favorite singer or band?</li>
                        <li>Lisa: Hi Emma! I really love Taylor Swift. What about you?</li>
                        <li>Emma: I'm a big fan of Coldplay. Their music is so inspiring.</li>
                        <li>Lisa: That's cool! Do you have a favorite Coldplay song?</li>
                        <li>Emma: Definitely! I love “Fix You.”</li>
                      </ul>
                    </div>
                    <div>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Emma: Chào Lisa! Bạn có ca sĩ hoặc ban nhạc yêu thích không?</li>
                        <li>Lisa: Có chứ, mình rất thích Taylor Swift. Còn bạn?</li>
                        <li>Emma: Mình là fan của Coldplay. Nhạc của họ truyền cảm hứng.</li>
                        <li>Lisa: Tuyệt! Bạn thích bài nào của Coldplay?</li>
                        <li>Emma: “Fix You” là best của mình.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div id="instrument" className="mt-8">
                  <h3 className="text-lg font-semibold">2. Hỏi về nhạc cụ</h3>
                  <p className="mt-2">
                    John đang học piano và Sarah chơi guitar — đoạn hội thoại mẫu giúp bạn luyện ngữ điệu khi hỏi–đáp về
                    nhạc cụ.
                  </p>
                </div>

                <div id="fav-song" className="mt-8">
                  <h3 className="text-lg font-semibold">3. Chia sẻ bài hát yêu thích</h3>
                  <p className="mt-2">Gợi ý cách diễn đạt cảm xúc khi bàn về một bài hát: lyrics, vocal, high notes…</p>
                </div>

                <div id="concert" className="mt-8">
                  <h3 className="text-lg font-semibold">4. Thảo luận về buổi hòa nhạc</h3>
                  <p className="mt-2">Mẫu hội thoại khi kể lại trải nghiệm concert: crowd, vibe, highlight…</p>
                </div>

                <div id="movie-music" className="mt-8">
                  <h3 className="text-lg font-semibold">5. Âm nhạc trong phim</h3>
                  <p className="mt-2">Trao đổi về soundtrack yêu thích, tác động của âm nhạc tới cảm xúc trong phim.</p>
                </div>
              </section>

              <section id="videos" className="mt-10">
                <h2 className="text-xl font-semibold">III. Video tham khảo</h2>
                <ul className="mt-3 list-disc list-inside">
                  <li>
                    <a className="font-semibold text-blue-600 hover:underline" href="https://youtu.be/ROKf2EXAAPs" target="_blank" rel="noreferrer">
                      Talking about Music English Conversation
                    </a>
                  </li>
                  <li>
                    <a className="font-semibold text-blue-600 hover:underline" href="https://youtu.be/HqABTfepMsw" target="_blank" rel="noreferrer">
                      What Kind of Music Do You Like?
                    </a>
                  </li>
                </ul>
                <p className="mt-4">
                  Hy vọng những mẫu hội thoại trên giúp bạn tự tin hơn khi giao tiếp về chủ đề âm nhạc!
                </p>
              </section>
            </article>

            {/* Author */}
            <AuthorCard />

            {/* Premium block */}
            <PremiumCarousel />

            {/* Related posts */}
            <RelatedCarousel />

            {/* Comments */}
            <CommentsBox />
          </main>

          {/* Sidebar */}
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
