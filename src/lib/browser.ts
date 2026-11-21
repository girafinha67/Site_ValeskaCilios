export interface BrowserEnv {
  android: boolean;
  ios: boolean;
  /** navegador "de verdade" no iOS (Chrome, Firefox, Edge) */
  iosRealBrowser: boolean;
  /** pacote Android do navegador detectado (Chrome, Samsung, Edge, Firefox, Opera) */
  androidPackage: string | null;
}

export function detectBrowser(): BrowserEnv {
  const ua = navigator.userAgent;
  const android = /Android/i.test(ua);
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const inAppWebView = /; wv\)|FBAN|FBAV|Instagram|Line\/|MicroMessenger|GSA\/|Snapchat|TikTok|musical_ly/i.test(ua);
  let androidPackage: string | null = null;
  if (android && !inAppWebView) {
    if (/SamsungBrowser/i.test(ua)) androidPackage = 'com.sec.android.app.sbrowser';
    else if (/EdgA/i.test(ua)) androidPackage = 'com.microsoft.emmx';
    else if (/Firefox/i.test(ua)) androidPackage = 'org.mozilla.firefox';
    else if (/OPR\//i.test(ua)) androidPackage = 'com.opera.browser';
    else if (/Chrome/i.test(ua)) androidPackage = 'com.android.chrome';
  }
  return { android, ios, iosRealBrowser: ios && /CriOS|FxiOS|EdgiOS/i.test(ua), androidPackage };
}

/**
 * Tenta abrir o endereço no navegador do aparelho (Chrome, Safari, Samsung Internet...), saindo do
 * navegador interno do Gmail/Instagram. Devolve "stay" quando só foi possível navegar na própria aba
 * (aí vale mostrar uma dica ao usuário).
 */
export function openInBrowser(url: string): 'launched' | 'stay' {
  const env = detectBrowser();
  const u = new URL(url);

  if (env.android) {
    const pkg = env.androidPackage ? `package=${env.androidPackage};` : '';
    const intent = `intent://${u.host}${u.pathname}${u.search}${u.hash}#Intent;scheme=${u.protocol.replace(':', '')};action=android.intent.action.VIEW;${pkg}S.browser_fallback_url=${encodeURIComponent(url)};end`;
    location.href = intent;
    return 'launched';
  }

  if (env.ios && !env.iosRealBrowser) {
    location.href = url.replace(/^http/, 'x-safari-http');
    return 'stay';
  }

  location.assign(url);
  return 'launched';
}
