const root = process.cwd();
const port = Number(process.env.PORT || 8000);

Bun.serve({
	port,
	async fetch(request) {
		const url = new URL(request.url);
		const pathname = decodeURIComponent(url.pathname);
		const path = pathname === "/" ? "/index.html" : pathname;
		const file = Bun.file(`${root}${path}`);

		if (await file.exists()) {
			return new Response(file);
		}

		return new Response("Not found", { status: 404 });
	},
});

console.log(`Serving ${root} on http://localhost:${port}`);
