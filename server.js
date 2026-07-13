require("dotenv").config()

const app = require("./src/app");
const prisma = require("./src/config/prisma");

// Verify database connection on startup
prisma.$connect()
    .then(() => {
        console.log("Connected to PostgreSQL database via Prisma.");
        app.listen(3000, () => {
            console.log("Server is listening to port 3000.");
        });
    })
    .catch(err => {
        console.error("Failed to connect to database:", err);
        process.exit(1);
    });

// Graceful shutdown
process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
});
