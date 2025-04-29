.PHONY: build run stop clean

build:
	docker build -t freee-vibes-mcp .

run:
	docker run -i --rm freee-vibes-mcp

stop:
	docker stop freee-vibes-mcp || true
	docker rm freee-vibes-mcp || true

clean: stop
	docker rmi freee-vibes-mcp || true
