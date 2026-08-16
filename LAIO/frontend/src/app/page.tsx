"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock,
  Headphones,
  LineChart,
  Play,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
  Volume2,
} from "lucide-react";

import AuthModal from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import HeroMascot from "@/components/landing/HeroMascot";
import LandingHeader from "@/components/landing/LandingHeader";
import LearningOrbit from "@/components/landing/LearningOrbit";
import ScrollReveal from "@/components/landing/ScrollReveal";

type Feature = {
  title: string;
  description: string;
  label: string;
  icon: LucideIcon;
  color: string;
  accent: string;
};

const features: Feature[] = [
  {
    title: "Bộ từ của riêng bạn",
    description: "Tạo notebook theo môn học, kỳ thi hoặc bất kỳ chủ đề nào bạn đang theo đuổi.",
    label: "Tổ chức",
    icon: BookOpen,
    color: "bg-[#80b7ff]",
    accent: "text-[#113859]",
  },
  {
    title: "Ôn đúng thời điểm",
    description: "Lịch SRS thay đổi theo từng câu trả lời, để từ khó quay lại sớm hơn.",
    label: "Ghi nhớ",
    icon: CalendarDays,
    color: "bg-[#9bcf86]",
    accent: "text-[#173f34]",
  },
  {
    title: "Flashcard chủ động",
    description: "Lật thẻ, tự nhớ trước khi xem đáp án và chấm mức độ thuộc của chính mình.",
    label: "Luyện tập",
    icon: Repeat2,
    color: "bg-[#f58a67]",
    accent: "text-[#5b2118]",
  },
  {
    title: "Nghe cách phát âm",
    description: "Phát audio ngay trên thẻ học khi dịch vụ giọng đọc của hệ thống được cấu hình.",
    label: "Âm thanh",
    icon: Headphones,
    color: "bg-[#f3a5c2]",
    accent: "text-[#5a1f37]",
  },
  {
    title: "Tiến độ có số liệu",
    description: "Theo dõi từ đến hạn, lượt ôn đã hoàn thành và độ chính xác từ dữ liệu thật.",
    label: "Theo dõi",
    icon: LineChart,
    color: "bg-[#b7a0ea]",
    accent: "text-[#2f2255]",
  },
  {
    title: "Kết quả theo từng lượt",
    description: "Mỗi learning session lưu số câu đã làm, câu đúng và trạng thái hoàn thành.",
    label: "Nhịp học",
    icon: Target,
    color: "bg-[#82cfca]",
    accent: "text-[#143f3c]",
  },
];

const steps = [
  {
    number: "01",
    title: "Gom từ vào một nơi",
    description: "Tạo notebook và thêm đúng những từ bạn thật sự cần học.",
    icon: BookOpen,
    color: "bg-[#80b7ff]",
  },
  {
    number: "02",
    title: "Tự nhớ, rồi mới lật",
    description: "Bắt đầu lượt ôn, trả lời flashcard và tự chấm mức độ ghi nhớ từ 0 đến 5.",
    icon: Brain,
    color: "bg-[#f3a5c2]",
  },
  {
    number: "03",
    title: "Quay lại đúng ngày",
    description: "LAIO cập nhật lịch sau mỗi câu trả lời và đưa từ đến hạn trở lại hàng ôn.",
    icon: CalendarDays,
    color: "bg-[#d8e78f]",
  },
];

const faqs = [
  {
    question: "LAIO hiện tập trung vào phần nào của tiếng Anh?",
    answer:
      "Phiên bản hiện tại tập trung vào từ vựng: tạo notebook, thêm từ, học flashcard, ôn theo lịch SRS và theo dõi tiến độ. Các kỹ năng khác không được giả vờ là đã hoàn thiện.",
  },
  {
    question: "SRS hoạt động như thế nào?",
    answer:
      "Sau mỗi câu trả lời, hệ thống dùng điểm 0–5 để cập nhật độ dễ, khoảng cách ôn và ngày ôn tiếp theo. Từ chưa chắc sẽ quay lại sớm hơn; từ đã vững được giãn lịch.",
  },
  {
    question: "Một lượt ôn có quá dài không?",
    answer:
      "Luồng hiện tại lập kế hoạch tối đa 20 từ cho một learning session. Bạn vẫn có thể hoàn thành hoặc rời lượt học; trạng thái phiên được ghi nhận rõ ràng.",
  },
  {
    question: "Dữ liệu học có được đồng bộ không?",
    answer:
      "Khi đăng nhập, notebook và tiến độ được gắn với tài khoản Supabase của bạn. Frontend gọi backend bằng access token, không dùng dữ liệu mock cho luồng học thật.",
  },
  {
    question: "Có dùng tốt trên điện thoại không?",
    answer:
      "Landing page và luồng web được thiết kế responsive cho mobile, tablet và desktop. LAIO hiện là ứng dụng web; repo chưa tuyên bố có ứng dụng native.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const openAuth = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuth = useCallback(() => setIsAuthModalOpen(false), []);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [router, user]);

  return (
    <div id="top" className="laio-landing min-h-screen overflow-x-hidden bg-[#fffdf7] text-[#173f34]">
      <LandingHeader onOpenAuth={openAuth} />

      <main>
        <section
          aria-labelledby="hero-title"
          className="relative flex min-h-[760px] items-center overflow-hidden bg-[#aebd74] px-5 pb-20 pt-28 sm:px-8 lg:min-h-[100svh] lg:pb-16"
        >
          <div className="hero-grid-mark absolute inset-0 opacity-20" aria-hidden="true" />
          <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-6">
            <div className="relative z-10 max-w-[650px]">
              <p className="hero-copy-one mb-5 inline-flex items-center gap-2 rounded-full border border-[#173f3433] bg-[#fff4c566] px-4 py-2 text-xs font-black uppercase tracking-[0.14em]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Học từ vựng theo nhịp của bạn
              </p>
              <h1
                id="hero-title"
                className="hero-copy-two landing-display text-[clamp(3.15rem,7vw,6.4rem)] font-black leading-[0.91] tracking-[-0.065em] text-[#173f34]"
              >
                Từ mới vào đầu.
                <span className="mt-2 block text-[#fff7d7]">Ở lại thật lâu.</span>
              </h1>
              <p className="hero-copy-three mt-7 max-w-[590px] text-base font-semibold leading-7 text-[#173f34d9] sm:text-lg sm:leading-8">
                LAIO gom notebook, flashcard và lịch ôn ngắt quãng vào một hành trình liền mạch — để bạn biết hôm nay cần học gì, thay vì đoán.
              </p>

              <div className="hero-copy-four mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={openAuth}
                  className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#173f34] px-7 text-base font-black text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#0f3028]"
                >
                  Bắt đầu học miễn phí
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
                <a
                  href="#method"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-[#173f3440] px-6 text-sm font-black transition-colors hover:border-[#173f34] hover:bg-[#fff4c54d]"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  Xem cách hoạt động
                </a>
              </div>

              <ul className="hero-copy-five mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold sm:text-sm" aria-label="Điểm nổi bật">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Dữ liệu học thật
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Lịch ôn cá nhân
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Web responsive
                </li>
              </ul>
            </div>

            <HeroMascot />
          </div>

          <div className="absolute inset-x-0 bottom-0 h-7 rounded-t-[50%] bg-[#fffdf7] sm:h-10" aria-hidden="true" />
        </section>

        <section id="features" aria-labelledby="features-title" className="bg-[#fffdf7] px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal className="mx-auto max-w-[780px] text-center">
              <p className="section-kicker">Bàn học all-in-one</p>
              <h2 id="features-title" className="landing-display mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Sáu việc cần thiết. Một nhịp học rõ ràng.
              </h2>
              <p className="mx-auto mt-5 max-w-[640px] text-base font-medium leading-7 text-[#426157] sm:text-lg">
                Không nhồi mọi tính năng vào một dashboard. Mỗi phần của LAIO dẫn đến cùng một mục tiêu: nhớ được từ và biết khi nào cần ôn lại.
              </p>
            </ScrollReveal>

            <ScrollReveal className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" delay={80}>
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className={`${feature.color} ${feature.accent} group relative flex min-h-[330px] flex-col overflow-hidden rounded-[30px] border-[3px] border-[#173f34] p-7 transition-transform duration-300 hover:-translate-y-1 sm:min-h-[360px]`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="rounded-full border-2 border-current px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
                        {feature.label}
                      </span>
                      <span className="text-sm font-black opacity-60">0{index + 1}</span>
                    </div>
                    <div className="feature-character mt-8 grid h-24 w-24 place-items-center rounded-[34px] border-[3px] border-current bg-[#fffdf780] transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                      <Icon className="h-10 w-10" strokeWidth={2.4} aria-hidden="true" />
                      <span className="feature-character-eye left-[26px]" aria-hidden="true" />
                      <span className="feature-character-eye right-[26px]" aria-hidden="true" />
                    </div>
                    <div className="mt-auto pt-7">
                      <h3 className="landing-display text-2xl font-black tracking-[-0.035em]">{feature.title}</h3>
                      <p className="mt-3 text-sm font-semibold leading-6 opacity-80">{feature.description}</p>
                    </div>
                  </article>
                );
              })}
            </ScrollReveal>
          </div>
        </section>

        <section id="method" aria-labelledby="method-title" className="bg-[#f4eedf] px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal className="grid items-end gap-6 lg:grid-cols-[1fr_0.75fr]">
              <div>
                <p className="section-kicker">Cách LAIO hoạt động</p>
                <h2 id="method-title" className="landing-display mt-4 max-w-[760px] text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                  Học ít bước hơn, nhưng mỗi bước có lý do.
                </h2>
              </div>
              <p className="max-w-[500px] text-base font-medium leading-7 text-[#426157] lg:justify-self-end">
                Từ lúc thêm một từ mới đến khi thấy nó quay lại trong hàng ôn, dữ liệu đi qua một flow duy nhất — không có mock JSON chen vào.
              </p>
            </ScrollReveal>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <ScrollReveal key={step.number} delay={index * 100}>
                    <article className="relative min-h-[350px] overflow-hidden rounded-[30px] border-[3px] border-[#173f34] bg-[#fffdf7] p-7">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-[0.18em]">Bước {step.number}</span>
                        <div className={`grid h-14 w-14 place-items-center rounded-2xl border-[3px] border-[#173f34] ${step.color}`}>
                          <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="mt-20">
                        <h3 className="landing-display text-3xl font-black tracking-[-0.04em]">{step.title}</h3>
                        <p className="mt-4 text-sm font-semibold leading-6 text-[#426157]">{step.description}</p>
                      </div>
                      <span className="absolute -bottom-9 -right-3 text-[9rem] font-black leading-none text-[#173f340d]" aria-hidden="true">
                        {step.number}
                      </span>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        <section aria-labelledby="visual-title" className="bg-[#28336f] px-5 py-20 text-white sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal>
              <p className="section-kicker !text-[#f8df7d]">Một vòng lặp có điểm dừng</p>
              <h2 id="visual-title" className="landing-display mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Không phải học lại tất cả. Chỉ gặp lại từ khi cần.
              </h2>
              <p className="mt-6 max-w-[560px] text-base font-medium leading-7 text-[#e7e9ff] sm:text-lg">
                Mỗi câu trả lời cập nhật lịch hiện tại của từ. Lịch sử vẫn được giữ riêng, để tiến độ hôm nay không xóa dấu vết của những lần học trước.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {["Trả lời", "Cập nhật lịch", "Chờ đến hạn", "Ôn lại"].map((item) => (
                  <span key={item} className="rounded-full border border-white/30 px-4 py-2 text-xs font-black">
                    {item}
                  </span>
                ))}
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100} className="rounded-[36px] border-2 border-white/20 bg-[#364486] p-3 sm:p-6">
              <LearningOrbit />
            </ScrollReveal>
          </div>
        </section>

        <section aria-labelledby="facts-title" className="bg-[#fffdf7] px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal className="rounded-[36px] border-[3px] border-[#173f34] bg-[#173f34] p-7 text-white sm:p-10 lg:p-14">
              <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                <div>
                  <p className="section-kicker !text-[#f8df7d]">Cơ chế đang chạy thật</p>
                  <h2 id="facts-title" className="landing-display mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                    Số liệu nói về sản phẩm, không nói quá về người dùng.
                  </h2>
                </div>
                <p className="text-sm font-semibold leading-6 text-[#dbe7df] sm:text-base sm:leading-7">
                  Repo chưa có testimonial hay số người học đã được kiểm chứng. Vì vậy LAIO chỉ công bố những giới hạn và quy tắc có thể đối chiếu trực tiếp trong code.
                </p>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <article className="rounded-[26px] bg-[#f8df7d] p-6 text-[#173f34]">
                  <p className="landing-display text-5xl font-black tracking-[-0.06em]">20</p>
                  <p className="mt-3 text-sm font-black">từ tối đa được lập kế hoạch cho một lượt ôn</p>
                </article>
                <article className="rounded-[26px] bg-[#f3a5c2] p-6 text-[#173f34]">
                  <p className="landing-display text-5xl font-black tracking-[-0.06em]">0–5</p>
                  <p className="mt-3 text-sm font-black">thang điểm dùng để cập nhật lịch ghi nhớ</p>
                </article>
                <article className="rounded-[26px] bg-[#80b7ff] p-6 text-[#173f34]">
                  <p className="landing-display text-5xl font-black tracking-[-0.06em]">1:1</p>
                  <p className="mt-3 text-sm font-black">một lịch SRS hiện tại cho mỗi từ của mỗi người học</p>
                </article>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section id="reviews" aria-labelledby="reviews-title" className="bg-[#f8df7d] px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="section-kicker">Tự đánh giá sau buổi đầu</p>
                <h2 id="reviews-title" className="landing-display mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                  Ba điều bạn phải nhìn thấy, không cần tin lời quảng cáo.
                </h2>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    icon: Clock,
                    title: "Biết từ nào đang đến hạn",
                    text: "Dashboard và notebook dùng dữ liệu lịch ôn thật để đưa ra danh sách cần học.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Kết thúc lượt học có kết quả",
                    text: "Learning session trả về số câu đã làm, câu đúng và độ chính xác thay vì chỉ phát hiệu ứng chúc mừng.",
                  },
                  {
                    icon: LineChart,
                    title: "Quay lại thấy tiến độ mới",
                    text: "Sau khi hoàn thành, dashboard đọc lại progress summary từ backend cho tài khoản hiện tại.",
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.title} className="flex gap-4 rounded-[26px] border-[3px] border-[#173f34] bg-[#fffdf7] p-5 sm:gap-6 sm:p-7">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#173f34] text-white sm:h-14 sm:w-14">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f0513e]">Kiểm tra 0{index + 1}</p>
                        <h3 className="landing-display mt-1 text-xl font-black tracking-[-0.03em] sm:text-2xl">{item.title}</h3>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#426157]">{item.text}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section id="faq" aria-labelledby="faq-title" className="bg-[#fffdf7] px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <ScrollReveal>
              <p className="section-kicker">FAQ</p>
              <h2 id="faq-title" className="landing-display mt-4 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                Hỏi thẳng, trả lời rõ.
              </h2>
              <p className="mt-5 max-w-[420px] text-base font-medium leading-7 text-[#426157]">
                Những gì chưa có trong sản phẩm sẽ không được viết như thể đã hoàn thiện.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={80} className="divide-y-2 divide-[#173f3420] border-y-2 border-[#173f3420]">
              {faqs.map((faq, index) => (
                <details key={faq.question} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 rounded-xl py-5 text-left focus-visible:outline-offset-4 sm:py-6">
                    <span className="flex items-start gap-4">
                      <span className="mt-1 text-xs font-black text-[#f0513e]">0{index + 1}</span>
                      <span className="landing-display text-lg font-black tracking-[-0.025em] sm:text-xl">{faq.question}</span>
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#173f34] text-xl font-black transition-transform duration-200 group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="pb-6 pl-9 pr-12 text-sm font-semibold leading-6 text-[#426157] sm:text-base sm:leading-7">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </ScrollReveal>
          </div>
        </section>

        <section aria-labelledby="final-cta-title" className="bg-[#f3a5c2] px-5 py-20 sm:px-8 lg:py-28">
          <ScrollReveal className="mx-auto max-w-[980px] text-center">
            <div className="mx-auto mb-7 grid h-20 w-20 place-items-center rounded-[28px] border-[3px] border-[#173f34] bg-[#fffdf7]">
              <Volume2 className="h-9 w-9" aria-hidden="true" />
            </div>
            <h2 id="final-cta-title" className="landing-display text-4xl font-black tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Cho những từ đang quên một lịch hẹn mới.
            </h2>
            <p className="mx-auto mt-5 max-w-[620px] text-base font-semibold leading-7 text-[#4e3140] sm:text-lg">
              Bắt đầu bằng một notebook nhỏ. LAIO sẽ lo phần nhắc lại đúng lúc.
            </p>
            <button
              type="button"
              onClick={openAuth}
              className="group mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#173f34] px-8 text-base font-black text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#0f3028]"
            >
              Tạo tài khoản LAIO
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
          </ScrollReveal>
        </section>
      </main>

      <footer className="bg-[#112f28] px-5 pb-8 pt-16 text-[#dce8df] sm:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-10 border-b border-white/15 pb-12 md:grid-cols-[1fr_auto_auto] md:gap-16">
            <div className="max-w-[410px]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-[15px] bg-[#f8df7d] text-lg font-black text-[#173f34]">L</span>
                <span className="landing-display text-2xl font-black text-white">LAIO</span>
              </div>
              <p className="mt-5 text-sm font-medium leading-6 text-[#b8ccc1]">
                Nền tảng học từ vựng cá nhân hóa bằng notebook, flashcard và spaced repetition.
              </p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f8df7d]">Khám phá</p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-bold">
                <a href="#features" className="hover:text-white">Tính năng</a>
                <a href="#method" className="hover:text-white">Cách học</a>
                <a href="#faq" className="hover:text-white">FAQ</a>
              </div>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f8df7d]">Dự án</p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-bold">
                <a href="https://github.com/Duckz289/LAIO" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a>
                <button type="button" onClick={openAuth} className="text-left hover:text-white">Đăng nhập</button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-7 text-xs font-semibold text-[#8fa99b] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 LAIO. Learn all in one.</p>
            <p>Thiết kế nguyên bản bằng SVG và CSS.</p>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuth} />
    </div>
  );
}
