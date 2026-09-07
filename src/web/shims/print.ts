/**
 * محاكي الطباعة على الويب — window.print عبر نافذة جديدة.
 */
function printHtml(html: string): Promise<void> {
  return new Promise(resolve => {
    const win = window.open('', '_blank', 'noopener');
    if (!win) {
      resolve();
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
      resolve();
    }, 350);
  });
}

function printFile(uri: string): void {
  window.open(uri, '_blank', 'noopener');
}

async function print(options: { html?: string; filePath?: string }): Promise<void> {
  if (options.html) {
    await printHtml(options.html);
  } else if (options.filePath) {
    printFile(options.filePath);
  }
}

export default { print };