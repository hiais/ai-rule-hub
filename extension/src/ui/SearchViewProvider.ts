import * as vscode from 'vscode';
import { ContentLibraryProvider } from './ContentLibraryProvider';

export class SearchViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'aiRuleHub.search';
  private webviewView?: vscode.WebviewView;
  private updateTimer: any;
  constructor(private libraryProvider: ContentLibraryProvider) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
    this.webviewView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage((msg) => {
      if (!msg || typeof msg !== 'object') return;
      switch (msg.type) {
        case 'setFilter':
          this.libraryProvider.setFilter(msg.value ?? '');
          this.scheduleUpdateSegments();
          break;
        case 'setCategory':
          this.libraryProvider.setActiveCategory(msg.value ?? undefined);
          this.scheduleUpdateSegments();
          break;
        default:
          break;
      }
    });

    // 初次加载时同步计数（防抖触发）
    this.scheduleUpdateSegments();

    // 视图可见性变化：从其他视图切回时立即刷新计数
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.scheduleUpdateSegments();
      }
    });

    // 订阅库数据变化：当树数据变更时同步分段计数
    const changeDisposable = this.libraryProvider.onDidChangeTreeData(() => {
      // 若视图不可见则跳过，避免不必要的消息传递
      if (webviewView.visible) {
        this.scheduleUpdateSegments();
      }
    });

    // 视图销毁时清理订阅
    webviewView.onDidDispose(() => {
      try {
        changeDisposable.dispose();
        if (this.updateTimer) {
          clearTimeout(this.updateTimer);
        }
      } catch {}
    });
  }

  private getHtml(): string {
    const nonce = String(Date.now());
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>搜索</title>
  <style>
    html, body { height: 100%; }
    body { font-family: var(--vscode-font-family); padding: 8px; height: 100%; overflow-y: auto; }
    .row { display: flex; align-items: center; }
    input { flex: 1; padding: 6px 8px; border: 1px solid var(--vscode-input-border); background: var(--vscode-input-background); color: var(--vscode-input-foreground); }
    /* 自适应网格：自动填充列，最小宽度保证不拥挤 */
    .segments {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 6px;
      margin-top: 8px;
      grid-auto-rows: min-content;
    }
    /* 最窄时强制保持两列 */
    .segments.two-cols {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .seg {
      position: relative;
      white-space: nowrap;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid var(--vscode-button-border);
      background: var(--vscode-button-secondaryBackground, transparent);
      color: var(--vscode-foreground);
      cursor: pointer;
      text-align: center;
      font-size: 12px;
    }
    .seg.active { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    /* 计数徽章：更省宽度 */
    .seg .badge {
      display: inline-block;
      margin-left: 6px;
      padding: 0 6px;
      border-radius: 999px;
      background: var(--vscode-badge-background, var(--vscode-button-background));
      color: var(--vscode-badge-foreground, var(--vscode-button-foreground));
      font-size: 11px;
      line-height: 16px;
    }
    /* 始终使用自适应网格自动换行，不启用横向单行滚动 */
    /* 紧凑模式：隐藏冗余的括号计数（我们仅保留徽章） */
    .compact .seg .paren-count { display: none; }
  </style>
  </head>
  <body>
    <div class="row">
      <input id="q" type="text" placeholder="输入关键词或过滤：type:rule status:draft tag:mcp" />
    </div>
    <div class="segments" id="segments"></div>
    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      const q = document.getElementById('q');
      const segs = document.getElementById('segments');

      const DEFAULT_CATS = ['rule','prompt','mcp','agent','workflow'];
      const LABELS_SHORT = { 'rule':'rule','prompt':'prompt','mcp':'mcp','agent':'agent','workflow':'flow','全部':'全部' };
      const COMPACT_WIDTH = 280; // 紧凑模式阈值
      const TWO_COLS_LOCK_WIDTH = 200; // 窄宽度下强制两列阈值

      let categories = ['全部', ...DEFAULT_CATS];
      let counts = {};
      // 读取持久化状态（分段与过滤）
      const saved = (typeof vscode.getState === 'function' ? vscode.getState() : {}) || {};
      let active = typeof saved.active === 'string' ? saved.active : '全部';
      const savedFilter = typeof saved.filter === 'string' ? saved.filter : '';
      if (q) q.value = savedFilter;

      function applyLayout() {
        const width = segs.offsetWidth || 200;
        const compact = width < COMPACT_WIDTH;
        const lockTwo = width < TWO_COLS_LOCK_WIDTH;
        segs.classList.toggle('compact', compact);
        segs.classList.toggle('two-cols', lockTwo);
      }

      function renderSegments() {
        segs.innerHTML = '';
        const compact = segs.classList.contains('compact');

        categories.forEach(cat => {
          const el = document.createElement('button');
          el.className = 'seg' + (active === cat ? ' active' : '');
          const cnt = (cat === '全部')
            ? Object.values(counts).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
            : (counts[cat] ?? 0);

          // 文本：紧凑模式使用短标签，正常模式用完整标签
          const text = compact ? (LABELS_SHORT[cat] || cat) : cat;
          el.textContent = text;

          // 计数徽章：更省空间，替换 (12) 形式
          if (typeof cnt === 'number') {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = String(cnt);
            el.appendChild(badge);
          }

          // 悬浮提示提供完整信息
          el.title = cat + ' (' + cnt + ')';

          el.onclick = () => {
            active = cat;
            renderSegments();
            vscode.postMessage({ type: 'setCategory', value: cat === '全部' ? undefined : cat });
            // 记忆当前分段与过滤状态
            if (typeof vscode.setState === 'function') {
              vscode.setState({ active, filter: q.value || '' });
            }
          };
          segs.appendChild(el);
        });

        applyLayout();
      }

      // 首次渲染并将持久化状态同步给扩展侧
      renderSegments();
      vscode.postMessage({ type: 'setFilter', value: q.value || '' });
      vscode.postMessage({ type: 'setCategory', value: active === '全部' ? undefined : active });
      window.addEventListener('resize', () => {
        applyLayout();
      });

      q.addEventListener('input', (e) => {
        const val = e.target.value || '';
        vscode.postMessage({ type: 'setFilter', value: val });
        if (typeof vscode.setState === 'function') {
          vscode.setState({ active, filter: val });
        }
        if (!val) {
          // 输入被清空时也重置分类为“全部”
          active = '全部';
          renderSegments();
          vscode.postMessage({ type: 'setCategory', value: undefined });
          if (typeof vscode.setState === 'function') {
            vscode.setState({ active, filter: '' });
          }
        }
      });

      // 接收扩展侧推送的分类计数并刷新分段
      window.addEventListener('message', (event) => {
        const msg = event.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'updateSegments') {
          counts = msg.counts || {};
          // 根据启用的分类动态生成按钮集合，避免显示未启用分类导致计数缺失
          const keys = Object.keys(counts);
          categories = ['全部', ...DEFAULT_CATS.filter(cat => keys.includes(cat))];
          // 若当前选择的分类已不可用，则回退到“全部”，并同步扩展与持久化状态
          if (active !== '全部' && !keys.includes(active)) {
            active = '全部';
            vscode.postMessage({ type: 'setCategory', value: undefined });
            if (typeof vscode.setState === 'function') {
              vscode.setState({ active, filter: q.value || '' });
            }
          }
          renderSegments();
        }
      });
    </script>
  </body>
</html>`;
  }

  private async updateSegments() {
    if (!this.webviewView) return;
    const counts = await this.libraryProvider.getCategoryCounts(true);
    this.webviewView.webview.postMessage({ type: 'updateSegments', counts });
  }

  private scheduleUpdateSegments() {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    this.updateTimer = setTimeout(() => this.updateSegments(), 100);
  }
}
