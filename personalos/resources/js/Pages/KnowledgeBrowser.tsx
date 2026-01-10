import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Folder, FileText, ArrowLeft, ChevronRight } from 'lucide-react';
import { User } from '@/types';

interface Folder {
  name: string;
  path: string;
  fileCount: number;
}

interface File {
  name: string;
  slug: string;
  path: string;
  title: string;
  type: string;
  dateAdded: string | null;
  excerpt: string;
  size: number;
}

interface Breadcrumb {
  name: string;
  path: string;
}

interface Props {
  auth: {
    user: User;
  };
  folders: Folder[];
  files: File[];
  currentPath: string;
  breadcrumbs: Breadcrumb[];
}

export default function KnowledgeBrowser({ auth, folders, files, currentPath, breadcrumbs }: Props) {
  return (
    <AppLayout user={auth.user}>
      <Head title={`Knowledge - ${breadcrumbs[breadcrumbs.length - 1]?.name || 'Browse'}`} />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1200px] mx-auto">

        {/* Back button */}
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 text-xs font-mono text-white/40 hover:text-emerald-400 transition-colors mb-6 px-3 py-2 bg-white/5 border border-white/10 rounded-[2px]"
        >
          <ArrowLeft size={12} />
          BACK TO KNOWLEDGE
        </Link>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 mb-6 text-xs font-mono">
            <Link href="/knowledge" className="text-white/40 hover:text-emerald-400 transition-colors">
              Knowledge
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center gap-2">
                <ChevronRight size={12} className="text-white/20" />
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-white font-bold">{crumb.name}</span>
                ) : (
                  <Link
                    href={`/knowledge/browse/${crumb.path}`}
                    className="text-white/40 hover:text-emerald-400 transition-colors"
                  >
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="mb-6 pb-4 border-b border-white/10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
            {breadcrumbs[breadcrumbs.length - 1]?.name || 'Browse'}
          </h2>
          <div className="flex items-center gap-4 text-xs font-mono text-white/40">
            {folders.length > 0 && <span>{folders.length} folder{folders.length !== 1 ? 's' : ''}</span>}
            {folders.length > 0 && files.length > 0 && <span>•</span>}
            {files.length > 0 && <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>}
          </div>
        </div>

        {/* Subfolders */}
        {folders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-mono text-white/50 uppercase tracking-wide mb-4">Folders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {folders.map((folder) => (
                <Link
                  key={folder.path}
                  href={`/knowledge/browse/${folder.path}`}
                  className="group stealth-card p-4 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-emerald-500/60 group-hover:text-emerald-500 transition-colors">
                      <Folder size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-white text-sm mb-1 group-hover:text-emerald-400 transition-colors">
                        {folder.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/30">
                        <FileText size={9} />
                        <span>{folder.fileCount} file{folder.fileCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        {files.length > 0 && (
          <div>
            <h3 className="text-sm font-mono text-white/50 uppercase tracking-wide mb-4">Files</h3>
            <div className="space-y-2">
              {files.map((file) => (
                <Link
                  key={file.path}
                  href={`/knowledge/file/${file.path}`}
                  className="block p-4 bg-[#0F0F0F] border border-white/5 rounded-[2px] hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold font-display text-sm mb-2 group-hover:text-emerald-400 transition-colors">
                        {file.title}
                      </h4>
                      {file.excerpt && (
                        <p className="text-white/40 text-xs mb-3 line-clamp-2 font-light">
                          {file.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 rounded-[2px] text-white/60">
                          {file.type}
                        </span>
                        {file.dateAdded && (
                          <span className="text-[10px] font-mono text-white/30">
                            {file.dateAdded}
                          </span>
                        )}
                      </div>
                    </div>
                    <FileText className="w-4 h-4 text-white/20 group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {folders.length === 0 && files.length === 0 && (
          <div className="stealth-card p-12 text-center">
            <Folder size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/40 text-sm font-mono">This folder is empty</p>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
