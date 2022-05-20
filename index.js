const { MovieCrawler } = require('./crawler');
const server = require('./server');

const dytt = new MovieCrawler({
	name: '电影天堂',
	indexPage: 'https://dy.dytt8.net/html/gndy/dyzz/list_23_1.html',
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

// server.render(content);
