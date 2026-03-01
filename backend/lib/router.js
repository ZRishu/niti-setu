const normalizePath = (path) => {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
};

export class Router {
  constructor() {
    this.routes = [];
  }

  on(method, path, handler) {
    this.routes.push({ method: method.toUpperCase(), path: normalizePath(path), handler });
  }

  async handle(request, context = {}) {
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);
    const method = request.method.toUpperCase();

    for (const route of this.routes) {
      if (route.method === method && route.path === path) {
        return route.handler({ request, url, ...context });
      }
    }

    return null;
  }
}
