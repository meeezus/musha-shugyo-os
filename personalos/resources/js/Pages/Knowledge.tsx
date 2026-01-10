import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Folder, FileText, ChevronRight, ChevronDown, File } from 'lucide-react';
import { User } from '@/types';
import { useState } from 'react';

interface TreeNode {
  type: 'folder' | 'file';
  name: string;
  path: string;
  children?: TreeNode[];
  fileCount?: number;
  extension?: string;
  size?: number;
}

interface KnowledgeStats {
  totalFiles: number;
  totalFolders: number;
}

interface Props {
  auth: {
    user: User;
  };
  tree: TreeNode[];
  stats: KnowledgeStats;
}

function TreeItem({ node, level = 0 }: { node: TreeNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  if (node.type === 'file') {
    const icon = node.extension === 'pdf' ? (
      <File size={14} className="text-red-400/60" />
    ) : (
      <FileText size={14} className="text-emerald-500/60" />
    );

    return (
      <Link
        href={`/knowledge/file/${node.path}`}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-black/60 dark:text-white/60 hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-[2px] group"
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {icon}
        <span className="truncate flex-1">{node.name}</span>
        <span className="text-[9px] text-black/30 dark:text-white/30 opacity-0 group-hover:opacity-100">
          {node.extension?.toUpperCase()}
        </span>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-[2px]"
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {isExpanded ? (
          <ChevronDown size={12} className="text-black/40 dark:text-white/40 flex-shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-black/40 dark:text-white/40 flex-shrink-0" />
        )}
        <Folder size={14} className="text-emerald-500/60 flex-shrink-0" />
        <span className="truncate flex-1 font-bold">{node.name}</span>
        <span className="text-[9px] text-black/30 dark:text-white/30">{node.fileCount}</span>
      </button>

      {isExpanded && node.children && node.children.length > 0 && (
        <div className="mt-0.5">
          {node.children.map((child, index) => (
            <TreeItem key={child.path || index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Knowledge({ auth, tree, stats }: Props) {
  return (
    <AppLayout user={auth.user}>
      <Head title="Knowledge" />

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar Tree */}
        <div className="w-80 border-r border-black/10 dark:border-white/10 flex flex-col bg-white dark:bg-[#0A0A0A]">
          {/* Header */}
          <div className="p-4 border-b border-black/10 dark:border-white/10">
            <h2 className="text-sm font-display font-bold text-black dark:text-white mb-2">
              KNOWLEDGE
            </h2>
            <div className="flex items-center gap-3 text-[10px] font-mono text-black/40 dark:text-white/40">
              <span>{stats.totalFolders} folders</span>
              <span>•</span>
              <span>{stats.totalFiles} files</span>
            </div>
          </div>

          {/* Tree View */}
          <div className="flex-1 overflow-y-auto p-2">
            {tree.map((node, index) => (
              <TreeItem key={node.path || index} node={node} />
            ))}
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[800px] mx-auto">
            <div className="stealth-card p-8 text-center">
              <Folder size={64} className="mx-auto mb-6 text-emerald-500/20" />
              <h2 className="text-2xl font-display font-bold text-black dark:text-white mb-3">
                Knowledge Base
              </h2>
              <p className="text-black/40 dark:text-white/40 text-sm font-mono mb-6">
                Select a file from the sidebar to view its contents
              </p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4">
                  <div className="text-2xl font-bold text-emerald-400 mb-1">
                    {stats.totalFiles}
                  </div>
                  <div className="text-[10px] font-mono text-black/40 dark:text-white/40 uppercase tracking-wide">
                    Total Files
                  </div>
                </div>
                <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[2px] p-4">
                  <div className="text-2xl font-bold text-emerald-400 mb-1">
                    {stats.totalFolders}
                  </div>
                  <div className="text-[10px] font-mono text-black/40 dark:text-white/40 uppercase tracking-wide">
                    Folders
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-[2px]">
              <h3 className="text-xs font-mono font-bold text-emerald-400 mb-2 uppercase tracking-wide">
                Navigation Tips
              </h3>
              <ul className="text-xs font-mono text-black/60 dark:text-white/60 space-y-1">
                <li>• Click folders to expand/collapse</li>
                <li>• Click files to view content</li>
                <li>• PDF files open for download</li>
                <li>• Markdown files render with syntax highlighting</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
