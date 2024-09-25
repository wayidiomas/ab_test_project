// src/utils/generateScript.ts

import { Link } from '../types';

export function generateRedirectScript(links: Link[], userId: string): string {
  const linksArrayString = JSON.stringify(links);

  return `
    <script>
      (function() {
        var links = ${linksArrayString};
        var random = Math.random() * 100;
        var cumulative = 0;
        var selectedUrl = links[0].url;

        for (var i = 0; i < links.length; i++) {
          cumulative += links[i].percentage;
          if (random <= cumulative) {
            selectedUrl = links[i].url;
            break;
          }
        }

        // Enviar dados para a API antes do redirecionamento
        if (navigator.sendBeacon) {
          var data = new Blob([JSON.stringify({
            user_id: '${userId}',
            page_url: window.location.href
          })], { type: 'application/json' });
          navigator.sendBeacon('https://sua-api.com/log-access', data);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('POST', 'https://sua-api.com/log-access', true);
          xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
          xhr.send(JSON.stringify({
            user_id: '${userId}',
            page_url: window.location.href
          }));
        }

        window.location.href = selectedUrl;
      })();
    </script>
  `;
}
