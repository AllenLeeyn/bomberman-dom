import { update } from './vdom.js';

class Router {
    constructor(rootSelector = '#app') {
        this.routes = {};
        this.root = document.querySelector(rootSelector);
        this.currentVNode  = null;

        if (!this.root) {
            throw new Error(`Router: Root element "${rootSelector}" not found in DOM`);
        }

        this.notFoundHandler = () => ({
        tag: 'div',
        attrs: {},
        children: ['404 - Page Not Found']
        });

        window.addEventListener('hashchange', () => this.handleRoute());
    }

    addRoute(path, handler) {
        console.warn(`Adding route for path: ${path}`);
        this.routes[path] = handler;
    }

    setNotFoundHandler(handler) {
        this.notFoundHandler = handler;
    }

    navigate(path) {
        console.warn(`Navigating to path: ${path}`);
        location.hash = `#${path}`;
    }
    
    getCurrentPath() {
        return location.hash.slice(1);
    }

    handleRoute() {
        const path = this.getCurrentPath();
        console.warn(`Handling route for path: ${path}`);
        const handler = this.routes[path] || this.notFoundHandler;
        const vnode = handler(path);

        if (!vnode) return;

        this.currentVNode = update(this.root, this.currentVNode, vnode);
    }

    start() {
        this.handleRoute();
    }
}

export const router = new Router();
