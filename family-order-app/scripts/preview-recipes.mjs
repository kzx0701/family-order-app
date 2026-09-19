// Isolated uni-app preview: same page sources, no login restoration or cloud calls.
import { mkdirSync, readFileSync, writeFileSync, existsSync, cpSync, symlinkSync, readdirSync, lstatSync, unlinkSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const runtime = process.env.UNI_PREVIEW_RUNTIME || '/Applications/HBuilderX.app/Contents/HBuilderX/plugins/uniapp-cli-vite'
const preview = resolve(app, '.recipe-preview')
if (!existsSync(resolve(runtime, 'node_modules/@dcloudio/vite-plugin-uni/bin/uni.js'))) throw new Error('Set UNI_PREVIEW_RUNTIME to a uni-app CLI runtime directory.')
mkdirSync(preview, { recursive: true })
// Copy (not link) sources so uni-app's dependency scanner sees a normal project root.
for (const item of ['pages', 'components', 'scss', 'composables', 'store', 'utils', 'mock', 'static', 'uni.scss', 'manifest.json', 'index.html']) cpSync(resolve(app, item), resolve(preview, item), { recursive: true })
const modules = resolve(preview, 'node_modules')
if (existsSync(modules) && lstatSync(modules).isSymbolicLink()) unlinkSync(modules)
mkdirSync(modules, { recursive: true })
for (const name of readdirSync(resolve(runtime, 'node_modules'))) {
  if (!existsSync(resolve(modules, name))) symlinkSync(resolve(runtime, 'node_modules', name), resolve(modules, name), 'dir')
}
const sass = resolve(dirname(runtime), 'compile-dart-sass/node_modules/sass')
if (!existsSync(resolve(modules, 'sass')) && existsSync(sass)) symlinkSync(sass, resolve(modules, 'sass'), 'dir')
const pages = JSON.parse(readFileSync(resolve(app, 'pages.json'), 'utf8'))
pages.pages.sort((a, b) => Number(b.path === 'pages/recipe/recipe') - Number(a.path === 'pages/recipe/recipe'))
writeFileSync(resolve(preview, 'pages.json'), JSON.stringify(pages, null, 2))
writeFileSync(resolve(preview, 'package.json'), readFileSync(resolve(app, 'package.json'), 'utf8'))
const appSource = readFileSync(resolve(app, 'App.vue'), 'utf8')
writeFileSync(resolve(preview, 'App.vue'), '<script>export default {}</script>\n' + appSource.slice(appSource.indexOf('<style')) + '\n<style>uni-tabbar { display: none !important; } .uni-app--showtabbar uni-page-wrapper { height: 100%; } .uni-app--showtabbar uni-page-wrapper::after { display: none; }</style>')
writeFileSync(resolve(preview, 'main.js'), `import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { useUserStore } from './store/user.js'
import App from './App.vue'
export function createApp() {
  const app = createSSRApp(App); app.use(createPinia());
  // Role selection exists only in this generated local preview entry.
  // #ifdef H5
  useUserStore().currentMode = new URLSearchParams(location.search).get('previewRole') === 'cook' ? 'cook' : 'diner';
  // #endif
  ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab'].forEach(api => uni.addInterceptor(api, { invoke(args) {
    if (!['/pages/recipe/recipe', '/pages/recipe-detail/recipe-detail', '/pages/order/order'].includes(args.url.split('?')[0])) {
      uni.showToast({ title: '当前预览的是菜单和菜谱', icon: 'none' }); return false
    }
  }})); return { app }
}`)
writeFileSync(resolve(preview, 'vite.config.js'), `import { defineConfig } from 'vite'; import uni from '@dcloudio/vite-plugin-uni'; export default defineConfig({ plugins: [uni()], server: { host: '127.0.0.1', port: 5178, strictPort: true } });`)
cpSync(resolve(app, 'scripts/recipe-preview.html'), resolve(preview, 'preview.html'))
cpSync(resolve(app, 'scripts/recipe-editor-preview.html'), resolve(preview, 'editor-preview.html'))
cpSync(resolve(app, 'scripts/order-preview.html'), resolve(preview, 'order-preview.html'))
const build = process.argv.includes('--build')
const platform = process.argv.find(arg => arg.startsWith('--platform='))?.split('=')[1] || 'h5'
const child = spawn(process.execPath, [resolve(runtime, 'node_modules/@dcloudio/vite-plugin-uni/bin/uni.js'), ...(build ? ['build'] : []), '-p', platform], { cwd: preview, stdio: 'inherit', env: { ...process.env, UNI_INPUT_DIR: preview, UNI_OUTPUT_DIR: resolve(preview, 'dist', platform), UNI_HBUILDERX_PLUGINS: dirname(runtime) } })
child.on('exit', code => process.exit(code ?? 0))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
