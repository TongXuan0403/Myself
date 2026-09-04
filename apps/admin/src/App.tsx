import "./styles.css";

import { ArticleList } from "./components/ArticleList";
import { EditorPanel } from "./components/EditorPanel";
import { Sidebar } from "./components/Sidebar";
import { StatsBar } from "./components/StatsBar";
import { Toast } from "./components/Toast";
import { Topbar } from "./components/Topbar";
import { useArticleWorkspace } from "./hooks/useArticleWorkspace";

function App() {
  const {
    articles,
    counts,
    createArticle,
    filtered,
    menuOpen,
    publishSelected,
    query,
    selected,
    selectedId,
    saveDraft,
    setMenuOpen,
    setQuery,
    setSelectedId,
    toast,
    updateSelected,
  } = useArticleWorkspace();

  return (
    <div className="admin-app">
      <Sidebar articleCount={articles.length} open={menuOpen} onCreateArticle={createArticle} onClose={() => setMenuOpen(false)} />
      <main className="admin-main">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <StatsBar total={counts.total} published={counts.published} draft={counts.draft} />
        <section className="workspace" id="articles">
          <ArticleList
            articles={articles}
            filteredArticles={filtered}
            query={query}
            selectedId={selectedId}
            onQueryChange={setQuery}
            onSelect={setSelectedId}
            onCreate={createArticle}
          />
          <EditorPanel article={selected} onClose={() => setSelectedId(0)} onPublish={publishSelected} onSave={saveDraft} onUpdate={updateSelected} />
        </section>
      </main>
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}

export default App;
