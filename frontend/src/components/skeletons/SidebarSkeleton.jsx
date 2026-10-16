const SidebarSkeleton = () => {
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside className="h-full w-full flex flex-col bg-base-100" aria-busy="true" aria-label="Loading conversations">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="skeleton size-9 rounded-full" />
          <div className="skeleton h-4 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton size-7 rounded-full" />
          <div className="skeleton size-7 rounded-full" />
        </div>
      </div>

      {/* Search + tabs */}
      <div className="px-4 pt-3 pb-2 space-y-3">
        <div className="skeleton h-9 w-full rounded-[10px]" />
        <div className="flex gap-2">
          {[48, 56, 64, 52].map((w, i) => (
            <div key={i} className="skeleton h-6 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Contacts */}
      <div className="flex-1 overflow-hidden px-2 py-1">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full p-2 flex items-center gap-3">
            <div className="skeleton size-11 rounded-full shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-3.5" style={{ width: `${55 + ((idx * 17) % 35)}%` }} />
              <div className="skeleton h-3" style={{ width: `${30 + ((idx * 23) % 40)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;
