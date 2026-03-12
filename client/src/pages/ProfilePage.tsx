import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { SESSION_USER_REFRESH_EVENT } from "../api/auth";
import {
  completeMyProfileImage,
  getMyPosts,
  getMyProfile,
  presignMyProfileImage,
  putMyProfileImageToPresignedUrl,
  updateMyProfile,
} from "../api/users";
import type { MyProfilePost, UserProfile } from "../api/types";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Archive,
  CalendarDays,
  Camera,
  Download,
  ExternalLink,
  Heart,
  Loader2,
  Mail,
  RefreshCw,
  UserRound,
} from "lucide-react";

const PAGE_SIZE = 6;
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function profileDisplayName(profile: UserProfile | null) {
  return (
    profile?.nickname?.trim() ||
    profile?.name?.trim() ||
    profile?.email?.split("@")[0]?.trim() ||
    "Profile"
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Date(parsed).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function resolveProfilePostViewerPath(post: MyProfilePost) {
  const fallback = `/showcase/${encodeURIComponent(String(post.postId))}/viewer`;
  const rawPath = post.viewerPath?.trim();

  if (!rawPath || rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return fallback;
  }
  if (rawPath.startsWith("/showcase/")) {
    return rawPath.endsWith("/viewer") ? rawPath : `${rawPath.replace(/\/+$/, "")}/viewer`;
  }

  const showcaseMatch = rawPath.match(/\/showcase\/([^/?#]+)/);
  if (showcaseMatch?.[1]) {
    return `/showcase/${encodeURIComponent(showcaseMatch[1])}/viewer`;
  }

  const postMatch = rawPath.match(/\/posts\/([^/?#]+)/);
  if (postMatch?.[1]) {
    return `/showcase/${encodeURIComponent(postMatch[1])}/viewer`;
  }

  return fallback;
}

function mapProfileError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 401")) return "로그인이 필요합니다.";
  if (message.includes("HTTP 404")) return "계정 정보를 찾을 수 없습니다.";
  return "프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function mapNicknameError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 400")) return "닉네임 형식을 다시 확인해 주세요.";
  if (message.includes("HTTP 409")) return "이미 사용 중인 닉네임입니다.";
  return "닉네임 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function mapProfileImageError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 400")) return "프로필 이미지는 5MB 이하 JPG, PNG, WEBP만 가능합니다.";
  if (message.includes("HTTP 403")) return "프로필 이미지를 수정할 권한이 없습니다.";
  if (message.includes("PROFILE_IMAGE_UPLOAD_FAILED")) return "프로필 이미지 업로드에 실패했습니다.";
  return "프로필 이미지 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

function mapPostsError(error: unknown) {
  const message = String(error instanceof Error ? error.message : error);
  if (message.includes("HTTP 401")) return "로그인이 필요합니다.";
  return "내 게시물 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [nickname, setNickname] = useState("");
  const [nicknameEditing, setNicknameEditing] = useState(false);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameFeedback, setNicknameFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageFeedback, setImageFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [posts, setPosts] = useState<MyProfilePost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const response = await getMyProfile();
      setProfile(response.user);
      setNickname(response.user.nickname?.trim() || response.user.name?.trim() || "");
      setProfileError("");
    } catch (caught) {
      setProfileError(mapProfileError(caught));
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadPosts = useCallback(async (nextPage: number) => {
    setPostsLoading(true);
    try {
      const response = await getMyPosts(nextPage, PAGE_SIZE);
      setPosts(Array.isArray(response.items) ? response.items : []);
      setPage(Math.max(1, Number(response.page) || nextPage));
      setTotalPages(Math.max(1, Number(response.totalPages) || 1));
      setHasNext(Boolean(response.hasNext));
      setTotalCount(Math.max(0, Number(response.totalCount) || 0));
      setPostsError("");
    } catch (caught) {
      setPostsError(mapPostsError(caught));
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    void loadPosts(page);
  }, [loadPosts, page]);

  const currentDisplayName = useMemo(() => profileDisplayName(profile), [profile]);
  const currentNickname = (profile?.nickname?.trim() || profile?.name?.trim() || "").trim();
  const currentNicknameLabel = currentNickname || "-";
  const trimmedNickname = nickname.trim();
  const canSaveNickname =
    trimmedNickname.length > 0 && trimmedNickname !== currentNickname && !nicknameSaving && !profileLoading;

  const handleSaveNickname = async () => {
    if (!canSaveNickname) return;
    setNicknameSaving(true);
    setNicknameFeedback(null);

    try {
      const response = await updateMyProfile(trimmedNickname);
      setProfile((current) => ({ ...(current ?? response.user), ...response.user }));
      setNickname(response.user.nickname?.trim() || trimmedNickname);
      setNicknameFeedback({
        type: "success",
        text: response.message || "닉네임이 변경되었습니다.",
      });
      setNicknameEditing(false);
      window.dispatchEvent(new Event(SESSION_USER_REFRESH_EVENT));
    } catch (caught) {
      setNicknameFeedback({ type: "error", text: mapNicknameError(caught) });
    } finally {
      setNicknameSaving(false);
    }
  };

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
      setImageFeedback({ type: "error", text: "프로필 이미지는 JPG, PNG, WEBP만 업로드할 수 있습니다." });
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      setImageFeedback({ type: "error", text: "프로필 이미지는 5MB 이하만 업로드할 수 있습니다." });
      return;
    }

    setImageUploading(true);
    setImageFeedback(null);

    try {
      const presigned = await presignMyProfileImage(file);
      await putMyProfileImageToPresignedUrl(presigned.uploadUrl, file);
      const completed = await completeMyProfileImage(presigned.key);
      setProfile((current) =>
        current
          ? {
              ...current,
              profileImageUrl: completed.profileImageUrl,
              profileImageUpdatedAt: completed.profileImageUpdatedAt,
            }
          : current
      );
      setImageFeedback({ type: "success", text: "프로필 이미지가 변경되었습니다." });
      window.dispatchEvent(new Event(SESSION_USER_REFRESH_EVENT));
    } catch (caught) {
      setImageFeedback({ type: "error", text: mapProfileImageError(caught) });
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F2F0EB] px-6 pb-20 pt-28 text-[#2D2D2D]">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="flex flex-col gap-6 border-b border-[#1A3C34]/10 pb-10 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.32em] text-[#D95F39]">
                <UserRound size={14} /> Account Profile
              </div>
              <h1 className="text-5xl font-serif italic tracking-tight md:text-7xl">
                My <span className="font-sans not-italic font-black uppercase text-[#1A3C34]">Profile</span>
              </h1>
              <p className="text-[13px] font-medium text-[#1A3C34]/55">
                계정 정보와 게시물 상태를 한 곳에서 확인하고 관리합니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/uploads"
                className="inline-flex h-12 items-center gap-3 border border-[#1A3C34]/15 px-5 text-[11px] font-black uppercase tracking-[0.18em] text-[#1A3C34] transition-colors hover:bg-[#1A3C34] hover:text-[#F2F0EB]"
              >
                <Archive size={14} />
                아카이브
              </Link>
              <button
                type="button"
                onClick={() => {
                  void loadProfile();
                  void loadPosts(page);
                }}
                className="inline-flex h-12 items-center gap-3 border border-[#1A3C34]/15 px-5 text-[11px] font-black uppercase tracking-[0.18em] text-[#1A3C34] transition-colors hover:bg-[#1A3C34] hover:text-[#F2F0EB]"
              >
                <RefreshCw size={14} />
                새로고침
              </button>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-5">
              <section className="border border-[#1A3C34]/10 bg-white p-8 shadow-[0_24px_48px_-32px_rgba(26,60,52,0.35)]">
                {profileLoading ? (
                  <div className="flex min-h-[260px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1A3C34]/35" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                      <div className="relative">
                        {profile?.profileImageUrl ? (
                          <img
                            src={profile.profileImageUrl}
                            alt={currentDisplayName}
                            className="h-28 w-28 rounded-full border border-[#1A3C34]/10 object-cover"
                            draggable={false}
                          />
                        ) : (
                          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#1A3C34]/10 bg-[#F2F0EB] text-3xl font-black uppercase text-[#1A3C34]">
                            {currentDisplayName.slice(0, 1)}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageUploading}
                          className="absolute bottom-0 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white bg-[#1A3C34] text-white transition-colors hover:bg-[#D95F39] disabled:opacity-60"
                        >
                          {imageUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleProfileImageChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1A3C34]/35">
                          Profile Identity
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-[#1A3C34]">
                          {currentDisplayName}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-none border-[#1A3C34]/10 bg-[#F2F0EB] text-[#1A3C34]">
                            {profile?.provider || "session"}
                          </Badge>
                          {profile?.profileImageUpdatedAt && (
                            <Badge
                              variant="outline"
                              className="rounded-none border-[#D95F39]/15 bg-[#D95F39]/5 text-[#D95F39]"
                            >
                              Updated {formatDate(profile.profileImageUpdatedAt)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {profileError && (
                      <div className="border border-[#D95F39]/20 bg-[#D95F39]/5 px-4 py-3 text-[12px] font-bold text-[#D95F39]">
                        {profileError}
                      </div>
                    )}
                    {imageFeedback && (
                      <div
                        className={`px-4 py-3 text-[12px] font-bold ${
                          imageFeedback.type === "success"
                            ? "border border-[#1A3C34]/15 bg-[#1A3C34]/5 text-[#1A3C34]"
                            : "border border-[#D95F39]/20 bg-[#D95F39]/5 text-[#D95F39]"
                        }`}
                      >
                        {imageFeedback.text}
                      </div>
                    )}

                    <div className="grid gap-4 border-t border-[#1A3C34]/8 pt-6">
                      <InfoRow icon={<Mail size={15} />} label="Email" value={profile?.email || "-"} />
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 text-[13px] font-medium text-[#1A3C34]/60">
                          <span className="mt-0.5 text-[#D95F39]">
                            <UserRound size={15} />
                          </span>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A3C34]/35">
                              Nickname
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[#1A3C34]">{currentNicknameLabel}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setNickname(currentNickname);
                                  setNicknameFeedback(null);
                                  setNicknameEditing((current) => !current);
                                }}
                                className="inline-flex h-8 items-center border border-[#1A3C34]/15 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34] transition-colors hover:bg-[#1A3C34] hover:text-[#F2F0EB]"
                              >
                                {nicknameEditing ? "닫기" : "변경"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {nicknameEditing && (
                          <div className="space-y-3 pl-7">
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <Input
                                value={nickname}
                                maxLength={30}
                                onChange={(event) => setNickname(event.target.value)}
                                placeholder="닉네임 입력"
                                className="h-11 border-[#1A3C34]/15 bg-[#F2F0EB]/50 text-[#1A3C34]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  onClick={() => void handleSaveNickname()}
                                  disabled={!canSaveNickname}
                                  className="h-11 rounded-none bg-[#1A3C34] px-4 text-white hover:bg-[#D95F39] disabled:opacity-50"
                                >
                                  {nicknameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "저장"}
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNickname(currentNickname);
                                    setNicknameFeedback(null);
                                    setNicknameEditing(false);
                                  }}
                                  className="h-11 border border-[#1A3C34]/15 px-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34] transition-colors hover:bg-[#1A3C34] hover:text-[#F2F0EB]"
                                >
                                  취소
                                </button>
                              </div>
                            </div>

                            {nicknameFeedback && (
                              <div
                                className={`px-4 py-3 text-[12px] font-bold ${
                                  nicknameFeedback.type === "success"
                                    ? "border border-[#1A3C34]/15 bg-[#1A3C34]/5 text-[#1A3C34]"
                                    : "border border-[#D95F39]/20 bg-[#D95F39]/5 text-[#D95F39]"
                                }`}
                              >
                                {nicknameFeedback.text}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <InfoRow icon={<CalendarDays size={15} />} label="Created" value={formatDate(profile?.createdAt)} />
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-8 lg:col-span-7">
              <section className="border border-[#1A3C34]/10 bg-white p-8 shadow-[0_24px_48px_-32px_rgba(26,60,52,0.35)]">
                <div className="flex flex-col gap-4 border-b border-[#1A3C34]/8 pb-6 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#1A3C34]/35">
                      Published Posts
                    </div>
                    <h3 className="text-3xl font-black tracking-tight text-[#1A3C34]">내 게시물 목록</h3>
                    <p className="text-[13px] font-medium text-[#1A3C34]/50">
                      총 {totalCount.toLocaleString("ko-KR")}개의 공개 게시물을 확인할 수 있습니다.
                    </p>
                  </div>

                  <div className="rounded-full border border-[#D95F39]/15 bg-[#D95F39]/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#D95F39]">
                    Page {page} / {totalPages}
                  </div>
                </div>

                {postsError && (
                  <div className="mt-6 border border-[#D95F39]/20 bg-[#D95F39]/5 px-4 py-3 text-[12px] font-bold text-[#D95F39]">
                    {postsError}
                  </div>
                )}

                {postsLoading ? (
                  <div className="flex min-h-[280px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1A3C34]/35" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center text-[#1A3C34]/30">
                    <Archive size={30} />
                    <p className="text-[12px] font-black uppercase tracking-[0.24em]">게시된 콘텐츠가 없습니다.</p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {posts.map((post) => {
                      const viewerPath = resolveProfilePostViewerPath(post);
                      return (
                        <Link
                          key={String(post.postId)}
                          to={viewerPath}
                          className="grid gap-5 border border-[#1A3C34]/8 p-4 transition-colors hover:border-[#1A3C34]/20 hover:bg-[#F2F0EB]/35 md:grid-cols-[140px,1fr]"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden bg-[#1A3C34]">
                            {post.thumbnailUrl ? (
                              <img
                                src={post.thumbnailUrl}
                                alt={post.title}
                                className="h-full w-full object-cover"
                                draggable={false}
                              />
                            ) : (
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_30%),linear-gradient(160deg,_#1A3C34_0%,_#10251F_55%,_#08100D_100%)]" />
                            )}
                          </div>

                          <div className="flex min-w-0 flex-col justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34]/45">
                                <span>Post {post.postId}</span>
                                {post.sceneId != null && <span>Scene {post.sceneId}</span>}
                                {post.jobId != null && <span>Job {post.jobId}</span>}
                              </div>
                              <h4 className="text-2xl font-black tracking-tight text-[#1A3C34]">
                                {post.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-4 text-[12px] font-bold text-[#1A3C34]/55">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays size={14} className="text-[#D95F39]" />
                                  {formatDate(post.createdAt)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Heart size={14} className="text-[#D95F39]" />
                                  {Number(post.likeCount || 0).toLocaleString("ko-KR")}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Download size={14} className="text-[#D95F39]" />
                                  {Number(post.downloadCount || 0).toLocaleString("ko-KR")}
                                </span>
                              </div>
                            </div>

                            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1A3C34]">
                              Viewer 열기
                              <ExternalLink size={14} />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between border-t border-[#1A3C34]/8 pt-6">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={postsLoading || page <= 1}
                    className="h-11 border border-[#1A3C34]/15 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34] transition-colors hover:bg-[#1A3C34] hover:text-[#F2F0EB] disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#1A3C34]"
                  >
                    Previous
                  </button>
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1A3C34]/40">
                    Page {page} of {totalPages}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage((current) => (hasNext ? current + 1 : current))}
                    disabled={postsLoading || !hasNext}
                    className="h-11 border border-[#1A3C34]/15 px-5 text-[10px] font-black uppercase tracking-[0.18em] text-[#1A3C34] transition-colors hover:bg-[#1A3C34] hover:text-[#F2F0EB] disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#1A3C34]"
                  >
                    Next
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-[13px] font-medium text-[#1A3C34]/60">
      <span className="mt-0.5 text-[#D95F39]">{icon}</span>
      <div className="space-y-1">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A3C34]/35">{label}</div>
        <div className="text-[#1A3C34]">{value}</div>
      </div>
    </div>
  );
}
