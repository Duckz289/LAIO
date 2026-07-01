"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Trash2, Folder, LogOut, Loader2, X } from "lucide-react";

import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useNotebooksStore } from "@/stores/notebooks-store";

export default function NotebooksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const notebooks = useNotebooksStore((state) => state.notebooks);
  const progress = useNotebooksStore((state) => state.progress);
  const loading = useNotebooksStore((state) => state.loading);
  const refreshing = useNotebooksStore((state) => state.refreshing);
  const initialized = useNotebooksStore((state) => state.initialized);
  const fetchNotebooks = useNotebooksStore((state) => state.fetchNotebooks);
  const removeNotebook = useNotebooksStore((state) => state.removeNotebook);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      void fetchNotebooks();
    }
  }, [authLoading, fetchNotebooks, user]);

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      await api.createNotebook({ title, description });
      setTitle("");
      setDescription("");
      setIsModalOpen(false);
      await fetchNotebooks({ force: true });
    } catch {
      alert("Không thể tạo sổ tay, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotebook = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sổ tay này không? Toàn bộ từ vựng bên trong sẽ bị mất.")) {
      return;
    }

    try {
      await api.deleteNotebook(id);
      removeNotebook(id);
      await fetchNotebooks({ force: true });
    } catch {
      alert("Xóa sổ tay thất bại.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const showInitialLoader = authLoading || (loading && !initialized);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/notebooks" className="flex items-center gap-2 cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">LAIO Dashboard</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors bg-slate-100 hover:bg-red-50 px-4 py-2 rounded-xl"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-28 pb-16 px-6">
        {refreshing ? (
          <div className="mb-4 flex items-center justify-end gap-2 text-xs font-medium text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span>Đang cập nhật danh sách sổ tay...</span>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Sổ tay từ vựng của bạn</h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý và phân loại các bộ từ vựng để kích hoạt lộ trình ôn tập SRS.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all duration-200 shadow-md shadow-blue-500/10 flex items-center gap-2 self-start sm:self-auto hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Tạo sổ tay mới
          </button>
        </div>

        {progress ? (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              ["Tổng từ", progress.total_vocabulary],
              ["Cần ôn hôm nay", progress.due_today],
              ["Độ chính xác", `${progress.accuracy_percentage}%`],
              ["Chuỗi ngày học", progress.current_streak_days],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </section>
        ) : null}

        {showInitialLoader ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Đang tải danh sách sổ tay...</p>
          </div>
        ) : notebooks.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto mt-8 flex flex-col items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Chưa có sổ tay nào</h3>
              <p className="text-sm text-slate-500 mt-1">
                Tạo ngay sổ tay đầu tiên để thêm từ vựng, bắt đầu cày game và ôn tập định kỳ.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              + Tạo sổ tay đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notebooks.map((notebook, index) => (
              <div
                key={notebook.id}
                className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex flex-col justify-between group relative animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => router.push(`/notebooks/${notebook.id}`)}
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 group-hover:scale-110">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-950 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors duration-200">
                    {notebook.title}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-6">
                    {notebook.description || "Không có mô tả."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400 font-medium">
                  <span>Cập nhật: {new Date(notebook.updated_at).toLocaleDateString("vi-VN")}</span>
                  <button
                    onClick={() => void handleDeleteNotebook(notebook.id)}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200 hover:scale-110"
                    title="Xóa sổ tay"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md animate-zoomIn">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden p-6 flex flex-col gap-5">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mt-2">
                <h2 className="text-2xl font-bold text-slate-900">Tạo sổ tay mới</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Phân loại từ vựng theo chủ đề để học có hệ thống hơn.
                </p>
              </div>

              <form onSubmit={handleCreateNotebook} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tên sổ tay</label>
                  <input
                    type="text"
                    placeholder="Nhập tên sổ tay..."
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-sm transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Mô tả ngắn</label>
                  <textarea
                    placeholder="Ghi chú mục tiêu hoặc nội dung bộ từ này..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-sm resize-none transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1 mt-2 text-sm shadow-sm hover:scale-105 active:scale-95"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Xác nhận tạo"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
