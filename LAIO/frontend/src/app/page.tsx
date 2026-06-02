// ============================================
// File: frontend/src/app/page.tsx
// ============================================
"use client";

import React, { useState } from "react";
import { CheckCircle2, Users, Gamepad2, Brain, ArrowRight } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";

export default function LandingPage() {
  // State quản lý việc ẩn/hiển thị bảng đăng nhập
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-900 font-sans antialiased">
      
      {/* 1. NAVBAR FIXED */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Luyện Từ</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Tính năng</a>
            <a href="#method" className="hover:text-blue-600 transition-colors">Cách học</a>
            <a href="#reviews" className="hover:text-blue-600 transition-colors">Đánh giá</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm shadow-blue-500/10 flex items-center gap-1"
            >
              Bắt đầu miễn phí <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Cột trái: Nội dung Text */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-left">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.15]">
              Học từ vựng theo lộ trình: <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 bg-clip-text text-transparent drop-shadow-sm">
                Nhớ lâu hơn
              </span>
              ,{" "}
              <span className="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-600 bg-clip-text text-transparent drop-shadow-sm">
                học đều hơn
              </span>
              .
            </h1>
            
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
              Thay vì mở 5 app khác nhau, bạn chỉ cần một chỗ: chọn bộ từ, học flashcard, luyện qua game, để SRS nhắc ôn đúng lúc. Có sẵn hơn 100.000 từ vựng từ SGK, Oxford 3000, Cambridge IELTS, Vocabulary in Use và nhiều nguồn khác.
            </p>

            <div>
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 group text-base"
              >
                Bắt đầu học miễn phí 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Khối Badges Thống Kê */}
            <div className="grid grid-cols-3 gap-4 mt-4 max-w-md">
              <div className="bg-slate-100/60 border border-slate-200/50 rounded-xl p-3 flex flex-col gap-1">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">100.000+</span>
                <span className="text-xs text-slate-500">người học</span>
              </div>
              <div className="bg-slate-100/60 border border-slate-200/50 rounded-xl p-3 flex flex-col gap-1">
                <Gamepad2 className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-sm text-slate-900">6 mode</span>
                <span className="text-xs text-slate-500">game luyện tập</span>
              </div>
              <div className="bg-slate-100/60 border border-slate-200/50 rounded-xl p-3 flex flex-col gap-1">
                <Brain className="w-5 h-5 text-purple-500" />
                <span className="font-bold text-sm text-slate-900">SRS</span>
                <span className="text-xs text-slate-500">nhắc ôn thông minh</span>
              </div>
            </div>

            {/* Dòng Checkmarks Chân Hero */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Flashcard thông minh
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Roadmap TOEIC / IELTS
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Game luyện tập + SRS
              </div>
            </div>
          </div>

          {/* Cột phải: Mockup Hình ảnh đại diện */}
          <div className="lg:col-span-6 relative flex justify-center items-center">
            <div className="absolute w-72 h-72 bg-blue-400/20 rounded-full blur-3xl -z-10 top-10 left-10" />
            <div className="absolute w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl -z-10 bottom-10 right-10" />

            <div className="w-full max-w-[480px] bg-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-800 relative">
              <div className="aspect-[16/10] bg-gradient-to-tr from-slate-900 to-slate-950 rounded-xl border border-slate-700 overflow-hidden flex flex-col p-4 text-white">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <span className="text-[10px] text-slate-500 ml-2">luyentu.com/dashboard</span>
                </div>
                <div className="flex-1 flex flex-col justify-center items-center gap-2">
                  <span className="text-xs text-slate-400">Giao diện hệ thống quản lý học tập</span>
                  <div className="w-3/4 h-3 bg-slate-800 rounded animate-pulse" />
                  <div className="w-1/2 h-3 bg-slate-800 rounded animate-pulse" />
                </div>
              </div>

              {/* Floating Badge 1: Số lượng người học */}
              <div className="absolute -top-10 -left-16 bg-white/95 backdrop-blur-sm border border-slate-100 p-3 rounded-xl shadow-lg flex items-center gap-3 max-w-[200px] z-10">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-900 whitespace-nowrap">100.000+ người học</span>
                  <span className="text-[9px] text-slate-500 whitespace-nowrap">quay lại mỗi ngày</span>
                </div>
              </div>

              {/* Floating Badge 2: SRS + Roadmap */}
              <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-sm border border-slate-100 p-3 rounded-xl shadow-lg flex items-center gap-3 max-w-[180px]">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-900">SRS + roadmap</span>
                  <span className="text-[9px] text-slate-500">không học rời rạc</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. FEATURES GRID SECTION */}
      <section id="features" className="py-16 px-6 bg-slate-100/50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 font-bold">❤️</div>
            <h3 className="font-bold text-lg text-slate-950">100.000+</h3>
            <p className="text-sm text-slate-500 leading-relaxed">người học đang hoạt động tích cực trên toàn hệ thống.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 font-bold">📖</div>
            <h3 className="font-bold text-lg text-slate-950">100.000+</h3>
            <p className="text-sm text-slate-500 leading-relaxed">từ vựng từ SGK, Oxford 3000, Vocabulary in Use, Cambridge cho IELTS...</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 font-bold">🎧</div>
            <h3 className="font-bold text-lg text-slate-950">6 Chế Độ</h3>
            <p className="text-sm text-slate-500 leading-relaxed">chế độ luyện tập nâng cao kết hợp thuật toán ôn tập ngắt quãng SRS.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 font-bold">📱</div>
            <h3 className="font-bold text-lg text-slate-950">Web + Mobile</h3>
            <p className="text-sm text-slate-500 leading-relaxed">học liền mạch trên mọi thiết bị, dữ liệu đồng bộ thời gian thực.</p>
          </div>
        </div>
      </section>

      {/* 4. MAIN FEATURES HEADER */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center flex flex-col gap-4">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Tính năng chính</span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
          Tạo deck, học flashcard, luyện game, ôn SRS <br className="hidden md:inline" />
          — tất cả trong một
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base">
          Dưới đây là những gì bạn thực sự dùng mỗi ngày khi học trên Luyện Từ.
        </p>
      </section>

      {/* Nhúng AuthModal vào chân trang */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

    </div>
  );
}