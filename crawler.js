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
		const { name, indexPages, ruleCallback, crawCallback } = options;
		this._name = name;
		this._indexPages = indexPages; // 首页url
		this._ruleCallback = ruleCallback; // 页面地址规则
		this.result = [];
		this.category = new Set(['全部']); // 分类
		this.crawler = new Crawler({
			maxConnections: 10,
			forceUTF8: true,
			// rateLimit: 100, // 请求最小间隔
			retryTimeout: 6000,
			timeout: 3000,
			headers: {
				'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36`, //,
				// 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
			},
		});
	}

	// 获取电影链接列表
	fetchLinkList = async (indexPage, pageCount) => {
		// 先计算页面地址数组
		const pageList = new Array(pageCount).fill(indexPage).reduce((pre, curItem, index) => {
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
							// 错误日志
							console.error(error);
							reject(error);
						} else {
							const $ = res.$;
							// 返回当页解析结果
							const newItems = [];
							$('.bd3r table td .ulink').each((index, aElement) => {
								if (!$(aElement).attr('href').includes('index')) {
									const title = $(aElement)?.text();
									const link =
										indexPage.slice(0, indexPage.lastIndexOf('net') + 3) +
										$(aElement)?.attr('href');
									newItems.push({ title, link });
								}
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
		const promiseArr = this.result.map((item, index) => {
			const { link } = item;
			return new Promise((resolve, reject) => {
				this.crawler.queue({
					uri: link,
					method: 'GET',
					callback: (error, res, done) => {
						if (error) {
							// 错误日志
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
								str1 !== undefined ? Number(str1.slice(str1.indexOf('分') + 1, str1.indexOf('/'))) : 0;
							// 类别
							const str2 = strArr.find(str => {
								return str.includes('类　　别');
							});

							const temp2 =
								str2 !== undefined ? str2.replace('类　　别', '').replace(/\s+|\\n|\\r/g, '') : '';
							const types = temp2.split('/');

							this.result[index].rate = rate;
							this.result[index].types = types;
							if (str2) {
								this.category.add(...types);
							}

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
		for (let i = 0; i < Object.keys(this._indexPages).length; i++) {
			let name = Object.keys(this._indexPages)[i];
			let indexPage = Object.values(this._indexPages)[i];
			console.info(`正在获取 ${name} 信息，请稍等。。。`);
			await this.fetchLinkList(indexPage, pageCount);
			console.info('列表获取完毕，正在获取详细信息。。。');
			await this.fetchDescription();
			console.info(`\x1B[32m【 ${this._name} 】 信息已经更新 ${this.result.length} 项内容\x1b[0m`);
		}
	};
}

module.exports = { MovieCrawler };
