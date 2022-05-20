/**
 * 爬取网页内容
 */
const Crawler = require('crawler');
const userAgents = [
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
	'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.12) Gecko/20070731 Ubuntu/dapper-security Firefox/1.5.0.12',
	'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Acoo Browser; SLCC1; .NET CLR 2.0.50727; Media Center PC 5.0; .NET CLR 3.0.04506)',
	'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11',
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/535.20 (KHTML, like Gecko) Chrome/19.0.1036.7 Safari/535.20',
	'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko Fedora/1.9.0.8-1.fc10 Kazehakase/0.5.6',
];

class MovieCrawler {
	constructor(options) {
		const { name, indexPage, ruleCallback, crawCallback } = options;
		this._name = name;
		this._indexPage = indexPage; // 首页url
		this._ruleCallback = ruleCallback; // 页面地址规则
		this.result = [];
		this.category = new Set(['全部']); // 分类
		this.crawler = new Crawler({
			maxConnections: 10,
			forceUTF8: true,
			rateLimit: 0, // 请求最小间隔
			retryTimeout: 100000,
			timeout: 50000,
			headers: {
				// 'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36`, //,
				'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
			},
		});
	}

	// 获取电影链接列表
	fetchLinkList = async pageCount => {
		// 先计算页面地址数组
		const pageList = new Array(pageCount).fill(this._indexPage).reduce((pre, curItem, index) => {
			if (index === 0) {
				pre.push(curItem);
			} else {
				pre.push(this._ruleCallback(pre[index - 1]));
			}
			return pre;
		}, []);
		// 获取每个页面的电影链接
		const promiseArr = pageList.map(page => {
			return new Promise((resolve, reject) => {
				this.crawler.queue({
					uri: page,
					method: 'GET',
					callback: (error, res, done) => {
						if (error) {
							console.error(error);
							reject(error);
						} else {
							const $ = res.$;
							// 返回当页解析结果
							const newItems = [];
							$('.bd3r table td')
								.find('.ulink')
								.each((index, aElement) => {
									const title = $(aElement)?.text();
									const link = 'https://dy.dytt8.net' + $(aElement)?.attr('href');
									newItems.push({ title, link });
								});
							this.result.push(...newItems);
							resolve(this.result);
						}
						done();
					},
				});
			});
		});
		return await Promise.all(promiseArr);
	};

	// 获取每部电影的描述信息
	fetchDescription = async () => {
		this.crawler.on('drain', () => {
			console.info(`\x1B[32m【 ${this._name} 】 信息已经更新 ${this.result.length} 项内容\x1b[0m`);
		});
		const promiseArr = this.result.map((item, index) => {
			const { link } = item;
			return new Promise((resolve, reject) => {
				this.crawler.queue({
					uri: link,
					method: 'GET',
					callback: (error, res, done) => {
						if (error) {
							console.error(error);
							reject(error);
						} else {
							const $ = res.$;
							const desc = $('#Zoom span').text();
							// 评分
							const strArr = desc.split('◎');
							const str1 = strArr.find(str => {
								return str.includes('评分');
							});
							const rate =
								str1 !== undefined
									? Number(str1.slice(str1.indexOf('分') + 1, str1.indexOf('/')))
									: NaN;
							// 类别
							const str2 = strArr.find(str => {
								return str.includes('类');
							});
							const temp2 = str2.replace('类　　别', '').replace(/\s+|\\n|\\r/g, '');
							const types = temp2.split('/');
							this.result[index].rate = rate;
							this.result[index].types = types;
							this.category.add(...types);

							// 图片
							const img = $('#Zoom img').attr('src');
							this.result[index].img = img;

							resolve(this.result);
						}
						done();
					},
				});
			});
		});
		return await Promise.all(promiseArr);
	};

	start = async pageCount => {
		console.info('正在获取最新电影信息，请稍等。。。');
		await this.fetchLinkList(pageCount);
		console.info('列表获取完毕，正在获取详细信息。。。');
		await this.fetchDescription();
	};
}

module.exports = { MovieCrawler };
