SHELL := /bin/zsh

default: init

init:
	npm install
	docker compose up -d
	ngrok http --domain=tough-gar-adapted.ngrok-free.app 8888 > /dev/null &
	npm run start:dev

teardown:
	docker compose down

update:
	docker compose up -d
	#cp -n .env.local .env
