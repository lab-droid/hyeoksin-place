/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  HeadingLevel,
  ShadingType
} from "docx";
import { saveAs } from "file-saver";
import { 
  Info, 
  Key, 
  ExternalLink, 
  Mail, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  FileText,
  TrendingUp,
  Globe,
  FileDown,
  MapPin,
  Hexagon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface ReportData {
  analysis: string;
  roadmap: string;
}

export default function App() {
  const [showUsage, setShowUsage] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('GEMINI_API_KEY') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [placeUrl, setPlaceUrl] = useState('');
  const [requests, setRequests] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMailInfo, setShowMailInfo] = useState(false);

  // Progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.floor(Math.random() * 10) + 2;
        });
      }, 500);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as any).elements.apiKey.value;
    setApiKey(input);
    localStorage.setItem('GEMINI_API_KEY', input);
    setShowKeyInput(false);
  };

  const handlePlaceAnalysis = async () => {
    if (!apiKey) {
      setError('Google API Key가 필요합니다. 우측 상단에서 설정해주세요.');
      return;
    }
    
    if (!placeUrl) {
      setError('스마트 플레이스 주소를 입력해주세요.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const prompt = `
        스마트플레이스 주소: ${placeUrl}

        위 플레이스 링크의 정보를 분석하여 다음 항목들을 작성해주세요.
        
        1. 최적화 세팅 요청 항목 (5~7가지):
           업체가 자신의 강점을 드러내기 위해 답변하거나 준비해야 할 구체적인 질문이나 포인트입니다. (이미지, 공지사항, 리뷰 대응, 키워드 배치 등 포함)
        
        2. 네이버 스마트 플레이스 대표 키워드 추천 (5개):
           검색 노출에 유리하고 업체의 특징을 잘 나타내는 핵심 키워드 5개를 선정해주세요.
           (중요: '맛집' 키워드는 네이버 정책상 대표 키워드로 등록할 수 없으므로 절대 포함하지 마세요.)
        
        3. 최적화된 업체 정보 (상세설명):
           고객의 방문 욕구를 자극하고 신뢰를 줄 수 있는 최적화된 상세설명 문구를 작성해주세요. (가독성 좋게 줄바꿈 활용)
        
        4. 첫 번째 소개글 기획 (제목 및 본문):
           플레이스 '소식' 탭에 올릴 첫 번째 게시물의 매력적인 제목과 본문 내용을 기획해주세요.

        [제약사항]
        - 마크다운 형식을 절대 사용하지 마세요.
        - 각 섹션을 명확한 제목(예: [1. 최적화 세팅 요청 항목])으로 구분하여 작성하세요.
        - 최대한 쉽고 친절하게 작성하세요.
      `;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }]
      });
      
      setRequests(result.text || '');
    } catch (err: any) {
      console.error(err);
      setError('분석 중 오류가 발생했습니다. API Key를 확인해주세요.');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateReport = async () => {
    if (!apiKey) {
      setError('Google API Key가 필요합니다. 우측 상단에서 설정해주세요.');
      return;
    }
    
    if (!placeUrl) {
      setError('플레이스 주소를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const genAI = new GoogleGenAI({ apiKey });
      
      const prompt = `
        당신은 네이버 스마트 플레이스 최적화 전문가입니다.
        다음 정보를 바탕으로 자세한 분석 보고서와 마케팅 로드맵을 작성해주세요.
        
        스마트플레이스 주소: ${placeUrl}
        분석 데이터 및 최적화 제안: ${requests}

        [보고서 구성 요구사항]
        1. 네이버 스마트 플레이스 현재 상태 분석 및 진단
        2. 추천 키워드 및 검색 최적화 전략
           (중요: 대표 키워드 추천 시 '맛집' 키워드는 네이버 정책상 등록이 불가능하므로 제외하고 전략을 세워주세요.)
        3. 최적화된 상세설명 및 업체 정보 가이드
        4. 첫 번째 소식(소개글) 기획 및 리뷰 관리 전략
        5. 마케팅 실행 로드맵 (1주차~4주차 단계별)

        [중요 제약사항]
        - 보고서의 첫 번째 줄은 반드시 "[업체명] 스마트 플레이스 최적화 분석 보고서" 형식의 제목이어야 합니다.
        - 마크다운 형식을 절대 사용하지 마세요. (예: #, **, -, > 등 사용 금지)
        - 일반 텍스트 줄바꿈만 사용하여 가독성 있게 작성하세요.
        - 중요한 강조 사항이나 제목에는 다음 마커를 사용하여 스타일을 지정하세요:
          * [BOLD]텍스트[/BOLD] : 굵게 표시할 텍스트
          * [RED]텍스트[/RED] : 빨간색으로 표시할 텍스트
          * [BLUE]텍스트[/BLUE] : 파란색으로 표시할 텍스트
          * [YELLOW]텍스트[/YELLOW] : 노란색 배경색을 입힐 텍스트
        - 최대한 쉽고 친절하게 설명하세요.
        - 전문적인 마케팅 용어는 풀어서 설명하세요.
      `;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }]
      });
      const text = result.text;

      // Split text into analysis and roadmap for UI separation if needed, 
      // or just keep it as one block. Here we'll just split by a common marker if exists or just show it.
      setReport({
        analysis: text,
        roadmap: "" // We'll put everything in analysis for simplicity given the "no markdown" constraint
      });
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError('보고서 생성 중 오류가 발생했습니다. API Key를 확인하거나 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocx = async () => {
    if (!report) return;

    const lines = report.analysis.split('\n');
    const paragraphs: Paragraph[] = [];

    lines.forEach((line, index) => {
      const runs: TextRun[] = [];
      
      // Simple regex-based parser for our markers
      // Matches [TAG]content[/TAG] or just plain text
      const regex = /\[(BOLD|RED|BLUE|YELLOW)\](.*?)\[\/\1\]|([^\[]+|\[(?!BOLD|RED|BLUE|YELLOW|\/BOLD|\/RED|\/BLUE|\/YELLOW).*?\])/g;
      let match;
      let hasContent = false;

      while ((match = regex.exec(line)) !== null) {
        hasContent = true;
        if (match[1]) {
          const tag = match[1];
          const content = match[2];
          runs.push(new TextRun({
            text: content,
            bold: tag === 'BOLD',
            color: tag === 'RED' ? 'FF0000' : (tag === 'BLUE' ? '0000FF' : undefined),
            shading: tag === 'YELLOW' ? {
              type: ShadingType.CLEAR,
              fill: "FFFF00",
            } : undefined,
          }));
        } else {
          runs.push(new TextRun({
            text: match[3],
          }));
        }
      }

      // If line was empty, add a spacer
      if (!hasContent && line.trim() === '') {
        paragraphs.push(new Paragraph({ text: "" }));
      } else {
        paragraphs.push(new Paragraph({
          children: runs,
          heading: index === 0 ? HeadingLevel.HEADING_1 : undefined,
          alignment: index === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 200, after: 200 }
        }));
      }
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "스마트플레이스_최적화_보고서.docx");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans selection:bg-teal-100">
      {/* Header / Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-start p-4 pointer-events-none">
        {/* Left: Usage Instructions Toggle */}
        <div className="pointer-events-auto flex flex-col items-start gap-2">
          <button 
            onClick={() => setShowUsage(!showUsage)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${
              showUsage ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 border border-gray-100'
            }`}
          >
            <Info size={16} />
            <span className="text-sm font-medium">사용방법</span>
          </button>

          <AnimatePresence>
            {showUsage && (
              <motion.div 
                initial={{ opacity: 0, x: -20, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -20, y: -10 }}
                className="bg-white p-4 rounded-2xl shadow-xl border border-gray-200 max-w-xs"
              >
                <div className="flex items-center gap-2 mb-2 text-blue-600">
                  <Info size={18} />
                  <span className="font-bold text-sm">사용 방법</span>
                </div>
                <ul className="text-xs space-y-1.5 text-gray-600">
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-bold">1.</span>
                    <span>우측 상단 버튼을 눌러 Google API Key를 입력하세요.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-bold">2.</span>
                    <span>스마트 플레이스 모바일 주소(m.place.naver.com/...)를 입력하세요.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-bold">3.</span>
                    <span>'플레이스 최적화 분석' 버튼을 눌러 핵심 포인트를 생성하세요.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500 font-bold">4.</span>
                    <span>'분석 보고서 생성하기' 버튼을 눌러 최종 보고서를 확인하세요.</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: API Key Status & Settings */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <button 
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${
              apiKey ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-white text-gray-700 border border-gray-100'
            }`}
          >
            <Key size={16} />
            <span className="text-sm font-medium">API Key {apiKey ? '적용됨' : '미적용'}</span>
          </button>

          <AnimatePresence>
            {showKeyInput && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 w-72"
              >
                <form onSubmit={handleSaveApiKey} className="space-y-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Google Gemini API Key</label>
                  <input 
                    name="apiKey"
                    type="password"
                    defaultValue={apiKey}
                    placeholder="AI Studio에서 발급받은 키 입력"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors">
                    저장하기
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className="pt-24 pb-32 px-4 max-w-4xl mx-auto">
        {/* Hero Image Section - Updated to match 3D design */}
        <section className="mb-12">
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-2xl bg-[#00C4A7] flex items-center justify-center">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full h-full px-8 md:px-16 py-8">
              <div className="flex-1 text-center md:text-left">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-black mb-4 tracking-widest uppercase">
                    AI Optimization
                  </span>
                  <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-tight">
                    혁신 플레이스<br />
                    <span className="text-teal-100">최적화 AI</span>
                  </h1>
                  <p className="text-white/90 text-sm md:text-lg font-medium max-w-md">
                    네이버 스마트 플레이스의 미래,<br className="hidden md:block" />
                    3D 분석 기술로 압도적인 성장을 경험하세요.
                  </p>
                </motion.div>
              </div>

              {/* 3D Illustration Placeholder - Hand holding phone */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
                className="flex-1 flex justify-center md:justify-end mt-8 md:mt-0"
              >
                <div className="relative w-48 h-80 md:w-56 md:h-96">
                  {/* Phone Mockup */}
                  <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-2xl border-[6px] border-white overflow-hidden">
                    <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                      <div className="relative w-20 h-20 flex items-center justify-center mb-4">
                        <Hexagon size={80} className="text-[#00C4A7] fill-[#00C4A7]/10" strokeWidth={1.5} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <MapPin size={32} className="text-[#00C4A7] fill-[#00C4A7]" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="w-6 h-6 bg-[#00C4A7] rounded-sm flex items-center justify-center text-white font-black text-[10px]">N</span>
                        <h3 className="text-gray-900 font-black text-xl">SmartPlace</h3>
                      </div>
                      <p className="text-teal-500 text-[10px] font-bold tracking-widest uppercase">Optimization AI</p>
                      
                      {/* Mock UI elements */}
                      <div className="mt-8 w-full space-y-2">
                        <div className="h-2 w-full bg-teal-100 rounded-full" />
                        <div className="h-2 w-3/4 bg-teal-100 rounded-full" />
                        <div className="h-2 w-1/2 bg-teal-100 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Input Section */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-50 mb-8">
          <div className="space-y-6 mb-8">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
                <Globe size={14} className="text-teal-500" />
                스마트 플레이스 주소
              </label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={placeUrl}
                    onChange={(e) => setPlaceUrl(e.target.value)}
                    placeholder="m.place.naver.com/hyeoksin"
                    className="flex-1 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-lg font-medium"
                  />
                  <button 
                    onClick={handlePlaceAnalysis}
                    disabled={analyzing || !placeUrl}
                    className="px-8 bg-teal-600 text-white rounded-2xl font-black text-sm hover:bg-teal-700 transition-all disabled:opacity-50 whitespace-nowrap shadow-lg shadow-teal-100"
                  >
                    {analyzing ? '분석 중...' : '플레이스 최적화 분석'}
                  </button>
                </div>
                <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                  <Info size={12} />
                  반드시 모바일 링크(m.place.naver.com/...) 형식으로 입력해주세요.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-8">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
              <FileText size={14} className="text-teal-500" />
              플레이스 최적화 분석 결과 (세팅 항목, 키워드, 상세설명, 소식 기획)
            </label>
            <div className="relative">
              <textarea 
                rows={12}
                value={requests}
                onChange={(e) => setRequests(e.target.value)}
                placeholder="플레이스 주소를 입력하고 '플레이스 최적화 분석' 버튼을 눌러주세요."
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-none leading-relaxed font-medium"
              />
              {analyzing && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Loader2 className="animate-spin text-teal-600" size={32} />
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={generateReport}
            disabled={loading || !placeUrl}
            className="w-full bg-teal-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-teal-100 hover:bg-teal-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Send size={24} />
                분석 보고서 생성하기
              </>
            )}
          </button>
        </section>

        {/* Progress Section */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white rounded-[2rem] p-8 border border-gray-50 shadow-xl shadow-gray-100">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-sm font-black text-teal-600 uppercase tracking-widest">AI 분석 진행 단계</span>
                  <span className="text-3xl font-black text-teal-600">{progress}%</span>
                </div>
                <div className="w-full h-4 bg-gray-50 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-teal-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="mt-4 text-xs text-gray-400 text-center font-medium">
                  스마트 플레이스 데이터를 분석하여 최적의 로드맵을 설계하고 있습니다.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Output Section */}
        <AnimatePresence>
          {report && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-gray-200/50 border border-gray-50 relative">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-50">
                  <div className="p-4 bg-teal-50 rounded-[1.5rem] text-teal-600 shadow-sm">
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-gray-900">플레이스 최적화 분석 보고서</h2>
                    <p className="text-sm text-gray-400 font-medium">AI 분석 전문가: 정혁신</p>
                  </div>
                </div>
                
                {/* Result Text - No Markdown, No Copy */}
                <div 
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {report.analysis.split('\n').map((line, i) => {
                    const parts = [];
                    const regex = /\[(BOLD|RED|BLUE|YELLOW)\](.*?)\[\/\1\]|([^\[]+|\[(?!BOLD|RED|BLUE|YELLOW|\/BOLD|\/RED|\/BLUE|\/YELLOW).*?\])/g;
                    let match;
                    while ((match = regex.exec(line)) !== null) {
                      if (match[1]) {
                        const tag = match[1];
                        const content = match[2];
                        parts.push(
                          <span 
                            key={parts.length}
                            className={`
                              ${tag === 'BOLD' ? 'font-bold text-gray-900' : ''}
                              ${tag === 'RED' ? 'text-red-500' : ''}
                              ${tag === 'BLUE' ? 'text-teal-600' : ''}
                              ${tag === 'YELLOW' ? 'bg-yellow-100 px-1 rounded' : ''}
                            `}
                          >
                            {content}
                          </span>
                        );
                      } else {
                        parts.push(<span key={parts.length}>{match[3]}</span>);
                      }
                    }
                    return <div key={i} className={i === 0 ? "text-2xl font-black text-center mb-10 text-teal-700" : "mb-3 font-medium"}>{parts}</div>;
                  })}
                </div>

                <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-teal-600 font-black uppercase tracking-widest text-sm">
                      <CheckCircle2 size={20} />
                      <span>분석 완료</span>
                    </div>
                    <button 
                      onClick={downloadDocx}
                      className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-sm hover:bg-teal-700 transition-all shadow-xl shadow-teal-100"
                    >
                      <FileDown size={18} />
                      보고서 다운로드 (.docx)
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-300 italic max-w-xs text-center md:text-right">
                    * 본 보고서는 AI 분석 기반이며, 실제 결과는 네이버 알고리즘 변화에 따라 다를 수 있습니다.
                  </p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Bottom Actions */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 p-6 flex justify-end gap-3 pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-end gap-3">
          {/* Maintenance Info Popover */}
          <AnimatePresence>
            {showMailInfo && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-200 w-80 mb-2"
              >
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Mail size={16} className="text-blue-500" />
                  오류/유지보수 문의
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  업데이트나 유지보수가 필요할 경우 아래 이메일로 어떤 부분이 필요한지 상세하게 작성 후 보내주세요.
                </p>
                <div className="mt-4 p-3 bg-gray-50 rounded-xl text-blue-600 font-bold text-sm text-center border border-blue-50">
                  info@nextin.ai.kr
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <button 
              onClick={() => setShowMailInfo(!showMailInfo)}
              className="bg-white text-gray-700 px-6 py-3 rounded-full shadow-lg border border-gray-200 font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-all"
            >
              <Mail size={16} />
              오류/유지보수 문의
            </button>
            <a 
              href="https://hyeoksinai.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-black text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-900 transition-all"
            >
              혁신AI 플랫폼 바로가기
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
