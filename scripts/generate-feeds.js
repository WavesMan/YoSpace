/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { getLocalPostsList } = require('../src/utils/content/local');
const { generateRSS, generateATOM } = require('../src/utils/feed-generator');

/** 构建正式博客的 RSS 与 Atom 订阅。 */
async function generateFeeds() {
  if (fs.existsSync('.env')) dotenv.config({ quiet: true });
  const { items } = await getLocalPostsList(0, 20, 'zh-CN');
  const feeds = [
    [process.env.NEXT_PUBLIC_RSS_FEED_PATH || '/feeds/rss.xml', generateRSS(items)],
    [process.env.NEXT_PUBLIC_ATOM_FEED_PATH || '/feeds/atom.xml', generateATOM(items)],
  ];

  for (const [feedPath, xml] of feeds) {
    const outputPath = path.join(process.cwd(), 'public', feedPath);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, xml);
  }
  console.log('RSS 与 Atom 订阅已生成');
}

if (require.main === module) {
  generateFeeds().catch(error => {
    console.error('生成订阅失败', error);
    process.exitCode = 1;
  });
}

module.exports = { generateFeeds };
