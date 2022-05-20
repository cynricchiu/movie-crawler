/**
 * 本地服务
 */
const koa = require('koa');
const koa_static = require('koa-static');
const koa_views = require('koa-views');
const app = new koa();
const open = require('open');
const path = require('path');

const render = result => {
	const { content, category } = result;
	app.use(koa_views(path.join(__dirname, './public'), { extension: 'ejs' }));
	app.use(koa_static(path.join(__dirname, './public')));
	app.use(async ctx => {
		const title = '最新电影分类列表';
		await ctx.render('index', { title, content, category });
	});
	const port = '3000';
	app.listen(port);
	open(`http://127.0.0.1:${port}`);
};

module.exports = { render };
