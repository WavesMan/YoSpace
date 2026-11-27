// 正式部署成功后，按实际 URL 变更通知搜索引擎。
import { readFileSync } from 'node:fs';

const { siteUrl } = JSON.parse(readFileSync(new URL('../src/data/seo.json', import.meta.url), 'utf8'));
const site = new URL(siteUrl);
const [engine, ...values] = process.argv.slice(2);

async function submitUrls() {
    if (!['indexnow', 'baidu'].includes(engine) || !values.length) {
        throw new Error('用法：node scripts/submit-search-urls.mjs indexnow|baidu /blog/文章路径');
    }

    const urls = [...new Set(values.map(value => {
        const url = new URL(value, site);
        if (url.origin !== site.origin || url.hash || url.username || url.password) {
            throw new Error('只接受无片段的正式站 URL');
        }
        return url.href;
    }))];

    let endpoint;
    let body;
    let contentType;
    if (engine === 'indexnow') {
        const key = process.env.INDEXNOW_KEY || '';
        if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error('请配置有效的 INDEXNOW_KEY');
        endpoint = 'https://api.indexnow.org/indexnow';
        body = JSON.stringify({ host: site.hostname, key, keyLocation: new URL(`/${key}.txt`, site).href, urlList: urls });
        contentType = 'application/json';
    } else {
        const token = process.env.BAIDU_PUSH_TOKEN;
        if (!token) throw new Error('请配置 BAIDU_PUSH_TOKEN');
        endpoint = new URL('https://data.zz.baidu.com/urls');
        endpoint.search = new URLSearchParams({ site: site.hostname, token }).toString();
        body = urls.join('\n');
        contentType = 'text/plain';
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': `${contentType}; charset=utf-8` },
        body,
        signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`提交被拒绝，HTTP ${response.status}`);

    if (engine === 'baidu') {
        const result = await response.json();
        if (result.success !== urls.length) throw new Error(`百度确认接收 ${Number(result.success) || 0}/${urls.length} 条 URL`);
    }
    console.log(`已提交 ${urls.length} 条 URL，HTTP ${response.status}`);
}

submitUrls().catch(error => {
    console.error('搜索引擎提交失败', error.message);
    process.exitCode = 1;
});
