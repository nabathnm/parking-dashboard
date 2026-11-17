const { spawn } = require('child_process');
const http = require('http');

const dev = spawn('cmd.exe', ['/c', 'npx', 'next', 'dev', '--webpack', '-p', '3005']);

dev.stdout.on('data', d => console.log('STDOUT:', d.toString()));
dev.stderr.on('data', d => console.log('STDERR:', d.toString()));

setTimeout(() => {
  http.get('http://localhost:3005', res => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      const links = body.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) || [];
      console.log('CSS LINKS:', links);
      const hrefs = links.map(l => (l.match(/href="([^"]+)"/) || [])[1]).filter(Boolean);
      console.log('HREFS:', hrefs);
      if (hrefs.length > 0) {
        http.get('http://localhost:3005' + hrefs[0], cssRes => {
          let css = '';
          cssRes.on('data', c => css += c);
          cssRes.on('end', () => {
            console.log('CSS LENGTH:', css.length);
            console.log('CSS PREVIEW:', css.slice(0, 300));
            dev.kill();
            process.exit(0);
          });
        });
      } else {
        console.log('BODY PREVIEW:', body.slice(0, 500));
        dev.kill();
        process.exit(0);
      }
    });
  }).on('error', err => {
    console.error('HTTP ERR:', err);
    dev.kill();
    process.exit(1);
  });
}, 7000);
