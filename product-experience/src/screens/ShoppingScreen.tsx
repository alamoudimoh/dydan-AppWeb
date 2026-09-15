import { useState } from "react";
import { AppCtx, Icon } from "../App";
import { SHOPPING_LISTS, ShoppingList, ShoppingItem, getMemberById } from "../data";

export default function ShoppingScreen({ ctx, isSolo }: { ctx: AppCtx; isSolo: boolean }) {
  const [lists, setLists] = useState<ShoppingList[]>(SHOPPING_LISTS);
  const [activeList, setActiveList] = useState<string>("sl-groceries");
  const [newItem, setNewItem] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListEmoji, setNewListEmoji] = useState("🛒");
  const [newListShared, setNewListShared] = useState(false);

  const [isEditingList, setIsEditingList] = useState(false);
  const [editListName, setEditListName] = useState("");
  const [editListEmoji, setEditListEmoji] = useState("");
  const [editListShared, setEditListShared] = useState(false);

  const visibleLists = isSolo ? lists.filter(l => !l.isShared) : lists;
  const currentList = visibleLists.find(l => l.id === activeList) || visibleLists[0];

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const newList: ShoppingList = {
      id: `sl-${Date.now()}`,
      name: newListName.trim(),
      emoji: newListEmoji,
      isShared: !isSolo && newListShared,
      ownerId: "sarah",
      items: []
    };
    setLists(prev => [...prev, newList]);
    setActiveList(newList.id);
    setIsCreatingList(false);
    setNewListName("");
    setNewListEmoji("🛒");
    ctx.showToast(`List "${newList.name}" created`);
  };

  const toggleItem = (listId: string, itemId: string) => {
    setLists(prev => prev.map(l => l.id !== listId ? l : {
      ...l, items: l.items.map(i => i.id !== itemId ? i : { ...i, done: !i.done })
    }));
  };

  const addItem = (listId: string) => {
    if (!newItem.trim()) return;
    const item: ShoppingItem = { id: `item-${Date.now()}`, text: newItem.trim(), done: false, addedById: "sarah" };
    setLists(prev => prev.map(l => l.id !== listId ? l : { ...l, items: [...l.items, item] }));
    setNewItem("");
    ctx.showToast(`"${item.text}" added`);
  };

  const removeItem = (listId: string, itemId: string) => {
    setLists(prev => prev.map(l => l.id !== listId ? l : { ...l, items: l.items.filter(i => i.id !== itemId) }));
  };

  const clearDone = (listId: string) => {
    setLists(prev => prev.map(l => l.id !== listId ? l : { ...l, items: l.items.filter(i => !i.done) }));
    ctx.showToast("Completed items cleared");
  };

  const saveEdit = (listId: string, itemId: string) => {
    if (!editText.trim()) return;
    setLists(prev => prev.map(l => l.id !== listId ? l : { ...l, items: l.items.map(i => i.id !== itemId ? i : { ...i, text: editText }) }));
    setEditingId(null);
  };

  if (!currentList && !isCreatingList) return (
    <div className="empty-state">
      <div style={{ fontSize: 48 }}>🛒</div>
      <div className="font-bold text-primary">No shopping lists yet</div>
      <button className="btn btn-primary mt-3" onClick={() => setIsCreatingList(true)}><Icon name="plus" size={15} />Create list</button>
    </div>
  );

  const todo = currentList.items.filter(i => !i.done);
  const done = currentList.items.filter(i => i.done);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 0 40px" }}>
      <div className="page-header pb-5">
        <div>
          <h1 className="text-primary" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Shopping</h1>
          <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
            {isSolo ? "Personal lists" : "Personal and shared household lists"}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreatingList(true)}>
          <Icon name="plus" size={14} />New list
        </button>
      </div>

      <div className="px-4 md:px-7">
        <div className="shopping-layout grid gap-5" style={{ gridTemplateColumns: "220px 1fr" }}>
          {/* List sidebar */}
          <div className="flex flex-col gap-2">
            {visibleLists.map(l => {
              const completedCount = l.items.filter(i => i.done).length;
              const isActive = l.id === activeList;
              return (
                <button key={l.id}
                  className="text-start p-3 rounded-lg cursor-pointer"
                  style={{ background: isActive ? "var(--brand-faint)" : "var(--surface)", border: isActive ? "1px solid var(--brand)" : "1px solid var(--line)", borderRadius: "var(--r-lg)", fontFamily: "var(--font-ui)" }}
                  onClick={() => setActiveList(l.id)}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 18 }}>{l.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate" style={{ fontSize: 13, color: isActive ? "var(--brand)" : "var(--t-primary)" }}>{l.name}</div>
                      <div className="text-faint" style={{ fontSize: 11 }}>
                        {l.items.length - completedCount} remaining
                        {l.isShared && " · Shared"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            <button className="p-3 rounded-lg border-2 border-dashed text-center text-brand font-semibold"
              style={{ borderColor: "var(--line)", borderRadius: "var(--r-lg)", fontSize: 12, cursor: "pointer", background: "transparent", fontFamily: "var(--font-ui)" }}
              onClick={() => setIsCreatingList(true)}>
              <Icon name="plus" size={13} style={{ display: "inline", marginRight: 4 }} />
              New list
            </button>
          </div>

          {/* List content */}
          <div>
            {isCreatingList ? (
              <div className="card p-5 border border-line" style={{ borderRadius: "var(--r-xl)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-primary font-bold" style={{ fontSize: 18, margin: 0 }}>Create New List</h2>
                  <button className="btn btn-ghost btn-icon" onClick={() => setIsCreatingList(false)}>
                    <Icon name="x" size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1 w-16">
                      <label className="text-muted" style={{ fontSize: 12, fontWeight: 600 }}>Emoji</label>
                      <input className="input text-center" value={newListEmoji} onChange={e => setNewListEmoji(e.target.value)} maxLength={2} style={{ fontSize: 18, padding: "8px 0" }} />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-muted" style={{ fontSize: 12, fontWeight: 600 }}>List Name</label>
                      <input className="input" value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="e.g. Groceries, Target, Hardware..." autoFocus />
                    </div>
                  </div>
                  {!isSolo && (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input type="checkbox" checked={newListShared} onChange={e => setNewListShared(e.target.checked)} style={{ accentColor: "var(--brand)", width: 16, height: 16 }} />
                      <span className="text-primary font-medium" style={{ fontSize: 14 }}>Share with family</span>
                    </label>
                  )}
                  <div className="flex justify-end gap-2 mt-2">
                    <button className="btn btn-ghost" onClick={() => setIsCreatingList(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCreateList} disabled={!newListName.trim()}>Create List</button>
                  </div>
                </div>
              </div>
            ) : isEditingList ? (
              <div className="card p-5 border border-line" style={{ borderRadius: "var(--r-xl)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-primary font-bold" style={{ fontSize: 18, margin: 0 }}>Edit List</h2>
                  <button className="btn btn-ghost btn-icon" onClick={() => setIsEditingList(false)}>
                    <Icon name="x" size={16} />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1 w-16">
                      <label className="text-muted" style={{ fontSize: 12, fontWeight: 600 }}>Emoji</label>
                      <input className="input text-center" value={editListEmoji} onChange={e => setEditListEmoji(e.target.value)} maxLength={2} style={{ fontSize: 18, padding: "8px 0" }} />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-muted" style={{ fontSize: 12, fontWeight: 600 }}>List Name</label>
                      <input className="input" value={editListName} onChange={e => setEditListName(e.target.value)} autoFocus />
                    </div>
                  </div>
                  {!isSolo && (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input type="checkbox" checked={editListShared} onChange={e => setEditListShared(e.target.checked)} style={{ accentColor: "var(--brand)", width: 16, height: 16 }} />
                      <span className="text-primary font-medium" style={{ fontSize: 14 }}>Share with family</span>
                    </label>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-line" style={{ borderColor: "var(--line)" }}>
                    <button className="btn btn-ghost text-sig-over px-2" onClick={() => {
                      ctx.showConfirm({
                        title: "Delete List",
                        message: `Are you sure you want to delete "${currentList.name}"? This cannot be undone.`,
                        confirmLabel: "Delete",
                        danger: true,
                        onConfirm: () => {
                          const newLists = lists.filter(l => l.id !== currentList.id);
                          setLists(newLists);
                          setIsEditingList(false);
                          if (!newLists.find(l => l.id === activeList)) setActiveList(newLists[0]?.id || "");
                          ctx.showToast("List deleted");
                        }
                      });
                    }}>Delete list</button>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost" onClick={() => setIsEditingList(false)}>Cancel</button>
                      <button className="btn btn-primary" onClick={() => {
                        if (!editListName.trim()) return;
                        setLists(prev => prev.map(l => l.id === currentList.id ? { ...l, name: editListName.trim(), emoji: editListEmoji, isShared: !isSolo && editListShared } : l));
                        setIsEditingList(false);
                        ctx.showToast("List updated");
                      }} disabled={!editListName.trim()}>Save Changes</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentList ? (
              <>
            {/* List header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 24 }}>{currentList.emoji}</span>
                  <h2 className="text-primary font-bold" style={{ fontSize: 20, margin: 0 }}>{currentList.name}</h2>
                  {currentList.isShared && <span className="badge bg-brand-faint text-brand" style={{ fontSize: 11 }}>Shared</span>}
                </div>
                <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {todo.length} item{todo.length !== 1 ? "s" : ""} remaining
                  {done.length > 0 && ` · ${done.length} done`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {done.length > 0 && (
                  <button className="btn btn-ghost btn-sm text-muted" onClick={() => clearDone(currentList.id)}>
                    Clear done
                  </button>
                )}
                <button aria-label="Edit shopping list" className="btn btn-ghost btn-icon text-muted" onClick={() => {
                  setEditListName(currentList.name);
                  setEditListEmoji(currentList.emoji);
                  setEditListShared(currentList.isShared || false);
                  setIsEditingList(true);
                }}>
                  <Icon name="edit" size={16} />
                </button>
              </div>
            </div>

            {/* Add item input */}
            <div className="flex gap-2 mb-4">
              <input
                aria-label="Add shopping item"
                className="input flex-1"
                placeholder="Add an item..."
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem(currentList.id)}
              />
              <button className="btn btn-primary" onClick={() => addItem(currentList.id)} disabled={!newItem.trim()}>
                <Icon name="plus" size={15} />
                Add
              </button>
            </div>

            {/* Items */}
            <div className="card overflow-hidden">
              {todo.length === 0 && done.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: 40 }}>{currentList.emoji}</div>
                  <div className="font-bold text-primary">List is empty</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>Type above to add your first item.</div>
                </div>
              ) : (
                <>
                  {/* Todo items */}
                  {todo.map((item, i) => {
                    const addedBy = item.addedById ? getMemberById(item.addedById) : null;
                    return (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-line" style={{ borderColor: "var(--line)" }}>
                        <button
                          aria-label={`Mark ${item.text} complete`}
                          onClick={() => toggleItem(currentList.id, item.id)}
                          style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid var(--line-strong)", background: "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                        />
                        <div className="flex-1 min-w-0">
                          {editingId === item.id ? (
                            <input
                              className="input"
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onBlur={() => saveEdit(currentList.id, item.id)}
                              onKeyDown={e => e.key === "Enter" && saveEdit(currentList.id, item.id)}
                              autoFocus
                              style={{ padding: "3px 8px", fontSize: 14 }}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-primary" style={{ fontSize: 14 }}>{item.text}</span>
                              {item.quantity && <span className="text-faint" style={{ fontSize: 11 }}>({item.quantity})</span>}
                            </div>
                          )}
                          {addedBy && currentList.isShared && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className="avatar" style={{ width: 14, height: 14, background: addedBy.avatarColor, fontSize: 6 }}>{addedBy.initials}</div>
                              <span className="text-faint" style={{ fontSize: 10 }}>Added by {addedBy.name}</span>
                            </div>
                          )}
                        </div>
                        <button aria-label={`Edit ${item.text}`} className="btn btn-ghost btn-icon" onClick={() => { setEditingId(item.id); setEditText(item.text); }}>
                          <Icon name="edit" size={13} />
                        </button>
                        <button aria-label={`Remove ${item.text}`} className="btn btn-ghost btn-icon text-sig-over" onClick={() => removeItem(currentList.id, item.id)}>
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Done items */}
                  {done.length > 0 && (
                    <>
                      <div className="px-4 py-2 border-b border-line" style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}>
                        <span className="text-faint" style={{ fontSize: 12, fontWeight: 700 }}>Checked off ({done.length})</span>
                      </div>
                      {done.map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-line" style={{ borderColor: "var(--line)" }}>
                          <button
                            aria-label={`Mark ${item.text} incomplete`}
                            onClick={() => toggleItem(currentList.id, item.id)}
                            style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid var(--sig-done)", background: "var(--sig-done)", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon name="check" size={12} style={{ color: "white" }} />
                          </button>
                          <span className="text-muted flex-1" style={{ fontSize: 14, textDecoration: "line-through" }}>{item.text}</span>
                          <button aria-label={`Remove ${item.text}`} className="btn btn-ghost btn-icon text-sig-over" onClick={() => removeItem(currentList.id, item.id)}>
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Progress */}
            {currentList.items.length > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <div className="progress-track flex-1" style={{ height: 6 }}>
                  <div className="progress-fill done" style={{ width: `${(done.length / currentList.items.length) * 100}%` }} />
                </div>
                <span className="text-muted font-mono" style={{ fontSize: 12 }}>{done.length}/{currentList.items.length}</span>
              </div>
            )}
              </>
            ) : null}
          </div>
        </div>

        {/* Solo state: promote family lists */}
        {isSolo && (
          <div className="mt-5 card p-5 flex items-center gap-4" style={{ border: "1px dashed var(--brand)", borderRadius: "var(--r-xl)" }}>
            <div style={{ fontSize: 32 }}>👨‍👩‍👧‍👦</div>
            <div>
              <div className="font-bold text-primary" style={{ fontSize: 14 }}>Share lists with family</div>
              <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>Invite household members to collaborate on shared shopping lists.</div>
            </div>
            <button className="btn btn-secondary ms-auto" style={{ whiteSpace: "nowrap" }} onClick={() => ctx.navigate("settings")}>
              Invite members
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
