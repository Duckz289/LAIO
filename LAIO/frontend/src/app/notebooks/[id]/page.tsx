// frontend/src/app/notebooks/[id]/page.tsx

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, BookOpen, Zap } from 'lucide-react';
import Link from 'next/link';

// Components
import StatsCard from './components/StatsCard';
import QuickActions from './components/QuickActions';
import SearchBar from './components/SearchBar';
import VocabList from './components/VocabList';
import StudyMode from './components/StudyMode';
import AddVocabModal from './components/AddVocabModal';

// Types & API
import { Vocab, Notebook } from './types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function NotebookDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const notebookId = params.id as string;

  // States
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [vocabs, setVocabs] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'study'>('notes');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVocab, setEditingVocab] = useState<Vocab | null>(null);
  const [dueVocabs, setDueVocabs] = useState<Vocab[]>([]);
  const [learningSessionId, setLearningSessionId] = useState<string | null>(null);
  const [studyStarting, setStudyStarting] = useState(false);

  // Fetch notebook info
  const fetchNotebook = async () => {
    try {
      const data = await api.getNotebook(notebookId);
      setNotebook({
        id: data.id,
        title: data.title,
        description: data.description || '',
        totalVocabs: 0,
        masteredVocabs: 0,
        dueVocabs: 0,
      });
    } catch (error) {
      console.error('Lỗi lấy notebook:', error);
    }
  };

  // Fetch vocab list
  const fetchVocabs = async () => {
    try {
      setLoading(true);
      const data = await api.getVocabs(notebookId);
      const vocabList: Vocab[] = data.vocab_items;
      setVocabs(vocabList);
      
      // Update stats
      const mastered = vocabList.filter((v: Vocab) => v.is_mastered === true).length;
      const today = new Date().toISOString().split('T')[0];
      const due = vocabList.filter((v: Vocab) => 
        v.next_review_date && v.next_review_date <= today && !v.is_mastered
      ).length;
      
      setNotebook(prev => prev ? {
        ...prev,
        totalVocabs: vocabList.length,
        masteredVocabs: mastered,
        dueVocabs: due,
      } : null);
    } catch (error) {
      console.error('Lỗi lấy danh sách từ:', error);
      setVocabs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDueVocabs = async (): Promise<Vocab[]> => {
    try {
      const data = await api.getDueReviews(notebookId);
      const mapped = data.items.map((item) => ({
          id: item.vocab_item_id,
          word: item.word,
          meaning: item.meaning,
          pronunciation: item.pronunciation,
          example_sentence: item.example_sentence,
          difficulty_level: 1,
          is_mastered: false,
          next_review_date: item.next_review_date,
          created_at: item.last_reviewed_at ?? item.next_review_date,
          updated_at: item.last_reviewed_at ?? item.next_review_date,
        }));
      setDueVocabs(mapped);
      return mapped;
    } catch (error) {
      console.error('Lỗi lấy lịch ôn:', error);
      setDueVocabs([]);
      return [];
    }
  };

  useEffect(() => {
    if (notebookId && !authLoading && user) {
      fetchNotebook();
      fetchVocabs();
      fetchDueVocabs();
    }
  }, [notebookId, authLoading, user]);

  // Filtered vocabs
  const filteredVocabs = useMemo(() => {
    if (!searchTerm.trim()) return vocabs;
    return vocabs.filter(v => 
      v.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.meaning.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vocabs, searchTerm]);

  // CRUD operations
  const addVocab = async (
    newVocab: Omit<Vocab, 'id' | 'created_at' | 'updated_at'>,
  ) => {
    try {
      await api.createVocab(notebookId, {
        word: newVocab.word,
        meaning: newVocab.meaning,
        pronunciation: newVocab.pronunciation,
        example_sentence: newVocab.example_sentence || '',
        difficulty_level: newVocab.difficulty_level,
      });
      await Promise.all([fetchVocabs(), fetchDueVocabs()]);
    } catch (error) {
      console.error('Lỗi thêm từ:', error);
      alert('Thêm từ thất bại');
      throw error;
    }
  };

  const updateVocab = async (id: string, data: Partial<Vocab>) => {
    try {
      await api.updateVocab(id, data);
      await Promise.all([fetchVocabs(), fetchDueVocabs()]);
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      alert('Cập nhật thất bại');
      throw error;
    }
  };

  const deleteVocab = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa từ này?')) return;
    try {
      await api.deleteVocab(id);
      fetchVocabs();
      fetchDueVocabs();
    } catch (error) {
      console.error('Lỗi xóa:', error);
      alert('Xóa thất bại');
    }
  };

  const toggleMaster = async (id: string) => {
    const vocab = vocabs.find(v => v.id === id);
    if (vocab) {
      await updateVocab(id, { is_mastered: !vocab.is_mastered });
    }
  };

  const startStudy = async () => {
    if (studyStarting) return;
    try {
      setStudyStarting(true);
      setActiveTab('study');
      const due = await fetchDueVocabs();
      if (!learningSessionId && due.length > 0) {
        const session = await api.startLearningSession(notebookId);
        if (session.status === 'active') {
          setLearningSessionId(session.id);
        }
      }
    } catch (error) {
      console.error('Lỗi bắt đầu phiên học:', error);
      alert('Không thể bắt đầu phiên học. Vui lòng thử lại.');
      setActiveTab('notes');
    } finally {
      setStudyStarting(false);
    }
  };

  const handleReview = async (
    id: string,
    score: number,
    timeSpentMs: number,
  ) => {
    if (!learningSessionId) throw new Error('Learning session is not ready');
    await api.submitLearningAnswer(learningSessionId, {
      vocab_item_id: id,
      score,
      review_type: 'flashcard',
      time_spent_ms: timeSpentMs,
    });
  };

  const completeStudy = async () => {
    if (!learningSessionId) return;
    await api.completeLearningSession(learningSessionId);
    setLearningSessionId(null);
    await Promise.all([fetchVocabs(), fetchDueVocabs()]);
  };

  if ((authLoading || loading) && vocabs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/notebooks" className="text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{notebook?.title || 'Notebook'}</h1>
              <p className="text-sm text-gray-500">{notebook?.description}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Thêm từ
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {notebook && <StatsCard notebook={notebook} />}
            <QuickActions />
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tabs */}
            <div className="flex gap-6 border-b bg-white px-4 rounded-t-xl">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 pb-3 px-2 font-medium transition-all ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Ghi chú ({filteredVocabs.length})
              </button>
              <button
                onClick={() => void startStudy()}
                disabled={studyStarting}
                className={`flex items-center gap-2 pb-3 px-2 font-medium transition-all ${
                  activeTab === 'study'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Zap className="w-4 h-4" />
                Ôn tập ({dueVocabs.length})
              </button>
            </div>

            {/* Search Bar */}
            {activeTab === 'notes' && (
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            )}

            {/* Content */}
            {activeTab === 'notes' ? (
              <VocabList
                vocabs={filteredVocabs}
                onToggleMaster={toggleMaster}
                onEdit={setEditingVocab}
                onDelete={deleteVocab}
              />
            ) : (
              <StudyMode
                dueVocabs={dueVocabs}
                onReview={handleReview}
                onComplete={completeStudy}
              />
            )}
          </div>
        </div>
      </main>

      {/* Add Modal */}
      <AddVocabModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addVocab}
      />

      {/* Edit Modal */}
      {editingVocab && (
        <AddVocabModal
          isOpen={true}
          onClose={() => setEditingVocab(null)}
          onAdd={(data) => updateVocab(editingVocab.id, data)}
          editingVocab={editingVocab}
        />
      )}
    </div>
  );
}
