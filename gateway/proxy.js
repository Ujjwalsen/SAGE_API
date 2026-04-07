const { createProxyMiddleware } = require("http-proxy-middleware");

const proxy = createProxyMiddleware({
    target: "http://localhost:4000",
    changeOrigin: true,
    pathRewrite: {
        '^/api': '',
    },
});

module.exports = proxy;