import React, { useState } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
  featured: boolean;
}

interface BlogState {
  selectedCategory: string;
  searchQuery: string;
}

const BlogPage: React.FC = () => {
  const [state, setState] = useState<BlogState>({
    selectedCategory: 'all',
    searchQuery: ''
  });

  const posts: BlogPost[] = [
    {
      id: '1',
      title: 'Getting Started with Multi-Agent Systems',
      excerpt: 'Learn how to build AI systems where multiple agents collaborate to solve complex problems.',
      author: 'Sarah Chen',
      date: '2024-05-02',
      category: 'tutorial',
      readTime: '8 min',
      image: '🤖',
      featured: true
    },
    {
      id: '2',
      title: 'Optimizing Agent Performance: A Guide to Efficiency',
      excerpt: 'Discover techniques to make your AI agents faster, cheaper, and more reliable.',
      author: 'Alex Rodriguez',
      date: '2024-04-28',
      category: 'performance',
      readTime: '10 min',
      image: '⚡',
      featured: true
    },
    {
      id: '3',
      title: 'Real-World Applications: AI Agents in Production',
      excerpt: 'See how companies are using Forge agents to automate complex workflows and save costs.',
      author: 'Maya Patel',
      date: '2024-04-25',
      category: 'case-study',
      readTime: '12 min',
      image: '📊',
      featured: false
    },
    {
      id: '4',
      title: 'Prompt Engineering Best Practices',
      excerpt: 'Master the art of writing effective prompts that get better results from your agents.',
      author: 'Jordan Smith',
      date: '2024-04-20',
      category: 'tutorial',
      readTime: '7 min',
      image: '✍️',
      featured: false
    },
    {
      id: '5',
      title: 'Building RAG Systems with Knowledge Bases',
      excerpt: 'Integrate external knowledge sources into your agents for more accurate and informed decisions.',
      author: 'Sarah Chen',
      date: '2024-04-15',
      category: 'tutorial',
      readTime: '9 min',
      image: '📚',
      featured: false
    },
    {
      id: '6',
      title: 'Forge API v2: What\'s New and What\'s Coming',
      excerpt: 'Explore the latest updates to our API and upcoming features in our roadmap.',
      author: 'Alex Rodriguez',
      date: '2024-04-10',
      category: 'announcement',
      readTime: '6 min',
      image: '📢',
      featured: false
    }
  ];

  const categories = [
    { id: 'all', label: 'All Articles' },
    { id: 'tutorial', label: 'Tutorials' },
    { id: 'announcement', label: 'Announcements' },
    { id: 'case-study', label: 'Case Studies' },
    { id: 'performance', label: 'Performance' }
  ];

  const filteredPosts = posts.filter(post => {
    const matchesCategory = state.selectedCategory === 'all' || post.category === state.selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = filteredPosts.filter(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Blog</h1>
          <p className="text-lg text-slate-600 mb-8">Learn, explore, and stay updated on AI agents and Forge.</p>

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <input
              type="text"
              placeholder="Search articles..."
              value={state.searchQuery}
              onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setState(prev => ({ ...prev, selectedCategory: cat.id }))}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  state.selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="px-6 py-16 sm:px-8 lg:px-12 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Featured</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {featuredPosts.map(post => (
              <Link key={post.id} href={`/blog/${post.id}`}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="text-5xl">{post.image}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full capitalize">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{post.title}</h3>
                  <p className="text-slate-600">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t">
                    <span>{post.author}</span>
                    <span>{post.readTime} read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className={`px-6 ${featuredPosts.length > 0 ? 'py-8' : 'py-16'} sm:px-8 lg:px-12 max-w-6xl mx-auto`}>
        <h2 className="text-2xl font-bold text-slate-900 mb-8">
          {filteredPosts.length === regularPosts.length ? 'Latest Articles' : 'More Articles'}
        </h2>
        <div className="space-y-6">
          {regularPosts.length > 0 ? (
            regularPosts.map(post => (
              <Link key={post.id} href={`/blog/${post.id}`}
                className="block bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg hover:border-blue-200 transition">
                <div className="flex gap-6">
                  <div className="text-4xl flex-shrink-0">{post.image}</div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{post.title}</h3>
                        <p className="text-slate-600 text-sm mt-1">{post.excerpt}</p>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full capitalize flex-shrink-0">
                        {post.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{post.author}</span>
                      <span>•</span>
                      <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span>{post.readTime} read</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">No articles found. Try a different search or category.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="px-6 py-16 sm:px-8 lg:px-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Stay Updated</h2>
          <p className="text-lg text-blue-100">Get the latest Forge news and tutorials delivered to your inbox.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button className="px-6 py-2 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;
