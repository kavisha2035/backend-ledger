const { z } = require("zod");

const registerSchema = z.object({
    email: z.string({ required_error: "Email is required" })
        .email("Invalid email format")
        .trim()
        .toLowerCase(),
    name: z.string({ required_error: "Name is required" })
        .min(1, "Name cannot be empty")
        .trim(),
    password: z.string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters")
});

const loginSchema = z.object({
    email: z.string({ required_error: "Email is required" })
        .email("Invalid email format")
        .trim()
        .toLowerCase(),
    password: z.string({ required_error: "Password is required" })
        .min(1, "Password cannot be empty")
});

const accountSchema = z.object({
    currency: z.string().length(3, "Currency must be exactly a 3-character ISO code").default("INR")
});

const transactionSchema = z.object({
    fromAccount: z.string({ required_error: "fromAccount is required" })
        .uuid("fromAccount must be a valid UUID"),
    toAccount: z.string({ required_error: "toAccount is required" })
        .uuid("toAccount must be a valid UUID"),
    amount: z.number({ required_error: "amount is required" })
        .positive("Amount must be a positive number greater than 0"),
    idempotencyKey: z.string({ required_error: "idempotencyKey is required" })
        .min(1, "Idempotency key cannot be empty"),
    description: z.string().optional()
});

const initialFundsSchema = z.object({
    toAccount: z.string({ required_error: "toAccount is required" })
        .uuid("toAccount must be a valid UUID"),
    amount: z.number({ required_error: "amount is required" })
        .positive("Amount must be a positive number greater than 0"),
    idempotencyKey: z.string({ required_error: "idempotencyKey is required" })
        .min(1, "Idempotency key cannot be empty"),
    description: z.string().optional()
});

module.exports = {
    registerSchema,
    loginSchema,
    accountSchema,
    transactionSchema,
    initialFundsSchema
};
