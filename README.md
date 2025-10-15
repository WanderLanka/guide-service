# Guide Service

Domain service for Tour Guides. Owns guide profiles, availability, featured flags, tour packages, and performance metrics.

Key endpoints

- Tour Packages
	- POST /tourpackages/insert
	- GET /tourpackages/list
	- GET /tourpackages/get/:slugOrId
	- PATCH /tourpackages/update/:slugOrId
	- DELETE /tourpackages/delete/:slugOrId

- Guides (CRUD)
	- POST /guide/insert
	- GET /guide/list
	- GET /guide/get/:idOrUsername
	- PATCH /guide/update/:idOrUsername
	- DELETE /guide/delete/:idOrUsername

- Guides (utility)
	- GET /featuredguides (root)

## Env

Copy `.env.example` to `.env` and set values.

## Run

npm install
npm run dev
