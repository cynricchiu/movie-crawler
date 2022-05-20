const { MovieCrawler } = require('./crawler');
const server = require('./server');

const dytt = new MovieCrawler({
	name: '电影天堂',
	indexPages: {
		最新电影: 'https://dy.dytt8.net/html/gndy/dyzz/list_23_1.html',
		日韩电影: 'https://www.ygdy8.net/html/gndy/rihan/list_6_1.html',
		欧美电影: 'https://www.ygdy8.net/html/gndy/oumei/list_7_1.html',
		国内电影: 'https://www.ygdy8.net/html/gndy/china/list_4_1.html',
		综合电影: 'https://www.ygdy8.net/html/gndy/jddy/list_63_1.html',
	},
	ruleCallback: url => {
		const curIndex = Number(url.substring(url.lastIndexOf('_') + 1, url.lastIndexOf('.')));
		const nextPage = `${url.slice(0, url.lastIndexOf('_'))}_${Number(curIndex) + 1}.html`;
		return nextPage;
	},
});

dytt.start(10).then(() => {
	// 将所有结果输出为html
	server.render({ content: dytt.result, category: dytt.category });
});
