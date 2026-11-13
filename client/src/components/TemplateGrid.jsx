import { useState, useMemo } from 'react';
import TemplateCard from './TemplateCard';

const TemplateGrid = ({ templates = [], onUnlock, onResetLocks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'fresh' | 'locked'

  // Counts
  const lockedCount = useMemo(() => templates.filter(t => t.isUsedThisMonth).length, [templates]);
  const freshCount = useMemo(() => templates.filter(t => !t.isUsedThisMonth).length, [templates]);

  // Unique categories
  const categories = useMemo(() => {
    const list = new Set(templates.map((t) => t.category));
    return ['All', ...Array.from(list)];
  }, [templates]);

  // Filter templates based on search term, category, and lock status
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'fresh'
          ? !t.isUsedThisMonth
          : t.isUsedThisMonth;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [templates, searchTerm, selectedCategory, statusFilter]);

  return (
    <div>
      {/* Top Controls: Status Tabs & Quick Reset */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px 16px',
          background: 'var(--navy-800)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--white-10)',
        }}
      >
        {/* Availability Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '0.82rem' }}
          >
            All Designs ({templates.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('fresh')}
            className={`btn btn-sm ${statusFilter === 'fresh' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px', fontSize: '0.82rem' }}
          >
            ✨ Fresh & Available ({freshCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('locked')}
            className={`btn btn-sm ${statusFilter === 'locked' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderColor: lockedCount > 0 ? 'rgba(239, 68, 68, 0.5)' : undefined,
            }}
          >
            🔒 Used / Locked ({lockedCount})
          </button>
        </div>

        {/* Reset Locks Action Button if any designs are locked */}
        {lockedCount > 0 && onResetLocks && (
          <button
            type="button"
            onClick={onResetLocks}
            className="btn btn-outline btn-sm"
            style={{
              color: 'var(--gold-400)',
              borderColor: 'rgba(232, 185, 35, 0.4)',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Reset used marks to reuse any template"
          >
            <span>🔄</span> Unlock All Designs ({lockedCount})
          </button>
        )}
      </div>

      {/* Search and Category Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search templates by title, festival, or metal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: '40px',
              fontSize: '0.95rem',
              height: '46px',
            }}
          />
        </div>

        {/* Category Filters */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'thin',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                textTransform: 'capitalize',
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
              }}
            >
              {cat === 'festival' ? '🎉 Festival Specials' : cat === 'premium' ? '👑 Premium Rates' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Display */}
      {filteredTemplates.length === 0 ? (
        <div className="empty-state animate-fadeIn">
          <div className="empty-state-icon">{statusFilter === 'locked' ? '🔓' : '🖼️'}</div>
          <div className="empty-state-title">
            {statusFilter === 'locked' ? 'No Locked Templates' : 'No Templates Found'}
          </div>
          <p className="empty-state-desc">
            {statusFilter === 'locked'
              ? 'You have not locked any templates yet. When you download a poster, it will appear here as locked so you can try other designs!'
              : 'Try modifying your search query or selecting a different category tab.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template._id}
              template={template}
              onUnlock={onUnlock}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateGrid;

