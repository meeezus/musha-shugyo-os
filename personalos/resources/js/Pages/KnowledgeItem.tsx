import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Calendar, Tag, ExternalLink, User as UserIcon, Trash2, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User } from '@/types';
import { useState } from 'react';

interface KnowledgeItemData {
  title: string;
  type: string;
  date_added?: string;
  source?: string;
  author?: string;
  tags: string[];
  via?: string;
  content: string;
  contentHtml: string;
  path: string;
  folder: string;
  slug: string;
  isPdf: boolean;
  pdfPath?: string;
  fileSize?: number;
}

interface RelatedItem {
  slug: string;
  path: string;
  title: string;
  type: string;
  excerpt: string;
}

interface Props {
  auth: {
    user: User;
  };
  item: KnowledgeItemData;
  relatedItems: RelatedItem[];
}

export default function KnowledgeItem({ auth, item, relatedItems }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    router.delete(`/knowledge/file/${item.path}`, {
      onSuccess: () => {
        // Will redirect to folder page via controller
      }
    });
  };

  const breadcrumbs = item.folder ? item.folder.split('/') : [];

  return (
    <AppLayout user={auth.user}>
      <Head title={item.title} />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1200px] mx-auto">

        {/* Back button and Delete */}
        <div className="flex items-center justify-between mb-6">
          {item.folder ? (
            <Link
              href={`/knowledge/browse/${item.folder}`}
              className="inline-flex items-center gap-2 text-xs font-mono text-black/40 dark:text-white/40 hover:text-emerald-400 transition-colors px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px]"
            >
              <ArrowLeft size={12} />
              BACK TO FOLDER
            </Link>
          ) : (
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-2 text-xs font-mono text-black/40 dark:text-white/40 hover:text-emerald-400 transition-colors px-3 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px]"
            >
              <ArrowLeft size={12} />
              BACK TO KNOWLEDGE
            </Link>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 text-xs font-mono text-red-400/60 hover:text-red-400 transition-colors px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-[2px] hover:border-red-500/40"
          >
            <Trash2 size={12} />
            DELETE
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="stealth-card p-6 max-w-md w-full">
              <h3 className="font-bold font-display text-black dark:text-white text-lg mb-4">
                CONFIRM DELETE
              </h3>
              <p className="text-black/70 dark:text-white/70 text-sm mb-6">
                Are you sure you want to delete "{item.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-xs rounded-[2px] hover:bg-red-500/30 transition-colors"
                >
                  DELETE
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 font-mono text-xs rounded-[2px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 mb-6 text-xs font-mono">
            <Link href="/knowledge" className="text-black/40 dark:text-white/40 hover:text-emerald-400 transition-colors">
              Knowledge
            </Link>
            {breadcrumbs.map((crumb, index) => {
              const crumbPath = breadcrumbs.slice(0, index + 1).join('/');
              return (
                <div key={crumbPath} className="flex items-center gap-2">
                  <ChevronRight size={12} className="text-black/20 dark:text-white/20" />
                  <Link
                    href={`/knowledge/browse/${crumbPath}`}
                    className="text-black/40 dark:text-white/40 hover:text-emerald-400 transition-colors"
                  >
                    {crumb}
                  </Link>
                </div>
              );
            })}
            <div className="flex items-center gap-2">
              <ChevronRight size={12} className="text-black/20 dark:text-white/20" />
              <span className="text-black/60 dark:text-white/60">{item.slug}</span>
            </div>
          </div>
        )}

        {/* Main content */}
        <article className="stealth-card p-6 md:p-8 mb-6">

          {/* Header */}
          <header className="mb-8 pb-6 border-b border-black/5 dark:border-white/5">
            {/* Type badge */}
            <div className="mb-4">
              <span className="text-[10px] font-mono px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-[2px]">
                {item.type.toUpperCase()}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-display font-bold text-black dark:text-white mb-4">
              {item.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-black/40 dark:text-white/40 mb-4">
              {item.date_added && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {item.date_added}
                </span>
              )}

              {item.author && (
                <span className="flex items-center gap-1">
                  <UserIcon size={12} />
                  {item.author}
                </span>
              )}
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Tag size={12} className="text-black/30 dark:text-white/30" />
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-1 bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/10 dark:border-white/10 rounded-[2px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Source link */}
            {item.source && (
              <a
                href={item.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <ExternalLink size={12} />
                VIEW SOURCE
              </a>
            )}

            {/* Via */}
            {item.via && (
              <p className="text-xs font-mono text-black/30 dark:text-white/30 mt-3 border-l border-black/10 dark:border-white/10 pl-3">
                {item.via}
              </p>
            )}
          </header>

          {/* Content */}
          {item.isPdf ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2px] mb-6">
                <svg className="w-12 h-12 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-bold text-black dark:text-white mb-2">PDF Document</h3>
              <p className="text-black/40 dark:text-white/40 text-sm font-mono mb-6">
                {(item.fileSize! / 1024 / 1024).toFixed(2)} MB
              </p>
              <a
                href={`/knowledge/download/${item.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-sm rounded-[2px] hover:bg-emerald-500/30 transition-colors"
              >
                <ExternalLink size={16} />
                OPEN PDF
              </a>
              <p className="text-black/30 dark:text-white/30 text-xs font-mono mt-4">
                Click to open in your default PDF viewer
              </p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({...props}) => <h1 className="text-2xl font-display font-bold text-black dark:text-white mb-4 mt-8" {...props} />,
                  h2: ({...props}) => <h2 className="text-xl font-display font-bold text-black dark:text-white mb-3 mt-6" {...props} />,
                  h3: ({...props}) => <h3 className="text-lg font-display font-bold text-black dark:text-white mb-2 mt-4" {...props} />,
                  p: ({...props}) => <p className="text-black/70 dark:text-white/70 mb-4 leading-relaxed" {...props} />,
                  ul: ({...props}) => <ul className="list-disc list-inside text-black/70 dark:text-white/70 mb-4 space-y-2" {...props} />,
                  ol: ({...props}) => <ol className="list-decimal list-inside text-black/70 dark:text-white/70 mb-4 space-y-2" {...props} />,
                  li: ({...props}) => <li className="text-black/70 dark:text-white/70" {...props} />,
                  a: ({...props}) => <a className="text-emerald-400 hover:text-emerald-300 underline" {...props} />,
                  code: ({...props}) => <code className="text-xs font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-[2px] text-emerald-400" {...props} />,
                  pre: ({...props}) => <pre className="bg-[#f0f0f0] dark:bg-[#0F0F0F] border border-black/10 dark:border-white/10 rounded-[2px] p-4 overflow-x-auto mb-4" {...props} />,
                  blockquote: ({...props}) => <blockquote className="border-l-2 border-emerald-500/30 pl-4 italic text-black/60 dark:text-white/60 my-4" {...props} />,
                  strong: ({...props}) => <strong className="text-black dark:text-white font-bold" {...props} />,
                }}
              >
                {item.content}
              </ReactMarkdown>
            </div>
          )}
        </article>

        {/* Related items */}
        {relatedItems.length > 0 && (
          <div className="stealth-card p-6">
            <h2 className="font-bold font-display text-black dark:text-white tracking-wide text-sm mb-4">
              RELATED FILES
            </h2>
            <div className="space-y-2">
              {relatedItems.map((relatedItem) => (
                <Link
                  key={relatedItem.path}
                  href={`/knowledge/file/${relatedItem.path}`}
                  className="block p-3 bg-[#f0f0f0] dark:bg-[#0F0F0F] border border-black/5 dark:border-white/5 rounded-[2px] hover:border-emerald-500/30 transition-all group"
                >
                  <h3 className="font-bold font-display text-black dark:text-white text-sm mb-1 group-hover:text-emerald-400 transition-colors">
                    {relatedItem.title}
                  </h3>
                  <p className="text-black/40 dark:text-white/40 text-xs line-clamp-2 font-light">
                    {relatedItem.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
