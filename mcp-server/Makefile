.PHONY: build run stop clean

build:
	docker build -t mcp-server .

run:
	docker run -i --rm mcp-server

stop:
	docker stop mcp-server || true
	docker rm mcp-server || true

clean: stop
	docker rmi mcp-server || true
