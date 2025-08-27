import React from "react";
import { Link } from "react-router-dom";
import "@styles/AuthorCard.css";

const FALLBACK =
  "https://via.placeholder.com/240x240.png?text=Teacher";

/**
 * AuthorCard
 * - author: Teacher (id, fullName, avatarUrl, headline, bio, gender)
 * - getTeacherUrl?: (teacher) => string  (tuỳ biến đường dẫn trang chi tiết GV)
 * - placeholder?: string
 */
export default function AuthorCard({
  author,
  getTeacherUrl,
  placeholder = FALLBACK,
}) {
  if (!author) return null;

  const gender = String(author.gender || "").toLowerCase();
  let honor = "Mr./Ms.";
  if (gender.includes("female")) honor = "Ms.";
  else if (gender.includes("male")) honor = "Mr.";

  const teacherUrl =
    typeof getTeacherUrl === "function"
      ? getTeacherUrl(author)
      : `/customer/teacher/${author.id}`;

  return (
    <div className="author-card">
      <div className="author-avatar">
        <img
          src={author.avatarUrl || placeholder}
          alt={author.fullName}
          loading="lazy"
        />
      </div>

      <div className="author-info">
        <div className="author-name">{author.fullName}</div>
        {author.headline && <div className="author-role">{author.headline}</div>}
        {author.bio && <p className="author-bio">{author.bio}</p>}

        {!!author.id && (
          <div className="author-cta">
            <Link
              to={teacherUrl}
              className="author-cta-btn"
              aria-label={`Học với ${honor} ${author.fullName}`}
            >
              Học với {honor} {author.fullName}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
