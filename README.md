# 💻 Onboarding - Mariana

A simple server with CRUD operations on a Users database.

---

## 🔬 Environment and Tools

- **Typescript** and **Node.js** - Development of the server API
- **ESLint** and **Prettier** - Code linting and formatting
- **PostgreSQL** - Relational database
- **Docker** - Containers to instantiate the databases locally
- **Prisma** - ORM to interact with the databases

---

## ⚙️ Steps to run and debug

1. **Clone the repository** and, inside its folder, make sure that npm and docker are also installed and that you have access to them.

2. **Install dependencies**. Inside your project folder, run the command:

```bash
npm install
```

3. **Start the server API.** For that, you may:

- Start the server in production mode, by running:

```bash
npm start
```

- Or start the server in development mode (auto-reload on changes in src/index.ts):

```bash
npm run dev
```

4. **Interact with the API.** You may use Postman to simulate requests to the server API now that you've started it. For example, a possible endpoint is `/hello`.

5. **Start the databases**. Still inside the project root folder, run:

```bash
docker compose up -d
```

6. **Add a .env file.** You should add a DATABASE_URL variable, such as in the example below:

```bash
DATABASE_URL="postgresql://dev_user:dev_pass@localhost:5432/dev_db?schema=public"
```

7. **Apply Prisma Migrations**. You'll create the tables defined in the schema.prisma file defined, including an entity called _User_, by running the following command:

```bash
npx prisma migrate dev --name init
```

The provided `DATABASE_URL` example will initialize the development database. If you wish to connect to the test database, you should change the `.env` file to reference the test database credentials found on `docker-compose.yml` and run the migrate command once again.

8. **Interact with the DB.** Now, you may use TablePlus to directly perform CRUD operations on the database, or even use Prisma-Client to define operations inside the API description.

9. **When finished**, stop the containers by running:

```bash
docker compose stop
```
