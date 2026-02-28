import React, { useState, useEffect, useContext } from "react";
import { db, storage } from "../firebaseConfig.js";
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, 
  doc, serverTimestamp, query, orderBy 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Authcontext } from "../contextProvider.jsx";
import { 
  Plus, X, Trash2, Edit3, Search, BookOpen, User, Calendar, 
  Hash, Image as ImageIcon, CheckCircle, AlertCircle, Send,
  ChevronRight, MoreVertical, Layout, Type, Globe, Zap,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, List, ListOrdered, Quote, Link as LinkIcon,
  Undo, Redo, Eraser
} from "lucide-react";
import Navbar from "../components/navbar.jsx";

// Tiptap Imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

// --- CUSTOM TIPTAP MENUBAR ---
const EditorMenuBar = ({ editor }) => {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const NavButton = ({ onClick, disabled, isActive, children }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
        isActive 
          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-800 bg-[#0f172a] p-2 rounded-t-xl">
      <NavButton onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={16} /></NavButton>
      <NavButton onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={16} /></NavButton>
      <NavButton onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon size={16} /></NavButton>
      <NavButton onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough size={16} /></NavButton>
      
      <div className="w-px h-6 bg-slate-700 mx-1 self-center" />
      
      <NavButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}><Heading1 size={16} /></NavButton>
      <NavButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}><Heading2 size={16} /></NavButton>
      
      <div className="w-px h-6 bg-slate-700 mx-1 self-center" />
      
      <NavButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List size={16} /></NavButton>
      <NavButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}><ListOrdered size={16} /></NavButton>
      <NavButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}><Quote size={16} /></NavButton>
      
      <div className="w-px h-6 bg-slate-700 mx-1 self-center" />
      
      <NavButton onClick={setLink} isActive={editor.isActive('link')}><LinkIcon size={16} /></NavButton>
      <NavButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}><Eraser size={16} /></NavButton>
      
      <div className="w-px h-6 bg-slate-700 mx-1 self-center" />
      
      <NavButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}><Undo size={16} /></NavButton>
      <NavButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}><Redo size={16} /></NavButton>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const BlogsPage = () => {
  const { userDetails } = useContext(Authcontext);
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("live");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "Tech",
    tags: "",
    status: "active",
    featuredImage: ""
  });
  const [imageFile, setImageFile] = useState(null);

  // Initialize Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: formData.content,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, content: editor.getHTML() }));
    },
  });

  // Sync editor content when editing an existing post
  useEffect(() => {
    if (editor && formData.content !== editor.getHTML()) {
      editor.commands.setContent(formData.content);
    }
  }, [formData.content, editor]);

  useEffect(() => {
    const q = query(collection(db, "blog_posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = formData.featuredImage || "";
      if (imageFile) {
        const storageRef = ref(storage, `blog_assets/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const payload = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content, // Now pulling cleanly from Tiptap state
        category: formData.category,
        tags: formData.tags.split(",").map(tag => tag.trim()), 
        featuredImage: imageUrl,
        authorName: userDetails?.displayName || "System Admin",
        authorEmail: userDetails?.email || "admin@system.io",
        authorAvatar: userDetails?.photoURL || "",
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "blog_posts", editingId), payload);
      } else {
        await addDoc(collection(db, "blog_posts"), { 
          ...payload, 
          status: "active", 
          createdAt: serverTimestamp(),
          views: 0 
        });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Transmission failed. Check console.");
    }
    setLoading(false);
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "archived" : "active";
    await updateDoc(doc(db, "blog_posts", id), { status: nextStatus });
  };

  const resetForm = () => {
    setFormData({ title: "", excerpt: "", content: "", category: "Tech", tags: "", status: "active", featuredImage: "" });
    setImageFile(null);
    setEditingId(null);
    if (editor) editor.commands.setContent(""); // Reset editor visibly
    setIsModalOpen(false);
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return view === "live" ? p.status === "active" && matchesSearch : p.status === "archived" && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
        
        {/* ── HEADER & CONTROLS ── */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter italic">Editorial <span className="text-cyan-500">Nexus</span></h1>
              <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] mt-1">Manage system-wide knowledge base</p>
            </div>
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="w-full sm:w-auto px-6 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-black text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition-all"
            >
              <Plus size={16} /> Create Dispatch
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
             <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
              <button onClick={() => setView("live")} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "live" ? "bg-slate-700 text-cyan-400" : "text-slate-500"}`}>Published</button>
              <button onClick={() => setView("archived")} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "archived" ? "bg-slate-700 text-amber-500" : "text-slate-500"}`}>Archive</button>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search articles or categories..." 
                className="w-full bg-black/50 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs focus:border-cyan-500 outline-none transition-all"
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── BLOG LIST ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map(post => (
            <div key={post.id} className="group relative bg-slate-900/20 border border-slate-800/60 rounded-[2rem] p-6 hover:border-cyan-500/30 transition-all flex flex-col h-full">
              <div className="aspect-video w-full mb-6 rounded-2xl overflow-hidden bg-black border border-slate-800 relative">
                {post.featuredImage ? (
                  <img src={post.featuredImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800"><BookOpen size={48} /></div>
                )}
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 backdrop-blur-md border border-slate-700 rounded-full text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                  {post.category}
                </div>
              </div>

              <h2 className="text-xl font-bold uppercase tracking-tight mb-2 group-hover:text-cyan-400 transition-colors">{post.title}</h2>
              <p className="text-slate-400 text-xs line-clamp-2 mb-6 italic">{post.excerpt}</p>

              <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold">
                    {post.authorName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-white">{post.authorName}</p>
                    <p className="text-[9px] font-mono text-slate-500">{(post.createdAt?.toDate())?.toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(post.id); setFormData({...post, tags: post.tags.join(", ")}); setIsModalOpen(true); }} className="p-2 bg-slate-800 rounded-lg hover:text-cyan-400 transition-colors"><Edit3 size={14}/></button>
                  <button onClick={() => handleStatusToggle(post.id, post.status)} className={`p-2 bg-slate-800 rounded-lg hover:text-amber-500 transition-colors`}><Zap size={14}/></button>
                  <button onClick={() => deleteDoc(doc(db, "blog_posts", post.id))} className="p-2 bg-slate-800 rounded-lg hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── EDITORIAL MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center bg-black/95 backdrop-blur-xl overflow-y-auto">
          <form onSubmit={handleSubmit} className="relative mt-10 mb-10 bg-slate-900 border border-cyan-500/30 w-full max-w-4xl rounded-[2.5rem] p-6 sm:p-10 space-y-8 animate-in slide-in-from-bottom-4 h-fit">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">{editingId ? "Override Dispatch" : "Commit New Dispatch"}</h2>
                <p className="text-cyan-500 text-[9px] font-mono uppercase tracking-[0.3em]">Module: Editorial_Interface // Auth: {userDetails?.email}</p>
              </div>
              <button type="button" onClick={resetForm} className="p-3 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={24}/></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Media & Meta */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={12}/> Cover Asset</label>
                  <div className="aspect-square bg-black border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center p-4 text-center group hover:border-cyan-500/50 cursor-pointer relative overflow-hidden">
                    {imageFile || formData.featuredImage ? (
                      <img src={imageFile ? URL.createObjectURL(imageFile) : formData.featuredImage} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="preview" />
                    ) : null}
                    <input type="file" className="hidden" id="blog-asset" onChange={e => setImageFile(e.target.files[0])} />
                    <label htmlFor="blog-asset" className="relative z-10 cursor-pointer">
                      <p className="text-[10px] font-bold uppercase text-cyan-500">Replace Media</p>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                  <select 
                    className="w-full bg-black border border-slate-800 p-4 rounded-xl text-xs font-bold uppercase outline-none focus:border-cyan-500"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option>Tech</option>
                    <option>Operations</option>
                    <option>Development</option>
                    <option>Intelligence</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tags (Comma Separated)</label>
                  <input 
                    className="w-full bg-black border border-slate-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500" 
                    placeholder="React, Firebase, UI..." 
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                  />
                </div>
              </div>

              {/* Right Column: Content */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Article Title</label>
                  <input 
                    required
                    className="w-full bg-black border border-slate-800 p-4 rounded-xl text-lg font-bold outline-none focus:border-cyan-500" 
                    placeholder="The Future of Autonomous UI..." 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Brief Excerpt</label>
                  <textarea 
                    required
                    className="w-full bg-black border border-slate-800 p-4 rounded-xl text-xs h-20 resize-none outline-none focus:border-cyan-500 italic" 
                    placeholder="A short summary for the card view..."
                    value={formData.excerpt}
                    onChange={e => setFormData({...formData, excerpt: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Editorial Body</label>
                  
                  {/* Tiptap Editor Implementation */}
                  <div className="editorial-container bg-black border border-slate-800 rounded-xl overflow-hidden focus-within:border-cyan-500 transition-colors">
                    <EditorMenuBar editor={editor} />
                    <EditorContent editor={editor} className="p-4" />
                  </div>

                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 py-6 rounded-[2rem] font-black text-[10px] tracking-[0.4em] uppercase shadow-2xl shadow-cyan-900/40 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? "Transmitting Data..." : editingId ? "Update System Records" : "Authorize Editorial Deployment"}
            </button>
          </form>
        </div>
      )}
      
      {/* Tiptap Custom Styling Replacing Quill */}
      <style>{`
        /* Tiptap ProseMirror Styles */
        .ProseMirror {
          min-height: 250px;
          color: #cbd5e1;
          font-family: inherit;
          font-size: 14px;
          outline: none;
        }
        
        /* Placeholder equivalent */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #475569;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }

        /* Essential Editor Formatting Rules */
        .ProseMirror p { margin-bottom: 0.75em; }
        .ProseMirror h1 { font-size: 1.8em; font-weight: 900; margin-bottom: 0.5em; color: white; }
        .ProseMirror h2 { font-size: 1.4em; font-weight: bold; margin-bottom: 0.5em; color: white; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
        .ProseMirror blockquote { border-left: 3px solid #06b6d4; padding-left: 1rem; color: #94a3b8; font-style: italic; margin-bottom: 1rem; }
        .ProseMirror a { color: #06b6d4; text-decoration: underline; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default BlogsPage;